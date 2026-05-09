import { requireUser } from '@/lib/dal/require-user'
import { getOnboardingProfile } from '@/lib/dal/onboarding'
import RecipeStyleSettingsClient from './RecipeStyleSettingsClient'

export default async function RecipeStyleSettingsPage() {
  const user = await requireUser()
  const op = await getOnboardingProfile(user.id).catch(() => ({}))
  return <RecipeStyleSettingsClient adventurousness={op.adventurousness || null} />
}
