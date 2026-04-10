'use server'

import { requireUser, isMockMode } from '@/lib/dal/require-user'
import { sanitizeString, sanitizeEnum } from '@/lib/sanitize'
import { apiLimiter } from '@/lib/rate-limit'
import { ok, fail } from '@/lib/action-result'
import {
  updateMockMeal,
  clearMockMeal,
  fillMockWeek,
  getMockMeals,
} from '@/lib/dal/mock-store'

export async function swapMeal(day, mealType, newMealName) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const cleanName = sanitizeString(newMealName, 200)
    const cleanType = sanitizeEnum(mealType, ['breakfast', 'lunch', 'dinner'])
    const cleanDay = sanitizeString(day, 10)

    if (!cleanName) return fail('Meal name is required')
    if (!cleanType) return fail('Invalid meal type')
    if (!cleanDay) return fail('Day is required')

    if (isMockMode()) {
      const updated = await updateMockMeal(cleanDay, cleanType, {
        name: cleanName,
        ingredients: [],
      })
      if (!updated) return fail('Meal slot not found')
      const meals = await getMockMeals()
      return ok({ meals, swappedTo: cleanName })
    }

    // Supabase path — schema stores day_of_week as integer 1–5
    const DAY_TO_INT = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5 }
    const dayInt = DAY_TO_INT[cleanDay]
    if (!dayInt) return fail('Invalid day')

    const { getSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = await getSupabaseServerClient()
    const { error } = await supabase
      .from('meal_slots')
      .update({ custom_meal_name: cleanName })
      .eq('user_id', user.id)
      .eq('day_of_week', dayInt)
      .eq('meal_type', cleanType)

    if (error) return fail('Failed to swap meal')
    return ok({ swappedTo: cleanName })
  } catch {
    return fail('Something went wrong')
  }
}

export async function removeMeal(day, mealType) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const cleanType = sanitizeEnum(mealType, ['breakfast', 'lunch', 'dinner'])
    const cleanDay = sanitizeString(day, 10)

    if (!cleanType || !cleanDay) return fail('Invalid meal slot')

    if (isMockMode()) {
      await clearMockMeal(cleanDay, cleanType)
      const meals = await getMockMeals()
      return ok({ meals })
    }

    const DAY_TO_INT = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5 }
    const dayInt = DAY_TO_INT[cleanDay]
    if (!dayInt) return fail('Invalid day')

    const { getSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = await getSupabaseServerClient()
    const { error } = await supabase
      .from('meal_slots')
      .delete()
      .eq('user_id', user.id)
      .eq('day_of_week', dayInt)
      .eq('meal_type', cleanType)

    if (error) return fail('Failed to remove meal')
    return ok()
  } catch {
    return fail('Something went wrong')
  }
}

export async function fillWeek() {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    if (isMockMode()) {
      const result = await fillMockWeek()
      return ok({ meals: result.meals, filledCount: result.filledCount })
    }

    // Supabase path: would query empty slots and insert suggestions
    return ok({ filledCount: 0 })
  } catch {
    return fail('Something went wrong')
  }
}

export async function addToGrocery(day, mealType) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    if (isMockMode()) {
      const meals = await getMockMeals()
      const dayObj = meals.find(d => d.day === day)
      if (!dayObj) return fail('Day not found')
      const meal = dayObj.meals.find(m => m.type === mealType)
      if (!meal || !meal.ingredients) return fail('Meal has no ingredients')
      const needCount = meal.ingredients.filter(i => !i.have).length
      return ok({ addedCount: needCount })
    }

    return ok({ addedCount: 0 })
  } catch {
    return fail('Something went wrong')
  }
}
