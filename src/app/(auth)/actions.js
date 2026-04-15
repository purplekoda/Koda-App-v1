'use server'

import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { requireUser, isMockMode } from '@/lib/dal/require-user'
import { authLimiter } from '@/lib/rate-limit'
import { ok, fail } from '@/lib/action-result'

export async function logout() {
  try {
    const user = await requireUser()
    const rate = authLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    if (!isMockMode()) {
      const supabase = await getSupabaseServerClient()
      const { error } = await supabase.auth.signOut()
      if (error) return fail('Sign out failed. Please try again.')
    }
  } catch {
    // If requireUser fails the session is already invalid — proceed to redirect
  }

  redirect('/login')
}
