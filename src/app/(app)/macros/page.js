import { requireUser } from '@/lib/dal/require-user'
import { getMacroMembers, getTodayIndex, getMacroExtrasTotal } from '@/lib/dal/macros'
import MacrosPageClient from './MacrosPageClient'

export default async function MacrosPage() {
  const user = await requireUser()

  let members = []
  let extrasMap = {}
  const today = new Date().toISOString().slice(0, 10)

  try {
    members = await getMacroMembers(user.id)

    // Fetch today's extras for each member in parallel
    const extrasPromises = members.map(m =>
      getMacroExtrasTotal(user.id, m.id, today).then(result => [m.id, result])
    )
    const extrasResults = await Promise.all(extrasPromises)
    for (const [memberId, result] of extrasResults) {
      extrasMap[memberId] = result
    }
  } catch (err) {
    console.error('[MacrosPage] Failed to load data:', err?.message)
  }

  const primaryMemberId = members.find(m => m.isPrimary)?.id ?? members[0]?.id ?? null

  return (
    <MacrosPageClient
      members={members}
      todayIndex={getTodayIndex()}
      extrasMap={extrasMap}
      primaryMemberId={primaryMemberId}
    />
  )
}
