import 'server-only'

import { getCurrentUser } from '@/lib/dal/auth'

const USE_MOCK = !process.env.NEXT_PUBLIC_SUPABASE_URL

const MOCK_USER = Object.freeze({
  id: 'mock-user-id',
  email: 'jessica@example.com',
  user_metadata: {
    display_name: 'Jessica',
    initials: 'JM',
  },
})

/**
 * Get the current user, or return a mock user in development mode.
 * Redirects to /login if Supabase is configured and no user is authenticated.
 */
export async function requireUser() {
  if (USE_MOCK) {
    return MOCK_USER
  }

  // In production, this calls requireAuth() which redirects if not authenticated
  const user = await getCurrentUser()
  if (!user) {
    const { redirect } = await import('next/navigation')
    redirect('/login')
  }
  return user
}

/**
 * Check if we're running in mock mode (no Supabase configured).
 */
export function isMockMode() {
  return USE_MOCK
}
