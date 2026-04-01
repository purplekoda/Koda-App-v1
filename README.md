# Koda

A household meal-planning and kitchen management app built with Next.js and Supabase.

## Features

- **Dashboard** — daily overview with meals, schedule, to-dos, and upcoming events
- **Meals** — weekly meal planner with swap/fill helpers and detail views
- **Kitchen** — pantry tracker, scan-to-add, and AI-powered dinner ideas
- **Grocery** — step-by-step grocery list builder (choose store → review meals → pantry check → send)
- **Recipes** — recipe browser
- **Calendar & Events** — scheduling and event management
- **AI Bar** — conversational AI assistant embedded across the app
- **Auth** — login/signup powered by Supabase with SSR session handling

## Tech Stack

- **Framework:** Next.js 16 (App Router, React 19)
- **Auth & Database:** Supabase (`@supabase/ssr`)
- **Styling:** styled-components with a custom theme
- **Sanitization:** isomorphic-dompurify
- **Linting:** ESLint

## Getting Started

### Prerequisites

- Node.js 18+
- [Task](https://taskfile.dev/) (optional, but recommended)
- A Supabase project (or run without env vars to use mock data)

### Environment Variables

Create a `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

If these are omitted, the app runs in dev mode with mock data.

### Install & Run

```bash
task install
task dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

```
src/
├── app/
│   ├── (app)/        # Authenticated app routes (dashboard, meals, kitchen, etc.)
│   ├── (auth)/       # Login, signup, and auth callback
│   └── page.js       # Root redirect (→ dashboard or login)
├── components/       # UI components organized by feature
├── data/             # Mock data for development
├── lib/              # Supabase clients, auth DAL, sanitization, rate limiting
└── styles/           # Theme, global styles, styled-components registry
```

## Tasks

This project uses [Task](https://taskfile.dev/) as its task runner. Run `task` to see all available tasks.

| Command          | Description                        |
| ---------------- | ---------------------------------- |
| `task dev`       | Start dev server                   |
| `task build`     | Create a production build          |
| `task start`     | Start production server            |
| `task lint`      | Run ESLint                         |
| `task lint:fix`  | Run ESLint with auto-fix           |
| `task clean`     | Remove build artifacts             |
| `task install`   | Install dependencies               |
| `task check`     | Run lint and build to verify       |

Pass a custom port with `task dev PORT=4000`.
