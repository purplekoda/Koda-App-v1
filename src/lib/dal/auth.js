import 'server-only'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Get the currently authenticated user. Returns null if not authenticated.
 */
export async function getCurrentUser() {
  const supabase = await getSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

/**
 * Require authentication. Redirects to /login if not authenticated.
 * Use this in Server Components and DAL functions.
 */
export async function requireAuth() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return user
}

/**
 * Get the current session. Returns null if no active session.
 */
export async function getSession() {
  const supabase = await getSupabaseServerClient()
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error || !session) {
    return null
  }

  return session
}

/**
 * Verify a JWT token from an API request. Returns the user or null.
 */
export async function verifyApiAuth(request) {
  const authHeader = request.headers.get('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const supabase = await getSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  )

  if (error || !user) {
    return null
  }

  return user
}
