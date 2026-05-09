import { requireUser } from '@/lib/dal/require-user'
import { getOnboardingProfile } from '@/lib/dal/onboarding'
import FrustrationsSettingsClient from './FrustrationsSettingsClient'

export default async function FrustrationsSettingsPage() {
  const user = await requireUser()
  const op = await getOnboardingProfile(user.id).catch(() => ({}))
  return <FrustrationsSettingsClient frustrations={op.cooking_frustrations || []} />
}
