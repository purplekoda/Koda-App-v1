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
    .select('id, name, category, freshness, days_left')
    .eq('user_id', userId)
    .order('freshness')

  if (error) throw new Error('Failed to load pantry items')

  return (data || []).map(item => ({
    id: item.id,
    name: item.name,
    category: item.category || 'Other',
    freshness: item.freshness || 'fresh',
    daysLeft: item.days_left,
  }))
}

export async function getDinnerIdeas(userId) {
  if (isMockMode()) {
    return getMockDinnerIdeas()
  }

  // Dinner ideas are generated at scan time and not persisted —
  // return empty so the page shows the scan prompt instead
  return []
}

export async function getLastScan(userId) {
  if (isMockMode()) {
    return getMockLastScan()
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('pantry_scans')
    .select('scanned_at, items_detected')
    .eq('user_id', userId)
    .order('scanned_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) return null

  const scannedAt = new Date(data.scanned_at)
  return {
    date: scannedAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    time: scannedAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    itemsDetected: data.items_detected,
    scannedAt: data.scanned_at,
  }
}

/**
 * Replace all pantry items for a user with new scan results,
 * and record the scan in pantry_scans.
 */
export async function saveScanResults(userId, items) {
  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()

  // Delete old pantry items
  const { error: deleteError } = await supabase
    .from('pantry_items')
    .delete()
    .eq('user_id', userId)

  if (deleteError) throw new Error('Failed to clear old pantry items')

  // Insert new items
  if (items.length > 0) {
    const rows = items.map(item => ({
      user_id: userId,
      name: item.name,
      category: item.category || 'Other',
      freshness: item.freshness || 'fresh',
      days_left: item.daysLeft ?? null,
    }))

    const { error: insertError } = await supabase
      .from('pantry_items')
      .insert(rows)

    if (insertError) throw new Error('Failed to save pantry items')
  }

  // Record the scan
  const { error: scanError } = await supabase
    .from('pantry_scans')
    .insert({
      user_id: userId,
      items_detected: items.length,
    })

  if (scanError) {
    console.error('[saveScanResults] Failed to record scan:', scanError.message)
  }
}
