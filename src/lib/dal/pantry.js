import 'server-only'

import { isMockMode } from './require-user'
import { getMockPantry, getMockDinnerIdeas, getMockLastScan } from './mock-store'

export async function getPantryItems(userId) {
  if (isMockMode()) {
    return getMockPantry()
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('pantry_items')
    .select('*')
    .eq('user_id', userId)
    .order('freshness')

  if (error) throw new Error('Failed to load pantry items')
  return data
}

export async function getDinnerIdeas(userId) {
  if (isMockMode()) {
    return getMockDinnerIdeas()
  }

  // In production, this could use AI to suggest based on pantry contents
  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .limit(4)

  if (error) throw new Error('Failed to load dinner ideas')
  return data
}

export async function getLastScan(userId) {
  if (isMockMode()) {
    return getMockLastScan()
  }

  // In production, fetch the last scan record
  return null
}
