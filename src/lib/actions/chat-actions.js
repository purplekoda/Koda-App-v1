import 'server-only'

import { revalidatePath } from 'next/cache'
import { isMockMode } from '@/lib/dal/require-user'
import { sanitizeString } from '@/lib/sanitize'

const DAY_TO_INT = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }
const DAY_ABBR = { 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 7: 'Sun' }

/**
 * Save a full set of meal slots to the current week's meal plan.
 * Called when Gemini confirms a fill_meal_plan action.
 *
 * @param {string} userId
 * @param {Array<{ day_of_week: number, meal_type: string, meal_name: string }>} slots
 */
export async function fillMealPlan(userId, slots) {
  if (!slots?.length) return { saved: 0 }

  if (isMockMode()) {
    const { updateMockMeal } = await import('@/lib/dal/mock-store')
    for (const slot of slots) {
      await updateMockMeal(DAY_ABBR[slot.day_of_week], slot.meal_type, {
        name: sanitizeString(slot.meal_name, 200),
        recipeId: null,
        recipe: null,
        ingredients: [],
      })
    }
    revalidatePath('/meals')
    return { saved: slots.length }
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const { getOrCreateMealPlan } = await import('@/lib/dal/meals')
  const supabase = await getSupabaseServerClient()
  const planId = await getOrCreateMealPlan(userId, supabase, 0)

  const rows = slots
    .filter(s => s.day_of_week >= 1 && s.day_of_week <= 7 && s.meal_name)
    .map(slot => ({
      meal_plan_id: planId,
      day_of_week: slot.day_of_week,
      meal_type: slot.meal_type,
      custom_meal_name: sanitizeString(slot.meal_name, 200),
      recipe_id: null,
    }))

  const { error } = await supabase
    .from('meal_slots')
    .upsert(rows, { onConflict: 'meal_plan_id,day_of_week,meal_type' })

  if (error) throw new Error('Failed to save meal plan: ' + error.message)

  revalidatePath('/meals')
  return { saved: rows.length }
}

/**
 * Replace a single meal slot in the current week's meal plan.
 * Called when Gemini confirms a swap_meal action.
 *
 * @param {string} userId
 * @param {string} day - 'Mon'–'Sun'
 * @param {string} mealType - 'breakfast'|'lunch'|'dinner'
 * @param {string} newMealName
 */
export async function swapMeal(userId, day, mealType, newMealName) {
  const dayInt = DAY_TO_INT[day]
  if (!dayInt) throw new Error('Invalid day: ' + day)

  const cleanName = sanitizeString(newMealName, 200)
  if (!cleanName) throw new Error('Invalid meal name')

  if (isMockMode()) {
    const { updateMockMeal } = await import('@/lib/dal/mock-store')
    await updateMockMeal(day, mealType, {
      name: cleanName,
      recipeId: null,
      recipe: null,
      ingredients: [],
    })
    revalidatePath('/meals')
    return { swapped: true, day, mealType, newName: cleanName }
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const { getOrCreateMealPlan } = await import('@/lib/dal/meals')
  const supabase = await getSupabaseServerClient()
  const planId = await getOrCreateMealPlan(userId, supabase, 0)

  const { error } = await supabase
    .from('meal_slots')
    .upsert(
      {
        meal_plan_id: planId,
        day_of_week: dayInt,
        meal_type: mealType,
        custom_meal_name: cleanName,
        recipe_id: null,
      },
      { onConflict: 'meal_plan_id,day_of_week,meal_type' }
    )

  if (error) throw new Error('Failed to swap meal: ' + error.message)

  revalidatePath('/meals')
  return { swapped: true, day, mealType, newName: cleanName }
}

/**
 * Save a recipe described in chat to the Recipe Box.
 * Called when Gemini confirms an add_recipe action.
 *
 * @param {string} userId
 * @param {{ name: string, description?: string, ingredients: Array, instructions?: string, prep_time_minutes?: number, cook_time_minutes?: number, servings?: number, tags?: string[] }} recipeData
 */
export async function addRecipeFromChat(userId, recipeData) {
  const name = sanitizeString(recipeData.name, 200)
  if (!name) throw new Error('Recipe name is required')

  const recipe = {
    name,
    description: sanitizeString(recipeData.description, 500) || null,
    instructions: recipeData.instructions || null,
    ingredients: Array.isArray(recipeData.ingredients) ? recipeData.ingredients : [],
    tags: Array.isArray(recipeData.tags) ? recipeData.tags : [],
    prep_time_minutes: recipeData.prep_time_minutes || null,
    cook_time_minutes: recipeData.cook_time_minutes || null,
    servings: recipeData.servings || null,
    source: 'chat',
  }

  if (isMockMode()) {
    const { createMockRecipe } = await import('@/lib/dal/mock-store')
    const created = await createMockRecipe(recipe)
    revalidatePath('/recipes')
    return created
  }

  const { createRecipe } = await import('@/lib/dal/recipes')
  const created = await createRecipe(userId, recipe)
  revalidatePath('/recipes')
  return created
}

/**
 * Log a manual receipt entry from a chat description.
 * Called when Gemini confirms a log_receipt action.
 *
 * @param {string} userId
 * @param {{ store_name: string, total_amount: number, date?: string, items?: Array<{ item_name: string, total_price?: number }> }} receiptData
 */
export async function logReceiptFromChat(userId, receiptData) {
  const storeName = sanitizeString(receiptData.store_name, 100) || 'Unknown Store'
  const total = Number(receiptData.total_amount) || 0

  const { getWeekStart } = await import('@/lib/dal/budget')
  const weekStart = getWeekStart(
    receiptData.date ? new Date(receiptData.date) : new Date()
  )

  const receipt = {
    store_name: storeName,
    total_amount: total,
    week_start: weekStart,
    entry_type: 'manual',
  }

  const items = (receiptData.items || [])
    .map(item => ({
      item_name: sanitizeString(item.item_name || item.name, 200),
      total_price: Number(item.total_price) || null,
      quantity: 1,
    }))
    .filter(i => i.item_name)

  if (isMockMode()) {
    const { addMockReceipt } = await import('@/lib/dal/mock-store')
    const created = await addMockReceipt({ ...receipt, user_id: userId }, items)
    revalidatePath('/budget')
    return created
  }

  const { createReceipt } = await import('@/lib/dal/budget')
  const created = await createReceipt(userId, receipt, items)
  revalidatePath('/budget')
  return created
}

/**
 * Add items to the current grocery list from a chat request.
 * Called when Gemini confirms an add_to_grocery action.
 *
 * @param {string} userId
 * @param {Array<{ name: string, quantity?: string, category?: string } | string>} items
 */
export async function addToGroceryList(userId, items) {
  const validItems = (items || [])
    .map(item => ({
      name: sanitizeString(typeof item === 'string' ? item : item.name, 200),
      quantity: (typeof item === 'object' && item.quantity) ? String(item.quantity) : '1',
      category: (typeof item === 'object' && item.category) ? item.category : 'Other',
    }))
    .filter(i => i.name)

  if (!validItems.length) return { added: 0 }

  // Auto-assign stores based on grocery preferences (best-effort; no error on failure)
  let storeAssignments = {}
  try {
    const { getGroceryPreferences } = await import('@/lib/dal/profile')
    const prefs = await getGroceryPreferences(userId)
    const storeList = prefs?.store_list || []
    for (const item of validItems) {
      for (const store of storeList) {
        if (Array.isArray(store.categories) && store.categories.some(
          c => c.toLowerCase() === item.category.toLowerCase()
        )) {
          storeAssignments[item.name] = store.value
          break
        }
      }
    }
  } catch {
    // Preferences unavailable — skip auto-assignment
  }

  if (isMockMode()) {
    const { addMockGroceryItems } = await import('@/lib/dal/mock-store')
    if (typeof addMockGroceryItems === 'function') {
      addMockGroceryItems(validItems.map(i => ({
        name: i.name,
        quantity: i.quantity,
        category: i.category,
        store_assignment: storeAssignments[i.name] || null,
      })))
    }
    revalidatePath('/grocery')
    return { added: validItems.length }
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()

  const rows = validItems.map(item => ({
    user_id: userId,
    name: item.name,
    quantity: item.quantity,
    category: item.category,
    status: 'need',
    checked: false,
    in_pantry: false,
    store_assignment: storeAssignments[item.name] || null,
  }))

  const { error } = await supabase.from('grocery_items').insert(rows)
  if (error) throw new Error('Failed to add grocery items: ' + error.message)

  revalidatePath('/grocery')
  return { added: validItems.length }
}

/**
 * Update a pantry item or staple's status from a chat request.
 * When marking as out of stock, also adds to the grocery list.
 * Called when Gemini confirms an update_pantry or mark_staple_out_of_stock action.
 *
 * @param {string} userId
 * @param {string} itemName
 * @param {boolean} isOutOfStock
 */
export async function updatePantryFromChat(userId, itemName, isOutOfStock) {
  if (!itemName) throw new Error('Item name is required')
  const cleanName = sanitizeString(itemName, 200)

  // Check if this matches a staple first
  const { getStaples, toggleStapleStock } = await import('@/lib/dal/staples')
  const staples = await getStaples(userId)
  const staple = staples.find(
    s => s.name.toLowerCase() === cleanName.toLowerCase()
  )

  if (staple) {
    await toggleStapleStock(userId, staple.id, isOutOfStock)
    if (isOutOfStock) {
      await addToGroceryList(userId, [{ name: cleanName, category: staple.category || 'Other' }])
    }
    revalidatePath('/kitchen')
    return { updated: 'staple', name: cleanName, isOutOfStock }
  }

  // Fall back to managed pantry
  if (isMockMode()) {
    const { getMockManagedPantry, updateMockPantryItem } = await import('@/lib/dal/mock-store')
    const pantry = await getMockManagedPantry()
    const found = pantry.find(
      i => i.ingredient_name.toLowerCase() === cleanName.toLowerCase()
    )
    if (found) {
      await updateMockPantryItem(found.id, { is_depleted: isOutOfStock })
    }
    if (isOutOfStock) {
      await addToGroceryList(userId, [{ name: cleanName }])
    }
    revalidatePath('/kitchen')
    return { updated: 'pantry', name: cleanName, isOutOfStock }
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()

  const { data: pantryItem } = await supabase
    .from('pantry')
    .select('id')
    .eq('user_id', userId)
    .ilike('ingredient_name', cleanName)
    .maybeSingle()

  if (pantryItem) {
    await supabase
      .from('pantry')
      .update({ is_depleted: isOutOfStock })
      .eq('id', pantryItem.id)
      .eq('user_id', userId)
  }

  if (isOutOfStock) {
    await addToGroceryList(userId, [{ name: cleanName }])
  }

  revalidatePath('/kitchen')
  return { updated: 'pantry', name: cleanName, isOutOfStock }
}
