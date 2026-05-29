import 'server-only'

import { isMockMode } from './require-user'
export { PANTRY_CATEGORIES, PANTRY_UNITS } from './pantry-constants'

/**
 * Get all non-depleted pantry items for a user, sorted by expiry date (soonest first).
 * Depleted items are included when includeDepleted = true.
 */
export async function getManagedPantryItems(userId, { includeDepleted = false } = {}) {
  if (isMockMode()) {
    const { getMockManagedPantry } = await import('./mock-store')
    const items = await getMockManagedPantry()
    return includeDepleted ? items : items.filter(i => !i.is_depleted)
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()

  let query = supabase
    .from('pantry')
    .select('id, ingredient_name, quantity, unit, purchase_date, expiry_date, category, is_depleted, source, created_at')
    .eq('user_id', userId)
    .order('is_depleted', { ascending: true })
    .order('expiry_date', { ascending: true, nullsFirst: false })
    .order('ingredient_name', { ascending: true })

  if (!includeDepleted) {
    query = query.eq('is_depleted', false)
  }

  const { data, error } = await query
  if (error) throw new Error('Failed to load pantry items')
  return data || []
}

/**
 * Add a new pantry item for the user.
 */
export async function addPantryItem(userId, item) {
  if (isMockMode()) {
    const { addMockPantryItem } = await import('./mock-store')
    return addMockPantryItem(item)
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('pantry')
    .insert({
      user_id: userId,
      ingredient_name: item.ingredient_name,
      quantity: item.quantity ?? null,
      unit: item.unit ?? null,
      purchase_date: item.purchase_date ?? null,
      expiry_date: item.expiry_date ?? null,
      category: item.category || 'Other',
      is_depleted: false,
    })
    .select()
    .single()

  if (error) throw new Error('Failed to add pantry item')
  return data
}

/**
 * Update an existing pantry item.
 */
export async function updatePantryItem(userId, itemId, updates) {
  if (isMockMode()) {
    const { updateMockPantryItem } = await import('./mock-store')
    return updateMockPantryItem(itemId, updates)
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('pantry')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', itemId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw new Error('Failed to update pantry item')
  return data
}

/**
 * Delete a pantry item.
 */
export async function deletePantryItem(userId, itemId) {
  if (isMockMode()) {
    const { deleteMockPantryItem } = await import('./mock-store')
    return deleteMockPantryItem(itemId)
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()

  const { error } = await supabase
    .from('pantry')
    .delete()
    .eq('id', itemId)
    .eq('user_id', userId)

  if (error) throw new Error('Failed to delete pantry item')
}

/**
 * Mark a pantry item as depleted (or restore it).
 */
export async function setPantryItemDepleted(userId, itemId, isDepleted) {
  return updatePantryItem(userId, itemId, { is_depleted: isDepleted })
}

/**
 * Cross-reference a confirmed meal plan's recipe ingredients against the pantry
 * and mark matching items as depleted. Called after the user confirms the week.
 *
 * Matching is case-insensitive: a pantry item is depleted if its ingredient_name
 * appears as a substring of any recipe ingredient name (or vice versa).
 *
 * @param {string} userId
 * @param {string} mealPlanId
 */
export async function depleteIngredientsForMealPlan(userId, mealPlanId) {
  if (isMockMode()) {
    // Mock mode: no-op depletion (no persistent recipe ingredients to cross-ref)
    return { depletedCount: 0 }
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()

  // 1. Get all meal slots for this plan that have a recipe
  const { data: slots } = await supabase
    .from('meal_slots')
    .select('recipe_id')
    .eq('meal_plan_id', mealPlanId)
    .eq('user_id', userId)
    .not('recipe_id', 'is', null)

  if (!slots?.length) return { depletedCount: 0 }

  const recipeIds = [...new Set(slots.map(s => s.recipe_id))]

  // 2. Get all ingredient names from those recipes
  const { data: recipes } = await supabase
    .from('recipes')
    .select('ingredients')
    .in('id', recipeIds)
    .eq('user_id', userId)

  const plannedIngredientNames = new Set()
  ;(recipes || []).forEach(recipe => {
    const ings = Array.isArray(recipe.ingredients) ? recipe.ingredients : []
    ings.forEach(ing => {
      const name = typeof ing === 'string' ? ing : ing?.name
      if (name) plannedIngredientNames.add(name.trim().toLowerCase())
    })
  })

  if (plannedIngredientNames.size === 0) return { depletedCount: 0 }

  // 3. Get non-depleted pantry items
  const { data: pantryItems } = await supabase
    .from('pantry')
    .select('id, ingredient_name')
    .eq('user_id', userId)
    .eq('is_depleted', false)

  if (!pantryItems?.length) return { depletedCount: 0 }

  // 4. Match pantry items to planned ingredients (case-insensitive substring)
  const toDeplete = pantryItems.filter(item => {
    const itemName = item.ingredient_name.trim().toLowerCase()
    // Match if the pantry item name appears in any planned ingredient, or vice versa
    for (const plannedName of plannedIngredientNames) {
      if (plannedName.includes(itemName) || itemName.includes(plannedName)) {
        return true
      }
    }
    return false
  })

  if (!toDeplete.length) return { depletedCount: 0 }

  const { error } = await supabase
    .from('pantry')
    .update({ is_depleted: true, updated_at: new Date().toISOString() })
    .in('id', toDeplete.map(i => i.id))
    .eq('user_id', userId)

  if (error) throw new Error('Failed to deplete pantry items')
  return { depletedCount: toDeplete.length }
}

/**
 * Commit the user-reviewed scan results to the managed pantry.
 * Replaces all source='scan' rows with the curated list, inserts any
 * manually-added review items as source='manual', and optionally wipes
 * all pre-existing source='manual' rows.
 *
 * @param {string} userId
 * @param {Array<{ name, category, freshness, daysLeft }>} scanItems  AI-detected items user kept
 * @param {Array<{ name, category }>}                      manualItems Items user typed in during review
 * @param {boolean}                                        deleteExistingManual  Wipe old manual items
 */
export async function saveCommittedScanItems(userId, scanItems, manualItems, deleteExistingManual) {
  if (isMockMode()) {
    const { saveCommittedScanItemsToMock } = await import('./mock-store')
    return saveCommittedScanItemsToMock(scanItems, manualItems, deleteExistingManual)
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const now = new Date().toISOString()

  // 1. Remove old scan-sourced rows
  await supabase.from('pantry').delete().eq('user_id', userId).eq('source', 'scan')

  // 2. Optionally remove old manually-added rows
  if (deleteExistingManual) {
    await supabase.from('pantry').delete().eq('user_id', userId).eq('source', 'manual')
  }

  // 3. Insert curated AI-detected items
  if (scanItems.length > 0) {
    const scanRows = scanItems.map(item => {
      let expiryDate = null
      if (item.daysLeft != null && item.daysLeft >= 0) {
        const d = new Date()
        d.setDate(d.getDate() + item.daysLeft)
        expiryDate = d.toISOString().slice(0, 10)
      }
      return {
        user_id: userId,
        ingredient_name: item.name,
        category: item.category || 'Other',
        expiry_date: expiryDate,
        source: 'scan',
        is_depleted: false,
        created_at: now,
        updated_at: now,
      }
    })
    const { error } = await supabase.from('pantry').insert(scanRows)
    if (error) {
      console.error('[saveCommittedScanItems] scan insert error:', error)
      throw new Error(error.message || 'Failed to save scan items')
    }
  }

  // 4. Insert new manually-added items from the review step
  if (manualItems.length > 0) {
    const manualRows = manualItems.map(item => ({
      user_id: userId,
      ingredient_name: item.name,
      category: item.category || 'Other',
      source: 'manual',
      is_depleted: false,
      created_at: now,
      updated_at: now,
    }))
    const { error } = await supabase.from('pantry').insert(manualRows)
    if (error) {
      console.error('[saveCommittedScanItems] manual insert error:', error)
      throw new Error(error.message || 'Failed to save manual items')
    }
  }
}

/**
 * Add a pantry item from a receipt, with dedup check.
 * If an item with the same name was added in the last 7 days, returns existing without creating duplicate.
 * Returns { item, wasNew: bool }
 */
export async function addPantryItemFromReceipt(userId, item, receiptId) {
  if (isMockMode()) {
    const { findMockPantryItemByNameRecent, addMockPantryItemFromReceipt } = await import('./mock-store')
    const existing = await findMockPantryItemByNameRecent(item.ingredient_name)
    if (existing) return { item: existing, wasNew: false }
    const newItem = await addMockPantryItemFromReceipt(
      { ...item, source: 'receipt' },
      receiptId
    )
    return { item: newItem, wasNew: true }
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()

  // Dedup: look for same name in last 7 days
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 7)
  const { data: existing } = await supabase
    .from('pantry')
    .select('id, ingredient_name, expires_at')
    .eq('user_id', userId)
    .ilike('ingredient_name', item.ingredient_name)
    .eq('is_depleted', false)
    .gte('created_at', cutoff.toISOString())
    .maybeSingle()

  if (existing) return { item: existing, wasNew: false }

  const { data, error } = await supabase
    .from('pantry')
    .insert({
      user_id: userId,
      ingredient_name: item.ingredient_name,
      quantity: item.quantity ?? null,
      unit: item.unit ?? null,
      category: item.category || 'Other',
      expires_at: item.expires_at ?? null,
      source: 'receipt',
      source_receipt_id: receiptId ?? null,
      is_depleted: false,
    })
    .select()
    .single()

  if (error) throw new Error('Failed to add pantry item from receipt')
  return { item: data, wasNew: true }
}

/**
 * Replace all scan-sourced pantry items with the latest scan results.
 * Deletes previous `source = 'scan'` rows and inserts fresh ones.
 * Derives expiry_date from daysLeft when available.
 *
 * @param {string} userId
 * @param {Array<{ name: string, category: string, freshness: string, daysLeft: number|null }>} items
 * @param {string} scannedAt  ISO timestamp of the scan
 */
export async function saveScannedItemsToManagedPantry(userId, items, scannedAt) {
  if (isMockMode()) {
    const { saveScannedItemsToMockManagedPantry } = await import('./mock-store')
    return saveScannedItemsToMockManagedPantry(items, scannedAt)
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()

  // Remove all previously scanned items for this user
  await supabase
    .from('pantry')
    .delete()
    .eq('user_id', userId)
    .eq('source', 'scan')

  if (!items.length) return

  const scanDate = scannedAt ? new Date(scannedAt) : new Date()
  const rows = items.map(item => {
    // Derive expiry_date from daysLeft
    let expiryDate = null
    if (item.daysLeft != null && item.daysLeft >= 0) {
      const d = new Date(scanDate)
      d.setDate(d.getDate() + item.daysLeft)
      expiryDate = d.toISOString().slice(0, 10)
    }

    return {
      user_id: userId,
      ingredient_name: item.name,
      category: item.category || 'Other',
      expiry_date: expiryDate,
      source: 'scan',
      is_depleted: false,
      created_at: scanDate.toISOString(),
      updated_at: scanDate.toISOString(),
    }
  })

  const { error } = await supabase.from('pantry').insert(rows)
  if (error) throw new Error('Failed to save scanned items to pantry')
}
