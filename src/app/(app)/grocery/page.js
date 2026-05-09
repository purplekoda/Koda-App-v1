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
