import { describe, it, expect, beforeEach } from 'vitest'
import {
  createPendingAction,
  claimPendingAction,
  validateToolArgs,
  ToolArgError,
  _resetMockPendingForTests,
  getTouchedSlots,
  MERGEABLE_PENDING,
  mergePendingArgs,
} from './chat-tools'

describe('validateToolArgs', () => {
  it('rejects bad day/meal_type enums', () => {
    expect(() => validateToolArgs('set_meal', { day: 'Monday', meal_type: 'dinner', meal_name: 'x' })).toThrow(ToolArgError)
    expect(() => validateToolArgs('set_meal', { day: 'Mon', meal_type: 'brunch', meal_name: 'x' })).toThrow(ToolArgError)
  })

  it('requires non-empty meal name', () => {
    expect(() => validateToolArgs('set_meal', { day: 'Mon', meal_type: 'dinner', meal_name: '' })).toThrow(ToolArgError)
  })

  it('normalizes add_to_grocery', () => {
    const out = validateToolArgs('add_to_grocery', { items: [{ name: 'Eggs' }, { name: 'milk', quantity: '2' }] })
    expect(out.items).toEqual([
      { name: 'Eggs', quantity: '1', category: 'Other' },
      { name: 'milk', quantity: '2', category: 'Other' },
    ])
  })

  it('clear_slot requires at least one slot', () => {
    expect(() => validateToolArgs('clear_slot', { slots: [] })).toThrow(ToolArgError)
  })

  it('fill_meal_plan rejects placeholder meal names', () => {
    const base = { day_of_week: 1, meal_type: 'dinner' }
    for (const bad of ['AI Generated Meal', 'ai-generated meal', 'Meal 1', 'meal 12', 'TBD', 'placeholder']) {
      expect(() => validateToolArgs('fill_meal_plan', { slots: [{ ...base, meal_name: bad }] }),
        `should reject "${bad}"`).toThrow(ToolArgError)
    }
  })

  it('fill_meal_plan accepts real meal names', () => {
    const out = validateToolArgs('fill_meal_plan', {
      slots: [{ day_of_week: 1, meal_type: 'dinner', meal_name: 'Lemon Herb Chicken' }],
    })
    expect(out.slots[0].meal_name).toBe('Lemon Herb Chicken')
  })
})

describe('pending action lifecycle (mock mode)', () => {
  const user = 'mock-user-id'
  const other = 'other-user'

  beforeEach(() => _resetMockPendingForTests())

  it('creates and claims once', async () => {
    const pending = await createPendingAction(user, 'fill_meal_plan', { slots: [{ day_of_week: 1, meal_type: 'dinner', meal_name: 'x' }] })
    expect(pending.id).toBeTruthy()
    const claimed = await claimPendingAction(user, pending.id)
    expect(claimed).toBeTruthy()
    expect(claimed.action_type).toBe('fill_meal_plan')
  })

  it('rejects a second claim', async () => {
    const pending = await createPendingAction(user, 'add_recipe', { recipe: { name: 'x' } })
    await claimPendingAction(user, pending.id)
    const again = await claimPendingAction(user, pending.id)
    expect(again).toBeNull()
  })

  it('rejects a claim by another user', async () => {
    const pending = await createPendingAction(user, 'log_receipt', { receipt: { store_name: 's', total_amount: 1 } })
    const claimed = await claimPendingAction(other, pending.id)
    expect(claimed).toBeNull()
  })

  it('rejects an unknown id', async () => {
    expect(await claimPendingAction(user, 'does-not-exist')).toBeNull()
  })
})

describe('cross-step slot write promotion (test 4c)', () => {
  // Simulates the ai.js loop: three sequential steps, each one single-slot
  // clear_slot. The first step executes, the next two are promoted to a
  // single merged pending — never three executions.
  it('executes one and collapses the rest into exactly one pending', () => {
    const steps = [
      { name: 'clear_slot', args: { slots: [{ day: 'Mon', meal_type: 'dinner' }] } },
      { name: 'clear_slot', args: { slots: [{ day: 'Tue', meal_type: 'dinner' }] } },
      { name: 'clear_slot', args: { slots: [{ day: 'Wed', meal_type: 'dinner' }] } },
    ]
    const slotsWrittenInPriorSteps = new Set()
    const promotedPendingByName = new Map()
    const executed = []

    for (const call of steps) {
      const touched = getTouchedSlots(call.name, call.args)
      const crossStepSlot = touched.length > 0 && slotsWrittenInPriorSteps.size > 0
      if (crossStepSlot) {
        const existing = promotedPendingByName.get(call.name)
        if (existing && MERGEABLE_PENDING.has(call.name)) {
          existing.args = mergePendingArgs(call.name, existing.args, call.args)
        } else {
          promotedPendingByName.set(call.name, { name: call.name, args: call.args })
        }
      } else {
        executed.push(call)
        touched.forEach(s => slotsWrittenInPriorSteps.add(s))
      }
    }

    expect(executed).toHaveLength(1)
    expect(executed[0].args.slots).toEqual([{ day: 'Mon', meal_type: 'dinner' }])
    expect(promotedPendingByName.size).toBe(1)
    const pending = promotedPendingByName.get('clear_slot')
    expect(pending.args.slots).toEqual([
      { day: 'Tue', meal_type: 'dinner' },
      { day: 'Wed', meal_type: 'dinner' },
    ])
  })

  it('mergePendingArgs dedupes repeated clear_slot entries', () => {
    const merged = mergePendingArgs(
      'clear_slot',
      { slots: [{ day: 'Mon', meal_type: 'dinner' }] },
      { slots: [{ day: 'Mon', meal_type: 'dinner' }, { day: 'Tue', meal_type: 'dinner' }] }
    )
    expect(merged.slots).toEqual([
      { day: 'Mon', meal_type: 'dinner' },
      { day: 'Tue', meal_type: 'dinner' },
    ])
  })

  it('getTouchedSlots returns [] for non-slot tools', () => {
    expect(getTouchedSlots('add_to_grocery', { items: [{ name: 'x' }] })).toEqual([])
    expect(getTouchedSlots('update_pantry', { item_name: 'eggs', is_out_of_stock: true })).toEqual([])
  })
})
