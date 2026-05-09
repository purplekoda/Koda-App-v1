import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/dal/require-user'
import { getRecipeById } from '@/lib/dal/recipes'
import { getGroceryPreferences } from '@/lib/dal/profile'
import { getHouseholdFaithPractices } from '@/lib/dal/faith-practices'
import RecipeDetailClient from './RecipeDetailClient'

export default async function RecipeDetailPage({ params }) {
  const { id } = await params
  const user = await requireUser()

  let recipe = null
  let groceryPreferences = {}
  let faithPractices = { follows_faith_based_diet: false }
  try {
    ;[recipe, groceryPreferences, faithPractices] = await Promise.all([
      getRecipeById(user.id, id),
      getGroceryPreferences(user.id).catch(() => ({})),
      getHouseholdFaithPractices(user.id).catch(() => ({ follows_faith_based_diet: false })),
    ])
  } catch (err) {
    console.error('[RecipeDetailPage] Failed to load recipe:', err?.message)
  }

  if (!recipe) notFound()

  return <RecipeDetailClient initialRecipe={recipe} groceryPreferences={groceryPreferences} faithPractices={faithPractices} />
}
