import { NextResponse } from 'next/server'

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/signup', '/callback']

// Routes that authenticated users shouldn't see (redirect to dashboard)
const AUTH_ROUTES = ['/login', '/signup']

export function proxy(request) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  // ── Security Headers ──
  // CSP: allow Supabase connections, Google Fonts, and inline styles for styled-components
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const isDev = process.env.NODE_ENV === 'development'
  // React requires 'unsafe-eval' in development for error overlay and stack traces
  const scriptSrc = isDev
    ? `script-src 'self' 'unsafe-inline' 'unsafe-eval'`
    : `script-src 'self' 'unsafe-inline'`
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      scriptSrc,
      `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
      `font-src 'self' https://fonts.gstatic.com`,
      `img-src 'self' data: blob: ${supabaseUrl}`,
      `connect-src 'self' ${supabaseUrl} https://*.supabase.co wss://*.supabase.co`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  )

  // ── CORS check for API routes ──
  if (pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin')
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    if (origin && origin !== appUrl) {
      return new NextResponse(null, { status: 403 })
    }
  }

  // ── Auth Redirect Logic ──
  // Skip auth redirects if Supabase is not configured (dev without backend)
  const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  if (!supabaseConfigured) {
    return response
  }

  // Check for Supabase auth cookie
  const hasAuthCookie = request.cookies.getAll().some(
    cookie => cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')
  )

  // Redirect unauthenticated users away from protected routes
  if (!hasAuthCookie && !PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    // Allow static assets and API routes through
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api') ||
      pathname === '/favicon.ico' ||
      pathname === '/'
    ) {
      return response
    }

    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users away from auth pages
  if (hasAuthCookie && AUTH_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    // Match all routes except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
