@AGENTS.md

# Project Overview

Koda is a household meal-planning and kitchen management app. Key areas: dashboard, meals, kitchen/pantry, grocery lists, recipes, calendar/events, and an AI assistant bar.

# Tech Stack

- Next.js 16 (App Router) with React 19
- Supabase for auth and database (`@supabase/ssr` for server-side sessions)
- styled-components with a custom theme (`src/styles/theme.js`)
- Task (https://taskfile.dev/) as the task runner — see `Taskfile.yml`

# Common Commands

- `task dev` — start dev server
- `task build` — production build
- `task lint` — run ESLint
- `task lint:fix` — ESLint with auto-fix
- `task check` — lint + build
- `task clean` — remove `.next`

# Project Structure

- `src/app/(app)/` — authenticated routes (dashboard, meals, kitchen, grocery, recipes, calendar, events, signups)
- `src/app/(auth)/` — login, signup, auth callback
- `src/components/` — UI components organized by feature (layout, meals, kitchen, grocery, ai, dashboard, common)
- `src/data/` — mock data for development
- `src/lib/` — utilities (Supabase clients, auth DAL, sanitization, rate limiting, validators)
- `src/styles/` — theme, global styles, styled-components registry

# Code Conventions

- Use styled-components for all styling; reference theme tokens from `src/styles/theme.js`
- Components are plain `.js` files (not TypeScript)
- Use the `@/` path alias for imports from `src/`
- Auth uses a Data Access Layer pattern (`src/lib/dal/auth.js`)
- Sanitize user-facing content with `isomorphic-dompurify` (`src/lib/sanitize.js`)
- Validate inputs with `src/lib/validators.js`

# Environment

- Copy `.env.example` to `.env.local` for local development
- The app runs in mock-data mode when Supabase env vars are missing
- Server-only secrets (`SUPABASE_SERVICE_ROLE_KEY`, deep-link bases) must never be exposed to the client
