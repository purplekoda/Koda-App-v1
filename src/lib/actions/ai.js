'use server'

import { requireUser, isMockMode } from '@/lib/dal/require-user'
import { validateAIPrompt } from '@/lib/validators'
import { sanitizeEnum } from '@/lib/sanitize'
import { aiLimiter } from '@/lib/rate-limit'
import { ok, fail } from '@/lib/action-result'

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

export async function askAI(prompt, context) {
  try {
    const user = await requireUser()
    const rate = aiLimiter.check(user.id)
    if (!rate.success) return fail('Too many AI requests. Please wait a moment.')

    const validation = validateAIPrompt({ prompt, context })
    if (!validation.valid) return fail(validation.errors.join(', '))

    const { prompt: cleanPrompt, context: cleanContext } = validation.data

    if (isMockMode()) {
      // Import mock-ai server-side only — never shipped to client
      const { getMockAIResponse } = await import('@/lib/mock-ai')
      const response = getMockAIResponse(cleanContext, cleanPrompt)
      return ok(response)
    }

    // --- Production: call Gemini 2.0 Flash with conversation history ---
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
