import { describe, it, expect, beforeEach } from 'vitest'
import {
  createPendingAction,
  claimPendingAction,
  validateToolArgs,
  ToolArgError,
  _resetMockPendingForTests,
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
