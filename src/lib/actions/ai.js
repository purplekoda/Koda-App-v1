'use server'

import { revalidatePath } from 'next/cache'
import { requireUser, isMockMode } from '@/lib/dal/require-user'
import { validateAIPrompt } from '@/lib/validators'
import { sanitizeString, sanitizeEnum } from '@/lib/sanitize'
import { apiLimiter, aiLimiter, uploadLimiter } from '@/lib/rate-limit'
import { ok, fail } from '@/lib/action-result'
import { classifyChatIntent } from '@/lib/chat-intent'
import {
  assertCanExecuteChatAction,
  CHAT_ACTION_FORBIDDEN,
  CHAT_ACTION_UNKNOWN,
} from '@/lib/chat-permissions'

const VALID_CONTEXTS = [
  'dashboard', 'meals', 'grocery', 'pantry', 'recipes', 'events', 'general',
]

export async function askAI(prompt, context) {
  try {
    const user = await requireUser()
    const rate = aiLimiter.check(user.id)
    if (!rate.success) return fail('Too many Koda requests. Please wait a moment.')

    const validation = validateAIPrompt({ prompt, context })
    if (!validation.valid) return fail(validation.errors.join(', '))

    const { prompt: cleanPrompt, context: cleanContext } = validation.data

    if (isMockMode()) {
      const { getMockAIResponse } = await import('@/lib/mock-ai')
      const intent = classifyChatIntent(cleanPrompt)
      const response = getMockAIResponse(cleanContext, cleanPrompt, intent)
      return ok(response)
    }

    // Every non-mock turn goes through the tool loop. importedContent is a
    // server-only decision and is never forwarded from this exported action.
    const { runChatTurn } = await import('@/lib/chat-turn')
    const result = await runChatTurn(user, cleanPrompt, cleanContext)
    return ok(result)
  } catch (err) {
    console.error('[askAI] error:', err)
    return fail('Koda could not respond. Please try again.')
  }
}


// ── Receipt parsing ────────────────────────────────────────────────────────────

const RECEIPT_SYSTEM_PROMPT =
  'You are a receipt parsing assistant. Analyze this receipt image and extract all information. ' +
  'Return ONLY a JSON object with no extra text.'

const RECEIPT_PARSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    store_name: { type: 'STRING', nullable: true },
    receipt_date: { type: 'STRING', nullable: true, description: 'YYYY-MM-DD format' },
    items: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          item_name: { type: 'STRING' },
          quantity: { type: 'NUMBER', nullable: true },
          unit_price: { type: 'NUMBER', nullable: true },
          total_price: { type: 'NUMBER' },
        },
        required: ['item_name', 'total_price'],
      },
    },
    receipt_total: { type: 'NUMBER', nullable: true },
  },
  required: ['items'],
}

/**
 * Parse a grocery receipt image using Gemini vision.
 * Accepts either a Supabase Storage signed URL or a base64 data URL.
 */
export async function parseReceiptAction(imageSource, mimeType = 'image/jpeg') {
  try {
    const user = await requireUser()
    const rate = uploadLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    if (!imageSource) return fail('No image provided.')

    if (isMockMode()) {
      return ok({
        store_name: 'Trader Joe\'s',
        receipt_date: new Date().toISOString().slice(0, 10),
        items: [
          { item_name: 'Organic Chicken Breast', quantity: 1, unit_price: 9.99, total_price: 9.99 },
          { item_name: 'Baby Spinach', quantity: 1, unit_price: 3.49, total_price: 3.49 },
          { item_name: 'Whole Milk', quantity: 2, unit_price: 2.99, total_price: 5.98 },
          { item_name: 'Sourdough Bread', quantity: 1, unit_price: 4.49, total_price: 4.49 },
        ],
        receipt_total: 23.95,
      })
    }

    const { GoogleGenAI } = await import('@google/genai')
    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) return fail('AI service is not configured.')

    const ai = new GoogleGenAI({ apiKey })

    let imageData
    let imageMimeType = mimeType

    if (imageSource.startsWith('data:')) {
      // Data URL: extract base64 payload
      const match = imageSource.match(/^data:([^;]+);base64,(.+)$/)
      if (!match) return fail('Invalid image data.')
      imageMimeType = match[1]
      imageData = match[2]
    } else {
      // Remote URL: must be a Supabase Storage signed URL on our own project.
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!supabaseUrl || !imageSource.startsWith(supabaseUrl + '/')) {
        return fail('Invalid image source.')
      }
      const response = await fetch(imageSource)
      if (!response.ok) return fail('Could not fetch receipt image.')
      const ct = (response.headers.get('content-type') || '').split(';')[0].trim()
      if (!ct.startsWith('image/')) return fail('Invalid image type.')
      imageMimeType = ct || mimeType
      const buffer = await response.arrayBuffer()
      imageData = Buffer.from(buffer).toString('base64')
    }

    const parts = [
      { inlineData: { mimeType: imageMimeType, data: imageData } },
      { text: 'Parse this receipt and return the structured data.' },
    ]

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts }],
      config: {
        systemInstruction: RECEIPT_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseSchema: RECEIPT_PARSE_SCHEMA,
      },
    })

    let parsed
    try {
      parsed = JSON.parse(response.text)
    } catch {
      return fail('Could not read receipt. Please try manual entry.')
    }

    if (!parsed?.items?.length) {
      return fail('No items found on receipt. Please try manual entry.')
    }

    return ok(parsed)
  } catch (err) {
    console.error('[parseReceiptAction] error:', err)
    return fail('Receipt scanning failed. Please try manual entry.')
  }
}

// ── Receipt item classification ───────────────────────────────────────────────

// Rule-based fallback classification (mock mode + Gemini failure fallback)
const FRESH_CATEGORIES = new Set([
  'Produce', 'Meat and Seafood', 'Meat', 'Seafood',
  'Dairy and Eggs', 'Dairy', 'Bread and Bakery', 'Bakery',
])
const SHELF_LIFE_BY_CATEGORY = {
  'Produce': 7, 'Meat and Seafood': 3, 'Meat': 3, 'Seafood': 2,
  'Dairy and Eggs': 14, 'Dairy': 14, 'Bread and Bakery': 5, 'Bakery': 5,
  'Frozen': 90, 'Canned and Jarred': 730, 'Canned': 730,
  'Grains and Pasta': 365, 'Grains': 365, 'Spices and Seasonings': 1095,
  'Oils and Condiments': 365, 'Pantry': 365,
  'Snacks': 90, 'Beverages': 180, 'Household': 0, 'Other': 90,
}
const NON_FOOD_CATEGORIES = new Set(['Household'])

function classifyLocally(items) {
  return items.map(item => {
    const cat = item.category || 'Other'
    const isFresh = FRESH_CATEGORIES.has(cat)
    const isFood = !NON_FOOD_CATEGORIES.has(cat)
    return {
      item_name: item.item_name,
      category: cat,
      pantry_type: isFresh ? 'fresh' : 'staple',
      suggested_shelf_life_days: SHELF_LIFE_BY_CATEGORY[cat] ?? 90,
      is_food: isFood,
    }
  })
}

const ITEM_CLASSIFICATION_SCHEMA = {
  type: 'ARRAY',
  items: {
    type: 'OBJECT',
    properties: {
      item_name: { type: 'STRING' },
      category: { type: 'STRING' },
      pantry_type: { type: 'STRING' },
      suggested_shelf_life_days: { type: 'INTEGER' },
      is_food: { type: 'BOOLEAN' },
    },
    required: ['item_name', 'category', 'pantry_type', 'suggested_shelf_life_days', 'is_food'],
  },
}

export async function classifyReceiptItemsAction(receiptId, items) {
  try {
    const user = await requireUser()
    const rate = aiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    if (!Array.isArray(items) || items.length === 0) return fail('No items to classify.')

    const cleanId = sanitizeString(receiptId, 50)
    if (!cleanId) return fail('Invalid receipt ID.')

    // Check for cached classification first
    const { getReceiptClassification, saveClassifiedItems } = await import('@/lib/dal/budget')
    const cached = await getReceiptClassification(user.id, cleanId)
    if (cached?.length) return ok(cached)

    if (isMockMode()) {
      const classified = classifyLocally(items)
      await saveClassifiedItems(user.id, cleanId, classified)
      return ok(classified)
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) {
      // Fallback to local classification if no API key
      const classified = classifyLocally(items)
      return ok(classified)
    }

    const { GoogleGenAI } = await import('@google/genai')
    const ai = new GoogleGenAI({ apiKey })

    const itemList = items.map(i => i.item_name).join('\n')
    const prompt = `You are a grocery item classifier. For each item in the following grocery receipt list classify it into the following fields. category as one of: Produce, Meat and Seafood, Dairy and Eggs, Bread and Bakery, Frozen, Canned and Jarred, Spices and Seasonings, Oils and Condiments, Grains and Pasta, Snacks, Beverages, Household, or Other. pantry_type as either staple for non-perishable items that are regularly kept in stock or fresh for perishable items that need to be used within days or weeks. suggested_shelf_life_days as an integer representing how many days this item typically lasts. is_food as true or false — exclude non-food household items like cleaning supplies, paper products, and personal care items from the pantry add prompt. Return a JSON array with one object per item.\n\nItems:\n${itemList}`

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: ITEM_CLASSIFICATION_SCHEMA,
      },
    })

    let classified
    try {
      classified = JSON.parse(response.text)
    } catch {
      classified = classifyLocally(items)
    }

    if (!Array.isArray(classified) || classified.length === 0) {
      classified = classifyLocally(items)
    }

    await saveClassifiedItems(user.id, cleanId, classified)
    return ok(classified)
  } catch (err) {
    console.error('[classifyReceiptItemsAction] error:', err)
    // On error, fall back to local classification
    const classified = classifyLocally(items)
    return ok(classified)
  }
}

export async function getAIHistoryAction(context) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')
    const cleanContext = sanitizeEnum(context, VALID_CONTEXTS) || 'general'

    if (isMockMode()) return ok([])

    const { getHistory } = await import('@/lib/dal/ai-history')
    const history = await getHistory(user.id, cleanContext)
    return ok(history)
  } catch (err) {
    console.error('[getAIHistoryAction] error:', err)
    return fail('Could not load chat history')
  }
}

/**
 * Confirm a meal edit suggestion and write it to the meal plan.
 * Optionally adds missing ingredients to the grocery list.
 *
 * @param {object} cardData - The card object from a suggestion response
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function confirmMealEditAction(cardData) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const { day, targetSlotType, suggestion } = cardData || {}
    if (!day || !targetSlotType || !suggestion?.item_name) {
      return fail('Invalid suggestion data')
    }

    try {
      await assertCanExecuteChatAction(user.id, 'set_meal')
      if (suggestion.ingredients_needed?.length > 0) {
        await assertCanExecuteChatAction(user.id, 'add_to_grocery')
      }
    } catch (err) {
      if (err?.code === CHAT_ACTION_FORBIDDEN || err?.code === CHAT_ACTION_UNKNOWN) {
        return fail(err.message)
      }
      throw err
    }

    const cleanName = sanitizeString(suggestion.item_name, 200)
    if (!cleanName) return fail('Invalid item name')

    const cleanSlot = sanitizeEnum(targetSlotType, [
      'sides', 'sides2', 'sides3', 'sides4',
      'breakfast_side', 'lunch_side', 'dinner_dessert',
    ])
    if (!cleanSlot) return fail('Invalid slot type')

    const cleanDay = sanitizeString(day, 10)
    if (!cleanDay) return fail('Invalid day')

    if (isMockMode()) {
      const { updateMockMeal } = await import('@/lib/dal/mock-store')
      const updated = await updateMockMeal(cleanDay, cleanSlot, {
        name: cleanName,
        recipeId: null,
        recipe: null,
        ingredients: [],
      })
      if (!updated) return fail('Could not update meal slot')

      // Add missing ingredients to grocery in mock mode
      let groceryAdded = []
      if (suggestion.ingredients_needed?.length > 0) {
        const { addMockGroceryItems } = await import('@/lib/dal/mock-store')
        groceryAdded = suggestion.ingredients_needed
        if (typeof addMockGroceryItems === 'function') {
          addMockGroceryItems(groceryAdded)
        }
      }

      revalidatePath('/meals')
      revalidatePath('/grocery')
      return ok({ added: cleanName, day: cleanDay, slot: cleanSlot, groceryAdded })
    }

    // Production: write to Supabase
    const { getSupabaseServerClient } = await import('@/lib/supabase/server')
    const { getOrCreateMealPlan } = await import('@/lib/dal/meals')
    const supabase = await getSupabaseServerClient()

    const DAY_TO_INT = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }
    const dayInt = DAY_TO_INT[cleanDay]
    if (!dayInt) return fail('Invalid day')

    const planId = await getOrCreateMealPlan(user.id, supabase, 0)

    const { error } = await supabase.from('meal_slots').upsert(
      {
        meal_plan_id: planId,
        user_id: user.id,
        day_of_week: dayInt,
        meal_type: cleanSlot,
        custom_meal_name: cleanName,
        recipe_id: null,
      },
      { onConflict: 'meal_plan_id,day_of_week,meal_type' }
    )

    if (error) {
      console.error('[confirmMealEditAction] upsert error:', error.message)
      return fail('Could not add to meal plan')
    }

    // Add missing ingredients to grocery list
    let groceryAdded = []
    if (suggestion.ingredients_needed?.length > 0) {
      groceryAdded = suggestion.ingredients_needed
      const items = groceryAdded.map(name => ({
        user_id: user.id,
        name,
        quantity: '1',
        category: 'Other',
        status: 'need',
        checked: false,
        source_meal: `${cleanDay} ${cardData.mealType || 'dinner'} - ${cleanName}`,
      }))

      const { error: groceryError } = await supabase
        .from('grocery_items')
        .insert(items)

      if (groceryError) {
        console.error('[confirmMealEditAction] grocery insert error:', groceryError.message)
        // Non-fatal: the meal was added, grocery is best-effort
      }
    }

    revalidatePath('/meals')
    revalidatePath('/grocery')
    return ok({ added: cleanName, day: cleanDay, slot: cleanSlot, groceryAdded })
  } catch (err) {
    console.error('[confirmMealEditAction] error:', err)
    return fail('Something went wrong')
  }
}

/**
 * Save a generated meal plan preview to Supabase.
 * Called when the user clicks "Save this plan!" on a meal_plan_preview card.
 *
 * @param {Array<{ day_of_week: number, meal_type: string, meal_name: string }>} slots
 */
export async function confirmPlanWeekAction(slots) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    if (!Array.isArray(slots) || slots.length === 0) return fail('No meal slots provided')

    try {
      await assertCanExecuteChatAction(user.id, 'fill_meal_plan')
    } catch (err) {
      if (err?.code === CHAT_ACTION_FORBIDDEN || err?.code === CHAT_ACTION_UNKNOWN) {
        return fail(err.message)
      }
      throw err
    }

    const { fillMealPlan } = await import('@/lib/actions/chat-actions')
    const result = await fillMealPlan(user.id, slots)
    return ok(result)
  } catch (err) {
    console.error('[confirmPlanWeekAction] error:', err)
    return fail('Could not save meal plan')
  }
}

/**
 * Confirm a pending chat action by id. Atomically claims the row via the
 * SECURITY DEFINER RPC, re-validates the stored payload with the same input
 * checks as the normal path, and then executes it.
 */
export async function confirmChatPendingAction(pendingId) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const cleanId = sanitizeString(pendingId, 100)
    if (!cleanId) return fail('Invalid confirmation id.')

    const { claimPendingAction, validateToolArgs, executeBigAction } = await import('@/lib/chat-tools')
    const row = await claimPendingAction(user.id, cleanId)
    if (!row) return fail('This confirmation is no longer available.')

    try {
      await assertCanExecuteChatAction(user.id, row.action_type)
    } catch (err) {
      if (err?.code === CHAT_ACTION_FORBIDDEN || err?.code === CHAT_ACTION_UNKNOWN) {
        return fail(err.message)
      }
      throw err
    }

    let safeArgs
    try {
      safeArgs = validateToolArgs(row.action_type, row.payload || {})
    } catch (err) {
      console.error('[confirmChatPendingAction] re-validation failed:', err?.message)
      return fail('That change can no longer be applied.')
    }

    const result = await executeBigAction(user.id, row.action_type, safeArgs)
    // A confirmed big change counts as "the next change" — supersede any
    // open undo so the stale chip disappears everywhere.
    const { supersedeUndo } = await import('@/lib/chat-tools')
    await supersedeUndo(user.id).catch(() => {})

    revalidatePath('/meals')
    revalidatePath('/dashboard')
    revalidatePath('/grocery')
    revalidatePath('/kitchen')

    let text = 'Saved.'
    if (row.action_type === 'fill_meal_plan') text = 'Saved. Your week is on the meal plan.'
    else if (row.action_type === 'add_recipe') text = 'Saved to your Recipe Box.'
    else if (row.action_type === 'log_receipt') text = 'Logged that receipt.'
    else if (row.action_type === 'clear_slot') text = 'Those slots are clear now.'
    else if (row.action_type === 'add_to_grocery') text = 'Added to your grocery list.'

    return ok({ executed: row.action_type, result, text })
  } catch (err) {
    console.error('[confirmChatPendingAction] error:', err)
    return fail('Could not apply the change.')
  }
}

/**
 * Cancel a pending chat action by id. Uses a SECURITY DEFINER RPC because
 * chat_pending_actions has no UPDATE/DELETE policy. Idempotent — a repeat
 * cancel or an already-claimed row simply returns the same reply.
 */
export async function cancelChatPendingAction(pendingId) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const cleanId = sanitizeString(pendingId, 100)
    if (!cleanId) return fail('Invalid confirmation id.')

    const { cancelPendingAction } = await import('@/lib/chat-tools')
    await cancelPendingAction(user.id, cleanId)
    return ok({ text: 'No problem, I left your week as it was.' })
  } catch (err) {
    console.error('[cancelChatPendingAction] error:', err)
    return fail('Could not cancel that change.')
  }
}

/**
 * Undo a small chat change. Takes only `undoId` from the browser; every
 * decision — ownership, expiry, re-validation, and the user_id used for
 * every write — is made server-side from `auth.uid()`.
 */
export async function undoChatAction(undoId, ..._ignored) {
  try {
    void _ignored
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const cleanId = sanitizeString(undoId, 100)
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const okShape = cleanId && (
      UUID_RE.test(cleanId) || (isMockMode() && /^uu_[a-z0-9]{6,}$/i.test(cleanId))
    )
    if (!okShape) return fail('That undo is no longer available.')

    const { claimUndo, restoreUndoEntry, composeUndoLabel } = await import('@/lib/chat-tools')
    const row = await claimUndo(user.id, cleanId)
    if (!row) return fail('That undo is no longer available.')

    const entries = Array.isArray(row.entries) ? row.entries : []

    // Re-check per-entry permissions server-side.
    const ENTRY_TO_ACTION = {
      slot: 'swap_meal',
      pantry: 'update_pantry',
      staple: 'mark_staple_out_of_stock',
      grocery_ids: 'add_to_grocery',
    }
    for (const e of entries) {
      try {
        await assertCanExecuteChatAction(user.id, ENTRY_TO_ACTION[e.kind] || 'swap_meal')
      } catch (err) {
        if (err?.code === CHAT_ACTION_FORBIDDEN || err?.code === CHAT_ACTION_UNKNOWN) {
          return fail(err.message)
        }
        throw err
      }
    }

    // Restore in reverse order.
    for (let i = entries.length - 1; i >= 0; i--) {
      await restoreUndoEntry(user.id, entries[i])
    }

    revalidatePath('/meals')
    revalidatePath('/dashboard')
    revalidatePath('/grocery')
    revalidatePath('/kitchen')

    const text = row.label || composeUndoLabel(entries)
    return ok({ text })
  } catch (err) {
    console.error('[undoChatAction] error:', err)
    return fail('That undo is no longer available.')
  }
}
