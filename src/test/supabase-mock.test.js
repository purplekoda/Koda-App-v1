import { describe, it, expect } from 'vitest';
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
