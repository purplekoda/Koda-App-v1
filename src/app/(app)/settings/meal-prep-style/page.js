import { requireUser } from '@/lib/dal/require-user'
import { getOnboardingProfile } from '@/lib/dal/onboarding'
import MealPrepStyleSettingsClient from './MealPrepStyleSettingsClient'

export default async function MealPrepStyleSettingsPage() {
  const user = await requireUser()
  const op = await getOnboardingProfile(user.id).catch(() => ({}))
  return <MealPrepStyleSettingsClient mealPrepStyle={op.meal_prep_style || null} />
}
