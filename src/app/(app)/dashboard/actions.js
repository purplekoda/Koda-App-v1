'use server'

import { requireUser, isMockMode } from '@/lib/dal/require-user'
import { sanitizeString } from '@/lib/sanitize'
import { apiLimiter } from '@/lib/rate-limit'
import { ok, fail } from '@/lib/action-result'
import { toggleMockTodo, getMockTodos } from '@/lib/dal/mock-store'

export async function toggleTodo(todoId) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const cleanId = sanitizeString(todoId, 36)
    if (!cleanId) return fail('Invalid todo')

    if (isMockMode()) {
      const updated = await toggleMockTodo(cleanId)
      if (!updated) return fail('Todo not found')
      const todos = await getMockTodos()
      return ok({ todos })
    }

    // In production, toggle in database
    return ok()
  } catch {
    return fail('Something went wrong')
  }
}
