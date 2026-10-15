import 'server-only'

import { isMockMode } from '@/lib/dal/require-user'

export const WRITE_ACTION_TYPES = Object.freeze([
  'fill_meal_plan',
  'swap_meal',
  'add_recipe',
  'log_receipt',
  'add_to_grocery',
  'update_pantry',
  'mark_staple_out_of_stock',
])

const WRITE_ACTION_SET = new Set(WRITE_ACTION_TYPES)

export const CHAT_ACTION_UNKNOWN = 'CHAT_ACTION_UNKNOWN'
export const CHAT_ACTION_FORBIDDEN = 'CHAT_ACTION_FORBIDDEN'

const FORBIDDEN_MESSAGE =
  'Only the account owner can make changes through chat. Household members can view the plan, but can’t edit it yet.'
const UNKNOWN_MESSAGE = 'That action isn’t available through chat.'

/**
 * Resolve the household role for a user.
 *
 * Sole-login product: when the `household_role` column is missing, null, or
 * any value other than the literal string `member`, the user is treated as
 * `owner`. Only an explicit `member` value downgrades access. Real DB errors
 * (not a missing-column error) are logged and also default to `owner` so we
 * don't lock the only user out.
 *
 * Exported so the prompt builder can share the same resolution logic.
 */
export async function getHouseholdRole(userId) {
  if (isMockMode()) return 'owner'
  if (!userId) return 'owner'

  try {
    const { getSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = await getSupabaseServerClient()

    const { data, error } = await supabase
      .from('profiles')
      .select('household_role')
      .eq('id', userId)
      .single()

    if (error) {
      // Column doesn't exist in schema yet — treat as sole owner.
      const code = error.code || ''
      const msg = (error.message || '').toLowerCase()
      const missingColumn =
        code === '42703' ||
        msg.includes('household_role') && msg.includes('does not exist')
      const noRow = code === 'PGRST116'
      if (!missingColumn && !noRow) {
        console.error('[getHouseholdRole] profile lookup failed:', error.message)
      }
      return 'owner'
    }

    return data?.household_role === 'member' ? 'member' : 'owner'
  } catch (err) {
    console.error('[getHouseholdRole] unexpected error:', err)
    return 'owner'
  }
}

/**
 * Gate every chat write on the server. Never consult the Gemini `confirmed`
 * flag — the model is not an authorization source.
 *
 * Throws an Error with `.code` set to CHAT_ACTION_UNKNOWN for unrecognised
 * types, or CHAT_ACTION_FORBIDDEN when the user is an explicit household
 * member.
 */
export async function assertCanExecuteChatAction(userId, actionType) {
  if (!actionType || !WRITE_ACTION_SET.has(actionType)) {
    const err = new Error(UNKNOWN_MESSAGE)
    err.code = CHAT_ACTION_UNKNOWN
    throw err
  }

  const role = await getHouseholdRole(userId)
  if (role === 'member') {
    const err = new Error(FORBIDDEN_MESSAGE)
    err.code = CHAT_ACTION_FORBIDDEN
    throw err
  }
}
