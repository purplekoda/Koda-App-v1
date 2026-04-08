import { requireUser } from '@/lib/dal/require-user'
import { getWeeklyMeals, getSwapSuggestions } from '@/lib/dal/meals'
import MealsPageClient from './MealsPageClient'

export default async function MealsPage() {
  const user = await requireUser()

  const [meals, swapSuggestions] = await Promise.all([
    getWeeklyMeals(user.id),
    getSwapSuggestions(user.id),
  ])

  return (
    <MealsPageClient
      initialMeals={meals}
      swapSuggestions={swapSuggestions}
    />
  )
}
