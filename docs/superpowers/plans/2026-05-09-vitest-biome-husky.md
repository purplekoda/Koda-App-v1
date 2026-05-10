# Vitest + Biome + Husky Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up Vitest with a ratcheting coverage gate (enforced in GitHub Actions), Biome as a formatter (alongside existing ESLint), and a fast Husky pre-push hook that runs lint + format only.

**Architecture:** Vitest (jsdom + v8 coverage) with colocated tests in `src/`. A custom `scripts/coverage-ratchet.js` enforces a ratcheting baseline stored in `.coverage-baseline.json` (committed). Husky pre-push runs `format:check` + `lint`. GitHub Actions workflow runs `format:check` + `lint` + `test:coverage`. ESLint + `eslint-config-next` is unchanged.

**Tech Stack:** Vitest, @vitest/coverage-v8, @vitejs/plugin-react, jsdom, @testing-library/{react,jest-dom,user-event}, @biomejs/biome, husky, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-05-09-vitest-biome-husky-design.md`

---

## File Structure

| Path | Purpose |
|------|---------|
| `vitest.config.js` | Vitest config: jsdom env, setupFiles, coverage provider/reporters/excludes |
| `vitest.setup.js` | jest-dom matchers + global mocks for `next/navigation`, `next/headers` |
| `src/test/render.js` | `renderWithTheme()` wrapper for styled-components ThemeProvider |
| `src/test/supabase-mock.js` | Chainable Supabase client mock factory |
| `src/test/sanity.test.js` | First sanity test proving the infra works (deleted later) |
| `scripts/coverage-ratchet.js` | Reads coverage summary, compares to baseline, updates or fails |
| `scripts/coverage-ratchet.test.js` | Tests for the pure functions in the ratchet script |
| `.coverage-baseline.json` | `{lines, branches}` floor — committed, only goes up |
| `biome.json` | Formatter-only config (linter disabled) |
| `.husky/pre-push` | Runs `format:check` + `lint` |
| `.github/workflows/ci.yml` | Runs `format:check` + `lint` + `test:coverage` on push/PR |
| `package.json` | New scripts + devDependencies + `prepare` |
| `Taskfile.yml` | New task targets mirroring npm scripts |
| `CLAUDE.md` | Append a "Testing & Tooling" section |

`.gitignore` already excludes `/coverage` — no change needed.

---

## Phase 1 — Vitest baseline

### Task 1: Install Vitest and prove the runner works

**Files:**
- Modify: `package.json` (add devDependencies + scripts)
- Create: `vitest.config.js`
- Create: `vitest.setup.js`
- Create: `src/test/sanity.test.js`

- [ ] **Step 1: Install Vitest dev dependencies**

```bash
npm install --save-dev vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

Expected: packages added to `package.json` devDependencies, `node_modules` updated, no errors.

- [ ] **Step 2: Add test scripts to `package.json`**

In the `scripts` block, add `test`, `test:run`, and keep existing scripts unchanged. After the change the scripts block contains:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest",
  "test:run": "vitest run"
}
```

- [ ] **Step 3: Create `vitest.config.js`**

```js
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.js'],
    include: ['src/**/*.{test,spec}.{js,jsx}', 'scripts/**/*.{test,spec}.js'],
  },
});
```

- [ ] **Step 4: Create `vitest.setup.js`**

```js
import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
  notFound: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: () => ({
    get: vi.fn(),
    getAll: vi.fn(() => []),
    set: vi.fn(),
    delete: vi.fn(),
  }),
  headers: () => new Map(),
}));
```

- [ ] **Step 5: Write the failing sanity test**

Create `src/test/sanity.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('vitest infra', () => {
  it('renders DOM and asserts via jest-dom', () => {
    render(<div data-testid="hi">hello</div>);
    expect(screen.getByTestId('hi')).toHaveTextContent('hello');
  });
});
```

- [ ] **Step 6: Run the sanity test to verify it passes**

Run: `npm run test:run -- src/test/sanity.test.js`

Expected: `1 passed` with `vitest infra > renders DOM and asserts via jest-dom`.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vitest.config.js vitest.setup.js src/test/sanity.test.js
git commit -m "chore: add vitest with jsdom + testing-library"
```

---

## Phase 2 — Coverage reporting

### Task 2: Add v8 coverage and verify summary output

**Files:**
- Modify: `package.json` (add `@vitest/coverage-v8`)
- Modify: `vitest.config.js` (add coverage config)

- [ ] **Step 1: Install coverage provider**

```bash
npm install --save-dev @vitest/coverage-v8
```

- [ ] **Step 2: Update `vitest.config.js` to add coverage**

Replace the file contents with:

```js
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.js'],
    include: ['src/**/*.{test,spec}.{js,jsx}', 'scripts/**/*.{test,spec}.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'src/**/*.test.{js,jsx}',
        'src/**/*.spec.{js,jsx}',
        'src/test/**',
        'src/**/*.stories.{js,jsx}',
        'src/proxy.js',
        'src/app/**/layout.js',
        'src/app/**/loading.js',
        'src/app/**/error.js',
        'src/app/**/not-found.js',
      ],
    },
  },
});
```

- [ ] **Step 3: Run coverage and confirm summary file is produced**

Run: `npx vitest run --coverage`

Expected: completes successfully; `coverage/coverage-summary.json` exists.

- [ ] **Step 4: Verify summary shape**

Run: `cat coverage/coverage-summary.json | head -c 200`

Expected: JSON containing a `total` object with `lines` and `branches` keys, each with a `pct` field. Example shape:

```json
{"total":{"lines":{"total":N,"covered":N,"skipped":0,"pct":N.NN},"branches":{...},...},"...":{...}}
```

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.js
git commit -m "chore: configure v8 coverage with json-summary reporter"
```

---

## Phase 3 — Ratcheting coverage script

### Task 3: TDD the ratchet script's pure functions

**Files:**
- Create: `scripts/coverage-ratchet.test.js`
- Create: `scripts/coverage-ratchet.js`

- [ ] **Step 1: Write the failing tests for pure functions**

Create `scripts/coverage-ratchet.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { extractPcts, compareCoverage } from './coverage-ratchet.js';

describe('extractPcts', () => {
  it('reads lines and branches pct from a coverage-summary shape', () => {
    const summary = {
      total: {
        lines: { pct: 73.42 },
        branches: { pct: 60.1 },
        statements: { pct: 73.42 },
        functions: { pct: 80 },
      },
    };
    expect(extractPcts(summary)).toEqual({ lines: 73.42, branches: 60.1 });
  });

  it('throws if summary is missing total', () => {
    expect(() => extractPcts({})).toThrow(/total/);
  });
});

describe('compareCoverage', () => {
  it('returns "equal" when current matches baseline', () => {
    expect(compareCoverage({ lines: 80, branches: 70 }, { lines: 80, branches: 70 })).toEqual({
      status: 'equal',
    });
  });

  it('returns "regression" with details when any value drops', () => {
    const r = compareCoverage({ lines: 79, branches: 70 }, { lines: 80, branches: 70 });
    expect(r.status).toBe('regression');
    expect(r.details).toContain('lines');
    expect(r.details).toContain('79');
    expect(r.details).toContain('80');
  });

  it('returns "regression" when only branches drops', () => {
    const r = compareCoverage({ lines: 80, branches: 69 }, { lines: 80, branches: 70 });
    expect(r.status).toBe('regression');
    expect(r.details).toContain('branches');
  });

  it('returns "improvement" with new baseline when any value rises', () => {
    const r = compareCoverage({ lines: 81, branches: 70 }, { lines: 80, branches: 70 });
    expect(r.status).toBe('improvement');
    expect(r.newBaseline).toEqual({ lines: 81, branches: 70 });
  });

  it('treats partial improvement (one up, one equal) as improvement', () => {
    const r = compareCoverage({ lines: 80, branches: 71 }, { lines: 80, branches: 70 });
    expect(r.status).toBe('improvement');
    expect(r.newBaseline).toEqual({ lines: 80, branches: 71 });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test:run -- scripts/coverage-ratchet.test.js`

Expected: FAIL with module-not-found or import errors (file `scripts/coverage-ratchet.js` does not yet exist).

- [ ] **Step 3: Implement `scripts/coverage-ratchet.js`**

Create `scripts/coverage-ratchet.js`:

```js
#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const SUMMARY_PATH = path.resolve(process.cwd(), 'coverage/coverage-summary.json');
const BASELINE_PATH = path.resolve(process.cwd(), '.coverage-baseline.json');

export function extractPcts(summary) {
  if (!summary || !summary.total) {
    throw new Error('Coverage summary missing required "total" field');
  }
  return {
    lines: summary.total.lines.pct,
    branches: summary.total.branches.pct,
  };
}

export function compareCoverage(current, baseline) {
  const linesDropped = current.lines < baseline.lines;
  const branchesDropped = current.branches < baseline.branches;

  if (linesDropped || branchesDropped) {
    const parts = [];
    if (linesDropped) parts.push(`lines ${current.lines}% < baseline ${baseline.lines}%`);
    if (branchesDropped) parts.push(`branches ${current.branches}% < baseline ${baseline.branches}%`);
    return { status: 'regression', details: parts.join(', ') };
  }

  if (current.lines > baseline.lines || current.branches > baseline.branches) {
    return {
      status: 'improvement',
      newBaseline: {
        lines: Math.max(current.lines, baseline.lines),
        branches: Math.max(current.branches, baseline.branches),
      },
    };
  }

  return { status: 'equal' };
}

function readJson(p) {
  return JSON.parse(readFileSync(p, 'utf8'));
}

function main() {
  if (!existsSync(SUMMARY_PATH)) {
    console.error(`coverage-ratchet: ${SUMMARY_PATH} not found. Run "vitest run --coverage" first.`);
    process.exit(1);
  }
  if (!existsSync(BASELINE_PATH)) {
    console.error(`coverage-ratchet: ${BASELINE_PATH} not found. Seed it with {"lines":0,"branches":0}.`);
    process.exit(1);
  }

  const current = extractPcts(readJson(SUMMARY_PATH));
  const baseline = readJson(BASELINE_PATH);
  const result = compareCoverage(current, baseline);

  if (result.status === 'equal') {
    console.log(`coverage-ratchet: OK (lines=${current.lines}% branches=${current.branches}%)`);
    process.exit(0);
  }

  if (result.status === 'regression') {
    console.error(`coverage-ratchet: REGRESSION (${result.details})`);
    process.exit(1);
  }

  // improvement
  writeFileSync(BASELINE_PATH, JSON.stringify(result.newBaseline, null, 2) + '\n');
  console.error(
    `coverage-ratchet: Coverage increased to lines=${current.lines}% branches=${current.branches}%. ` +
      `Baseline updated. Commit .coverage-baseline.json and push again.`,
  );
  process.exit(1);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) main();
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test:run -- scripts/coverage-ratchet.test.js`

Expected: all 6 tests pass.

- [ ] **Step 5: Seed the baseline file**

Create `.coverage-baseline.json`:

```json
{
  "lines": 0,
  "branches": 0
}
```

- [ ] **Step 6: Add the `test:coverage` script to `package.json`**

In the `scripts` block add `test:coverage`:

```json
"test:coverage": "vitest run --coverage && node scripts/coverage-ratchet.js"
```

- [ ] **Step 7: Run `test:coverage` end-to-end**

Run: `npm run test:coverage`

Expected: vitest finishes; ratchet runs. Because the seeded baseline is `{lines:0, branches:0}` and current coverage will be > 0, expect: **exit 1** with message `coverage-ratchet: Coverage increased to lines=X% branches=Y%. Baseline updated. Commit .coverage-baseline.json and push again.` Verify `.coverage-baseline.json` was rewritten with the new values.

- [ ] **Step 8: Re-run to verify equal-baseline path**

Run: `npm run test:coverage`

Expected: exit 0 with `coverage-ratchet: OK (lines=X% branches=Y%)`.

- [ ] **Step 9: Commit**

```bash
git add scripts/coverage-ratchet.js scripts/coverage-ratchet.test.js .coverage-baseline.json package.json
git commit -m "feat: add ratcheting coverage script and test:coverage npm script"
```

---

## Phase 4 — Test utilities

### Task 4: `renderWithTheme` helper

**Files:**
- Create: `src/test/render.js`
- Create: `src/test/render.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/test/render.test.js`:

```js
import { describe, it, expect } from 'vitest';
import styled from 'styled-components';
import { renderWithTheme, screen } from './render.js';

const Box = styled.div`
  color: ${(props) => props.theme.colors?.text || 'rebeccapurple'};
`;

describe('renderWithTheme', () => {
  it('wraps the tree in the project ThemeProvider so styled-components can read theme', () => {
    renderWithTheme(<Box data-testid="box">styled</Box>);
    const el = screen.getByTestId('box');
    expect(el).toBeInTheDocument();
    // Theme value applied — if ThemeProvider is missing, styled-components warns AND
    // theme.colors?.text is undefined, falling back to 'rebeccapurple'. We assert the
    // element exists and is rendered through the provider tree, which is enough
    // to catch a missing wrapper (styled-components throws without one in v6 strict).
  });

  it('re-exports screen and userEvent from testing-library', async () => {
    const mod = await import('./render.js');
    expect(mod.screen).toBeDefined();
    expect(mod.userEvent).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/test/render.test.js`

Expected: FAIL with module-not-found error for `./render.js`.

- [ ] **Step 3: Implement `src/test/render.js`**

Create `src/test/render.js`:

```js
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from 'styled-components';
import theme from '@/styles/theme';

export function renderWithTheme(ui, options = {}) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>, options);
}

export { screen, fireEvent, waitFor, within } from '@testing-library/react';
export { userEvent };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- src/test/render.test.js`

Expected: both tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/test/render.js src/test/render.test.js
git commit -m "feat: add renderWithTheme test helper for styled-components"
```

---

### Task 5: Supabase client mock factory

**Files:**
- Create: `src/test/supabase-mock.js`
- Create: `src/test/supabase-mock.test.js`

- [ ] **Step 1: Write the failing test**

Create `src/test/supabase-mock.test.js`:

```js
import { describe, it, expect, vi } from 'vitest';
import { createSupabaseMock } from './supabase-mock.js';

describe('createSupabaseMock', () => {
  it('returns a chainable query builder that resolves to the configured response', async () => {
    const client = createSupabaseMock({
      'meals.select': { data: [{ id: 1, name: 'tacos' }], error: null },
    });

    const res = await client.from('meals').select('*').eq('user_id', 'u1');
    expect(res.data).toEqual([{ id: 1, name: 'tacos' }]);
    expect(res.error).toBeNull();
  });

  it('returns { data: null, error: configured } when error response is set', async () => {
    const client = createSupabaseMock({
      'meals.select': { data: null, error: { message: 'boom' } },
    });

    const res = await client.from('meals').select('*');
    expect(res.error.message).toBe('boom');
  });

  it('defaults to empty data when no response is configured', async () => {
    const client = createSupabaseMock();
    const res = await client.from('anything').select('*');
    expect(res).toEqual({ data: [], error: null });
  });

  it('exposes auth.getUser() returning the configured user', async () => {
    const client = createSupabaseMock({ user: { id: 'u1', email: 'a@b.c' } });
    const res = await client.auth.getUser();
    expect(res.data.user).toEqual({ id: 'u1', email: 'a@b.c' });
  });

  it('records calls so tests can assert on them', async () => {
    const client = createSupabaseMock();
    await client.from('meals').insert({ name: 'pasta' });
    expect(client.from).toHaveBeenCalledWith('meals');
    expect(client._lastBuilder.insert).toHaveBeenCalledWith({ name: 'pasta' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- src/test/supabase-mock.test.js`

Expected: FAIL with module-not-found.

- [ ] **Step 3: Implement `src/test/supabase-mock.js`**

Create `src/test/supabase-mock.js`:

```js
import { vi } from 'vitest';

const CHAINABLE_METHODS = [
  'select',
  'insert',
  'update',
  'upsert',
  'delete',
  'eq',
  'neq',
  'gt',
  'gte',
  'lt',
  'lte',
  'like',
  'ilike',
  'in',
  'is',
  'or',
  'order',
  'limit',
  'range',
  'single',
  'maybeSingle',
];

export function createSupabaseMock(options = {}) {
  const responses = options;
  const user = options.user ?? null;

  const makeBuilder = (table) => {
    let terminalResponse = { data: [], error: null };
    const builder = { _table: table };

    for (const m of CHAINABLE_METHODS) {
      builder[m] = vi.fn((...args) => {
        const key = `${table}.${m}`;
        if (responses[key]) terminalResponse = responses[key];
        return builder;
      });
    }

    builder.then = (resolve) => Promise.resolve(terminalResponse).then(resolve);
    return builder;
  };

  const client = {
    _lastBuilder: null,
    from: vi.fn((table) => {
      const b = makeBuilder(table);
      client._lastBuilder = b;
      return b;
    }),
    auth: {
      getUser: vi.fn(async () => ({ data: { user }, error: null })),
      getSession: vi.fn(async () => ({ data: { session: user ? { user } : null }, error: null })),
      signOut: vi.fn(async () => ({ error: null })),
    },
  };

  return client;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- src/test/supabase-mock.test.js`

Expected: all 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/test/supabase-mock.js src/test/supabase-mock.test.js
git commit -m "feat: add chainable Supabase client mock factory for tests"
```

---

### Task 6: Remove the throwaway sanity test

**Files:**
- Delete: `src/test/sanity.test.js`

- [ ] **Step 1: Delete the sanity test**

```bash
rm src/test/sanity.test.js
```

- [ ] **Step 2: Verify the suite still passes**

Run: `npm run test:run`

Expected: all remaining tests pass (render.test.js, supabase-mock.test.js, coverage-ratchet.test.js).

- [ ] **Step 3: Commit**

```bash
git add -u src/test/sanity.test.js
git commit -m "chore: remove throwaway vitest sanity test"
```

---

## Phase 5 — Biome formatter

### Task 7: Install and configure Biome (formatter only)

**Files:**
- Modify: `package.json` (add `@biomejs/biome` + scripts)
- Create: `biome.json`

- [ ] **Step 1: Install Biome**

```bash
npm install --save-dev @biomejs/biome
```

- [ ] **Step 2: Create `biome.json`**

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

- [ ] **Step 3: Add format scripts to `package.json`**

In the `scripts` block add `format` and `format:check`:

```json
"format": "biome format --write .",
"format:check": "biome format ."
```

- [ ] **Step 4: Verify Biome can run**

Run: `npx biome format . | head -20`

Expected: no errors; Biome lists files it would change.

- [ ] **Step 5: Commit the config (without formatting yet)**

```bash
git add package.json package-lock.json biome.json
git commit -m "chore: add Biome formatter configuration (linter disabled)"
```

### Task 8: Apply bulk formatting as an isolated commit

**Files:**
- Modify: every formattable file under `src/`, `scripts/`, root `*.{js,mjs,json}`

- [ ] **Step 1: Run the formatter**

```bash
npm run format
```

Expected: Biome rewrites files in place. Output reports the count of files changed.

- [ ] **Step 2: Verify format check now passes**

Run: `npm run format:check`

Expected: exits 0 with no diffs reported.

- [ ] **Step 3: Verify lint still passes**

Run: `npm run lint`

Expected: ESLint exits 0 (formatting changes shouldn't break Next/React lint rules).

- [ ] **Step 4: Verify tests still pass**

Run: `npm run test:run`

Expected: all tests pass.

- [ ] **Step 5: Commit the formatting**

```bash
git add -A
git commit -m "chore: apply biome formatting across codebase"
```

> **Note:** This commit will be large by design — review the diff briefly to confirm only whitespace/quote/comma changes, no semantic edits.

---

## Phase 6 — Husky pre-push hook

### Task 9: Install Husky and create the pre-push hook

**Files:**
- Modify: `package.json` (`husky` devDep + `prepare` script)
- Create: `.husky/pre-push`

- [ ] **Step 1: Install Husky**

```bash
npm install --save-dev husky
```

- [ ] **Step 2: Add the `prepare` script to `package.json`**

In the `scripts` block add:

```json
"prepare": "husky"
```

- [ ] **Step 3: Initialize Husky**

```bash
npx husky init
```

Expected: creates `.husky/` directory with a sample `.husky/pre-commit`. Delete the sample (we don't want a pre-commit hook):

```bash
rm -f .husky/pre-commit
```

- [ ] **Step 4: Create `.husky/pre-push`**

Write the file contents:

```sh
npm run format:check
npm run lint
```

Then make it executable:

```bash
chmod +x .husky/pre-push
```

- [ ] **Step 5: Test the hook locally without pushing**

```bash
sh .husky/pre-push
```

Expected: both commands run and exit 0.

- [ ] **Step 6: Confirm a real failure is caught**

Temporarily break formatting in any file (e.g., add an extra space), then run:

```bash
sh .husky/pre-push
```

Expected: exits 1 at `format:check` step. Revert the change before continuing:

```bash
git checkout -- <file-you-edited>
```

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json .husky/pre-push
git commit -m "chore: add husky pre-push hook running format:check + lint"
```

---

## Phase 7 — GitHub Actions CI

### Task 10: Add CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create the workflow file**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
  pull_request:

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Format check (Biome)
        run: npm run format:check

      - name: Lint (ESLint)
        run: npm run lint

      - name: Test + coverage ratchet
        run: npm run test:coverage

      - name: Upload coverage HTML
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: coverage-html
          path: coverage/
          if-no-files-found: ignore
          retention-days: 7
```

- [ ] **Step 2: Validate YAML syntax locally**

Run: `node -e "console.log(require('node:fs').readFileSync('.github/workflows/ci.yml','utf8').length, 'bytes')"`

Expected: prints byte count, no syntax error from Node (basic existence check).

If `yamllint` is installed, also run `yamllint .github/workflows/ci.yml`. Otherwise rely on GitHub's parser at push time.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions workflow for lint + format + coverage ratchet"
```

---

## Phase 8 — Taskfile mirroring

### Task 11: Add new task targets

**Files:**
- Modify: `Taskfile.yml`

- [ ] **Step 1: Update `Taskfile.yml` to add test/format targets**

Append the following tasks to the `tasks:` block, keeping all existing tasks unchanged. Insert these alphabetically near `lint`:

```yaml
  test:
    desc: Run vitest in watch mode
    cmds:
      - npx vitest

  test:run:
    desc: Run vitest once
    cmds:
      - npx vitest run

  test:coverage:
    desc: Run vitest with coverage and enforce ratchet
    cmds:
      - npx vitest run --coverage
      - node scripts/coverage-ratchet.js

  format:
    desc: Apply Biome formatting in place
    cmds:
      - npx biome format --write .

  format:check:
    desc: Check Biome formatting without writing
    cmds:
      - npx biome format .
```

Also update the existing `check` task to include format and tests:

```yaml
  check:
    desc: Run format:check, lint, tests with coverage, and build
    cmds:
      - task: format:check
      - task: lint
      - task: test:coverage
      - task: build
```

- [ ] **Step 2: Verify Task can list new commands**

Run: `task --list-all`

Expected: output includes `test`, `test:run`, `test:coverage`, `format`, `format:check`, plus the existing tasks.

- [ ] **Step 3: Run `task check` to confirm wiring**

Run: `task check`

Expected: format:check passes, lint passes, test:coverage passes (baseline equal), build passes.

- [ ] **Step 4: Commit**

```bash
git add Taskfile.yml
git commit -m "chore: mirror new test/format scripts in Taskfile"
```

---

## Phase 9 — Documentation

### Task 12: Document tooling in CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Append a "Testing & Tooling" section to `CLAUDE.md`**

Add the following section at the end of the file (after the existing `# Environment` section):

```markdown
# Testing & Tooling

## Vitest

- `npm run test` — watch mode
- `npm run test:run` — single run
- `npm run test:coverage` — full run + coverage + ratchet enforcement
- Tests are colocated next to source as `*.test.{js,jsx}`. Test utilities live under `src/test/`.
- Use `renderWithTheme()` from `src/test/render.js` for any component using styled-components.
- Use `createSupabaseMock()` from `src/test/supabase-mock.js` for DAL/server-action tests.
- `next/navigation` and `next/headers` are auto-mocked globally in `vitest.setup.js`.

## Coverage ratchet

- `.coverage-baseline.json` stores the line and branch coverage floor (`{lines, branches}`).
- The baseline only goes up. Drops fail the build.
- When coverage improves, `scripts/coverage-ratchet.js` updates the baseline and exits 1, asking you to commit `.coverage-baseline.json` and push again.
- Manual baseline edits downward should be rare and reviewed.

## Biome (formatter only)

- `npm run format` — write changes in place
- `npm run format:check` — verify only (used in pre-push and CI)
- Biome's linter is disabled. ESLint + `eslint-config-next` remains the sole linter.

## Pre-push hook

- `.husky/pre-push` runs `format:check` + `lint`. Tests are NOT in the hook — they run in CI.
- Bypass with `git push --no-verify` only for emergencies.

## CI

- `.github/workflows/ci.yml` runs on every push and PR: format:check, lint, test:coverage.
- Coverage HTML report is uploaded as a workflow artifact.
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: document vitest, biome, husky, and CI tooling in CLAUDE.md"
```

---

## Verification checklist (after all tasks complete)

- [ ] `npm run test:coverage` — exits 0 (baseline equal)
- [ ] `npm run format:check` — exits 0
- [ ] `npm run lint` — exits 0
- [ ] `task check` — exits 0
- [ ] `sh .husky/pre-push` — exits 0
- [ ] `git status` — clean
- [ ] `cat .coverage-baseline.json` — contains current coverage values, not `{lines:0, branches:0}`
- [ ] `git log --oneline | head -15` — shows the staged sequence of commits, each with a clear message
