import 'server-only'

import { isMockMode } from './require-user'
import { getMockGrocery, getMockStores, getMockWeekSummary } from './mock-store'

export async function getGroceryItems(userId) {
  if (isMockMode()) {
    return getMockGrocery()
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('grocery_items')
    .select('*')
    .eq('user_id', userId)
    .order('category')

  if (error) throw new Error('Failed to load grocery items')
  return data
}

export async function getStores(userId) {
  if (isMockMode()) {
    return getMockStores()
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('store_connections')
    .select('*')
    .eq('user_id', userId)

  if (error) throw new Error('Failed to load stores')
  return data
}

export async function getWeekSummary(userId) {
  if (isMockMode()) {
    return getMockWeekSummary()
  }

  // In production, compute from actual grocery + meal data
  const items = await getGroceryItems(userId)
  return {
    totalIngredients: items.length,
    haveCount: items.filter(i => i.status === 'have').length,
    needCount: items.filter(i => i.status === 'need').length,
    lowCount: items.filter(i => i.status === 'low').length,
  }
}
