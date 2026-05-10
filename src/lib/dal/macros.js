import 'server-only';

import { isMockMode } from '@/lib/dal/require-user';

export async function getMacroMembers(userId) {
  if (isMockMode()) {
    const { mockMacroMembers } = await import('@/data/mock-macros');
    return JSON.parse(JSON.stringify(mockMacroMembers));
  }

  // TODO: Supabase query — join household_members with macro targets/actuals
  return [];
}

/**
 * Returns the current day index (0=Mon, 6=Sun) for highlighting.
 */
export function getTodayIndex() {
  const jsDay = new Date().getDay(); // 0=Sun, 1=Mon...
  return jsDay === 0 ? 6 : jsDay - 1;
}

// ── Macro Extras ──────────────────────────────────────

/**
 * Get all extras for a member on a specific date.
 */
export async function getMacroExtras(userId, memberId, date) {
  if (isMockMode()) {
    const { getMockMacroExtras } = await import('@/lib/dal/mock-store');
    const all = await getMockMacroExtras();
    return all.filter((e) => e.member_id === memberId && e.logged_date === date);
  }

  // TODO: Supabase query
  return [];
}

/**
 * Get all extras for a member in a week (Mon-Sun).
 * @param {string} weekStart — ISO date string for Monday
 */
export async function getMacroExtrasForWeek(userId, memberId, weekStart) {
  if (isMockMode()) {
    const { getMockMacroExtras } = await import('@/lib/dal/mock-store');
    const all = await getMockMacroExtras();
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return all.filter((e) => {
      if (e.member_id !== memberId) return false;
      const d = new Date(e.logged_date);
      return d >= start && d < end;
    });
  }

  // TODO: Supabase query with date range
  return [];
}

/**
 * Get all extras for a member in a month.
 */
export async function getMacroExtrasForMonth(userId, memberId, year, month) {
  if (isMockMode()) {
    const { getMockMacroExtras } = await import('@/lib/dal/mock-store');
    const all = await getMockMacroExtras();
    return all.filter((e) => {
      if (e.member_id !== memberId) return false;
      const d = new Date(e.logged_date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }

  // TODO: Supabase query
  return [];
}

/**
 * Sum extras macros for a member on a date.
 */
export async function getMacroExtrasTotal(userId, memberId, date) {
  const extras = await getMacroExtras(userId, memberId, date);
  const total = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  for (const e of extras) {
    total.calories += e.calories || 0;
    total.protein += e.protein || 0;
    total.carbs += e.carbs || 0;
    total.fat += e.fat || 0;
  }
  return { extras, total };
}

/**
 * Add a new macro extra entry.
 */
export async function addMacroExtra(userId, data) {
  if (isMockMode()) {
    const { addMockMacroExtra } = await import('@/lib/dal/mock-store');
    return addMockMacroExtra({
      ...data,
      user_id: userId,
      logged_date: data.logged_date || new Date().toISOString().slice(0, 10),
    });
  }

  // TODO: Supabase insert
  return null;
}

/**
 * Update an existing macro extra (only if not locked).
 */
export async function updateMacroExtra(userId, extraId, updates) {
  if (isMockMode()) {
    const { updateMockMacroExtra } = await import('@/lib/dal/mock-store');
    return updateMockMacroExtra(extraId, updates);
  }

  // TODO: Supabase update with is_locked check
  return null;
}
