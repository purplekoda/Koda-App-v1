// Vitest alias target for `import 'server-only'` — the real module throws
// when imported by client code, but tests run in node and need a no-op.
export {};
