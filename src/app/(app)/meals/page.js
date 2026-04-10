import { requireUser } from '@/lib/dal/require-user'
import { getWeeklyMeals, getSwapSuggestions } from '@/lib/dal/meals'
import MealsPageClient from './MealsPageClient'

export default async function MealsPage() {
  const user = await requireUser()

  let meals = [], swapSuggestions = []
  try {
    ;[meals, swapSuggestions] = await Promise.all([
      getWeeklyMeals(user.id),
      getSwapSuggestions(user.id),
    ])
  } catch (err) {
    console.error('[MealsPage] Failed to load data:', err?.message)
  }

  return (
    <MealsPageClient
      initialMeals={meals}
      swapSuggestions={swapSuggestions}
    />
  )
}
