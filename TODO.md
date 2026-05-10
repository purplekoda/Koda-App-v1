# Lint debt

Tracked for cleanup. These rules are currently set to `warn` in `eslint.config.mjs` so the pre-push hook and CI gate can pass. Re-promote to `error` once each is at zero warnings.

## React 19 / React Compiler rules (introduced by `eslint-config-next` 16)

- `react-hooks/set-state-in-effect` — 4 occurrences. `setState` is being called inside a `useEffect` synchronously, which can cascade renders. Refactor to derived state, event handlers, or `useEffect` cleanup as appropriate.
- `react-hooks/preserve-manual-memoization` — 1 occurrence in `src/components/pantry/StaplesSection.js` around line 743. The React Compiler can't preserve a `useMemo`/`useCallback`. Likely needs simplifying the dependency array or hoisting the inner function.
- `react-hooks/immutability` — 1 occurrence in `src/components/recipes/RecipeForm.js` around line 2511 (`onAssigned` value is being mutated where the rule expects immutability).

## Pre-React-19 rule

- `react/no-unescaped-entities` — 9 occurrences across various JSX text nodes (mostly `'` apostrophes). Replace with `&apos;` / `&#39;` or wrap in `{'…'}`.

## When to act

These do not block any current development. Address opportunistically; once a category is at zero, re-promote that rule to `error` in `eslint.config.mjs`.
