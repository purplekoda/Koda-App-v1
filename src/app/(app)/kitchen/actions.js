'use server'

import { requireUser, isMockMode } from '@/lib/dal/require-user'
import { sanitizeInteger, sanitizeEnum } from '@/lib/sanitize'
import { apiLimiter, uploadLimiter } from '@/lib/rate-limit'
import { ok, fail } from '@/lib/action-result'
import { getMockPantry, getMockDinnerIdeas, getMockLastScan } from '@/lib/dal/mock-store'

export async function startScan() {
  try {
    const user = await requireUser()
    const rate = uploadLimiter.check(user.id)
    if (!rate.success) return fail('Too many scans. Please wait a moment.')

    if (isMockMode()) {
      const pantryItems = await getMockPantry()
      const dinnerIdeas = await getMockDinnerIdeas()
      const lastScan = await getMockLastScan()
      return ok({ pantryItems, dinnerIdeas, lastScan })
    }

    // In production, trigger image analysis pipeline
    return ok({ pantryItems: [], dinnerIdeas: [], lastScan: null })
  } catch {
    return fail('Something went wrong')
  }
}

export async function addToMealPlan(ideaId, mealSlot) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const cleanId = sanitizeInteger(ideaId, 1, 999999)
    if (cleanId === null) return fail('Invalid idea')

    if (isMockMode()) {
      const ideas = await getMockDinnerIdeas()
      const idea = ideas.find(i => i.id === cleanId)
      if (!idea) return fail('Dinner idea not found')
      return ok({ addedMeal: idea.name })
    }

    // In production, insert into meal_slots
    return ok()
  } catch {
    return fail('Something went wrong')
  }
}
