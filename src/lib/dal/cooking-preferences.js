import 'server-only'

import { isMockMode } from './require-user'
import {
  getMockCookingPreferences,
  saveMockCookingPreferences,
  getMockDietaryRestrictions,
} from './mock-store'

export async function getCookingPreferences(userId) {
  if (isMockMode()) {
    return getMockCookingPreferences()
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('cooking_preferences')
    .eq('id', userId)
    .single()

  if (error) return null
  return data?.cooking_preferences || null
}

export async function saveCookingPreferences(userId, preferences) {
  if (isMockMode()) {
    saveMockCookingPreferences(preferences)
    return preferences
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase
    .from('profiles')
    .update({ cooking_preferences: preferences, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) throw new Error('Failed to save cooking preferences')
  return preferences
}

export async function getDietaryRestrictions(userId) {
  if (isMockMode()) {
    return getMockDietaryRestrictions()
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('dietary_restrictions')
    .select('restriction')
    .eq('user_id', userId)
    .is('family_member_id', null)

  if (error) return []
  return (data || []).map(r => r.restriction)
}
