import { requireUser } from '@/lib/dal/require-user'
import { getGroceryItems, getStores, getWeekSummary } from '@/lib/dal/grocery'
import { getWeeklyMeals } from '@/lib/dal/meals'
import { getGroceryPreferences, getProfile } from '@/lib/dal/profile'
import GroceryPageClient from './GroceryPageClient'

export default async function GroceryPage() {
  const user = await requireUser()

  let groceryItems = [], stores = [], weekSummary = null, weeklyMeals = [], groceryPreferences = {}, profile = {}
  try {
    ;[groceryItems, stores, weekSummary, weeklyMeals, groceryPreferences, profile] = await Promise.all([
      getGroceryItems(user.id),
      getStores(user.id),
      getWeekSummary(user.id),
      getWeeklyMeals(user.id),
      getGroceryPreferences(user.id),
      getProfile(user.id),
    ])
  } catch (err) {
    console.error('[GroceryPage] Failed to load data:', err?.message)
  }

  // When the grocery list is empty but the meal plan has recipe-linked slots,
  // derive a grocery list from the recipe ingredients so the pantry-check step
  // isn't blank before the user has manually added items.
  if (groceryItems.length === 0 && weeklyMeals.length > 0) {
    const seen = new Set()
    let derivedId = 1
    for (const day of weeklyMeals) {
      for (const meal of day.meals) {
        const ingredients = meal.ingredients?.length ? meal.ingredients : meal.recipe?.ingredients
        if (!Array.isArray(ingredients)) continue
        for (const ing of ingredients) {
          const key = (ing.name || '').toLowerCase().trim()
          if (!key || seen.has(key)) continue
          seen.add(key)
          groceryItems.push({
            id: derivedId++,
            name: ing.name,
            quantity: ing.quantity || null,
            category: 'Other',
            status: 'need',
            meal: meal.name || null,
            store_assignment: null,
          })
        }
      }
    }
    if (groceryItems.length > 0) {
      weekSummary = {
        totalIngredients: groceryItems.length,
        haveCount: 0,
        needCount: groceryItems.length,
        lowCount: 0,
      }
    }
  }

  return (
    <GroceryPageClient
      initialGroceryItems={groceryItems}
      stores={stores}
      weekSummary={weekSummary}
      weeklyMeals={weeklyMeals}
      groceryPreferences={groceryPreferences}
      shoppingStyle={profile?.shopping_style || null}
    />
  )
}
