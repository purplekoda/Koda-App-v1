'use server'

import { revalidatePath } from 'next/cache'
import { requireUser, isMockMode } from '@/lib/dal/require-user'
import { sanitizeString, sanitizeEnum } from '@/lib/sanitize'
import { apiLimiter, uploadLimiter } from '@/lib/rate-limit'
import { ok, fail } from '@/lib/action-result'
import { getWeekStart } from '@/lib/dal/budget'

const VALID_ENTRY_TYPES = ['photo', 'manual']

function parsePositiveDecimal(value) {
  const n = parseFloat(value)
  return isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null
}

// ── Budget setting ────────────────────────────────────────────────────────────

export async function setBudgetAction(weeklyBudget, monthlyBudget) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const weekly = parsePositiveDecimal(weeklyBudget)
    if (!weekly || weekly <= 0) return fail('Please enter a valid weekly budget amount greater than $0.')

    const monthly = monthlyBudget != null && monthlyBudget !== ''
      ? parsePositiveDecimal(monthlyBudget)
      : null
    if (monthly !== null && (!monthly || monthly <= 0)) {
      return fail('Please enter a valid monthly budget amount greater than $0.')
    }

    const { upsertUserBudget } = await import('@/lib/dal/budget')
    const budget = await upsertUserBudget(user.id, weekly, monthly)
    revalidatePath('/budget')
    return ok(budget)
  } catch (err) {
    console.error('[setBudgetAction] error:', err)
    return fail('Could not save budget. Please try again.')
  }
}

// ── Receipt management ────────────────────────────────────────────────────────

function sanitizeItems(rawItems) {
  if (!Array.isArray(rawItems)) return []
  return rawItems
    .map(item => ({
      item_name: sanitizeString(item.item_name, 200),
      quantity: parsePositiveDecimal(item.quantity) ?? 1,
      unit_price: parsePositiveDecimal(item.unit_price),
      total_price: parsePositiveDecimal(item.total_price) ?? 0,
      category: sanitizeString(item.category, 50) || null,
    }))
    .filter(item => item.item_name && item.total_price != null)
}

export async function addReceiptAction(receiptData, items) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const storeName = sanitizeString(receiptData?.store_name, 200) || null
    const entryType = sanitizeEnum(receiptData?.entry_type, VALID_ENTRY_TYPES) || 'manual'
    const imageUrl = sanitizeString(receiptData?.image_url, 500) || null
    const notes = sanitizeString(receiptData?.notes, 500) || null
    const totalAmount = parsePositiveDecimal(receiptData?.total_amount)
    if (totalAmount == null) return fail('Please enter a valid total amount.')

    const weekStart = receiptData?.receipt_date
      ? getWeekStart(new Date(receiptData.receipt_date))
      : getWeekStart()

    const sanitizedItems = sanitizeItems(items)

    const receipt = {
      week_start: weekStart,
      total_amount: totalAmount,
      store_name: storeName,
      entry_type: entryType,
      image_url: imageUrl,
      notes,
    }

    const { createReceipt } = await import('@/lib/dal/budget')
    const newReceipt = await createReceipt(user.id, receipt, sanitizedItems)
    revalidatePath('/budget')
    return ok(newReceipt)
  } catch (err) {
    console.error('[addReceiptAction] error:', err)
    return fail('Could not save receipt. Please try again.')
  }
}

export async function updateReceiptAction(receiptId, receiptData, items) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const cleanId = sanitizeString(receiptId, 50)
    if (!cleanId) return fail('Invalid receipt ID.')

    const updates = {}
    if (receiptData?.store_name !== undefined)
      updates.store_name = sanitizeString(receiptData.store_name, 200) || null
    if (receiptData?.notes !== undefined)
      updates.notes = sanitizeString(receiptData.notes, 500) || null
    if (receiptData?.total_amount !== undefined) {
      const amount = parsePositiveDecimal(receiptData.total_amount)
      if (amount == null) return fail('Invalid total amount.')
      updates.total_amount = amount
    }

    const { updateReceipt, replaceReceiptItems } = await import('@/lib/dal/budget')
    const updated = await updateReceipt(user.id, cleanId, updates)

    if (Array.isArray(items)) {
      const sanitizedItems = sanitizeItems(items)
      await replaceReceiptItems(user.id, cleanId, sanitizedItems)
    }

    revalidatePath('/budget')
    return ok(updated)
  } catch (err) {
    console.error('[updateReceiptAction] error:', err)
    return fail('Could not update receipt. Please try again.')
  }
}

export async function deleteReceiptAction(receiptId) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const cleanId = sanitizeString(receiptId, 50)
    if (!cleanId) return fail('Invalid receipt ID.')

    const { deleteReceipt } = await import('@/lib/dal/budget')
    await deleteReceipt(user.id, cleanId)
    revalidatePath('/budget')
    return ok({ deleted: cleanId })
  } catch (err) {
    console.error('[deleteReceiptAction] error:', err)
    return fail('Could not delete receipt. Please try again.')
  }
}

export async function getReceiptItemsAction(receiptId) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests.')

    const cleanId = sanitizeString(receiptId, 50)
    if (!cleanId) return fail('Invalid receipt ID.')

    if (isMockMode()) {
      const { getMockReceiptItems } = await import('@/lib/dal/mock-store')
      return ok(await getMockReceiptItems(cleanId))
    }

    const { getSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = await getSupabaseServerClient()

    // Verify ownership via join
    const { data, error } = await supabase
      .from('receipt_items')
      .select('*, receipts!inner(user_id)')
      .eq('receipt_id', cleanId)
      .eq('receipts.user_id', user.id)
      .order('created_at', { ascending: true })

    if (error) return fail('Could not load items.')
    return ok(data ?? [])
  } catch (err) {
    console.error('[getReceiptItemsAction] error:', err)
    return fail('Could not load receipt items.')
  }
}

// ── Supabase Storage upload URL ───────────────────────────────────────────────

export async function getReceiptUploadUrlAction(filename, contentType) {
  try {
    const user = await requireUser()
    const rate = uploadLimiter.check(user.id)
    if (!rate.success) return fail('Upload limit reached. Please wait a moment.')

    if (isMockMode()) {
      return ok({ uploadUrl: null, storagePath: null, mockMode: true })
    }

    const cleanFilename = sanitizeString(filename, 200)
    if (!cleanFilename) return fail('Invalid filename.')

    const now = new Date()
    const year = now.getUTCFullYear()
    const week = getWeekStart(now)
    const storagePath = `${user.id}/${year}/${week}/${Date.now()}-${cleanFilename}`

    const { getSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = await getSupabaseServerClient()
    const { data, error } = await supabase.storage
      .from('receipts')
      .createSignedUploadUrl(storagePath)

    if (error) return fail('Could not generate upload URL.')
    return ok({ uploadUrl: data.signedUrl, storagePath })
  } catch (err) {
    console.error('[getReceiptUploadUrlAction] error:', err)
    return fail('Could not prepare upload. Please try again.')
  }
}

// ── Add receipt items to pantry ───────────────────────────────────────────────

/**
 * Add selected receipt items to pantry/pantry_staples.
 *
 * selections: Array of {
 *   receiptItemId: string,
 *   item_name: string,
 *   category: string,
 *   pantry_type: 'staple' | 'fresh',
 *   suggested_shelf_life_days: number,
 *   expires_at: string|null,  // YYYY-MM-DD, may be user-overridden
 * }
 */
export async function addReceiptItemsToPantryAction(receiptId, selections) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const cleanReceiptId = sanitizeString(receiptId, 50)
    if (!cleanReceiptId) return fail('Invalid receipt ID.')

    if (!Array.isArray(selections) || selections.length === 0) {
      return fail('No items selected.')
    }

    const [
      { addPantryItemFromReceipt },
      { upsertStapleFromReceipt },
      { markReceiptItemsAddedToPantry },
    ] = await Promise.all([
      import('@/lib/dal/pantry-management'),
      import('@/lib/dal/staples'),
      import('@/lib/dal/budget'),
    ])

    const results = { staples: [], fresh: [], restocked: [] }
    const receiptItemIds = []

    for (const sel of selections) {
      const itemName = sanitizeString(sel.item_name, 200)
      if (!itemName) continue

      const category = sanitizeString(sel.category, 50) || 'Other'
      const pantryType = sel.pantry_type === 'staple' ? 'staple' : 'fresh'

      try {
        if (pantryType === 'staple') {
          const { wasRestocked } = await upsertStapleFromReceipt(
            user.id,
            { name: itemName, category },
            cleanReceiptId
          )
          if (wasRestocked) results.restocked.push(itemName)
          else results.staples.push(itemName)
        } else {
          const expiresAt = sanitizeString(sel.expires_at, 20) || null
          await addPantryItemFromReceipt(
            user.id,
            {
              ingredient_name: itemName,
              category,
              expires_at: expiresAt,
            },
            cleanReceiptId
          )
          results.fresh.push(itemName)
        }

        if (sel.receiptItemId) {
          receiptItemIds.push(sanitizeString(sel.receiptItemId, 50))
        }
      } catch (err) {
        console.error('[addReceiptItemsToPantryAction] item error:', itemName, err)
        // Continue with remaining items
      }
    }

    if (receiptItemIds.length > 0) {
      await markReceiptItemsAddedToPantry(user.id, cleanReceiptId, receiptItemIds.filter(Boolean))
    }

    revalidatePath('/budget')
    revalidatePath('/kitchen')

    const totalAdded = results.staples.length + results.fresh.length + results.restocked.length
    return ok({ ...results, totalAdded })
  } catch (err) {
    console.error('[addReceiptItemsToPantryAction] error:', err)
    return fail('Could not add items to pantry. Please try again.')
  }
}

// ── Recipe cost override ──────────────────────────────────────────────────────

export async function updateRecipeCostAction(recipeId, estimatedCost) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests.')

    const cleanId = sanitizeString(recipeId, 50)
    if (!cleanId) return fail('Invalid recipe ID.')

    const cost = parsePositiveDecimal(estimatedCost)
    if (cost == null) return fail('Invalid cost amount.')

    if (isMockMode()) {
      return ok({ id: cleanId, estimated_cost: cost, cost_overridden: true })
    }

    const { getSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = await getSupabaseServerClient()
    const { data, error } = await supabase
      .from('recipes')
      .update({ estimated_cost: cost, cost_overridden: true })
      .eq('id', cleanId)
      .eq('user_id', user.id)
      .select('id, estimated_cost, cost_overridden')
      .single()

    if (error) return fail('Could not update recipe cost.')
    revalidatePath('/meals')
    return ok(data)
  } catch (err) {
    console.error('[updateRecipeCostAction] error:', err)
    return fail('Could not save cost override.')
  }
}
