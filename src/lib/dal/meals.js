import 'server-only'

import { isMockMode } from './require-user'
import { getMockMeals, getMockTodayMeals, getMockSwapSuggestions } from './mock-store'

export async function getWeeklyMeals(userId) {
  if (isMockMode()) {
    return getMockMeals()
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('meal_slots')
    .select('*')
    .eq('user_id', userId)
    .order('day_of_week')

  if (error) throw new Error('Failed to load meals')
  return data
}

export async function getTodayMeals(userId) {
  if (isMockMode()) {
    return getMockTodayMeals()
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const today = new Date().getDay() || 7 // Convert Sunday=0 to 7
  const { data, error } = await supabase
    .from('meal_slots')
    .select('*')
    .eq('user_id', userId)
    .eq('day_of_week', today)

  if (error) throw new Error('Failed to load today meals')
  return data
}

export async function getSwapSuggestions(userId) {
  if (isMockMode()) {
    return getMockSwapSuggestions()
  }

  // In production, this could call an AI service or query recipes
  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .limit(4)

  if (error) throw new Error('Failed to load swap suggestions')
  return data
}
