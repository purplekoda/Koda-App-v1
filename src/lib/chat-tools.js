import 'server-only'

import { Type } from '@google/genai'
import { sanitizeString } from '@/lib/sanitize'
import { isMockMode } from '@/lib/dal/require-user'
import { SMALL_GROCERY_CAP } from '@/lib/chat-action-policy'

const DAY_ENUM = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_TO_INT = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }
const MEAL_TYPE_ENUM = [
  'breakfast', 'lunch', 'dinner',
  'sides', 'sides2', 'sides3', 'sides4',
  'breakfast_side', 'lunch_side', 'dinner_dessert',
]

// ── Tool declarations ──────────────────────────────────────────────────────

export const CHAT_TOOL_DECLARATIONS = [
  // Reads
  { name: 'get_week_plan', description: 'Return the user’s current week meal plan (days + filled slots).', parameters: { type: Type.OBJECT, properties: {} } },
  { name: 'get_pantry', description: 'Return the user’s current pantry items (non-depleted).', parameters: { type: Type.OBJECT, properties: {} } },

  // Small writes
  {
    name: 'set_meal',
    description: 'Set the meal in a single empty or filled slot. Use swap_meal when replacing a filled slot.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        day: { type: Type.STRING, enum: DAY_ENUM },
        meal_type: { type: Type.STRING, enum: MEAL_TYPE_ENUM },
        meal_name: { type: Type.STRING },
      },
      required: ['day', 'meal_type', 'meal_name'],
    },
  },
  {
    name: 'swap_meal',
    description: 'Replace the meal in a single filled slot.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        day: { type: Type.STRING, enum: DAY_ENUM },
        meal_type: { type: Type.STRING, enum: MEAL_TYPE_ENUM },
        new_meal_name: { type: Type.STRING },
      },
      required: ['day', 'meal_type', 'new_meal_name'],
    },
  },
  {
    name: 'clear_slot',
    description: 'Clear one or more meal slots. Clearing more than one slot is a big action.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        slots: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              day: { type: Type.STRING, enum: DAY_ENUM },
              meal_type: { type: Type.STRING, enum: MEAL_TYPE_ENUM },
            },
            required: ['day', 'meal_type'],
          },
        },
      },
      required: ['slots'],
    },
  },
  {
    name: 'add_to_grocery',
    description: 'Add one or more items to the current grocery list.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              quantity: { type: Type.STRING },
              category: { type: Type.STRING },
            },
            required: ['name'],
          },
        },
      },
      required: ['items'],
    },
  },
  {
    name: 'update_pantry',
    description: 'Mark a pantry item or staple as in or out of stock.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        item_name: { type: Type.STRING },
        is_out_of_stock: { type: Type.BOOLEAN },
      },
      required: ['item_name', 'is_out_of_stock'],
    },
  },

  // Big-only (always pending)
  {
    name: 'fill_meal_plan',
    description: 'Fill the full week with a set of meal_plan slots. Always confirmed by the user before executing.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        slots: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              day_of_week: { type: Type.INTEGER, description: '1=Mon..7=Sun' },
              meal_type: { type: Type.STRING, enum: MEAL_TYPE_ENUM },
              meal_name: { type: Type.STRING },
            },
            required: ['day_of_week', 'meal_type', 'meal_name'],
          },
        },
      },
      required: ['slots'],
    },
  },
  {
    name: 'add_recipe',
    description: 'Save a new recipe to the Recipe Box. Always confirmed before executing.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        description: { type: Type.STRING },
        ingredients: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, quantity: { type: Type.STRING } }, required: ['name'] } },
        instructions: { type: Type.STRING },
        prep_time_minutes: { type: Type.INTEGER },
        cook_time_minutes: { type: Type.INTEGER },
        servings: { type: Type.INTEGER },
        tags: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['name', 'ingredients'],
    },
  },
  {
    name: 'log_receipt',
    description: 'Log a manual receipt entry. Always confirmed before executing.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        store_name: { type: Type.STRING },
        total_amount: { type: Type.NUMBER },
        date: { type: Type.STRING, description: 'YYYY-MM-DD' },
        items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { item_name: { type: Type.STRING }, total_price: { type: Type.NUMBER } },
            required: ['item_name'],
          },
        },
      },
      required: ['store_name', 'total_amount'],
    },
  },
]

// ── Argument validation ────────────────────────────────────────────────────

export class ToolArgError extends Error {
  constructor(message) { super(message); this.code = 'TOOL_ARG_ERROR' }
}

function requireEnum(value, allowed, label) {
  if (!allowed.includes(value)) throw new ToolArgError(`${label} must be one of ${allowed.join(', ')}`)
  return value
}

function requireName(value, label, max = 200) {
  const cleaned = sanitizeString(value, max)
  if (!cleaned) throw new ToolArgError(`${label} is required`)
  return cleaned
}

/**
 * Validate and normalize args for a tool call. Throws ToolArgError on bad input.
 * The returned object is what the executor should use — never trust the raw
 * model-supplied args downstream.
 */
export function validateToolArgs(name, rawArgs) {
  const args = rawArgs && typeof rawArgs === 'object' ? rawArgs : {}
  switch (name) {
    case 'get_week_plan':
    case 'get_pantry':
      return {}

    case 'set_meal':
    case 'swap_meal': {
      const day = requireEnum(args.day, DAY_ENUM, 'day')
      const meal_type = requireEnum(args.meal_type, MEAL_TYPE_ENUM, 'meal_type')
      const nameField = name === 'set_meal' ? 'meal_name' : 'new_meal_name'
      const meal_name = requireName(args[nameField], nameField)
      return { day, meal_type, [nameField]: meal_name }
    }

    case 'clear_slot': {
      if (!Array.isArray(args.slots) || args.slots.length === 0) {
        throw new ToolArgError('slots must be a non-empty array')
      }
      if (args.slots.length > 21) throw new ToolArgError('too many slots')
      const slots = args.slots.map(s => ({
        day: requireEnum(s?.day, DAY_ENUM, 'day'),
        meal_type: requireEnum(s?.meal_type, MEAL_TYPE_ENUM, 'meal_type'),
      }))
      return { slots }
    }

    case 'add_to_grocery': {
      if (!Array.isArray(args.items) || args.items.length === 0) {
        throw new ToolArgError('items must be a non-empty array')
      }
      if (args.items.length > 100) throw new ToolArgError('too many grocery items')
      const items = args.items.map(it => ({
        name: requireName(it?.name, 'item name'),
        quantity: sanitizeString(it?.quantity, 32) || '1',
        category: sanitizeString(it?.category, 64) || 'Other',
      }))
      return { items }
    }

    case 'update_pantry':
    case 'mark_staple_out_of_stock': {
      const item_name = requireName(args.item_name, 'item_name')
      const is_out_of_stock = Boolean(args.is_out_of_stock ?? true)
      return { item_name, is_out_of_stock }
    }

    case 'fill_meal_plan': {
      if (!Array.isArray(args.slots) || args.slots.length === 0) {
        throw new ToolArgError('slots must be a non-empty array')
      }
      if (args.slots.length > 70) throw new ToolArgError('too many slots')
      const slots = args.slots.map(s => {
        const dow = Number(s?.day_of_week)
        if (!(dow >= 1 && dow <= 7)) throw new ToolArgError('day_of_week must be 1..7')
        return {
          day_of_week: dow,
          meal_type: requireEnum(s?.meal_type, MEAL_TYPE_ENUM, 'meal_type'),
          meal_name: requireName(s?.meal_name, 'meal_name'),
        }
      })
      return { slots }
    }

    case 'add_recipe': {
      const recipe = {
        name: requireName(args.name, 'recipe name'),
        description: sanitizeString(args.description, 500) || null,
        instructions: typeof args.instructions === 'string' ? args.instructions : null,
        ingredients: Array.isArray(args.ingredients) ? args.ingredients.slice(0, 100) : [],
        tags: Array.isArray(args.tags) ? args.tags.slice(0, 20) : [],
        prep_time_minutes: Number(args.prep_time_minutes) || null,
        cook_time_minutes: Number(args.cook_time_minutes) || null,
        servings: Number(args.servings) || null,
      }
      if (recipe.ingredients.length === 0) throw new ToolArgError('ingredients required')
      return { recipe }
    }

    case 'log_receipt': {
      const receipt = {
        store_name: requireName(args.store_name, 'store_name', 100),
        total_amount: Number(args.total_amount) || 0,
        date: sanitizeString(args.date, 20) || null,
        items: Array.isArray(args.items) ? args.items.slice(0, 200) : [],
      }
      return { receipt }
    }

    default:
      throw new ToolArgError(`unknown tool ${name}`)
  }
}

// ── Slot tracking / pending-merge helpers ──────────────────────────────────

/**
 * Return a canonical list of "day:meal_type" keys for the slots this call
 * touches. Non-slot tools return []. Used to detect cross-step slot writes
 * so the second one is promoted to pending instead of executing.
 */
export function getTouchedSlots(name, args) {
  if (name === 'set_meal' || name === 'swap_meal') {
    if (args?.day && args?.meal_type) return [`${args.day}:${args.meal_type}`]
    return []
  }
  if (name === 'clear_slot') {
    return (args?.slots || []).map(s => `${s.day}:${s.meal_type}`)
  }
  return []
}

export const MERGEABLE_PENDING = Object.freeze(new Set([
  'clear_slot', 'add_to_grocery', 'fill_meal_plan',
]))

/**
 * Merge two argument objects for a mergeable pending tool. For clear_slot the
 * slot list is de-duplicated by (day, meal_type).
 */
export function mergePendingArgs(name, existing, incoming) {
  if (name === 'clear_slot') {
    const seen = new Set()
    const slots = [...(existing?.slots || []), ...(incoming?.slots || [])].filter(s => {
      const k = `${s.day}:${s.meal_type}`
      if (seen.has(k)) return false
      seen.add(k); return true
    })
    return { slots }
  }
  if (name === 'add_to_grocery') {
    return { items: [...(existing?.items || []), ...(incoming?.items || [])] }
  }
  if (name === 'fill_meal_plan') {
    return { slots: [...(existing?.slots || []), ...(incoming?.slots || [])] }
  }
  return incoming
}

// ── Snapshots for undo (small writes only) ─────────────────────────────────

export async function snapshotBefore(userId, name, args) {
  switch (name) {
    case 'set_meal':
    case 'swap_meal': {
      const slot = await readSlot(userId, args.day, args.meal_type)
      return { slot }
    }
    case 'clear_slot': {
      const slots = []
      for (const s of args.slots) slots.push({ ...s, slot: await readSlot(userId, s.day, s.meal_type) })
      return { slots }
    }
    case 'update_pantry':
    case 'mark_staple_out_of_stock': {
      return { item_name: args.item_name }
    }
    case 'add_to_grocery':
      return {}
    default:
      return {}
  }
}

async function readSlot(userId, day, mealType) {
  if (isMockMode()) {
    const { getMockMeals } = await import('@/lib/dal/mock-store')
    const meals = await getMockMeals()
    const d = meals.find(x => x.day === day)
    const m = d?.meals?.find(x => x.type === mealType)
    return m ? { name: m.name || null, recipeId: m.recipeId || null } : null
  }
  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const { getOrCreateMealPlan } = await import('@/lib/dal/meals')
  const supabase = await getSupabaseServerClient()
  const planId = await getOrCreateMealPlan(userId, supabase, 0)
  const dayInt = DAY_TO_INT[day]
  const { data } = await supabase
    .from('meal_slots')
    .select('custom_meal_name, recipe_id')
    .eq('meal_plan_id', planId)
    .eq('user_id', userId)
    .eq('day_of_week', dayInt)
    .eq('meal_type', mealType)
    .maybeSingle()
  if (!data) return null
  return { name: data.custom_meal_name, recipeId: data.recipe_id }
}

// ── Readers ────────────────────────────────────────────────────────────────

export async function runReadTool(userId, name) {
  if (name === 'get_week_plan') {
    const { getWeeklyMeals } = await import('@/lib/dal/meals')
    const week = await getWeeklyMeals(userId, 0)
    return (week || []).map(d => ({
      day: d.day,
      meals: (d.meals || [])
        .filter(m => m.name)
        .map(m => ({ type: m.type, name: m.name })),
    }))
  }
  if (name === 'get_pantry') {
    const { getManagedPantryItems } = await import('@/lib/dal/pantry-management')
    const items = await getManagedPantryItems(userId)
    return (items || []).map(i => ({
      name: i.ingredient_name,
      category: i.category || null,
      expiry_date: i.expiry_date || null,
    }))
  }
  throw new ToolArgError(`unknown read tool ${name}`)
}

// ── Write dispatcher (small executions only) ───────────────────────────────

export async function executeWriteTool(userId, name, args) {
  const {
    swapMeal,
    clearMealSlots,
    addToGroceryList,
    updatePantryFromChat,
  } = await import('@/lib/actions/chat-actions')

  switch (name) {
    case 'set_meal':
      return swapMeal(userId, args.day, args.meal_type, args.meal_name)
    case 'swap_meal':
      return swapMeal(userId, args.day, args.meal_type, args.new_meal_name)
    case 'clear_slot':
      return clearMealSlots(userId, args.slots)
    case 'add_to_grocery':
      return addToGroceryList(userId, args.items)
    case 'update_pantry':
    case 'mark_staple_out_of_stock':
      return updatePantryFromChat(userId, args.item_name, args.is_out_of_stock)
    default:
      throw new ToolArgError(`unknown write tool ${name}`)
  }
}

export async function executeBigAction(userId, name, args) {
  const { fillMealPlan, addRecipeFromChat, logReceiptFromChat } = await import('@/lib/actions/chat-actions')
  switch (name) {
    case 'fill_meal_plan':
      return fillMealPlan(userId, args.slots)
    case 'add_recipe':
      return addRecipeFromChat(userId, args.recipe)
    case 'log_receipt':
      return logReceiptFromChat(userId, args.receipt)
    default:
      return executeWriteTool(userId, name, args)
  }
}

// ── Pending-action storage ─────────────────────────────────────────────────
// Mock mode uses an in-memory map keyed by id so tests can exercise the full
// claim lifecycle without a database.

const MOCK_PENDING = new Map()
const MOCK_TTL_MS = 5 * 60_000

function makeId() {
  return `pa_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`
}

function summarizePending(name, args) {
  switch (name) {
    case 'fill_meal_plan':
      return `Save a full-week plan with ${args.slots.length} meal${args.slots.length === 1 ? '' : 's'}.`
    case 'add_recipe':
      return `Save recipe “${args.recipe.name}” to your Recipe Box.`
    case 'log_receipt':
      return `Log a receipt from ${args.receipt.store_name} ($${args.receipt.total_amount || 0}).`
    case 'clear_slot':
      return `Clear ${args.slots.length} meal slots.`
    case 'add_to_grocery':
      return `Add ${args.items.length} items to your grocery list.`
    default:
      return `Confirm ${name}.`
  }
}

export async function createPendingAction(userId, name, args, { importedContent = false } = {}) {
  const summary = summarizePending(name, args)
  if (isMockMode()) {
    // Supersede older open pending rows of the same user + action_type so only
    // the newest can be claimed.
    for (const row of MOCK_PENDING.values()) {
      if (row.user_id === userId && row.action_type === name && !row.used_at && !row.cancelled) {
        row.cancelled = true
        row.used_at = new Date().toISOString()
      }
    }
    const id = makeId()
    const now = Date.now()
    const row = {
      id, user_id: userId, action_type: name, payload: args, summary,
      imported_content: !!importedContent,
      created_at: new Date(now).toISOString(),
      expires_at: new Date(now + MOCK_TTL_MS).toISOString(),
      used_at: null, cancelled: false,
    }
    MOCK_PENDING.set(id, row)
    return { id, type: name, summary, expires_at: row.expires_at, card: buildPendingCard(id, name, args) }
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  // Supersede older open pending rows of the same user+type before inserting.
  const { error: supersedeErr } = await supabase.rpc('supersede_chat_pending_actions', { p_action_type: name })
  if (supersedeErr) {
    console.error('[createPendingAction] supersede failed:', supersedeErr.message)
  }
  const { data, error } = await supabase
    .from('chat_pending_actions')
    .insert({
      user_id: userId,
      action_type: name,
      payload: args,
      summary,
      imported_content: !!importedContent,
    })
    .select('id, summary, expires_at')
    .single()
  if (error) throw new Error('Failed to create pending action: ' + error.message)
  return { id: data.id, type: name, summary: data.summary, expires_at: data.expires_at, card: buildPendingCard(data.id, name, args) }
}

/**
 * Atomically claim a pending action for the current user. Returns the row or
 * null if it is already used, expired, cancelled, or not owned by this user.
 */
export async function claimPendingAction(userId, pendingId) {
  if (isMockMode()) {
    const row = MOCK_PENDING.get(pendingId)
    if (!row) return null
    if (row.user_id !== userId) return null
    if (row.used_at || row.cancelled) return null
    if (new Date(row.expires_at).getTime() <= Date.now()) return null
    row.used_at = new Date().toISOString()
    return { ...row }
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase.rpc('claim_chat_pending_action', { pending_id: pendingId })
  if (error) {
    console.error('[claimPendingAction] rpc error:', error.message)
    return null
  }
  const row = Array.isArray(data) ? data[0] : data
  // A composite-returning plpgsql function can return a row with every column
  // null when no row matched. Treat that (and mismatched owner) as "no claim".
  if (!row?.id || row.user_id !== userId) return null
  if (!row.action_type) return null
  return row
}

/**
 * Cancel a pending action by id. In prod this calls the SECURITY DEFINER
 * cancel_chat_pending_action RPC; chat_pending_actions has no UPDATE policy.
 */
export async function cancelPendingAction(userId, pendingId) {
  if (isMockMode()) {
    const row = MOCK_PENDING.get(pendingId)
    if (!row || row.user_id !== userId) return false
    if (row.used_at || row.cancelled) return true
    row.cancelled = true
    row.used_at = new Date().toISOString()
    return true
  }
  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase.rpc('cancel_chat_pending_action', { p_pending_id: pendingId })
  if (error) {
    console.error('[cancelPendingAction] rpc error:', error.message)
    return false
  }
  return !!data
}

// Test-only helper: reset the mock pending map between tests.
export function _resetMockPendingForTests() {
  MOCK_PENDING.clear()
}

// ── Pending card builder ───────────────────────────────────────────────────

const DAY_ABBR = { 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 7: 'Sun' }
const DAY_FULL = {
  Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday',
  Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday',
}

/**
 * Build the client-rendered card payload for a pending action. For
 * fill_meal_plan this is the one-tap week card. For other pending types the
 * card is omitted and the client falls back to the summary text.
 */
export function buildPendingCard(pendingId, name, args) {
  if (name !== 'fill_meal_plan') return null
  const slots = Array.isArray(args?.slots) ? args.slots : []
  if (!slots.length) return null

  const allDinner = slots.every(s => s.meal_type === 'dinner')
  const sorted = [...slots].sort((a, b) => {
    if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week
    return String(a.meal_type).localeCompare(String(b.meal_type))
  })
  const rows = sorted.map(s => {
    const day = DAY_ABBR[s.day_of_week] || `Day ${s.day_of_week}`
    return allDinner
      ? { day, meal: s.meal_name }
      : { day, mealType: s.meal_type, meal: s.meal_name }
  })

  return {
    type: 'pending_week',
    pendingId,
    title: allDinner ? 'Your week of dinners' : 'Your week of meals',
    rows,
  }
}

// ── Undo (small-write snapshots) ───────────────────────────────────────────
// Mock-mode storage. In prod the RPCs own this state.

const MOCK_UNDO = new Map()
const MOCK_UNDO_TTL_MS = 30_000

function makeUndoId() {
  return `uu_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`
}

async function readSlotRef(userId, meal_plan_id, day_of_week, meal_type) {
  if (isMockMode()) {
    const { getMockMeals } = await import('@/lib/dal/mock-store')
    const meals = await getMockMeals()
    const day = DAY_ABBR[day_of_week]
    const d = meals.find(x => x.day === day)
    const m = d?.meals?.find(x => x.type === meal_type)
    if (!m || (!m.name && !m.recipeId)) return null
    return { custom_meal_name: m.name || null, recipe_id: m.recipeId || null }
  }
  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { data } = await supabase
    .from('meal_slots')
    .select('custom_meal_name, recipe_id')
    .eq('meal_plan_id', meal_plan_id)
    .eq('user_id', userId)
    .eq('day_of_week', day_of_week)
    .eq('meal_type', meal_type)
    .maybeSingle()
  return data || null
}

/**
 * Record a chat-undo row. In prod the RPC reads current rows itself; in mock
 * mode we mirror that by reading mock state here. Supersedes caller's open
 * undo rows. Returns `{ id, expires_at }` or `null` when no eligible entry.
 *
 * `targets` is an array of `{kind, ...natural keys}` — no "before" data.
 */
export async function recordUndo(userId, targets, label) {
  if (!Array.isArray(targets) || !targets.length) return null

  if (isMockMode()) {
    const entries = []
    for (const t of targets) {
      if (t.kind === 'slot') {
        const before = await readSlotRef(userId, t.meal_plan_id, t.day_of_week, t.meal_type)
        entries.push({
          kind: 'slot',
          ref: { meal_plan_id: t.meal_plan_id, day_of_week: t.day_of_week, meal_type: t.meal_type },
          before,
        })
      } else if (t.kind === 'pantry') {
        const { getMockManagedPantry } = await import('@/lib/dal/mock-store')
        const items = await getMockManagedPantry()
        const found = items.find(i => i.id === t.pantry_id)
        if (found) {
          entries.push({
            kind: 'pantry',
            ref: { pantry_id: t.pantry_id },
            before: { is_depleted: !!found.is_depleted, ingredient_name: found.ingredient_name },
          })
        }
      } else if (t.kind === 'staple') {
        const { getStaples } = await import('@/lib/dal/staples')
        const staples = await getStaples(userId)
        const s = staples.find(x => x.id === t.staple_id)
        if (s) {
          entries.push({
            kind: 'staple',
            ref: { staple_id: t.staple_id },
            before: {
              is_out_of_stock: !!s.is_out_of_stock,
              out_of_stock_since: s.out_of_stock_since || null,
              name: s.name,
            },
          })
        }
      } else if (t.kind === 'grocery_ids') {
        const ids = Array.isArray(t.ids) ? t.ids.filter(Boolean) : []
        if (ids.length) entries.push({ kind: 'grocery_ids', ids })
      }
    }
    if (!entries.length) return null
    // Supersede older open rows for this user.
    for (const r of MOCK_UNDO.values()) {
      if (r.user_id === userId && !r.used_at && !r.superseded_at) {
        r.superseded_at = new Date().toISOString()
      }
    }
    const id = makeUndoId()
    const now = Date.now()
    const expires_at = new Date(now + MOCK_UNDO_TTL_MS).toISOString()
    MOCK_UNDO.set(id, {
      id, user_id: userId, entries, label,
      created_at: new Date(now).toISOString(),
      expires_at, used_at: null, superseded_at: null,
    })
    return { id, expires_at }
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  // The RPC takes natural-key targets only and reads current rows itself.
  const { data: id, error } = await supabase.rpc('record_chat_undo', {
    p_targets: targets.map(t => {
      if (t.kind === 'slot') return { kind: 'slot', meal_plan_id: t.meal_plan_id, day_of_week: t.day_of_week, meal_type: t.meal_type }
      if (t.kind === 'pantry') return { kind: 'pantry', pantry_id: t.pantry_id }
      if (t.kind === 'staple') return { kind: 'staple', staple_id: t.staple_id }
      if (t.kind === 'grocery_ids') return { kind: 'grocery_ids', ids: t.ids }
      return null
    }).filter(Boolean),
    p_label: label || null,
  })
  if (error) {
    console.error('[recordUndo] rpc error:', error.message)
    return null
  }
  if (!id) return null
  // Read the row's expires_at (RLS allows own-select).
  const { data: row } = await supabase
    .from('chat_undo_actions')
    .select('expires_at')
    .eq('id', id)
    .maybeSingle()
  return { id, expires_at: row?.expires_at || new Date(Date.now() + MOCK_UNDO_TTL_MS).toISOString() }
}

/**
 * Record the post-write "after" state of a slot on an existing undo row.
 * Takes only the undo id and the slot's natural key — never meal data. The
 * server reads the current slot itself and only writes when both the undo
 * row and the slot belong to this user. No-ops otherwise.
 */
export async function attachUndoSlotAfter(userId, undoId, meal_plan_id, day_of_week, meal_type) {
  if (!undoId) return
  if (isMockMode()) {
    const row = MOCK_UNDO.get(undoId)
    if (!row || row.user_id !== userId) return
    const { getMockMeals } = await import('@/lib/dal/mock-store')
    const meals = await getMockMeals()
    const day = DAY_ABBR[day_of_week]
    const d = meals.find(x => x.day === day)
    const m = d?.meals?.find(x => x.type === meal_type)
    const after = (m && (m.name || m.recipeId))
      ? { custom_meal_name: m.name || null, recipe_id: m.recipeId || null }
      : null
    row.entries = row.entries.map(e => (
      e.kind === 'slot'
        && String(e.ref?.meal_plan_id) === String(meal_plan_id)
        && e.ref?.day_of_week === day_of_week
        && e.ref?.meal_type === meal_type
          ? { ...e, after }
          : e
    ))
    return
  }
  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase.rpc('attach_chat_undo_slot_after', {
    p_undo_id: undoId,
    p_meal_plan_id: meal_plan_id,
    p_day_of_week: day_of_week,
    p_meal_type: meal_type,
  })
  if (error) console.error('[attachUndoSlotAfter] rpc error:', error.message)
}

/**
 * Atomic one-shot claim. Returns the row or null when invalid.
 */
export async function claimUndo(userId, undoId) {
  if (isMockMode()) {
    const row = MOCK_UNDO.get(undoId)
    if (!row) return null
    if (row.user_id !== userId) return null
    if (row.used_at || row.superseded_at) return null
    if (new Date(row.expires_at).getTime() <= Date.now()) return null
    row.used_at = new Date().toISOString()
    return { ...row }
  }
  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase.rpc('claim_chat_undo', { p_undo_id: undoId })
  if (error) {
    console.error('[claimUndo] rpc error:', error.message)
    return null
  }
  const row = Array.isArray(data) ? data[0] : data
  if (!row?.id || row.user_id !== userId) return null
  return row
}

/**
 * Supersede the caller's open undo rows. Called after a confirmed pending
 * action because that counts as "the next change".
 */
export async function supersedeUndo(userId) {
  if (isMockMode()) {
    for (const r of MOCK_UNDO.values()) {
      if (r.user_id === userId && !r.used_at && !r.superseded_at) {
        r.superseded_at = new Date().toISOString()
      }
    }
    return
  }
  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase.rpc('supersede_chat_undo')
  if (error) console.error('[supersedeUndo] rpc error:', error.message)
}

/**
 * Restore a single undo entry. Writes always use `userId` from the session
 * and `.eq('user_id', userId)` on every mutation. Returns a short descriptor
 * of what happened, including an `after_mismatch` flag when the row changed
 * since the undo was recorded (we leave it alone).
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const isUuid = (v) => typeof v === 'string' && UUID_RE.test(v)
const isUuidOrNull = (v) => v === null || v === undefined || isUuid(v)

function validateEntry(entry) {
  if (!entry || typeof entry !== 'object') return false
  if (entry.kind === 'slot') {
    const ref = entry.ref
    if (!ref) return false
    const dow = Number(ref.day_of_week)
    if (!(dow >= 1 && dow <= 7)) return false
    if (!MEAL_TYPE_ENUM.includes(ref.meal_type)) return false
    // meal_plan_id must be a UUID in prod. In mock mode we allow non-UUID
    // placeholders because mock plans don't have real UUIDs.
    if (!isMockMode() && !isUuid(ref.meal_plan_id)) return false
    const before = entry.before
    if (before !== null && before !== undefined) {
      if (typeof before !== 'object') return false
      if (!isUuidOrNull(before.recipe_id)) return false
      // Sanitize the name in place so the restored write uses the clean form.
      const cleaned = before.custom_meal_name == null
        ? null
        : sanitizeString(String(before.custom_meal_name), 200) || null
      before.custom_meal_name = cleaned
    }
    return true
  }
  if (entry.kind === 'pantry') {
    if (!entry.ref || !isUuid(entry.ref.pantry_id)) return false
    if (typeof entry.before?.is_depleted !== 'boolean') return false
    return true
  }
  if (entry.kind === 'staple') {
    if (!entry.ref || !isUuid(entry.ref.staple_id)) return false
    if (typeof entry.before?.is_out_of_stock !== 'boolean') return false
    return true
  }
  if (entry.kind === 'grocery_ids') {
    if (!Array.isArray(entry.ids)) return false
    return entry.ids.every(isUuid)
  }
  return false
}

export async function restoreUndoEntry(userId, entry) {
  if (!validateEntry(entry)) {
    return { kind: entry?.kind || 'unknown', skipped: true, invalid: true }
  }
  if (entry.kind === 'slot') {
    const { meal_plan_id, day_of_week, meal_type } = entry.ref
    const before = entry.before
    const day = DAY_ABBR[day_of_week]
    if (!day) return { kind: 'slot', skipped: true }

    // Optional after-check: if the stored "after" state doesn't match the
    // current row (someone else edited it in the 30s window), leave it alone.
    if (entry.after !== undefined) {
      const current = await readSlotRef(userId, meal_plan_id, day_of_week, meal_type)
      const sameName = (current?.custom_meal_name || null) === (entry.after?.custom_meal_name || null)
      const sameRecipe = (current?.recipe_id || null) === (entry.after?.recipe_id || null)
      if (!(sameName && sameRecipe)) {
        return { kind: 'slot', day, meal_type, after_mismatch: true }
      }
    }

    if (isMockMode()) {
      const { updateMockMeal } = await import('@/lib/dal/mock-store')
      if (before && before.custom_meal_name) {
        await updateMockMeal(day, meal_type, {
          name: before.custom_meal_name,
          recipeId: before.recipe_id,
          recipe: null,
          ingredients: [],
        })
      } else {
        await updateMockMeal(day, meal_type, { name: null, recipeId: null, recipe: null, ingredients: [] })
      }
      return { kind: 'slot', day, meal_type, restored: before }
    }

    const { getSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = await getSupabaseServerClient()
    if (before && (before.custom_meal_name || before.recipe_id)) {
      const { error } = await supabase
        .from('meal_slots')
        .upsert({
          meal_plan_id,
          user_id: userId,
          day_of_week,
          meal_type,
          custom_meal_name: before.custom_meal_name,
          recipe_id: before.recipe_id,
        }, { onConflict: 'meal_plan_id,day_of_week,meal_type' })
      if (error) return { kind: 'slot', day, meal_type, error: error.message }
    } else {
      const { error } = await supabase
        .from('meal_slots')
        .delete()
        .eq('meal_plan_id', meal_plan_id)
        .eq('user_id', userId)
        .eq('day_of_week', day_of_week)
        .eq('meal_type', meal_type)
      if (error) return { kind: 'slot', day, meal_type, error: error.message }
    }
    return { kind: 'slot', day, meal_type, restored: before }
  }

  if (entry.kind === 'pantry') {
    if (isMockMode()) {
      const { updateMockPantryItem } = await import('@/lib/dal/mock-store')
      await updateMockPantryItem(entry.ref.pantry_id, { is_depleted: entry.before.is_depleted })
      return { kind: 'pantry', restored: entry.before }
    }
    const { getSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = await getSupabaseServerClient()
    const { error } = await supabase
      .from('pantry')
      .update({ is_depleted: entry.before.is_depleted })
      .eq('id', entry.ref.pantry_id)
      .eq('user_id', userId)
    if (error) return { kind: 'pantry', error: error.message }
    return { kind: 'pantry', restored: entry.before }
  }

  if (entry.kind === 'staple') {
    const { toggleStapleStock } = await import('@/lib/dal/staples')
    await toggleStapleStock(userId, entry.ref.staple_id, entry.before.is_out_of_stock)
    return { kind: 'staple', restored: entry.before }
  }

  if (entry.kind === 'grocery_ids') {
    const ids = Array.isArray(entry.ids) ? entry.ids : []
    if (!ids.length) return { kind: 'grocery_ids', deleted: 0 }
    if (isMockMode()) {
      const { getMockGrocery } = await import('@/lib/dal/mock-store')
      const items = await getMockGrocery()
      let deleted = 0
      for (const id of ids) {
        const idx = items.findIndex(i => i.id === id)
        if (idx >= 0) { items.splice(idx, 1); deleted++ }
      }
      return { kind: 'grocery_ids', deleted }
    }
    const { getSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = await getSupabaseServerClient()
    const { error } = await supabase
      .from('grocery_items')
      .delete()
      .in('id', ids)
      .eq('user_id', userId)
    if (error) return { kind: 'grocery_ids', error: error.message }
    return { kind: 'grocery_ids', deleted: ids.length }
  }

  return { kind: entry.kind || 'unknown', skipped: true }
}

/**
 * Compose the undo reply text from the stored label (if present) or from the
 * entries. The label is composed at record time; this is used when the stored
 * label is empty.
 */
export function composeUndoLabel(entries) {
  const slot = (entries || []).find(e => e.kind === 'slot')
  if (slot) {
    const day = DAY_FULL[DAY_ABBR[slot.ref?.day_of_week]] || 'that slot'
    const slotType = slot.ref?.meal_type || ''
    if (slot.before && slot.before.custom_meal_name) {
      return `Undone, ${day} ${slotType ? slotType + ' ' : ''}is back to ${slot.before.custom_meal_name}.`
    }
    return `Undone, ${day} ${slotType || ''} is empty again.`.replace(/\s+/g, ' ').trim() + ''
  }
  const grocery = (entries || []).find(e => e.kind === 'grocery_ids')
  if (grocery) return 'Undone, removed those items from your grocery list.'
  const pantry = (entries || []).find(e => e.kind === 'pantry' || e.kind === 'staple')
  if (pantry) {
    const name = pantry.before?.ingredient_name || pantry.before?.name || 'the item'
    return `Undone, ${name} is back to its previous status.`
  }
  return 'Undone.'
}

// Test-only helpers.
export function _resetMockUndoForTests() { MOCK_UNDO.clear() }
export function _getMockUndoRowForTests(id) { return MOCK_UNDO.get(id) }
export function _setMockUndoExpiryForTests(id, expiresAt) {
  const row = MOCK_UNDO.get(id)
  if (row) row.expires_at = new Date(expiresAt).toISOString()
}
