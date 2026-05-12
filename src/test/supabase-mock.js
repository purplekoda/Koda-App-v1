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
      builder[m] = vi.fn(() => {
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
      getSession: vi.fn(async () => ({
        data: { session: user ? { user } : null },
        error: null,
      })),
      signOut: vi.fn(async () => ({ error: null })),
    },
  };

  return client;
}
