import { requireUser } from '@/lib/dal/require-user'
import { getWeeklyMeals, getSwapSuggestions, getUserRecipesForPicker, buildWeekScaffold } from '@/lib/dal/meals'
import { getUserCollections, getRecipeCollectionLinks } from '@/lib/dal/collections'
import { getCookingPreferences } from '@/lib/dal/cooking-preferences'
import { getGroceryPreferences } from '@/lib/dal/profile'
import MealsPageClient from './MealsPageClient'

export default async function MealsPage() {
  const user = await requireUser()

  let meals = buildWeekScaffold(), swapSuggestions = [], recipes = []
  let cookingPreferences = null, groceryPreferences = {}
  let collections = [], collectionLinks = []
  try {
    ;[meals, swapSuggestions, recipes, cookingPreferences, groceryPreferences, collections, collectionLinks] = await Promise.all([
      getWeeklyMeals(user.id),
      getSwapSuggestions(user.id),
      getUserRecipesForPicker(user.id),
      getCookingPreferences(user.id).catch(() => null),
      getGroceryPreferences(user.id).catch(() => ({})),
      getUserCollections(user.id).catch(() => []),
      getRecipeCollectionLinks(user.id).catch(() => []),
    ])
  } catch (err) {
    console.error('[MealsPage] Failed to load data:', err?.message)
  }

  return (
    <MealsPageClient
      initialMeals={meals}
      swapSuggestions={swapSuggestions}
      recipes={recipes}
      cookingPreferences={cookingPreferences}
      groceryPreferences={groceryPreferences}
      collections={collections}
      collectionLinks={collectionLinks}
    />
  )
}
