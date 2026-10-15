import { describe, it, expect, vi } from 'vitest'

vi.mock('./require-user', () => ({ isMockMode: () => true }))
vi.mock('./mock-store', () => ({
  getMockMeals: vi.fn(async () => []),
  getMockTodayMeals: vi.fn(async () => []),
  getMockSwapSuggestions: vi.fn(async () => []),
  getMockRecipes: vi.fn(async () => []),
}))
vi.mock('@/lib/storage', () => ({ enrichRecipesWithSignedUrls: async (x) => x }))

const { getLocalDayOfWeek, getWeekMonday } = await import('./meals')

describe('getLocalDayOfWeek', () => {
  it('(8) 02:27 UTC on Thursday is still Wednesday in America/Denver', () => {
    const t = new Date('2026-10-15T02:27:00Z') // Thu 02:27 UTC = Wed 20:27 MT
    expect(getLocalDayOfWeek('America/Denver', t)).toBe(3) // Wed
  })

  it('rolls back correctly: 03:00 UTC Thu in Denver is still Wed', () => {
    expect(getLocalDayOfWeek('America/Denver', new Date('2026-10-15T03:00:00Z'))).toBe(3)
  })

  it('UTC Monday noon is Monday in UTC', () => {
    expect(getLocalDayOfWeek('UTC', new Date('2026-10-12T12:00:00Z'))).toBe(1)
  })
})

describe('getWeekMonday', () => {
  it('returns Monday ISO date for the current local week', () => {
    const iso = getWeekMonday(0, 'America/Denver')
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
