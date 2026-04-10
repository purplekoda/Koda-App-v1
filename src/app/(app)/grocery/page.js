import { requireUser } from '@/lib/dal/require-user'
import { getGroceryItems, getStores, getWeekSummary } from '@/lib/dal/grocery'
import { getWeeklyMeals } from '@/lib/dal/meals'
import GroceryPageClient from './GroceryPageClient'

export default async function GroceryPage() {
  const user = await requireUser()

  const [groceryItems, stores, weekSummary, weeklyMeals] = await Promise.all([
    getGroceryItems(user.id),
    getStores(user.id),
    getWeekSummary(user.id),
    getWeeklyMeals(user.id),
  ])

  return (
    <GroceryPageClient
      initialGroceryItems={groceryItems}
      stores={stores}
      weekSummary={weekSummary}
      weeklyMeals={weeklyMeals}
    />
  )
}
