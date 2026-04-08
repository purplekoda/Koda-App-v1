'use server'

import { requireUser, isMockMode } from '@/lib/dal/require-user'
import { validateAIPrompt } from '@/lib/validators'
import { aiLimiter } from '@/lib/rate-limit'
import { ok, fail } from '@/lib/action-result'

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

    // In production, call your AI service (e.g., Claude API)
    return ok({
      text: 'AI responses will be available once the AI service is configured.',
      chips: [],
    })
  } catch {
    return fail('Something went wrong')
  }
}
