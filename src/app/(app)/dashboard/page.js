import { requireUser } from '@/lib/dal/require-user'
import { getWeeklyMeals, getTodayMeals } from '@/lib/dal/meals'
import { getTodaySchedule, getTodos } from '@/lib/dal/events'
import { getDashboardSections } from '@/lib/dal/profile'
import { getPantryItems, getDinnerIdeas } from '@/lib/dal/pantry'
import { getManagedPantryItems } from '@/lib/dal/pantry-management'
import { getGroceryItems } from '@/lib/dal/grocery'
import { getMacroMembers } from '@/lib/dal/macros'
import { getCookingPreferences } from '@/lib/dal/cooking-preferences'
import DashboardPageClient from './DashboardPageClient'

export default async function DashboardPage() {
  const user = await requireUser()
  const displayName = user.user_metadata?.display_name || 'User'
  const initials = user.user_metadata?.initials || displayName.charAt(0).toUpperCase()

  let weeklyMeals = [], todayMeals = [], todaySchedule = [], todos = []
  let dashboardSections = [], pantryItems = [], managedPantry = []
  let groceryItems = [], macroMembers = [], dinnerIdeas = []
  let cookingPreferences = null

  try {
    ;[
      weeklyMeals, todayMeals, todaySchedule, todos,
      dashboardSections, pantryItems, managedPantry,
      groceryItems, macroMembers, dinnerIdeas,
      cookingPreferences,
    ] = await Promise.all([
      getWeeklyMeals(user.id),
      getTodayMeals(user.id),
      getTodaySchedule(user.id),
      getTodos(user.id),
      getDashboardSections(user.id),
      getPantryItems(user.id).catch(() => []),
      getManagedPantryItems(user.id).catch(() => []),
      getGroceryItems(user.id).catch(() => []),
      getMacroMembers(user.id).catch(() => []),
      getDinnerIdeas(user.id).catch(() => []),
      getCookingPreferences(user.id).catch(() => null),
    ])
  } catch (err) {
    console.error('[DashboardPage] Failed to load data:', err?.message)
  }

  // Merge legacy pantry items with managed pantry for alerts
  const allPantryItems = [...pantryItems, ...managedPantry]

  return (
    <DashboardPageClient
      weeklyMeals={weeklyMeals}
      todayMeals={todayMeals}
      todaySchedule={todaySchedule}
      todos={todos}
      user={{ displayName, initials }}
      dashboardSections={dashboardSections}
      pantryItems={allPantryItems}
      groceryItems={groceryItems}
      macroMembers={macroMembers}
      dinnerIdeas={dinnerIdeas}
      cookingPreferences={cookingPreferences}
    />
  )
}
