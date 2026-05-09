'use server'

import { requireUser } from '@/lib/dal/require-user'
import { apiLimiter } from '@/lib/rate-limit'
import { ok, fail } from '@/lib/action-result'
import { sanitizeEnum } from '@/lib/sanitize'
import { updateRecipe } from '@/lib/dal/recipes'
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
