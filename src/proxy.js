import { NextResponse } from 'next/server'

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/signup', '/callback']

// Routes that authenticated users shouldn't see (redirect to dashboard)
const AUTH_ROUTES = ['/login', '/signup']

// Allowed redirect destinations — prevents open redirect via ?redirect= param
const ALLOWED_REDIRECT_PATHS = new Set([
  '/dashboard', '/meals', '/grocery', '/kitchen', '/recipes',
  '/calendar', '/events', '/signups', '/onboarding',
])

function sanitizeRedirectPath(pathname) {
  if (!pathname || typeof pathname !== 'string') return '/dashboard'
  if (!pathname.startsWith('/') || pathname.startsWith('//')) return '/dashboard'
  const clean = pathname.split('?')[0].split('#')[0]
  return ALLOWED_REDIRECT_PATHS.has(clean) ? clean : '/dashboard'
}

export function proxy(request) {
  const { pathname } = request.nextUrl

  // ── Security Headers ──
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const isDev = process.env.NODE_ENV === 'development'

  // Generate a per-request cryptographic nonce for script-src CSP.
  // Base64-encoding the UUID produces a URL-safe opaque token suitable for
  // use inside a CSP 'nonce-…' source expression.
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

  // script-src: nonce replaces 'unsafe-inline'. 'strict-dynamic' allows
  // scripts loaded by a trusted (nonce-bearing) script to run without
  // being individually listed. 'unsafe-eval' is dev-only for React's
  // error-overlay stack reconstruction.
  // style-src: 'unsafe-inline' is required by styled-components for its
  // runtime CSS injection and cannot be replaced by a nonce until
  // styled-components ships server-nonce support.
  const scriptSrc = isDev
    ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`
    : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`

  const csp = [
    "default-src 'self'",
    scriptSrc,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' https://fonts.gstatic.com`,
    `img-src 'self' data: blob: ${supabaseUrl}`,
    `connect-src 'self' ${supabaseUrl} https://*.supabase.co wss://*.supabase.co`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; ')

  // Forward the nonce to Server Components via a custom request header so
  // the root layout can read it with next/headers and pass it to <Script>.
  // The CSP must also be set on the request headers so Next.js can parse
  // the 'nonce-…' token and stamp it on framework-emitted script tags.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', csp)

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  })

  // Set CSP on the response as well so the browser enforces it.
  response.headers.set('Content-Security-Policy', csp)

  // ── CORS check for API routes ──
  if (pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin')
    const isDevelopment = process.env.NODE_ENV === 'development'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL

    // In production, block all API requests if APP_URL is not configured
    if (!isDevelopment && !appUrl) {
      console.error('[proxy] NEXT_PUBLIC_APP_URL is not set — blocking all API requests in production')
      return new NextResponse(null, { status: 503 })
    }

    const allowedOrigin = appUrl || 'http://localhost:3000'

    // Block requests with no origin header (non-browser clients) and mismatched origins
    if (!origin || origin !== allowedOrigin) {
      return new NextResponse(null, {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Set CORS response headers for allowed origins
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin)
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }

  // ── Auth Redirect Logic ──
  // Skip auth redirects if Supabase is not configured (dev without backend)
  const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  if (!supabaseConfigured) {
    return response
  }

  // Check for Supabase auth cookie — verify name pattern and non-empty value
  const hasAuthCookie = request.cookies.getAll().some(
    cookie =>
      cookie.name.startsWith('sb-') &&
      cookie.name.endsWith('-auth-token') &&
      cookie.value.length > 0
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
    // Sanitize the redirect path to prevent open redirect attacks
    loginUrl.searchParams.set('redirect', sanitizeRedirectPath(pathname))
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
