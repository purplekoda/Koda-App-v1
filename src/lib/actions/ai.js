'use server'

import { revalidatePath } from 'next/cache'
import { requireUser, isMockMode } from '@/lib/dal/require-user'
import { validateAIPrompt } from '@/lib/validators'
import { sanitizeString, sanitizeEnum } from '@/lib/sanitize'
import { apiLimiter, aiLimiter, uploadLimiter } from '@/lib/rate-limit'
import { ok, fail } from '@/lib/action-result'
import { classifyChatIntent } from '@/lib/chat-intent'

const VALID_CONTEXTS = [
  'dashboard', 'meals', 'grocery', 'pantry', 'recipes', 'events', 'general',
]

/**
 * Derive follow-up suggestion chips from the AI response text.
 * Runs entirely server-side — no extra Gemini round-trip.
 * @param {string} text
 * @returns {string[]}
 */
function deriveChips(text) {
  const lower = text.toLowerCase()
  if (/grocery|shopping|buy|ingredient|store|aisle/.test(lower)) {
    return ['Check grocery list', 'Add to list', 'Find substitutions']
  }
  if (/pantry|fridge|refrigerator|expir|spoil/.test(lower)) {
    return ['Update pantry', 'Suggest dinner', 'What else is expiring?']
  }
  if (/meal|plan|week|recipe|dish|dinner|lunch|breakfast/.test(lower)) {
    return ['Plan this week', 'Show suggestions', 'Swap a meal']
  }
  if (/nutrition|calorie|protein|carb|fat|vitamin|macro/.test(lower)) {
    return ['Show full nutrition', 'Set nutrition goal', 'Plan balanced meals']
  }
  return ['Plan meals', 'Make grocery list', 'Check pantry']
}

/**
 * Determine the target slot type for an accompaniment, cascading to available slots.
 */
function resolveTargetSlot(itemType, mealType, currentDayMeals) {
  // For desserts, use dinner_dessert
  if (itemType === 'dessert') return 'dinner_dessert'

  // For breakfast/lunch sides
  if (mealType === 'breakfast') return 'breakfast_side'
  if (mealType === 'lunch') return 'lunch_side'

  // For dinner sides, cascade through sides → sides2 → sides3 → sides4
  const sideSlots = ['sides', 'sides2', 'sides3', 'sides4']
  if (currentDayMeals) {
    for (const slot of sideSlots) {
      const existing = currentDayMeals.find(m => m.type === slot)
      if (!existing || !existing.name) return slot
    }
  }
  return 'sides'
}

/**
 * Route a confirmed Gemini action to the appropriate chat-action function.
 * @param {string} userId
 * @param {{ type: string, confirmed: boolean, [key: string]: any }} action
 */
async function executeChatAction(userId, action) {
  const {
    fillMealPlan,
    swapMeal,
    addRecipeFromChat,
    logReceiptFromChat,
    addToGroceryList,
    updatePantryFromChat,
  } = await import('@/lib/actions/chat-actions')

  switch (action.type) {
    case 'fill_meal_plan':
      return fillMealPlan(userId, action.meal_plan_slots || [])

    case 'swap_meal':
      return swapMeal(userId, action.swap_day, action.swap_meal_type, action.swap_new_meal_name)

    case 'add_recipe':
      return addRecipeFromChat(userId, action.recipe || {})

    case 'log_receipt':
      return logReceiptFromChat(userId, action.receipt || {})

    case 'add_to_grocery':
      return addToGroceryList(userId, action.grocery_items || [])

    case 'update_pantry':
    case 'mark_staple_out_of_stock':
      return updatePantryFromChat(userId, action.pantry_item_name, action.pantry_is_out_of_stock ?? true)

    default:
      console.warn('[executeChatAction] Unknown action type:', action.type)
      return null
  }
}

/**
 * Handle meal plan editing intent via Gemini structured output.
 */
async function handleMealEditIntent(user, cleanPrompt, intent) {
  const { buildMealPlanPrompt } = await import('@/lib/buildMealPlanPrompt')
  const { getWeeklyMeals } = await import('@/lib/dal/meals')

  // Load context in parallel
  const [{ systemPromptPrefix }, currentMeals] = await Promise.all([
    buildMealPlanPrompt(user.id),
    getWeeklyMeals(user.id, 0),
  ])

  // Find the target day's meals for slot resolution
  let targetDayMeals = null
  if (intent.day) {
    const dayData = currentMeals.find(d => d.day === intent.day)
    if (dayData) targetDayMeals = dayData.meals
  }

  const targetSlot = resolveTargetSlot(intent.itemType, intent.mealType, targetDayMeals)

  // Build history with just this message
  const history = [{ role: 'user', parts: [{ text: cleanPrompt }] }]

  const { generateMealEditSuggestion } = await import('@/lib/gemini')
  const result = await generateMealEditSuggestion(history, systemPromptPrefix, {
    day: intent.day,
    mealType: intent.mealType,
    itemType: intent.itemType,
    currentMeals,
  })

  // If Gemini needs clarification, return as a normal message
  if (result.needs_clarification || !result.suggestion) {
    return ok({
      text: result.message,
      chips: ['Add a side dish', 'Add dessert', 'Never mind'],
    })
  }

  // Return structured suggestion with card
  return ok({
    text: result.message,
    chips: [],
    card: {
      type: 'meal_suggestion',
      day: intent.day,
      mealType: intent.mealType,
      targetSlotType: targetSlot,
      suggestion: result.suggestion,
    },
  })
}

/**
 * Handle swap intent — multi-step conversational swap flow with two confirmations.
 */
async function handleSwapIntent(user, cleanPrompt, cleanContext, intent) {
  const { buildMealPlanPrompt } = await import('@/lib/buildMealPlanPrompt')
  const { getWeeklyMeals } = await import('@/lib/dal/meals')
  const { getHistory, saveHistory } = await import('@/lib/dal/ai-history')
  const { generateMealSwapSuggestion } = await import('@/lib/gemini')

  const [{ systemPromptPrefix }, currentMeals, history] = await Promise.all([
    buildMealPlanPrompt(user.id),
    getWeeklyMeals(user.id, 0),
    getHistory(user.id, cleanContext),
  ])

  const updatedHistory = [
    ...history,
    { role: 'user', parts: [{ text: cleanPrompt }] },
  ]

  const result = await generateMealSwapSuggestion(updatedHistory, systemPromptPrefix, {
    day: intent.day,
    mealType: intent.mealType,
    currentMeals,
  })

  // Save history for multi-turn swap conversation
  const finalHistory = [
    ...updatedHistory,
    { role: 'model', parts: [{ text: result.message }] },
  ]
  saveHistory(user.id, cleanContext, finalHistory).catch((err) =>
    console.error('[handleSwapIntent] Failed to save history:', err)
  )

  const response = { text: result.message, chips: [] }

  // Execute the swap when both confirmations are received
  if (result.confirmed && result.suggestion) {
    try {
      const { swapMeal } = await import('@/lib/actions/chat-actions')
      await swapMeal(user.id, intent.day, intent.mealType, result.suggestion.recipe_name)
      response.chips = ['View meal plan', 'Swap another meal', 'Make grocery list']
    } catch (err) {
      console.error('[handleSwapIntent] Swap execution failed:', err)
      response.chips = ['Try again', 'Never mind']
    }
    return ok(response)
  }

  // If swap has a suggestion pending confirmation, present it as a card
  if (result.suggestion && !result.confirmed) {
    response.card = {
      type: 'swap_suggestion',
      day: intent.day,
      mealType: intent.mealType,
      suggestion: result.suggestion,
      step: result.step,
    }
    response.chips = ['Confirm swap', 'Suggest something else', 'Never mind']
  } else if (!result.suggestion) {
    response.chips = ['Use pantry ingredients', 'Open to new ingredients', 'Never mind']
  }

  return ok(response)
}

/**
 * Handle Surprise Me intent — asks user to choose Path A or B, then suggests.
 */
async function handleSurpriseMeIntent(user, cleanPrompt, cleanContext) {
  const { buildMealPlanPrompt } = await import('@/lib/buildMealPlanPrompt')
  const { getHistory, saveHistory } = await import('@/lib/dal/ai-history')
  const { generateSurpriseMeSuggestion } = await import('@/lib/gemini')

  const [{ systemPromptPrefix }, history] = await Promise.all([
    buildMealPlanPrompt(user.id),
    getHistory(user.id, cleanContext),
  ])

  const updatedHistory = [
    ...history,
    { role: 'user', parts: [{ text: cleanPrompt }] },
  ]

  const result = await generateSurpriseMeSuggestion(updatedHistory, systemPromptPrefix)

  const finalHistory = [
    ...updatedHistory,
    { role: 'model', parts: [{ text: result.message }] },
  ]
  saveHistory(user.id, cleanContext, finalHistory).catch((err) =>
    console.error('[handleSurpriseMeIntent] Failed to save history:', err)
  )

  const response = { text: result.message, chips: [] }

  if (result.step === 'ask_path') {
    response.chips = ['Use what I already have', 'Something new and popular']
  } else if (result.suggestion) {
    response.card = {
      type: 'surprise_suggestion',
      suggestion: result.suggestion,
      path: result.path,
    }
    response.chips = ['Add to meal plan', 'Surprise me again', 'Never mind']
  }

  return ok(response)
}

/**
 * Handle Plan Week intent — three conversational questions one at a time.
 */
async function handlePlanWeekIntent(user, cleanPrompt, cleanContext) {
  const { buildMealPlanPrompt } = await import('@/lib/buildMealPlanPrompt')
  const { getHistory, saveHistory } = await import('@/lib/dal/ai-history')
  const { generatePlanWeekConversation } = await import('@/lib/gemini')

  const [{ systemPromptPrefix }, history] = await Promise.all([
    buildMealPlanPrompt(user.id),
    getHistory(user.id, cleanContext),
  ])

  const updatedHistory = [
    ...history,
    { role: 'user', parts: [{ text: cleanPrompt }] },
  ]

  const result = await generatePlanWeekConversation(updatedHistory, systemPromptPrefix)

  const finalHistory = [
    ...updatedHistory,
    { role: 'model', parts: [{ text: result.message }] },
  ]
  saveHistory(user.id, cleanContext, finalHistory).catch((err) =>
    console.error('[handlePlanWeekIntent] Failed to save history:', err)
  )

  const response = { text: result.message, chips: [] }

  if (result.ready_to_plan && result.plan_config) {
    // Generate the actual meal plan now that the user has confirmed the settings
    try {
      const { getWeeklyMeals } = await import('@/lib/dal/meals')
      const { generateMealPlan } = await import('@/lib/gemini')
      const { getUserRecipes } = await import('@/lib/dal/recipes')

      const [currentMeals, userRecipes] = await Promise.all([
        getWeeklyMeals(user.id, 0),
        getUserRecipes(user.id),
      ])

      const emptySlots = currentMeals.flatMap(day =>
        day.meals
          .filter(m => !m.name && ['breakfast', 'lunch', 'dinner'].includes(m.type))
          .map(m => ({ day: day.day, dayOfWeek: day.dayOfWeek, type: m.type }))
      )

      if (emptySlots.length > 0) {
        const planResult = await generateMealPlan(emptySlots, {
          mealPlanSystemPrompt: systemPromptPrefix,
          userRecipes: userRecipes.map(r => ({ name: r.name, tags: r.tags || [] })),
          userInstructions: [
            result.plan_config.dietary_filters,
            result.plan_config.extra_instructions,
          ].filter(Boolean).join('. ') || null,
        })

        if (planResult.slots?.length > 0) {
          // Format plan preview for display
          const DAY_LABELS = { 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday', 7: 'Sunday' }
          const previewLines = planResult.slots.map(
            s => `• ${DAY_LABELS[s.day_of_week]} ${s.meal_type}: ${s.meal_name}`
          )

          response.text =
            `${result.message}\n\nHere's your week:\n${previewLines.join('\n')}\n\nShall I save this plan?`
          response.chips = ['Yes, save it!', 'Let me change something', 'Start over']

          // Attach plan data as a card so the frontend can offer a one-click save
          response.card = {
            type: 'meal_plan_preview',
            slots: planResult.slots,
          }

          return ok(response)
        }
      }

      response.text = result.message + '\n\nYour meal plan is already full — swap individual meals to make changes.'
      response.chips = ['Swap a meal', 'View plan', 'Never mind']
    } catch (err) {
      console.error('[handlePlanWeekIntent] Plan generation failed:', err)
      response.chips = ['Try again', 'Never mind']
    }
    return ok(response)
  }

  if (result.step === 1) {
    response.chips = ['Use my Recipe Box', 'Search online', 'Mix of both', 'Fill it all for me']
  } else if (result.step === 2) {
    response.chips = ['No extra restrictions', 'Low carb this week', 'No red meat']
  } else if (result.step === 3) {
    response.chips = ['Quick meals only', 'No preference', 'Budget-friendly']
  } else if (result.step === 4) {
    response.chips = ['Sounds good, plan it!', 'Let me change something']
  }

  return ok(response)
}

export async function askAI(prompt, context) {
  try {
    const user = await requireUser()
    const rate = aiLimiter.check(user.id)
    if (!rate.success) return fail('Too many Koda requests. Please wait a moment.')

    const validation = validateAIPrompt({ prompt, context })
    if (!validation.valid) return fail(validation.errors.join(', '))

    const { prompt: cleanPrompt, context: cleanContext } = validation.data

    // --- Intent detection for meal plan editing ---
    const intent = classifyChatIntent(cleanPrompt)

    if (isMockMode()) {
      const { getMockAIResponse } = await import('@/lib/mock-ai')
      const response = getMockAIResponse(cleanContext, cleanPrompt, intent)
      return ok(response)
    }

    // --- Meal edit intents route to structured flow ---
    if (intent.intent === 'add_accompaniment') {
      return await handleMealEditIntent(user, cleanPrompt, intent)
    }

    // --- Swap intent routes to multi-step swap flow ---
    if (intent.intent === 'swap_item') {
      return await handleSwapIntent(user, cleanPrompt, cleanContext, intent)
    }

    // --- Surprise Me intent routes to path-choice flow ---
    if (intent.intent === 'surprise_me') {
      return await handleSurpriseMeIntent(user, cleanPrompt, cleanContext)
    }

    // --- Plan Week intent routes to three-question flow ---
    if (intent.intent === 'plan_week') {
      return await handlePlanWeekIntent(user, cleanPrompt, cleanContext)
    }

    // --- General flow: full household context + app-control actions ---
    const [
      { getHistory, saveHistory },
      { callGeminiWithActions },
      { buildMealPlanPrompt },
      { buildChatContext },
    ] = await Promise.all([
      import('@/lib/dal/ai-history'),
      import('@/lib/gemini'),
      import('@/lib/buildMealPlanPrompt'),
      import('@/lib/chat-context'),
    ])

    // 1. Load history and household context in parallel
    const [history, { systemPromptPrefix }, chatContext] = await Promise.all([
      getHistory(user.id, cleanContext),
      buildMealPlanPrompt(user.id),
      buildChatContext(user.id),
    ])

    const householdContext = [systemPromptPrefix, chatContext].filter(Boolean).join('\n\n')

    // 2. Append the new user message
    const updatedHistory = [
      ...history,
      { role: 'user', parts: [{ text: cleanPrompt }] },
    ]

    // 3. Call Gemini with structured output (message + optional action)
    const result = await callGeminiWithActions(updatedHistory, householdContext)
    const responseText = result.message

    // 4. Execute confirmed action if present
    let actionExecuted = null
    if (result.action?.confirmed && result.action?.type) {
      try {
        await executeChatAction(user.id, result.action)
        actionExecuted = result.action.type
        revalidatePath('/(app)', 'layout')
      } catch (err) {
        console.error('[askAI] Action execution failed:', err)
      }
    }

    // 5. Persist history (fire-and-forget)
    const finalHistory = [
      ...updatedHistory,
      { role: 'model', parts: [{ text: responseText }] },
    ]
    saveHistory(user.id, cleanContext, finalHistory).catch((err) =>
      console.error('[askAI] Failed to save history:', err)
    )

    // 6. Return structured response
    return ok({
      text: responseText,
      chips: deriveChips(responseText),
      actionExecuted,
    })
  } catch (err) {
    try { const _r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GOOGLE_AI_API_KEY }, body: JSON.stringify({ contents: [{ parts: [{ text: 'hi' }] }] }) }); console.error('[RAW CHECK]', _r.status, (await _r.text()).slice(0, 300)) } catch (_e) { console.error('[RAW CHECK] failed', _e?.message) }; console.error('[ENV CHECK]', Object.keys(process.env).filter(k => ['GOOGLE','GEMINI','VERTEX'].some(s => k.includes(s))).join(',')); console.error('[KEY CHECK]', process.env.GOOGLE_AI_API_KEY?.length, process.env.GOOGLE_AI_API_KEY?.slice(0,6), process.env.GOOGLE_AI_API_KEY?.slice(-4)); console.error('[askAI] error:', err)
    return fail('Koda couldn\u2019t respond. Please try again.')
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

    const { fillMealPlan } = await import('@/lib/actions/chat-actions')
    const result = await fillMealPlan(user.id, slots)
    return ok(result)
  } catch (err) {
    console.error('[confirmPlanWeekAction] error:', err)
    return fail('Could not save meal plan')
  }
}
