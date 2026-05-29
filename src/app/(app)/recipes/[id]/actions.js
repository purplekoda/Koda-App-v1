'use server'

import { revalidatePath } from 'next/cache'
import { requireUser, isMockMode } from '@/lib/dal/require-user'
import { apiLimiter, aiLimiter } from '@/lib/rate-limit'
import { ok, fail } from '@/lib/action-result'
import { sanitizeString, sanitizeEnum } from '@/lib/sanitize'
import { updateRecipe } from '@/lib/dal/recipes'
import { addMockGroceryItems } from '@/lib/dal/mock-store'
import { GROCERY_STORES } from '@/data/grocery-stores'

const VALID_STORES = GROCERY_STORES.map(s => s.value)

/**
 * Save ingredient-to-store assignments for a recipe.
 * assignments: string[] — one store value per ingredient (parallel array), or '' for unassigned.
 */
export async function saveIngredientStoreAssignmentsAction(recipeId, assignments) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    if (!recipeId) return fail('Recipe ID is required')

    const sanitized = (Array.isArray(assignments) ? assignments : []).map(
      a => sanitizeEnum(a, VALID_STORES) || ''
    )

    await updateRecipe(user.id, recipeId, {
      ingredient_store_assignments: sanitized,
      updated_at: new Date().toISOString(),
    })

    return ok(sanitized)
  } catch {
    return fail('Could not save store assignments.')
  }
}

/**
 * Send a voice command to the cooking assistant and get Gemini's response.
 *
 * @param {string} message - The user's spoken transcript.
 * @param {object} recipe - Full recipe object (name, ingredients, instructions, steps).
 * @param {number} currentStep - 1-based step the user is on.
 * @param {Array} history - Conversation history for context.
 * @returns {Promise<{success: boolean, data?: {text: string}, error?: string}>}
 */
export async function askCookingAssistantAction(message, recipe, currentStep, history) {
  try {
    const user = await requireUser()
    const rate = aiLimiter.check(user.id)
    if (!rate.success) return fail('Too many Koda requests. Please wait a moment.')

    const cleanMessage = sanitizeString(message, 500)
    if (!cleanMessage) return fail('No message provided.')

    if (!recipe?.name || !recipe?.steps?.length) {
      return fail('Recipe data is required.')
    }

    if (isMockMode()) {
      return ok({ text: `Step ${currentStep}: ${recipe.steps[currentStep - 1] || 'You have completed all the steps!'}. Ready for the next step?` })
    }

    const { callCookingAssistant } = await import('@/lib/gemini')

    const safeHistory = Array.isArray(history)
      ? history.slice(-10)
      : []

    const text = await callCookingAssistant(cleanMessage, recipe, currentStep, safeHistory)

    return ok({ text })
  } catch {
    return fail('Koda couldn’t respond. Please try again.')
  }
}

export async function sendIngredientsToGroceryAction(recipeId, ingredients) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    if (!Array.isArray(ingredients) || !ingredients.length) {
      return fail('This recipe has no ingredients')
    }

    if (isMockMode()) {
      await addMockGroceryItems(ingredients.map(ing => ({
        name: ing.name,
        quantity: ing.quantity || null,
      })))
      return ok({ addedCount: ingredients.length })
    }

    const { getSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = await getSupabaseServerClient()

    // Find or create a draft grocery list to attach items to
    let listId
    const { data: existing, error: listFetchError } = await supabase
      .from('grocery_lists')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (listFetchError) {
      console.error('[sendIngredientsToGroceryAction] list fetch error:', listFetchError)
      return fail('Could not access your grocery list')
    }

    if (existing) {
      listId = existing.id
    } else {
      const { data: created, error: createError } = await supabase
        .from('grocery_lists')
        .insert({ user_id: user.id, status: 'draft' })
        .select('id')
        .single()
      if (createError) {
        console.error('[sendIngredientsToGroceryAction] list create error:', createError)
        return fail('Could not create a grocery list')
      }
      listId = created.id
    }

    const rows = ingredients.map(ing => ({
      grocery_list_id: listId,
      user_id: user.id,
      name: sanitizeString(ing.name, 200),
      quantity: ing.quantity ? sanitizeString(ing.quantity, 100) : null,
      category: 'Other',
    }))
    const { error } = await supabase.from('grocery_items').insert(rows)
    if (error) {
      console.error('[sendIngredientsToGroceryAction] insert error:', error)
      return fail('Could not add ingredients to grocery list')
    }

    revalidatePath('/grocery')
    return ok({ addedCount: ingredients.length })
  } catch (err) {
    console.error('[sendIngredientsToGroceryAction]', err)
    return fail('Something went wrong')
  }
}
