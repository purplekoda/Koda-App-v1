import { requireUser } from '@/lib/dal/require-user'
import { getGroceryItems, getStores, getWeekSummary } from '@/lib/dal/grocery'
import { getWeeklyMeals } from '@/lib/dal/meals'
import GroceryPageClient from './GroceryPageClient'

export default async function GroceryPage() {
  const user = await requireUser()

  let groceryItems = [], stores = [], weekSummary = null, weeklyMeals = []
  try {
    ;[groceryItems, stores, weekSummary, weeklyMeals] = await Promise.all([
      getGroceryItems(user.id),
      getStores(user.id),
      getWeekSummary(user.id),
      getWeeklyMeals(user.id),
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
    />
  )
}
