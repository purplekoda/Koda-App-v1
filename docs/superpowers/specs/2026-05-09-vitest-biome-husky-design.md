# Vitest + Biome + Husky pre-push gate

**Date:** 2026-05-09
**Status:** Approved, pending implementation plan

## Goal

Stand up a testing stack (Vitest), a formatter (Biome), a fast pre-push git hook (Husky) for lint + format, and a GitHub Actions CI workflow that enforces a ratcheting coverage gate climbing toward 100% line and branch coverage.

## Non-goals

- Replacing ESLint or losing `eslint-config-next` rules
- Slowing down `git push` with the test suite (hook stays fast; tests run in CI)
- Backfilling tests for the entire existing codebase before CI passes
- Changing the Netlify build pipeline (it stays as `npm run build`)

## Constraints

- Project uses Next.js 16 App Router, React 19, styled-components, Supabase, JS-only (no TypeScript)
- Existing `eslint-config-next` setup must keep working
- The `testsprite_tests/` directory is out of scope — leave untouched
- `src/proxy.js` (Next middleware) and `src/app/**/{layout,loading,error,not-found}.js` are excluded from coverage requirements (hard to unit-test, low value)

---

## Section 1 — Vitest stack & test infrastructure

### Runner

- **Vitest** with `@vitejs/plugin-react`
- Environment: **jsdom** (required for React 19 + styled-components rendering)
- Coverage provider: **`@vitest/coverage-v8`** (faster than istanbul, JS-only project doesn't benefit from istanbul features)

### Test setup file

`vitest.setup.js` (referenced from `vitest.config.js` `setupFiles`):

- Imports `@testing-library/jest-dom` matchers
- Provides global mocks for:
  - `next/navigation` — `useRouter`, `usePathname`, `useSearchParams`, `redirect`, `notFound`
  - `next/headers` — `cookies()`, `headers()`
- Resets mocks between tests via `afterEach(() => vi.clearAllMocks())`

### Test utilities

`src/test/render.js`:
- `renderWithTheme(ui, options)` — wraps component in styled-components `ThemeProvider` with `src/styles/theme.js`
- Re-exports `screen`, `userEvent`, etc., from testing-library

`src/test/supabase-mock.js`:
- Factory that returns a chainable mock matching the Supabase client surface used by the DAL
- Used by tests of server actions and `src/lib/dal/*` to avoid network calls

### File layout

- Tests **colocated** next to source: `foo.js` → `foo.test.js`
- Test utilities under `src/test/`
- The existing `testsprite_tests/` directory is unchanged

### Coverage scope

**Included:** `src/**/*.{js,jsx}`

**Excluded:**
- `src/**/*.test.{js,jsx}`
- `src/test/**`
- `src/**/*.stories.{js,jsx}`
- `src/proxy.js`
- `src/app/**/layout.js`
- `src/app/**/loading.js`
- `src/app/**/error.js`
- `src/app/**/not-found.js`
- Root config files (`next.config.mjs`, `eslint.config.mjs`, etc. — these are outside `src/` anyway)

### Dev dependencies added

- `vitest`
- `@vitejs/plugin-react`
- `@vitest/coverage-v8`
- `@testing-library/react`
- `@testing-library/jest-dom`
- `@testing-library/user-event`
- `jsdom`

---

## Section 2 — Ratcheting coverage gate

### Mechanism

`vitest.config.js` is configured with `coverage.reporter: ['text', 'json-summary', 'html']`. After `vitest run --coverage` completes, a Node script reads the summary and enforces the ratchet:

`scripts/coverage-ratchet.js` does the following:

1. Reads `coverage/coverage-summary.json` produced by Vitest
2. Reads `.coverage-baseline.json` from repo root: `{ "lines": <number>, "branches": <number> }`
3. Compares current `lines.pct` and `branches.pct` against the baseline
4. **Fails (exit 1)** if either current value is less than baseline — printing both numbers and a clear regression message
5. **Updates** the baseline file in-place if either current value is greater than baseline, then **fails (exit 1)** with a clear message: `"Coverage increased to lines=X% branches=Y%. Run npm run test:coverage locally, commit .coverage-baseline.json, and push again."` The CI run is blocked because the new baseline must be part of a commit; CI does not push back to the branch.
6. **Passes (exit 0)** silently if both values match the baseline exactly

### Why a separate baseline file vs Vitest's `thresholdAutoUpdate`

Vitest's built-in `thresholdAutoUpdate` rewrites the threshold values inside `vitest.config.js`. That conflates "config" with "current state" and creates noisy diffs in a config file every time coverage moves. A dedicated `.coverage-baseline.json` is cleaner, easier to review, and easy to reset manually if needed.

### Initial baseline

`.coverage-baseline.json` is seeded at `{ "lines": 0, "branches": 0 }`. The first push succeeds with whatever coverage exists; the script updates the baseline upward. Every push from then on can only increase the baseline. Decreases require a manual edit and are visible in code review.

### Reaching 100%

Once the baseline reaches 100%, the ratchet stays there — any uncovered new code fails the push. This IS the strict-100% destination state, reached by climbing rather than jumping.

### Scripts added to `package.json`

- `test` — `vitest` (watch mode, for development)
- `test:run` — `vitest run` (single run, no watch)
- `test:coverage` — `vitest run --coverage && node scripts/coverage-ratchet.js`
- `format` — `biome format --write .`
- `format:check` — `biome format .`
- `prepare` — `husky` (auto-installs hooks on `npm install`)

Existing `lint` and `dev`/`build`/`start` scripts are unchanged.

### Taskfile additions

Mirror the new npm scripts as Task targets:
- `task test`
- `task test:coverage`
- `task format`
- `task format:check`

---

## Section 3 — Husky pre-push hook & Biome

### Husky installation

- `husky` added to devDependencies
- `"prepare": "husky"` added to `package.json` scripts (auto-runs on `npm install`)
- Hooks live in `.husky/`

### `.husky/pre-push`

Runs in fail-fast order, cheapest first:

1. `npm run format:check` — Biome formatting check (~100ms)
2. `npm run lint` — ESLint with `eslint-config-next`

Tests are **not** run in the hook — they run in CI (see Section 4). This keeps `git push` fast and avoids developers waiting on the suite at push time. If either lint or format fails, the push is blocked. Standard `git push --no-verify` works for emergencies; no custom override is added.

### Biome configuration

`biome.json` at repo root:

```json
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
  "files": {
    "includes": ["src/**", "scripts/**", "*.{js,mjs,json}"]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "enabled": false
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "always",
      "trailingCommas": "all"
    }
  }
}
```

Biome's linter is **disabled** project-wide. ESLint remains the sole linter so `eslint-config-next` rules (image optimization, font loading, script optimization) continue to apply.

### Bulk-format commit

Running `biome format --write .` on a previously-unformatted codebase will touch most files. This is performed as a single isolated commit (`chore: apply biome formatting`) so it doesn't pollute the diff of subsequent feature commits.

### Dev dependencies added

- `husky`
- `@biomejs/biome`

---

## Section 4 — GitHub Actions CI workflow

### File

`.github/workflows/ci.yml`

### Triggers

- `push` to any branch
- `pull_request` targeting any branch

### Job: `verify`

Runs on `ubuntu-latest`, Node 20 (matching `netlify.toml`):

1. `actions/checkout@v4`
2. `actions/setup-node@v4` with Node 20 and `cache: 'npm'`
3. `npm ci`
4. `npm run format:check`
5. `npm run lint`
6. `npm run test:coverage` — runs Vitest + the ratchet script

Coverage HTML report is uploaded as a workflow artifact via `actions/upload-artifact@v4` for inspection on failed runs.

### Behavior

- Coverage regression → step 6 exits 1 → workflow fails → blocks PR merge (when branch protection is enabled in repo settings; configuring that is out of scope for this spec).
- Coverage improvement → ratchet script updates `.coverage-baseline.json` locally in the runner, then exits 1 with an instruction to bump locally and re-push. CI does not push back to the branch (avoids requiring elevated permissions and surprise commits).
- Lint or format failure → fails before tests run.

### Why CI instead of pre-push for tests

- Hook stays fast (~1s for lint+format vs many seconds/minutes once the suite grows)
- Tests run in a clean, reproducible environment
- Failures are visible in PR status checks, not just one developer's terminal
- Coverage HTML artifact is available for review

---

## File-tree summary of additions

```
.github/workflows/
  ci.yml                          # new
.husky/
  pre-push                        # new
docs/superpowers/specs/
  2026-05-09-vitest-biome-husky-design.md   # this file
scripts/
  coverage-ratchet.js             # new
src/test/
  render.js                       # new
  supabase-mock.js                # new
.coverage-baseline.json           # new, seeded at {lines:0, branches:0}
biome.json                        # new
vitest.config.js                  # new
vitest.setup.js                   # new
package.json                      # modified — scripts + devDependencies
Taskfile.yml                      # modified — new task targets
.gitignore                        # modified — add /coverage
```

## Open follow-ups (out of scope for first pass)

- Enabling branch protection rules in GitHub repo settings to require the `verify` workflow to pass before merge
- Writing actual tests — continuous work driven by the ratchet, not a one-time deliverable
- Decision on whether to ever wire a pre-commit `lint-staged`-style check (currently: no, hook is push-time only)
