import 'server-only'

import { isMockMode } from './require-user'
import { getMockProfile, saveMockProfile, getMockGroceryPreferences, saveMockGroceryPreferences, getMockRecipeCardSettings, saveMockRecipeCardSettings, getMockDashboardSections, saveMockDashboardSections } from './mock-store'
import { DEFAULT_SECTIONS } from '@/data/dashboard-sections'

export async function getProfile(userId) {
  if (isMockMode()) {
    return getMockProfile()
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('display_name, family_name, location, preferred_store, shopping_style, preferred_delivery_service')
    .eq('id', userId)
    .single()

  if (error) throw new Error('Failed to load profile')
  return data || {}
}

export async function updateProfile(userId, updates) {
  if (isMockMode()) {
    return saveMockProfile(updates)
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) throw new Error('Failed to update profile')
  return updates
}

export async function getGroceryPreferences(userId) {
  if (isMockMode()) {
    return getMockGroceryPreferences()
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('grocery_preferences')
    .eq('id', userId)
    .single()

  if (error) throw new Error('Failed to load grocery preferences')
  return data?.grocery_preferences || {}
}

export async function saveGroceryPreferences(userId, prefs) {
  if (isMockMode()) {
    return saveMockGroceryPreferences(prefs)
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase
    .from('profiles')
    .update({ grocery_preferences: prefs, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) throw new Error('Failed to save grocery preferences')
  return prefs
}

export async function getRecipeCardSettings(userId) {
  if (isMockMode()) {
    return getMockRecipeCardSettings()
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('recipe_card_settings')
    .eq('id', userId)
    .single()

  if (error) throw new Error('Failed to load recipe card settings')
  return data?.recipe_card_settings || null
}

export async function saveRecipeCardSettings(userId, settings) {
  if (isMockMode()) {
    return saveMockRecipeCardSettings(settings)
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase
    .from('profiles')
    .update({ recipe_card_settings: settings, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) throw new Error('Failed to save recipe card settings')
  return settings
}

export async function getDashboardSections(userId) {
  if (isMockMode()) {
    return getMockDashboardSections() || DEFAULT_SECTIONS
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('dashboard_sections')
    .eq('id', userId)
    .single()

  if (error) throw new Error('Failed to load dashboard sections')
  return data?.dashboard_sections || DEFAULT_SECTIONS
}

export async function saveDashboardSections(userId, sections) {
  if (isMockMode()) {
    return saveMockDashboardSections(sections)
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase
    .from('profiles')
    .update({ dashboard_sections: sections, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) throw new Error('Failed to save dashboard sections')
  return sections
}
