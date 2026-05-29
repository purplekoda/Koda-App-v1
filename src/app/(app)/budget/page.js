import { requireUser } from '@/lib/dal/require-user'
import { getUserBudget, getWeekReceipts, getWeekStart } from '@/lib/dal/budget'
import BudgetPageClient from './BudgetPageClient'

export default async function BudgetPage() {
  const user = await requireUser()
  const weekStart = getWeekStart()

  let budget = null
  let receipts = []
  try {
    ;[budget, receipts] = await Promise.all([
      getUserBudget(user.id),
      getWeekReceipts(user.id, weekStart),
    ])
  } catch (err) {
    console.error('[BudgetPage] Failed to load data:', err?.message)
  }

  return (
    <BudgetPageClient
      initialBudget={budget}
      initialReceipts={receipts}
      weekStart={weekStart}
    />
  )
}
