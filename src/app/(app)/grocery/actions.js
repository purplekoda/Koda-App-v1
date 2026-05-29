'use server'

import { requireUser, isMockMode } from '@/lib/dal/require-user'
import { sanitizeEnum, sanitizeInteger, sanitizeString } from '@/lib/sanitize'
import { apiLimiter } from '@/lib/rate-limit'
import { ok, fail } from '@/lib/action-result'
import { toggleMockGroceryItem, getMockGrocery, assignMockGroceryItemStore } from '@/lib/dal/mock-store'

export async function toggleGroceryItem(itemId, newStatus) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const cleanId = sanitizeInteger(itemId, 1, 999999)
    const cleanStatus = sanitizeEnum(newStatus, ['need', 'low', 'have'])

    if (cleanId === null) return fail('Invalid item')
    if (!cleanStatus) return fail('Invalid status')

    if (isMockMode()) {
      const updated = await toggleMockGroceryItem(cleanId, cleanStatus)
      if (!updated) return fail('Item not found')
      const items = await getMockGrocery()
      return ok({ items })
    }

    const { getSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = await getSupabaseServerClient()
    const { error } = await supabase
      .from('grocery_items')
      .update({ status: cleanStatus })
      .eq('user_id', user.id)
      .eq('id', cleanId)

    if (error) return fail('Failed to update item')
    return ok()
  } catch {
    return fail('Something went wrong')
  }
}

export async function assignItemStore(itemId, storeId) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const cleanStoreId = storeId ? sanitizeString(storeId, 50) : null

    if (isMockMode()) {
      const updated = await assignMockGroceryItemStore(itemId, cleanStoreId)
      if (!updated) return fail('Item not found')
      return ok()
    }

    const cleanId = sanitizeInteger(itemId, 1, 999999)
    if (cleanId === null) return fail('Invalid item')

    const { getSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = await getSupabaseServerClient()
    const { error } = await supabase
      .from('grocery_items')
      .update({ store_assignment: cleanStoreId })
      .eq('user_id', user.id)
      .eq('id', cleanId)

    if (error) return fail('Failed to assign store')
    return ok()
  } catch {
    return fail('Something went wrong')
  }
}

export async function sendToStore(storeId) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    if (isMockMode()) {
      return ok({ sent: true, storeId })
    }

    // In production, this would create a grocery_list record and mark items as sent
    return ok({ sent: true, storeId })
  } catch {
    return fail('Something went wrong')
  }
}
