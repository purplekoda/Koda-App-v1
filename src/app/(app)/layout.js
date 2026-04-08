import AppShell from '@/components/layout/AppShell'
import { requireUser } from '@/lib/dal/require-user'

export default async function AppLayout({ children }) {
  const user = await requireUser()

  const displayName = user.user_metadata?.display_name || 'User'
  const initials = user.user_metadata?.initials || displayName.charAt(0).toUpperCase()

  return <AppShell user={{ displayName, initials }}>{children}</AppShell>
}
