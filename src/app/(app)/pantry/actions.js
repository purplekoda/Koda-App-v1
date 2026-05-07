'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/dal/require-user'
import { sanitizeString, sanitizeEnum } from '@/lib/sanitize'
import { apiLimiter } from '@/lib/rate-limit'
import { ok, fail } from '@/lib/action-result'
import { PANTRY_CATEGORIES, PANTRY_UNITS } from '@/lib/dal/pantry-constants'

function sanitizeDecimal(value) {
  const n = parseFloat(value)
  if (!isFinite(n) || n < 0) return null
  return Math.round(n * 100) / 100
}

function sanitizeDate(value) {
  if (!value) return null
  // Accept YYYY-MM-DD only
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const d = new Date(value + 'T00:00:00')
  if (isNaN(d.getTime())) return null
  return value
}

export async function addPantryItemAction(formData) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const name = sanitizeString(formData.get?.('ingredient_name') ?? formData.ingredient_name, 200)
    if (!name) return fail('Ingredient name is required.')

    const quantity = sanitizeDecimal(formData.get?.('quantity') ?? formData.quantity)
    const unit = sanitizeEnum(
      formData.get?.('unit') ?? formData.unit,
      [...PANTRY_UNITS, '']
    )
    const purchaseDate = sanitizeDate(formData.get?.('purchase_date') ?? formData.purchase_date)
    const expiryDate = sanitizeDate(formData.get?.('expiry_date') ?? formData.expiry_date)
    const category = sanitizeEnum(
      formData.get?.('category') ?? formData.category,
      PANTRY_CATEGORIES
    ) || 'Other'

    const { addPantryItem } = await import('@/lib/dal/pantry-management')
    const item = await addPantryItem(user.id, {
      ingredient_name: name,
      quantity,
      unit: unit || null,
      purchase_date: purchaseDate,
      expiry_date: expiryDate,
      category,
    })

    revalidatePath('/pantry')
    return ok(item)
  } catch (err) {
    console.error('[addPantryItemAction]', err?.message)
    return fail('Could not add item.')
  }
}

export async function updatePantryItemAction(itemId, formData) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const cleanId = sanitizeString(itemId, 36)
    if (!cleanId) return fail('Invalid item.')

    const name = sanitizeString(formData.ingredient_name, 200)
    if (!name) return fail('Ingredient name is required.')

    const updates = {
      ingredient_name: name,
      quantity: sanitizeDecimal(formData.quantity),
      unit: sanitizeEnum(formData.unit, [...PANTRY_UNITS, '']) || null,
      purchase_date: sanitizeDate(formData.purchase_date),
      expiry_date: sanitizeDate(formData.expiry_date),
      category: sanitizeEnum(formData.category, PANTRY_CATEGORIES) || 'Other',
    }

    const { updatePantryItem } = await import('@/lib/dal/pantry-management')
    const item = await updatePantryItem(user.id, cleanId, updates)

    revalidatePath('/pantry')
    return ok(item)
  } catch (err) {
    console.error('[updatePantryItemAction]', err?.message)
    return fail('Could not update item.')
  }
}

export async function deletePantryItemAction(itemId) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const cleanId = sanitizeString(itemId, 36)
    if (!cleanId) return fail('Invalid item.')

    const { deletePantryItem } = await import('@/lib/dal/pantry-management')
    await deletePantryItem(user.id, cleanId)

    revalidatePath('/pantry')
    return ok()
  } catch (err) {
    console.error('[deletePantryItemAction]', err?.message)
    return fail('Could not delete item.')
  }
}

/**
 * Commit the user-reviewed scan results to the managed pantry.
 * @param {Array} scanItems       AI-detected items the user kept
 * @param {Array} manualItems     Items the user typed in during review
 * @param {boolean} deleteExisting  Whether to wipe pre-existing manual items
 */
export async function commitScanToPantryAction(scanItems, manualItems, deleteExisting) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    // Sanitize scan items: keep only name + category + freshness + daysLeft
    const cleanScan = (Array.isArray(scanItems) ? scanItems : []).map(item => ({
      name: sanitizeString(String(item.name ?? ''), 200),
      category: sanitizeEnum(item.category, PANTRY_CATEGORIES) || 'Other',
      freshness: item.freshness,
      daysLeft: typeof item.daysLeft === 'number' ? item.daysLeft : null,
    })).filter(i => i.name)

    // Sanitize manually-added items: name + category only
    const cleanManual = (Array.isArray(manualItems) ? manualItems : []).map(item => ({
      name: sanitizeString(String(item.name ?? ''), 200),
      category: sanitizeEnum(item.category, PANTRY_CATEGORIES) || 'Other',
    })).filter(i => i.name)

    const { saveCommittedScanItems } = await import('@/lib/dal/pantry-management')
    await saveCommittedScanItems(user.id, cleanScan, cleanManual, Boolean(deleteExisting))

    revalidatePath('/pantry')
    return ok()
  } catch (err) {
    console.error('[commitScanToPantryAction]', err?.message)
    return fail('Could not save pantry items. Please try again.')
  }
}

export async function toggleDepletedAction(itemId, isDepleted) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const cleanId = sanitizeString(itemId, 36)
    if (!cleanId) return fail('Invalid item.')

    const { setPantryItemDepleted } = await import('@/lib/dal/pantry-management')
    const item = await setPantryItemDepleted(user.id, cleanId, Boolean(isDepleted))

    revalidatePath('/pantry')
    return ok(item)
  } catch (err) {
    console.error('[toggleDepletedAction]', err?.message)
    return fail('Could not update item.')
  }
}
