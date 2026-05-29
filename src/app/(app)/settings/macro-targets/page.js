import { requireUser } from '@/lib/dal/require-user'
import { getMacroMembers } from '@/lib/dal/macros'
import MacroTargetsSettingsClient from './MacroTargetsSettingsClient'

export default async function MacroTargetsSettingsPage() {
  const user = await requireUser()
  const members = await getMacroMembers(user.id).catch(() => [])
  return <MacroTargetsSettingsClient members={members} />
}
