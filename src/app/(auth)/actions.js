'use server'

import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'
import { requireUser, isMockMode } from '@/lib/dal/require-user'
import { authLimiter } from '@/lib/rate-limit'
import { ok, fail } from '@/lib/action-result'
import { sanitizeString, sanitizeEmail } from '@/lib/sanitize'

export async function signUpAction({ name, email, password, accessCode }) {
  const expected = (process.env.KODA_ACCESS_CODE || '').trim()
  const provided = (accessCode || '').toString().trim()
  if (!expected || provided.toLowerCase() !== expected.toLowerCase()) {
    return fail('That access code isn\'t valid.')
  }

  const cleanName = sanitizeString((name || '').toString(), 100)
  if (!cleanName) return fail('Please enter your name.')

  const cleanEmail = sanitizeEmail((email || '').toString())
  if (!cleanEmail) return fail('Please enter a valid email address.')

  const pw = (password || '').toString()
  if (pw.length < 6 || pw.length > 128) {
    return fail('Password must be between 6 and 128 characters.')
  }

  const supabase = await getSupabaseServerClient()
  const { error } = await supabase.auth.signUp({
    email: cleanEmail,
    password: pw,
    options: { data: { display_name: cleanName } },
  })
  if (error) {
    console.error('Signup error:', error.message)
    return fail('Account creation failed. Please check your details and try again.')
  }

  return ok({ message: 'Account created — check your email to confirm, then sign in.' })
}

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
