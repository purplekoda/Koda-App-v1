import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase/server'

// Allowed redirect paths after authentication — prevents open redirect attacks
const ALLOWED_REDIRECTS = new Set([
  '/dashboard',
  '/meals',
  '/grocery',
  '/kitchen',
  '/recipes',
  '/calendar',
  '/events',
  '/signups',
  '/onboarding',
])

function getSafeRedirect(rawRedirect) {
  if (!rawRedirect || typeof rawRedirect !== 'string') return '/dashboard'

  // Must start with / (relative path only — never external URLs)
  if (!rawRedirect.startsWith('/')) return '/dashboard'

  // Block protocol-relative URLs (//evil.com)
  if (rawRedirect.startsWith('//')) return '/dashboard'

  // Strip query string and hash for comparison
  const pathname = rawRedirect.split('?')[0].split('#')[0]

  // Must be an explicitly allowed path
  if (!ALLOWED_REDIRECTS.has(pathname)) return '/dashboard'

  return pathname
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const redirectTo = getSafeRedirect(searchParams.get('redirect'))

  if (code) {
    const supabase = await getSupabaseServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(new URL(redirectTo, request.url))
    }

    console.error('[auth/callback] exchangeCodeForSession failed:', error.message)
  } else {
    console.warn('[auth/callback] No code param in callback request')
  }

  // If no code or error, redirect to login
  return NextResponse.redirect(new URL('/login', request.url))
}
