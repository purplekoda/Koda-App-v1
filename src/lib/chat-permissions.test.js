import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  isMockMode: vi.fn(() => false),
  getSupabaseServerClient: vi.fn(),
}))

vi.mock('@/lib/dal/require-user', () => ({
  isMockMode: mocks.isMockMode,
}))

vi.mock('@/lib/supabase/server', () => ({
  getSupabaseServerClient: mocks.getSupabaseServerClient,
}))

function makeClient({ data = null, error = null } = {}) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data, error }),
        }),
      }),
    }),
  }
}

describe('chat-permissions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.isMockMode.mockReturnValue(false)
  })

  describe('assertCanExecuteChatAction', () => {
    it('allows owner on known write action', async () => {
      mocks.getSupabaseServerClient.mockResolvedValue(
        makeClient({ data: { household_role: 'owner' } })
      )
      const { assertCanExecuteChatAction } = await import('./chat-permissions')
      await expect(
        assertCanExecuteChatAction('user-1', 'fill_meal_plan')
      ).resolves.toBeUndefined()
    })

    it('denies explicit household member', async () => {
      mocks.getSupabaseServerClient.mockResolvedValue(
        makeClient({ data: { household_role: 'member' } })
      )
      const { assertCanExecuteChatAction, CHAT_ACTION_FORBIDDEN } = await import(
        './chat-permissions'
      )
      await expect(
        assertCanExecuteChatAction('user-1', 'swap_meal')
      ).rejects.toMatchObject({ code: CHAT_ACTION_FORBIDDEN })
    })

    it('throws CHAT_ACTION_UNKNOWN for unrecognized action type', async () => {
      const { assertCanExecuteChatAction, CHAT_ACTION_UNKNOWN } = await import(
        './chat-permissions'
      )
      await expect(
        assertCanExecuteChatAction('user-1', 'delete_everything')
      ).rejects.toMatchObject({ code: CHAT_ACTION_UNKNOWN })
    })

    it('treats missing household_role column as owner (sole-login)', async () => {
      mocks.getSupabaseServerClient.mockResolvedValue(
        makeClient({
          data: null,
          error: { code: '42703', message: 'column "household_role" does not exist' },
        })
      )
      const { assertCanExecuteChatAction } = await import('./chat-permissions')
      await expect(
        assertCanExecuteChatAction('user-1', 'add_recipe')
      ).resolves.toBeUndefined()
    })

    it('mock mode allows owner', async () => {
      mocks.isMockMode.mockReturnValue(true)
      const { assertCanExecuteChatAction } = await import('./chat-permissions')
      await expect(
        assertCanExecuteChatAction('mock-user', 'update_pantry')
      ).resolves.toBeUndefined()
    })
  })
})
