import 'server-only'

// Non-exported-from-'use server': the client cannot call this. Only server
// code decides importedContent; the chat server action askAI never forwards
// its own arguments here.

import { revalidatePath } from 'next/cache'
import { isMockMode } from '@/lib/dal/require-user'
import {
  assertCanExecuteChatAction,
  CHAT_ACTION_FORBIDDEN,
  CHAT_ACTION_UNKNOWN,
} from '@/lib/chat-permissions'

const DAY_TO_INT = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }
const DAY_FULL = {
  Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday',
  Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday',
}

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

async function resolveMealPlanId(userId) {
  if (isMockMode()) return null
  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const { getOrCreateMealPlan } = await import('@/lib/dal/meals')
  const supabase = await getSupabaseServerClient()
  return getOrCreateMealPlan(userId, supabase, 0)
}

async function resolvePantryTarget(userId, itemName) {
  const name = (itemName || '').toLowerCase()
  const { getStaples } = await import('@/lib/dal/staples')
  const staples = await getStaples(userId)
  const staple = staples.find(s => s.name.toLowerCase() === name)
  if (staple) return { kind: 'staple', staple_id: staple.id }

  if (isMockMode()) {
    const { getMockManagedPantry } = await import('@/lib/dal/mock-store')
    const items = await getMockManagedPantry()
    const found = items.find(i => i.ingredient_name.toLowerCase() === name)
    if (found) return { kind: 'pantry', pantry_id: found.id }
    return null
  }
  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { data } = await supabase
    .from('pantry')
    .select('id')
    .eq('user_id', userId)
    .ilike('ingredient_name', itemName)
    .maybeSingle()
  if (data?.id) return { kind: 'pantry', pantry_id: data.id }
  return null
}

function composeLabelForWrite(name, args) {
  switch (name) {
    case 'set_meal': return `Set ${DAY_FULL[args.day] || args.day} ${args.meal_type} to ${args.meal_name}.`
    case 'swap_meal': return `Swapped ${DAY_FULL[args.day] || args.day} ${args.meal_type} to ${args.new_meal_name}.`
    case 'clear_slot': {
      const s = args.slots?.[0]
      return s ? `Cleared ${DAY_FULL[s.day] || s.day} ${s.meal_type}.` : 'Cleared slot.'
    }
    case 'add_to_grocery': {
      const n = args.items?.length || 0
      return n === 1 ? `Added ${args.items[0].name} to your grocery list.` : `Added ${n} items to your grocery list.`
    }
    case 'update_pantry':
    case 'mark_staple_out_of_stock':
      return args.is_out_of_stock
        ? `Marked ${args.item_name} out of stock.`
        : `Marked ${args.item_name} back in stock.`
    default: return 'Change saved.'
  }
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
      runReadTool,
      executeWriteTool,
      createPendingAction,
      ToolArgError,
      getTouchedSlots,
      mergePendingArgs,
      recordUndo,
      attachUndoSlotAfter,
      supersedeUndo,
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
  const pendings = []
  const skipped = []
  // Last recorded undo for the turn ({id, expires_at}). Each recordUndo call
  // supersedes earlier ones server-side; we expose only the newest to the UI.
  let undoRef = null
  let latestLabel = ''
  let responseText = ''
  let pendingLatched = false
  let mealPlanId = null

  async function getMealPlanId() {
    if (mealPlanId == null) mealPlanId = await resolveMealPlanId(user.id)
    return mealPlanId
  }

  // Slot writes committed in a prior step this turn.
  const slotsWrittenInPriorSteps = new Set()
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

    const batchSlots =
      stepSlotCount > 1 ||
      (slotIndices.length > 0 && slotsWrittenInPriorSteps.size > 0) ||
      (slotIndices.length > 0 && importedContent)

    // ── Pass 2: execute in original order.
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
          let preWriteRecordedForThisCall = false
          try {
            // Pre-write snapshot for non-slot small writes (pantry/staple).
            if (name === 'update_pantry' || name === 'mark_staple_out_of_stock') {
              const pantryTarget = await resolvePantryTarget(user.id, o.args.item_name)
              if (pantryTarget) {
                const label = composeLabelForWrite(name, o.args)
                latestLabel = label
                const rec = await recordUndo(user.id, [pantryTarget], label)
                if (rec) { undoRef = rec; preWriteRecordedForThisCall = true }
              }
            }
            const out = await executeWriteTool(user.id, name, o.args)
            executed.push({ type: name, args: o.args, result: out })
            // Post-write grocery undo: snapshot the inserted IDs.
            if (name === 'add_to_grocery' && Array.isArray(out?.ids) && out.ids.length) {
              const label = composeLabelForWrite(name, o.args)
              latestLabel = label
              const rec = await recordUndo(user.id, [{ kind: 'grocery_ids', ids: out.ids }], label)
              if (rec) undoRef = rec
            } else if (name === 'add_to_grocery' && isMockMode()) {
              // Mock-mode grocery adds don't return ids; look up by matching
              // last-inserted items by name is unreliable, so skip undo in
              // mock mode for add_to_grocery unless ids are present. Tests
              // that cover grocery undo construct the undo row directly.
            }
            toolResult = { status: 'ok', ...out }
          } catch (err) {
            if (preWriteRecordedForThisCall) {
              try { await supersedeUndo(user.id) } catch {}
              undoRef = null
            }
            toolResult = toolResultFromErr(err)
          }
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
          let preWriteRecordedForThisCall = false
          try {
            // Pre-write snapshot for slot writes.
            const planId = await getMealPlanId()
            const targets = []
            if (name === 'clear_slot') {
              for (const s of o.args.slots) {
                targets.push({ kind: 'slot', meal_plan_id: planId, day_of_week: DAY_TO_INT[s.day], meal_type: s.meal_type })
              }
            } else {
              targets.push({ kind: 'slot', meal_plan_id: planId, day_of_week: DAY_TO_INT[o.args.day], meal_type: o.args.meal_type })
            }
            const label = composeLabelForWrite(name, o.args)
            latestLabel = label
            const rec = await recordUndo(user.id, targets, label)
            if (rec) { undoRef = rec; preWriteRecordedForThisCall = true }

            const out = await executeWriteTool(user.id, name, o.args)
            executed.push({ type: name, args: o.args, result: out })
            o.touched.forEach(s => stepSlotsWritten.add(s))
            // Post-write: stamp the "after" state on each slot entry so undo
            // can detect concurrent edits.
            if (undoRef?.id) {
              for (const t of targets) {
                await attachUndoSlotAfter(user.id, undoRef.id, t.meal_plan_id, t.day_of_week, t.meal_type)
              }
            }
            toolResult = { status: 'ok', ...out }
          } catch (err) {
            if (preWriteRecordedForThisCall) {
              try { await supersedeUndo(user.id) } catch {}
              undoRef = null
            }
            toolResult = toolResultFromErr(err)
          }
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
    revalidatePath('/meals')
    revalidatePath('/dashboard')
    revalidatePath('/grocery')
    revalidatePath('/kitchen')
  }

  if (!responseText) {
    if (pendings.length > 0) {
      // Waiting changes always have text. The card lives in `pending[0].card`.
      responseText = pendings.length === 1 && pendings[0].type === 'fill_meal_plan'
        ? 'Your week is ready. Tap Save my week to keep it.'
        : pendings.length === 1
          ? `Ready to go — ${pendings[0].summary} Tap confirm to save.`
          : `Ready to save ${pendings.length} changes. Tap confirm on each card.`
    } else if (executed.length > 0) {
      responseText = latestLabel || `Done — ${executed.length === 1 ? 'change' : `${executed.length} changes`} saved.`
    } else {
      responseText = "Sorry, I couldn't do that, try again."
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
    chips: executed.length > 0 && pendings.length === 0 ? [] : deriveChips(responseText),
    actionExecuted: executed[0]?.type || null,
    actions: executed,
    undo: undoRef,
    pending: pendings,
    card: pendings[0]?.card || null,
    skipped,
  }
}
