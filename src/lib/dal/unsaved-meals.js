import 'server-only'
import { isMockMode } from './require-user'

export async function getUnsavedKodaMeals(userId) {
  if (isMockMode()) return []

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('meal_slots')
    .select('custom_meal_name, meal_type, meal_plan_id, meal_plans!inner(user_id)')
    .eq('meal_plans.user_id', userId)
    .is('recipe_id', null)
    .not('custom_meal_name', 'is', null)
    .order('custom_meal_name')

  if (error) {
    console.error('[getUnsavedKodaMeals] error:', error.message)
    return []
  }

  const seen = new Map()
  for (const row of data || []) {
    const key = row.custom_meal_name.toLowerCase().trim()
    if (!seen.has(key)) {
      seen.set(key, { name: row.custom_meal_name.trim(), meal_type: row.meal_type })
    }
  }
  return Array.from(seen.values())
}
