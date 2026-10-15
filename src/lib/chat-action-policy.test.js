import { describe, it, expect } from 'vitest'
import { classifyAction, SMALL_GROCERY_CAP } from './chat-action-policy'

describe('classifyAction', () => {
  it('classifies small single-slot writes', () => {
    expect(classifyAction('set_meal', { day: 'Mon', meal_type: 'dinner', meal_name: 'x' }, {})).toBe('small')
    expect(classifyAction('swap_meal', { day: 'Mon', meal_type: 'dinner', new_meal_name: 'x' }, {})).toBe('small')
    expect(classifyAction('update_pantry', { item_name: 'eggs', is_out_of_stock: true }, {})).toBe('small')
  })

  it('classifies big actions explicitly', () => {
    expect(classifyAction('fill_meal_plan', { slots: [{}] }, {})).toBe('big')
    expect(classifyAction('add_recipe', { recipe: {} }, {})).toBe('big')
    expect(classifyAction('log_receipt', { receipt: {} }, {})).toBe('big')
  })

  it('multi-slot clear is big', () => {
    expect(classifyAction('clear_slot', { slots: [{ day: 'Mon', meal_type: 'dinner' }] }, {})).toBe('small')
    expect(classifyAction('clear_slot', { slots: [{}, {}] }, {})).toBe('big')
  })

  it('long grocery list crosses the cap', () => {
    const under = Array.from({ length: SMALL_GROCERY_CAP }, (_, i) => ({ name: `i${i}` }))
    const over = Array.from({ length: SMALL_GROCERY_CAP + 1 }, (_, i) => ({ name: `i${i}` }))
    expect(classifyAction('add_to_grocery', { items: under }, {})).toBe('small')
    expect(classifyAction('add_to_grocery', { items: over }, {})).toBe('big')
  })

  it('imported content forces big for everything', () => {
    expect(classifyAction('set_meal', {}, { importedContent: true })).toBe('big')
    expect(classifyAction('add_to_grocery', { items: [{ name: 'eggs' }] }, { importedContent: true })).toBe('big')
  })

  it('unknown tool is big (safest)', () => {
    expect(classifyAction('nuke_everything', {}, {})).toBe('big')
  })

  it('ignores a model-supplied confirmed flag', () => {
    // args.confirmed must never influence tiering
    expect(classifyAction('fill_meal_plan', { slots: [], confirmed: true }, {})).toBe('big')
    expect(classifyAction('set_meal', { day: 'Mon', meal_type: 'dinner', confirmed: false }, {})).toBe('small')
  })
})
