import 'server-only'

import { getSupabaseServerClient } from '@/lib/supabase/server'

const MAX_HISTORY = 5

/**
 * Fetch the last N conversation messages for a user+context pair.
 *
 * @param {string} userId
 * @param {string} context
 * @returns {Promise<Array<{ role: 'user'|'model', parts: [{ text: string }] }>>}
 */
export async function getHistory(userId, context) {
  const supabase = await getSupabaseServerClient()

  const { data, error } = await supabase
    .from('ai_conversations')
    .select('messages')
    .eq('user_id', userId)
    .eq('context', context)
    .maybeSingle()

  if (error) {
    // Non-fatal: start a fresh history if the read fails
    console.error('[ai-history] getHistory error:', error.message)
    return []
  }

  return data?.messages ?? []
}

/**
 * Persist the conversation history, keeping only the last MAX_HISTORY messages.
 *
 * @param {string} userId
 * @param {string} context
 * @param {Array<{ role: 'user'|'model', parts: [{ text: string }] }>} messages
 */
export async function saveHistory(userId, context, messages) {
  const supabase = await getSupabaseServerClient()

  const trimmed = messages.slice(-MAX_HISTORY)

  const { error } = await supabase.from('ai_conversations').upsert(
    {
      user_id: userId,
      context,
      messages: trimmed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,context' }
  )

  if (error) {
    // Non-fatal: log but don't block the response
    console.error('[ai-history] saveHistory error:', error.message)
  }
}
