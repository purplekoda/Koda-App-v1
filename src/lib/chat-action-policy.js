import 'server-only'

/**
 * Server-only policy that decides whether a chat tool call executes immediately
 * or is held pending user confirmation. The Gemini model's own `confirmed`
 * flag is ignored — authorization is never delegated to the model.
 */

export const SMALL_ACTIONS = Object.freeze(new Set([
  'set_meal',
  'swap_meal',
  'clear_slot',
  'add_to_grocery',
  'update_pantry',
  'mark_staple_out_of_stock',
]))

export const BIG_ACTIONS = Object.freeze(new Set([
  'fill_meal_plan',
  'add_recipe',
  'log_receipt',
]))

export const READ_TOOLS = Object.freeze(new Set([
  'get_week_plan',
  'get_pantry',
]))

export const SMALL_GROCERY_CAP = 15

/**
 * @param {string} type
 * @param {object} args
 * @param {{ importedContent?: boolean }} ctx
 * @returns {'small'|'big'}
 */
export function classifyAction(type, args, ctx = {}) {
  if (ctx.importedContent) return 'big'
  if (BIG_ACTIONS.has(type)) return 'big'

  if (type === 'clear_slot' && Array.isArray(args?.slots) && args.slots.length > 1) {
    return 'big'
  }

  if (type === 'add_to_grocery' && Array.isArray(args?.items) && args.items.length > SMALL_GROCERY_CAP) {
    return 'big'
  }

  if (SMALL_ACTIONS.has(type)) return 'small'
  return 'big'
}
