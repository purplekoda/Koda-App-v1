import { requireUser } from '@/lib/dal/require-user'
import { getOnboardingProfile } from '@/lib/dal/onboarding'
import { getCookingPreferences } from '@/lib/dal/cooking-preferences'
import BudgetSettingsClient from './BudgetSettingsClient'

export default async function BudgetSettingsPage() {
  const user = await requireUser()
  const [op, cookingPrefs] = await Promise.all([
    getOnboardingProfile(user.id).catch(() => ({})),
    getCookingPreferences(user.id).catch(() => null),
  ])

  return (
    <BudgetSettingsClient
      budget={cookingPrefs?.weekly_budget || op.cooking_preferences?.weekly_budget || 150}
      monthlyBudget={cookingPrefs?.monthly_budget || op.cooking_preferences?.monthly_budget || 0}
      splitMonthly={cookingPrefs?.split_monthly_to_weekly || op.cooking_preferences?.split_monthly_to_weekly || false}
      priorities={op.budget_priorities || []}
      shoppingStyle={op.shopping_style || null}
      deliveryService={op.preferred_delivery_service || null}
    />
  )
}
