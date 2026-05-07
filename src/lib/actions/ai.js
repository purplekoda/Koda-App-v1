'use server'

import { revalidatePath } from 'next/cache'
import { requireUser, isMockMode } from '@/lib/dal/require-user'
import { validateAIPrompt } from '@/lib/validators'
import { sanitizeString, sanitizeEnum } from '@/lib/sanitize'
import { apiLimiter, aiLimiter } from '@/lib/rate-limit'
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

  // If swap has a suggestion, present it as a card
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

    // --- General flow (unchanged) ---
    const [{ getHistory, saveHistory }, { callGemini }] = await Promise.all([
      import('@/lib/dal/ai-history'),
      import('@/lib/gemini'),
    ])

    // 1. Load existing history for this user+context window
    const history = await getHistory(user.id, cleanContext)

    // 2. Append the new user message
    const updatedHistory = [
      ...history,
      { role: 'user', parts: [{ text: cleanPrompt }] },
    ]

    // 3. Call Gemini — may throw; outer catch returns a friendly fail()
    const responseText = await callGemini(updatedHistory)

    // 4. Append the model reply and persist (fire-and-forget, non-blocking)
    const finalHistory = [
      ...updatedHistory,
      { role: 'model', parts: [{ text: responseText }] },
    ]
    saveHistory(user.id, cleanContext, finalHistory).catch((err) =>
      console.error('[askAI] Failed to save history:', err)
    )

    // 5. Return structured response — chips derived server-side
    return ok({
      text: responseText,
      chips: deriveChips(responseText),
    })
  } catch (err) {
    console.error('[askAI] error:', err)
    return fail('Koda couldn\u2019t respond. Please try again.')
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
