import { requireUser } from '@/lib/dal/require-user'
import { getWeeklyMeals, getTodayMeals } from '@/lib/dal/meals'
import { getUpcomingEvents, getTodaySchedule, getTodos } from '@/lib/dal/events'
import DashboardPageClient from './DashboardPageClient'

export default async function DashboardPage() {
  const user = await requireUser()
  const displayName = user.user_metadata?.display_name || 'User'
  const initials = user.user_metadata?.initials || displayName.charAt(0).toUpperCase()

  const [weeklyMeals, todayMeals, upcomingEvents, todaySchedule, todos] =
    await Promise.all([
      getWeeklyMeals(user.id),
      getTodayMeals(user.id),
      getUpcomingEvents(user.id),
      getTodaySchedule(user.id),
      getTodos(user.id),
    ])

  return (
    <DashboardPageClient
      weeklyMeals={weeklyMeals}
      todayMeals={todayMeals}
      upcomingEvents={upcomingEvents}
      todaySchedule={todaySchedule}
      todos={todos}
      user={{ displayName, initials }}
    />
  )
}
