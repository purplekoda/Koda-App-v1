# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

# Project Overview

Koda is a household meal-planning and kitchen management app. Key areas: dashboard, meals, kitchen/pantry, grocery lists, recipes, calendar/events, and an AI assistant bar.

# Tech Stack

- Next.js 16 (App Router) with React 19
- Supabase for auth and database (`@supabase/ssr` for server-side sessions)
- styled-components with a custom theme (`src/styles/theme.js`)
- Task (https://taskfile.dev/) as the task runner — see `Taskfile.yml`
- Deployed on Netlify via `@netlify/plugin-nextjs`

# Common Commands

- `task dev` — start dev server (port 3000 by default)
- `task build` — production build
- `task lint` — run ESLint
- `task lint:fix` — ESLint with auto-fix
- `task check` — lint + build
- `task clean` — remove `.next`

Or via npm: `npm run dev`, `npm run build`, `npm run lint`

# Architecture

## Auth Flow

1. `src/proxy.js` (middleware) checks for Supabase auth cookies on every request. Unauthenticated users are redirected to `/login`. Authenticated users are blocked from `/login` and `/signup`.
2. Login/signup pages use the Supabase browser client directly (`@/lib/supabase/client`).
3. OAuth callback at `src/app/(auth)/callback/route.js` exchanges the code for a session.
4. Server-side auth uses a Data Access Layer: `src/lib/dal/auth.js` provides `getCurrentUser()` and `requireAuth()`. Both call `getUser()` which validates the JWT server-side (never trust `getSession()` for auth gates).
5. `src/lib/dal/require-user.js` wraps this with mock-mode fallback — returns a fake user when Supabase env vars are missing.

## Server Actions Pattern

All mutations go through Server Actions (`'use server'` files in route directories). They follow a consistent pattern:
- Call `requireUser()` for auth
- Check `apiLimiter` for rate limiting
- Sanitize inputs with `sanitizeString`/`sanitizeEnum`/`sanitizeEmail` from `src/lib/sanitize.js`
- Return `ok(data)` or `fail(message)` from `src/lib/action-result.js` — never expose raw errors

Client components call these actions inside `startTransition()` and check `result.success` to show toasts or revert optimistic updates.

## Mock Mode

When `NEXT_PUBLIC_SUPABASE_URL` is not set, the app runs in mock mode:
- `isMockMode()` from `require-user.js` returns true
- DAL functions return data from `src/lib/dal/mock-store.js` instead of querying Supabase
- All features remain usable for local development without a backend

## Middleware (`src/proxy.js`)

Handles CSP (nonce-based script-src via `x-nonce` request header), CORS enforcement for `/api/*` routes, and auth-based redirects. The nonce is generated per-request and forwarded to server components via request headers.

`NEXT_PUBLIC_APP_URL` must be set in production — if missing, all API requests return 503.

## Security Headers

`next.config.mjs` sets static security headers (HSTS, X-Frame-Options, COOP, CORP). Dynamic CSP is handled by the middleware.

# Code Conventions

- Use styled-components for all styling; reference theme tokens from `src/styles/theme.js`
- Components are plain `.js` files (not TypeScript)
- Use the `@/` path alias for imports from `src/`
- Sanitize all user inputs server-side before database operations
- Validate inputs with `src/lib/validators.js`
- Server pages wrap `Promise.all` DAL calls in try-catch with empty fallbacks to prevent 500s

# Environment

- Copy `.env.example` to `.env.local` for local development
- The app runs in mock-data mode when Supabase env vars are missing
- Server-only secrets (`SUPABASE_SERVICE_ROLE_KEY`, deep-link bases) must never be exposed to the client
- Required Netlify env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`
