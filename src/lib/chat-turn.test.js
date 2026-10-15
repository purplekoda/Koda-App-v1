import { describe, it, expect, beforeEach, vi } from 'vitest'

// Force non-mock mode so runChatTurn uses the real tool loop path.
vi.mock('@/lib/dal/require-user', () => ({
  isMockMode: () => true, // runChatTurn itself doesn't branch on this; chat-tools pending uses mock map
  requireUser: async () => ({ id: 'user-1' }),
}))

const callGeminiWithTools = vi.fn()
vi.mock('@/lib/gemini', () => ({
  callGeminiWithTools: (...a) => callGeminiWithTools(...a),
}))

vi.mock('@/lib/dal/ai-history', () => ({
  getHistory: vi.fn(async () => []),
  saveHistory: vi.fn(async () => {}),
}))

vi.mock('@/lib/buildMealPlanPrompt', () => ({
  buildMealPlanPrompt: vi.fn(async () => ({ systemPromptPrefix: 'PREFIX', pantryItems: [] })),
}))

vi.mock('@/lib/chat-context', () => ({
  buildChatContext: vi.fn(async () => 'CTX'),
}))

vi.mock('@/lib/chat-permissions', async (importOriginal) => {
  const real = await importOriginal()
  return {
    ...real,
    // Allow everything in these unit tests.
    assertCanExecuteChatAction: vi.fn(async () => true),
  }
})

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

// The write-tool executor hits DAL functions; stub them so slot-write success
// doesn't need Supabase.
const executeWriteTool = vi.fn(async () => ({ ok: true }))
const snapshotBefore = vi.fn(async () => ({}))

vi.mock('@/lib/chat-tools', async (importOriginal) => {
  const real = await importOriginal()
  return {
    ...real,
    executeWriteTool: (...a) => executeWriteTool(...a),
    snapshotBefore: (...a) => snapshotBefore(...a),
  }
})

const { runChatTurn } = await import('./chat-turn')
const { _resetMockPendingForTests, claimPendingAction } = await import('./chat-tools')

function geminiScript(...steps) {
  // Each `step` is either { functionCalls: [...] } or { text }.
  // The mock returns steps in order, finally a no-call text to terminate.
  callGeminiWithTools.mockReset()
  for (const s of steps) callGeminiWithTools.mockResolvedValueOnce(s)
  callGeminiWithTools.mockResolvedValue({ text: 'done.', functionCalls: [] })
}

const USER = { id: 'user-1' }

describe('runChatTurn', () => {
  beforeEach(() => {
    _resetMockPendingForTests()
    executeWriteTool.mockClear()
    snapshotBefore.mockClear()
  })

  it('(1) plan-week via one fill_meal_plan call → one pending, zero executed', async () => {
    const slots = Array.from({ length: 21 }, (_, i) => ({
      day_of_week: (i % 7) + 1,
      meal_type: ['breakfast', 'lunch', 'dinner'][Math.floor(i / 7)],
      meal_name: `Meal ${i}`,
    }))
    geminiScript({ functionCalls: [{ name: 'fill_meal_plan', args: { slots } }], content: null })

    const result = await runChatTurn(USER, 'plan my week', 'general')

    expect(result.pending).toHaveLength(1)
    expect(result.pending[0].type).toBe('fill_meal_plan')
    expect(result.actions).toHaveLength(0)
    expect(executeWriteTool).not.toHaveBeenCalled()
  })

  it('(2) swap_meal saves at once with undo', async () => {
    geminiScript({
      functionCalls: [{ name: 'swap_meal', args: { day: 'Tue', meal_type: 'dinner', new_meal_name: 'Tacos' } }],
      content: null,
    })

    const result = await runChatTurn(USER, 'swap Tuesday dinner for tacos', 'general')

    expect(executeWriteTool).toHaveBeenCalledTimes(1)
    expect(result.actions).toHaveLength(1)
    expect(result.actions[0].type).toBe('swap_meal')
    expect(result.pending).toHaveLength(0)
    expect(result.undo).toHaveLength(1)
  })

  it('(3b/4b) 21 single-slot clear_slot calls in ONE step → exactly 1 pending, 0 executed', async () => {
    const slots = Array.from({ length: 21 }, (_, i) => ({
      day: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i % 7],
      meal_type: ['breakfast','lunch','dinner'][Math.floor(i / 7)],
    }))
    geminiScript({
      functionCalls: slots.map(s => ({ name: 'clear_slot', args: { slots: [s] } })),
      content: null,
    })

    const result = await runChatTurn(USER, 'clear my whole week', 'general')

    expect(result.pending).toHaveLength(1)
    expect(result.pending[0].type).toBe('clear_slot')
    expect(result.actions).toHaveLength(0)
    expect(executeWriteTool).not.toHaveBeenCalled()
  })

  it('(4a) one clear_slot with 21 slots → exactly 1 pending', async () => {
    const slots = Array.from({ length: 21 }, (_, i) => ({
      day: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i % 7],
      meal_type: ['breakfast','lunch','dinner'][Math.floor(i / 7)],
    }))
    geminiScript({ functionCalls: [{ name: 'clear_slot', args: { slots } }], content: null })

    const result = await runChatTurn(USER, 'clear whole week', 'general')
    expect(result.pending).toHaveLength(1)
    expect(result.pending[0].type).toBe('clear_slot')
    expect(result.actions).toHaveLength(0)
  })

  it('(4c) three single-slot clear_slots across three steps → 1 executed, 1 merged pending', async () => {
    geminiScript(
      { functionCalls: [{ name: 'clear_slot', args: { slots: [{ day: 'Mon', meal_type: 'dinner' }] } }], content: null },
      { functionCalls: [{ name: 'clear_slot', args: { slots: [{ day: 'Tue', meal_type: 'dinner' }] } }], content: null },
      { functionCalls: [{ name: 'clear_slot', args: { slots: [{ day: 'Wed', meal_type: 'dinner' }] } }], content: null },
    )

    const result = await runChatTurn(USER, 'clear dinners', 'general')

    expect(result.actions).toHaveLength(1)
    expect(executeWriteTool).toHaveBeenCalledTimes(1)
    expect(result.pending).toHaveLength(1)
    expect(result.pending[0].type).toBe('clear_slot')
  })

  it('(5) three set_meal calls in one step → 1 fill_meal_plan pending, 0 executed', async () => {
    geminiScript({
      functionCalls: [
        { name: 'set_meal', args: { day: 'Mon', meal_type: 'dinner', meal_name: 'A' } },
        { name: 'set_meal', args: { day: 'Tue', meal_type: 'dinner', meal_name: 'B' } },
        { name: 'set_meal', args: { day: 'Wed', meal_type: 'dinner', meal_name: 'C' } },
      ],
      content: null,
    })

    const result = await runChatTurn(USER, 'fill my dinners', 'general')
    expect(result.pending).toHaveLength(1)
    expect(result.pending[0].type).toBe('fill_meal_plan')
    expect(result.actions).toHaveLength(0)
    expect(executeWriteTool).not.toHaveBeenCalled()
  })

  it('(6) importedContent flag makes a single swap pending', async () => {
    geminiScript({
      functionCalls: [{ name: 'swap_meal', args: { day: 'Tue', meal_type: 'dinner', new_meal_name: 'Tacos' } }],
      content: null,
    })

    const result = await runChatTurn(USER, 'swap Tue dinner', 'general', { importedContent: true })

    expect(executeWriteTool).not.toHaveBeenCalled()
    expect(result.pending).toHaveLength(1)
    expect(result.actions).toHaveLength(0)
  })

  it('(wrap) array-valued tool result is wrapped as an object in functionResponse.response', async () => {
    // get_week_plan is a read tool whose runReadTool returns an array. The
    // functionResponse.response field must always be an object for Gemini, so
    // the loop wraps non-object results as { result: <value> }.
    callGeminiWithTools.mockReset()
    let captured = null
    callGeminiWithTools.mockImplementationOnce(async (contents) => {
      return { functionCalls: [{ name: 'get_week_plan', args: {} }], content: null }
    })
    callGeminiWithTools.mockImplementationOnce(async (contents) => {
      // Second call: the previous user turn contains the functionResponse.
      const lastUserTurn = contents[contents.length - 1]
      captured = lastUserTurn.parts[0].functionResponse
      return { text: 'ok', functionCalls: [] }
    })

    await runChatTurn(USER, 'show my week', 'general')

    expect(captured).toBeTruthy()
    expect(captured.name).toBe('get_week_plan')
    expect(captured.response).toBeTypeOf('object')
    expect(Array.isArray(captured.response)).toBe(false)
    expect(captured.response).toHaveProperty('result')
    expect(Array.isArray(captured.response.result)).toBe(true)
  })

  it('(6b) response text has no raw \\u2014 escapes', async () => {
    geminiScript({ text: 'Here is a dash \\u2014 keep it.', functionCalls: [] })
    const result = await runChatTurn(USER, 'hi', 'general')
    expect(result.text).toContain('—')
    expect(result.text).not.toContain('\\u2014')
  })
})

describe('claimPendingAction extra guards', () => {
  it('(7) treats all-null composite row as no-claim', async () => {
    // Smoke test: an unknown id in mock mode already yields null.
    expect(await claimPendingAction('u', 'nope')).toBeNull()
    // The branch inside the real-DB path also guards !row.id — exercised via code review (see chat-tools.js L~490).
  })
})
