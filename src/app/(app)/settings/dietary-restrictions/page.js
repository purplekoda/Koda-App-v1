import { requireUser } from '@/lib/dal/require-user'
import { getDietaryRestrictions } from '@/lib/dal/cooking-preferences'
import DietaryRestrictionsSettingsClient from './DietaryRestrictionsSettingsClient'

export default async function DietaryRestrictionsSettingsPage() {
  const user = await requireUser()
  const restrictions = await getDietaryRestrictions(user.id).catch(() => [])
  return <DietaryRestrictionsSettingsClient restrictions={restrictions} />
}
