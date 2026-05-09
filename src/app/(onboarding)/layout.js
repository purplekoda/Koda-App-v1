import { requireUser } from '@/lib/dal/require-user'

export default async function OnboardingLayout({ children }) {
  // Auth gate — redirects to /login if not authenticated
  await requireUser()

  return <>{children}</>
}
