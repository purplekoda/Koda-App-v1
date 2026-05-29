import 'server-only'

import { isMockMode } from './require-user'

/** Returns the Monday date string (YYYY-MM-DD) for a given date. */
export function getWeekStart(date = new Date()) {
  const d = new Date(date)
  const day = d.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setUTCDate(d.getUTCDate() + diff)
  return d.toISOString().slice(0, 10)
}

// ── User budget ───────────────────────────────────────────────────────────────

export async function getUserBudget(userId) {
  if (isMockMode()) {
    const { getMockBudget } = await import('./mock-store')
    return getMockBudget()
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('user_budgets')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw new Error('Failed to load budget')
  return data
}

export async function upsertUserBudget(userId, weeklyBudget, monthlyBudget) {
  if (isMockMode()) {
    const { setMockBudget } = await import('./mock-store')
    return setMockBudget(weeklyBudget, monthlyBudget)
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('user_budgets')
    .upsert(
      {
        user_id: userId,
        weekly_budget: weeklyBudget,
        monthly_budget: monthlyBudget ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  if (error) throw new Error('Failed to save budget')
  return data
}

// ── Receipts ──────────────────────────────────────────────────────────────────

export async function getWeekReceipts(userId, weekStart) {
  if (isMockMode()) {
    const { getMockReceipts } = await import('./mock-store')
    return getMockReceipts(weekStart)
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('receipts')
    .select('*')
    .eq('user_id', userId)
    .eq('week_start', weekStart)
    .order('created_at', { ascending: false })

  if (error) throw new Error('Failed to load receipts')
  return data ?? []
}

export async function getReceiptItems(receiptId) {
  if (isMockMode()) {
    const { getMockReceiptItems } = await import('./mock-store')
    return getMockReceiptItems(receiptId)
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('receipt_items')
    .select('*')
    .eq('receipt_id', receiptId)
    .order('created_at', { ascending: true })

  if (error) throw new Error('Failed to load receipt items')
  return data ?? []
}

export async function createReceipt(userId, receipt, items) {
  if (isMockMode()) {
    const { addMockReceipt } = await import('./mock-store')
    return addMockReceipt({ ...receipt, user_id: userId }, items)
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()

  const { data: newReceipt, error: receiptError } = await supabase
    .from('receipts')
    .insert({ ...receipt, user_id: userId })
    .select()
    .single()

  if (receiptError) throw new Error('Failed to create receipt')

  if (items?.length) {
    const { error: itemsError } = await supabase
      .from('receipt_items')
      .insert(items.map(item => ({ ...item, receipt_id: newReceipt.id })))

    if (itemsError) throw new Error('Failed to save receipt items')
  }

  return newReceipt
}

export async function updateReceipt(userId, receiptId, updates) {
  if (isMockMode()) {
    const { updateMockReceipt } = await import('./mock-store')
    return updateMockReceipt(receiptId, updates)
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('receipts')
    .update(updates)
    .eq('id', receiptId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw new Error('Failed to update receipt')
  return data
}

export async function replaceReceiptItems(userId, receiptId, items) {
  if (isMockMode()) {
    const { updateMockReceiptItems } = await import('./mock-store')
    return updateMockReceiptItems(receiptId, items)
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()

  // Verify ownership
  const { data: receipt } = await supabase
    .from('receipts')
    .select('id')
    .eq('id', receiptId)
    .eq('user_id', userId)
    .maybeSingle()

  if (!receipt) throw new Error('Receipt not found')

  await supabase.from('receipt_items').delete().eq('receipt_id', receiptId)

  if (items?.length) {
    const { error } = await supabase
      .from('receipt_items')
      .insert(items.map(item => ({ ...item, receipt_id: receiptId })))
    if (error) throw new Error('Failed to update receipt items')
  }
}

export async function deleteReceipt(userId, receiptId) {
  if (isMockMode()) {
    const { deleteMockReceipt } = await import('./mock-store')
    return deleteMockReceipt(receiptId)
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase
    .from('receipts')
    .delete()
    .eq('id', receiptId)
    .eq('user_id', userId)

  if (error) throw new Error('Failed to delete receipt')
}

// ── Receipt classification ────────────────────────────────────────────────────

export async function saveClassifiedItems(userId, receiptId, classifiedItems) {
  if (isMockMode()) {
    const { saveMockClassifiedItems } = await import('./mock-store')
    await saveMockClassifiedItems(receiptId, classifiedItems)
    return
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase
    .from('receipts')
    .update({ classified_items: classifiedItems })
    .eq('id', receiptId)
    .eq('user_id', userId)

  if (error) throw new Error('Failed to save classified items')
}

export async function getReceiptClassification(userId, receiptId) {
  if (isMockMode()) {
    const { getMockClassifiedItems } = await import('./mock-store')
    return getMockClassifiedItems(receiptId)
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('receipts')
    .select('classified_items')
    .eq('id', receiptId)
    .eq('user_id', userId)
    .single()

  if (error) return null
  return data?.classified_items ?? null
}

export async function markReceiptItemsAddedToPantry(userId, receiptId, itemIds) {
  if (isMockMode()) {
    const { markMockReceiptItemsAddedToPantry } = await import('./mock-store')
    await markMockReceiptItemsAddedToPantry(itemIds)
    return
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  // Verify ownership via join first
  const { data: receipt } = await supabase
    .from('receipts')
    .select('id')
    .eq('id', receiptId)
    .eq('user_id', userId)
    .maybeSingle()

  if (!receipt) throw new Error('Receipt not found')

  const { error } = await supabase
    .from('receipt_items')
    .update({ added_to_pantry_at: new Date().toISOString() })
    .in('id', itemIds)
    .eq('receipt_id', receiptId)

  if (error) throw new Error('Failed to mark items as added to pantry')
}

// ── Supabase Storage signed URL ───────────────────────────────────────────────

export async function getReceiptImageUrl(storagePath) {
  if (!storagePath || isMockMode()) return null

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { data } = await supabase.storage
    .from('receipts')
    .createSignedUrl(storagePath, 3600)

  return data?.signedUrl ?? null
}
