# Koda App Roadmap

## Phase 1: Authentication Infrastructure
**Goal:** Establish the secure foundation for user identity management using state-of-the-art 2026 Supabase and Next.js practices.
- [x] Configure `@supabase/ssr` server and browser clients.
- [x] Implement Next.js Middleware to refresh sessions automatically via HTTP-only cookies.
- [x] Create core server actions for Auth: `login`, `signup`, `logout`.
- [x] Develop utility functions for securely checking authentication status in Server Components (e.g., using `getClaims()`).

## Phase 2: Frontend Authentication UI
**Goal:** Create premium, glassmorphism-inspired UI components for the authentication flows.
- [x] Design and implement the `login` page (`src/app/(auth)/login/page.js`).
- [x] Design and implement the `signup` page (`src/app/(auth)/signup/page.js`).
- [x] Implement robust client-side form validation (email/password rules) with actionable error states.
- [x] Add loading indicators and micro-animations to enhance the UX during server action execution.
- [x] Implement an `unauthorized` or `forbidden` page state.

## Phase 3: Route Protection and Access Control
**Goal:** Restrict access to sensitive parts of the application.
- [x] Apply Middleware redirects blocking unauthenticated users from accessing the `/(app)` route group.
- [x] Implement user state logic in the global `layout.js` to toggle navigation links (e.g. "Dashboard" vs "Login").
- [x] (Database Level) Implement PostgreSQL Row-Level Security (RLS) policies within `supabase-schema.sql` to block illicit CRUD operations.

## Phase 4: Advanced Auth & Integrations (Future Scope)
**Goal:** Extend identity beyond email/password to improve onboarding friction.
- [ ] Integrate OAuth providers (Google, GitHub).
- [ ] Explore Passwordless / Magic Link flow.
- [ ] Integrate avatar and profile management.
