'use server'

import { requireUser } from '@/lib/dal/require-user'
import { apiLimiter } from '@/lib/rate-limit'
import { ok, fail } from '@/lib/action-result'
import { sanitizeString } from '@/lib/sanitize'

/**
 * Send a message in the full onboarding conversation.
 * Relays the full conversation history to Gemini with the master system prompt.
 * Returns Gemini's next response as plain text.
 *
 * @param {{ messages: Array<{ role: 'user'|'model', content: string }> }} input
 */
export async function sendOnboardingChatMessage({ messages }) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    if (!messages?.length) return fail('No messages provided.')

    // Sanitize the latest user message
    const lastMsg = messages[messages.length - 1]
    if (lastMsg.role !== 'user') return fail('Last message must be from user.')
    const sanitized = sanitizeString(lastMsg.content, 2000)
    if (!sanitized) return fail('No response provided.')

    const { isMockMode } = await import('@/lib/dal/require-user')
    if (isMockMode()) {
      const { getMockConversationResponse } = await import('@/data/onboarding-conversation')
      const response = getMockConversationResponse(messages)
      return ok({ response })
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) return fail('AI service is not configured.')

    const { GoogleGenAI } = await import('@google/genai')
    const { ONBOARDING_SYSTEM_PROMPT } = await import('@/data/onboarding-conversation')
    const ai = new GoogleGenAI({ apiKey })

    const contents = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }))

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction: ONBOARDING_SYSTEM_PROMPT,
      },
    })

    return ok({ response: response.text })
  } catch (err) {
    console.error('[sendOnboardingChatMessage] Error:', err?.message)
    return fail('Something went wrong. Please try again.')
  }
}

/**
 * Extract partial onboarding data from the conversation so far.
 * Used to update the background form fill and progress percentage.
 *
 * @param {{ messages: Array<{ role: 'user'|'model', content: string }> }} input
 */
export async function extractPartialOnboardingData({ messages }) {
  try {
    await requireUser()

    if (!messages?.length) return ok({ data: {}, itemsConfirmed: 0 })

    const { isMockMode } = await import('@/lib/dal/require-user')
    if (isMockMode()) {
      const { getMockPartialExtraction } = await import('@/data/onboarding-conversation')
      const data = getMockPartialExtraction(messages)
      return ok({ data, itemsConfirmed: data.items_confirmed || 0 })
    }

    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) return ok({ data: {}, itemsConfirmed: 0 })

    const { GoogleGenAI } = await import('@google/genai')
    const { PARTIAL_EXTRACTION_PROMPT } = await import('@/data/onboarding-conversation')
    const ai = new GoogleGenAI({ apiKey })

    const transcript = messages
      .map(m => `${m.role === 'user' ? 'User' : 'Koda'}: ${m.content}`)
      .join('\n')

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: `Here is the conversation so far:\n\n${transcript}\n\n${PARTIAL_EXTRACTION_PROMPT}`,
      config: {
        responseMimeType: 'application/json',
      },
    })

    const parsed = JSON.parse(response.text)
    return ok({ data: parsed, itemsConfirmed: parsed.items_confirmed || 0 })
  } catch (err) {
    console.error('[extractPartialOnboardingData] Error:', err?.message)
    return ok({ data: {}, itemsConfirmed: 0 })
  }
}

/**
 * Save conversation history for resuming later.
 *
 * @param {{ messages: Array<{ role: 'user'|'model', content: string }> }} input
 */
export async function saveConversationHistoryAction({ messages }) {
  try {
    const user = await requireUser()

    const { isMockMode } = await import('@/lib/dal/require-user')
    if (isMockMode()) {
      const { saveMockOnboardingProfile } = await import('@/lib/dal/mock-store')
      saveMockOnboardingProfile({ onboarding_conversation_history: messages })
      return ok()
    }

    const { updateOnboardingProfile } = await import('@/lib/dal/onboarding')
    await updateOnboardingProfile(user.id, {
      onboarding_conversation_history: messages,
    })
    return ok()
  } catch (err) {
    console.error('[saveConversationHistory] Error:', err?.message)
    return ok() // non-critical
  }
}

/**
 * Save all completed onboarding data from the ONBOARDING_COMPLETE JSON.
 * Calls existing save actions for each section to reuse validation logic.
 *
 * @param {object} completionData - The parsed JSON from Gemini's completion response
 */
export async function saveOnboardingCompletionData(completionData) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const actions = await import('./actions')

    // 1. Save household
    if (completionData.household) {
      const hResult = await actions.saveHouseholdStepAction({
        household_size: completionData.household.household_size || 2,
        household_type: completionData.household.household_type || 'adults_only',
      })
      if (hResult?.success === false) return hResult
    }

    // 2. Save household members
    if (completionData.members?.length) {
      const membersResult = await actions.saveHouseholdMembersAction(
        completionData.members.map(m => ({
          name: m.name || 'Family member',
          age: m.age ?? null,
          age_group: m.age_group || (m.age && m.age < 18 ? 'child' : 'adult'),
          is_picky_eater: m.is_picky_eater || false,
          picky_issues: m.picky_issues || [],
          allergies: m.allergies || [],
          dietary_restrictions: m.dietary_restrictions || [],
          track_macros: m.track_macros || false,
          macro_calories: m.macro_calories ?? null,
          macro_protein_g: m.macro_protein_g ?? null,
          macro_carbs_g: m.macro_carbs_g ?? null,
          macro_fat_g: m.macro_fat_g ?? null,
        }))
      )
      if (membersResult?.success === false) return membersResult
    }

    // 3. Save schedule
    if (completionData.schedule) {
      if (completionData.schedule.cook_time_preference) {
        const ctResult = await actions.saveCookTimeAction({
          cook_time_preference: completionData.schedule.cook_time_preference,
        })
        if (ctResult?.success === false) return ctResult
      }

      const mpResult = await actions.saveMealPlanDaysAction({
        meal_plan_days: completionData.schedule.meal_plan_days || [1, 2, 3, 4, 5],
        meal_prep_days: completionData.schedule.meal_prep_days || [],
      })
      if (mpResult?.success === false) return mpResult
    }

    // 4. Save food preferences
    if (completionData.food_preferences) {
      if (completionData.food_preferences.cuisines?.length) {
        const cResult = await actions.saveCuisinesAction(completionData.food_preferences.cuisines)
        if (cResult?.success === false) return cResult
      }

      if (completionData.food_preferences.adventurousness) {
        const aResult = await actions.saveAdventurousnessAction({
          adventurousness: completionData.food_preferences.adventurousness,
        })
        if (aResult?.success === false) return aResult
      }

      if (completionData.food_preferences.meal_prep_style) {
        const mpResult = await actions.saveMealPrepStyleAction({
          meal_prep_style: completionData.food_preferences.meal_prep_style,
        })
        if (mpResult?.success === false) return mpResult
      }

      if (completionData.food_preferences.cooking_frustrations?.length) {
        const fResult = await actions.saveFrustrationsAction({
          cooking_frustrations: completionData.food_preferences.cooking_frustrations,
        })
        if (fResult?.success === false) return fResult
      }
    }

    // 5. Save budget
    if (completionData.budget) {
      const bResult = await actions.saveBudgetAction({
        weekly_budget: completionData.budget.weekly_budget || 150,
        budget_priorities: [],
        shopping_style: completionData.budget.shopping_style || null,
        preferred_delivery_service: completionData.budget.preferred_delivery_service || null,
      })
      if (bResult?.success === false) return bResult

      if (completionData.budget.preferred_stores?.length) {
        const fsResult = await actions.saveFavoriteStoresAction({
          preferred_stores: completionData.budget.preferred_stores,
          other_store_name: '',
          store_category_assignments: {},
        })
        if (fsResult?.success === false) return fsResult
      }
    }

    // 6. Save health goals
    if (completionData.health) {
      if (completionData.health.health_goals?.length) {
        const hgResult = await actions.saveHealthGoalsAction({
          health_goals: completionData.health.health_goals,
          daily_carb_limit: completionData.health.daily_carb_limit,
        })
        if (hgResult?.success === false) return hgResult
      }
    }

    // 7. Save faith practices
    if (completionData.faith_practices?.has_faith_practices) {
      const fpResult = await actions.saveFaithPracticesOnboardingAction({
        follows_faith_based_diet: true,
        scope: completionData.faith_practices.scope || 'household',
        practices: completionData.faith_practices.practices || [],
      })
      if (fpResult?.success === false) return fpResult
    }

    // 8. Clear conversation history and mark complete
    const { updateOnboardingProfile } = await import('@/lib/dal/onboarding')
    await updateOnboardingProfile(user.id, {
      onboarding_conversation_history: null,
    })

    return ok({ saved: true })
  } catch (err) {
    console.error('[saveOnboardingCompletionData] Error:', err?.message)
    return fail('Could not save your preferences. Please try again.')
  }
}
