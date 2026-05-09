'use server'

import { requireUser, isMockMode } from '@/lib/dal/require-user'
import { sanitizeString, sanitizeJson } from '@/lib/sanitize'
import { apiLimiter } from '@/lib/rate-limit'
import { ok, fail } from '@/lib/action-result'
import { toggleMockTodo, getMockTodos } from '@/lib/dal/mock-store'
import { saveDashboardSections } from '@/lib/dal/profile'
import { validateDashboardSections } from '@/lib/validators'

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

export async function updateDashboardSections(rawSections) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const sanitized = sanitizeJson(rawSections)
    const validation = validateDashboardSections(sanitized)
    if (!validation.valid) return fail(validation.errors[0])

    const saved = await saveDashboardSections(user.id, validation.data)
    return ok({ sections: saved })
  } catch {
    return fail('Something went wrong')
  }
}
