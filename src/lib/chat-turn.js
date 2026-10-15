import 'server-only'

// Non-exported-from-'use server': the client cannot call this. Only server
// code decides importedContent; the chat server action askAI never forwards
// its own arguments here.

import { revalidatePath } from 'next/cache'
import {
  assertCanExecuteChatAction,
  CHAT_ACTION_FORBIDDEN,
  CHAT_ACTION_UNKNOWN,
} from '@/lib/chat-permissions'

const DAY_TO_INT = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }

function deriveChips(text) {
  const lower = (text || '').toLowerCase()
  if (/grocery|shopping|buy|ingredient|store|aisle/.test(lower)) {
    return ['Check grocery list', 'Add to list', 'Find substitutions']
  }
  if (/pantry|fridge|refrigerator|expir|spoil/.test(lower)) {
    return ['Update pantry', 'Suggest dinner', 'What else is expiring?']
  }
  if (/meal|plan|week|recipe|dish|dinner|lunch|breakfast/.test(lower)) {
    return ['Plan this week', 'Show suggestions', 'Swap a meal']
  }
  return ['Plan meals', 'Make grocery list', 'Check pantry']
}

// Defensive cleanup: the model sometimes echoes literal escape sequences from
// history. JSX text children don't process JS escapes, so `—` would print
// raw. Replace a short set of common ones before returning text.
function cleanEscapes(text) {
  if (!text) return text
  return text
    .replace(/\\u2014/g, '—')
    .replace(/\\u2013/g, '–')
    .replace(/\\u2019/g, '’')
    .replace(/\\u201c/gi, '“')
    .replace(/\\u201d/gi, '”')
}

/**
 * Run one chat turn through the Gemini function-calling loop.
 *
 * Not a server action. Must be called from server code only. The caller
 * decides whether `importedContent` applies; chat text from the client never
 * sets it.
 *
 * @param {{ id: string }} user
 * @param {string} prompt - already-validated prompt
 * @param {string} context - already-validated context
 * @param {{ importedContent?: boolean }} [opts]
 * @returns {Promise<{ text, chips, actionExecuted, actions, undo, pending }>}
 */
export async function runChatTurn(user, prompt, context, { importedContent = false } = {}) {
  const [
    { getHistory, saveHistory },
    { callGeminiWithTools },
    { buildMealPlanPrompt },
    { buildChatContext },
    {
      CHAT_TOOL_DECLARATIONS,
      validateToolArgs,
      snapshotBefore,
      runReadTool,
      executeWriteTool,
      createPendingAction,
      ToolArgError,
      getTouchedSlots,
      mergePendingArgs,
    },
    { classifyAction, READ_TOOLS },
  ] = await Promise.all([
    import('@/lib/dal/ai-history'),
    import('@/lib/gemini'),
    import('@/lib/buildMealPlanPrompt'),
    import('@/lib/chat-context'),
    import('@/lib/chat-tools'),
    import('@/lib/chat-action-policy'),
  ])

  const [history, { systemPromptPrefix }, chatContext] = await Promise.all([
    getHistory(user.id, context),
    buildMealPlanPrompt(user.id),
    buildChatContext(user.id),
  ])

  const systemInstruction = [systemPromptPrefix, chatContext].filter(Boolean).join('\n\n')

  const contents = [
    ...history.map(h => ({ role: h.role, parts: h.parts })),
    { role: 'user', parts: [{ text: prompt }] },
  ]

  const tools = [{ functionDeclarations: CHAT_TOOL_DECLARATIONS }]
  const executed = []
  const undo = []
  const pendings = []
  const skipped = []
  let responseText = ''
  let pendingLatched = false

  // Slot writes committed in a prior step this turn.
  const slotsWrittenInPriorSteps = new Set()
  // Cross-step and in-step promoted pending intents, keyed by canonical type
  // ('clear_slot' or 'fill_meal_plan'). Persisted at end of loop.
  const promotedByType = new Map()

  function mergePromoted(canonicalType, args) {
    const existing = promotedByType.get(canonicalType)
    if (existing) {
      existing.args = mergePendingArgs(canonicalType, existing.args, args)
    } else {
      promotedByType.set(canonicalType, { name: canonicalType, args })
    }
  }

  function slotCallToFillMealPlan(name, args) {
    const dow = DAY_TO_INT[args.day]
    const mealName = name === 'set_meal' ? args.meal_name : args.new_meal_name
    return { slots: [{ day_of_week: dow, meal_type: args.meal_type, meal_name: mealName }] }
  }

  function toolResultFromErr(err) {
    if (err?.code === CHAT_ACTION_FORBIDDEN || err?.code === CHAT_ACTION_UNKNOWN) {
      return { status: 'error', message: err.message }
    }
    if (err instanceof ToolArgError) {
      return { status: 'error', message: err.message }
    }
    console.error('[runChatTurn] tool call failed:', err)
    return { status: 'error', message: 'Tool call failed.' }
  }

  for (let step = 0; step < 5; step++) {
    const { text, functionCalls, content } = await callGeminiWithTools(contents, systemInstruction, tools)
    if (!functionCalls || functionCalls.length === 0) {
      responseText = text || ''
      break
    }

    contents.push(content || { role: 'model', parts: functionCalls.map(fc => ({ functionCall: fc })) })

    // ── Pass 1: validate + classify each call, collect per-step slot writes.
    const outcomes = new Array(functionCalls.length)
    const slotIndices = []
    let stepSlotCount = 0
    for (let i = 0; i < functionCalls.length; i++) {
      const call = functionCalls[i]
      const name = call.name
      try {
        if (READ_TOOLS.has(name)) {
          outcomes[i] = { kind: 'read', name }
          continue
        }
        await assertCanExecuteChatAction(user.id, name)
        const args = validateToolArgs(name, call.args || {})
        const touched = getTouchedSlots(name, args)
        if (touched.length > 0) {
          outcomes[i] = { kind: 'slot', name, args, touched }
          slotIndices.push(i)
          stepSlotCount += touched.length
        } else {
          outcomes[i] = { kind: 'nonslot', name, args }
        }
      } catch (err) {
        outcomes[i] = { kind: 'error', name, toolResult: toolResultFromErr(err) }
      }
    }

    // Batch rule: if the whole step touches more than one slot in total, OR a
    // prior step already wrote one, OR this turn is on imported content,
    // every slot call this step is promoted to a single merged pending.
    const batchSlots =
      stepSlotCount > 1 ||
      (slotIndices.length > 0 && slotsWrittenInPriorSteps.size > 0) ||
      (slotIndices.length > 0 && importedContent)

    // ── Pass 2: execute in original order to emit response parts in order.
    const stepSlotsWritten = new Set()
    const responseParts = []
    for (let i = 0; i < functionCalls.length; i++) {
      const o = outcomes[i]
      const name = o.name
      let toolResult

      if (o.kind === 'read') {
        try { toolResult = await runReadTool(user.id, name) }
        catch (err) { toolResult = toolResultFromErr(err) }
      } else if (o.kind === 'error') {
        toolResult = o.toolResult
      } else if (o.kind === 'nonslot') {
        const tier = classifyAction(name, o.args, { importedContent })
        if (pendingLatched && tier === 'small') {
          toolResult = { status: 'skipped_pending', reason: 'Waiting on earlier confirmation.' }
          skipped.push({ type: name })
        } else if (tier === 'small') {
          try {
            const before = await snapshotBefore(user.id, name, o.args)
            const out = await executeWriteTool(user.id, name, o.args)
            executed.push({ type: name, args: o.args, result: out })
            undo.push({ type: name, before, ref: out })
            toolResult = { status: 'ok', ...out }
          } catch (err) { toolResult = toolResultFromErr(err) }
        } else {
          try {
            const pending = await createPendingAction(user.id, name, o.args, { importedContent })
            pendings.push(pending)
            pendingLatched = true
            toolResult = { status: 'pending_confirmation', pending_id: pending.id, summary: pending.summary }
          } catch (err) { toolResult = toolResultFromErr(err) }
        }
      } else {
        // Slot write.
        if (batchSlots || pendingLatched) {
          const canonical = name === 'clear_slot' ? 'clear_slot' : 'fill_meal_plan'
          const mergeArgs = name === 'clear_slot' ? o.args : slotCallToFillMealPlan(name, o.args)
          mergePromoted(canonical, mergeArgs)
          pendingLatched = true
          toolResult = { status: 'pending_confirmation', summary: 'Change held for user confirmation.' }
        } else {
          try {
            const before = await snapshotBefore(user.id, name, o.args)
            const out = await executeWriteTool(user.id, name, o.args)
            executed.push({ type: name, args: o.args, result: out })
            undo.push({ type: name, before, ref: out })
            o.touched.forEach(s => stepSlotsWritten.add(s))
            toolResult = { status: 'ok', ...out }
          } catch (err) { toolResult = toolResultFromErr(err) }
        }
      }

      if (process.env.NODE_ENV !== 'production' && toolResult && toolResult.status === 'error') {
        console.error('[chat-tool]', name, JSON.stringify(o.args || {}).slice(0, 300), JSON.stringify(toolResult).slice(0, 500))
      }
      const safeResult = (toolResult && typeof toolResult === 'object' && !Array.isArray(toolResult)) ? toolResult : { result: toolResult }
      responseParts.push({ functionResponse: { name, response: safeResult } })
    }

    for (const s of stepSlotsWritten) slotsWrittenInPriorSteps.add(s)
    contents.push({ role: 'user', parts: responseParts })
  }

  for (const intent of promotedByType.values()) {
    try {
      const pending = await createPendingAction(user.id, intent.name, intent.args, { importedContent })
      pendings.push(pending)
    } catch (err) {
      console.error('[runChatTurn] createPendingAction (promoted) failed:', err)
    }
  }

  if (executed.length > 0) {
    revalidatePath('/(app)', 'layout')
  }

  if (!responseText) {
    if (pendings.length > 0) {
      responseText = pendings.length === 1
        ? `Ready to go — ${pendings[0].summary} Tap confirm to save.`
        : `Ready to save ${pendings.length} changes. Tap confirm on each card.`
    } else if (executed.length > 0) {
      responseText = `Done — ${executed.length === 1 ? 'change' : `${executed.length} changes`} saved.`
    } else {
      responseText = ''
    }
  }

  responseText = cleanEscapes(responseText)

  const finalHistory = [
    ...history,
    { role: 'user', parts: [{ text: prompt }] },
    { role: 'model', parts: [{ text: responseText }] },
  ]
  saveHistory(user.id, context, finalHistory).catch((err) =>
    console.error('[runChatTurn] Failed to save history:', err)
  )

  return {
    text: responseText,
    chips: deriveChips(responseText),
    actionExecuted: executed[0]?.type || null,
    actions: executed,
    undo,
    pending: pendings,
    skipped,
  }
}
