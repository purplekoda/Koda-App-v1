'use server'

import { requireUser, isMockMode } from '@/lib/dal/require-user'
import { ok, fail } from '@/lib/action-result'
import { apiLimiter } from '@/lib/rate-limit'
import { sanitizeString } from '@/lib/sanitize'

export async function getDislikedIngredientsAction() {
  try {
    const user = await requireUser()

    const { getTasteProfile } = await import('@/lib/dal/taste-profile')
    const profile = await getTasteProfile(user.id)
    const ingredients = profile?.disliked_ingredients || []

    return ok({ ingredients })
  } catch {
    return fail('Something went wrong')
  }
}

export async function updateDislikedIngredientsAction(ingredients) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    if (!Array.isArray(ingredients)) return fail('Invalid ingredients list')

    const cleaned = ingredients
      .map(i => sanitizeString(i, 100))
      .filter(Boolean)
      .slice(0, 30)

    if (isMockMode()) {
      const { saveMockTasteProfile } = await import('@/lib/dal/mock-store')
      saveMockTasteProfile({ disliked_ingredients: cleaned })
      return ok({ ingredients: cleaned })
    }

    const { saveTasteProfile } = await import('@/lib/dal/taste-profile')
    await saveTasteProfile(user.id, { disliked_ingredients: cleaned })

    return ok({ ingredients: cleaned })
  } catch {
    return fail('Something went wrong')
  }
}
