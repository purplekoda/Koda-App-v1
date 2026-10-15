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
    const id = makeId()
    const now = Date.now()
    MOCK_PENDING.set(id, {
      id, user_id: userId, action_type: name, payload: args, summary,
      imported_content: !!importedContent,
      created_at: new Date(now).toISOString(),
      expires_at: new Date(now + MOCK_TTL_MS).toISOString(),
      used_at: null, cancelled: false,
    })
    return { id, type: name, summary, expires_at: new Date(now + MOCK_TTL_MS).toISOString() }
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
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
  return { id: data.id, type: name, summary: data.summary, expires_at: data.expires_at }
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
  if (!data) return null
  return Array.isArray(data) ? data[0] || null : data
}

// Test-only helper: reset the mock pending map between tests.
export function _resetMockPendingForTests() {
  MOCK_PENDING.clear()
}
