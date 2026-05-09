import 'server-only'

import { isMockMode } from '@/lib/dal/require-user'

/**
 * Data Access Layer for faith-based dietary practices.
 * Reads/writes faith_practices JSONB on profiles (household level)
 * and individual_faith_practices JSONB on household_members (member level).
 */

// ── Household-level faith practices ──────────────────────

export async function getHouseholdFaithPractices(userId) {
  if (isMockMode()) {
    const { getMockHouseholdFaithPractices } = await import('@/lib/dal/mock-store')
    return getMockHouseholdFaithPractices()
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { data } = await supabase
    .from('profiles')
    .select('faith_practices')
    .eq('id', userId)
    .single()

  return data?.faith_practices || { follows_faith_based_diet: false }
}

export async function saveHouseholdFaithPractices(userId, practices) {
  if (isMockMode()) {
    const { saveMockHouseholdFaithPractices } = await import('@/lib/dal/mock-store')
    saveMockHouseholdFaithPractices(practices)
    return practices
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase
    .from('profiles')
    .update({ faith_practices: practices })
    .eq('id', userId)

  if (error) throw new Error('Failed to save faith practices')
  return practices
}

// ── Individual member faith practices ────────────────────

export async function getMemberFaithPractices(userId, memberId) {
  if (isMockMode()) {
    const { getMockMemberFaithPractices } = await import('@/lib/dal/mock-store')
    return getMockMemberFaithPractices(memberId)
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { data } = await supabase
    .from('household_members')
    .select('individual_faith_practices')
    .eq('id', memberId)
    .eq('user_id', userId)
    .single()

  return data?.individual_faith_practices || { follows_individual_faith_diet: false }
}

export async function saveMemberFaithPractices(userId, memberId, practices) {
  if (isMockMode()) {
    const { saveMockMemberFaithPractices } = await import('@/lib/dal/mock-store')
    saveMockMemberFaithPractices(memberId, practices)
    return practices
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase
    .from('household_members')
    .update({ individual_faith_practices: practices })
    .eq('id', memberId)
    .eq('user_id', userId)

  if (error) throw new Error('Failed to save member faith practices')
  return practices
}

// ── Bulk read for all members (used by buildMealPlanPrompt) ──

export async function getAllMemberFaithPractices(userId) {
  if (isMockMode()) {
    const { getMockHouseholdMembers } = await import('@/lib/dal/mock-store')
    const members = getMockHouseholdMembers()
    return members.map(m => ({
      id: m.id,
      name: m.name,
      faith_practices: m.individual_faith_practices || { follows_individual_faith_diet: false },
    }))
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { data } = await supabase
    .from('household_members')
    .select('id, name, individual_faith_practices')
    .eq('user_id', userId)

  return (data || []).map(m => ({
    id: m.id,
    name: m.name,
    faith_practices: m.individual_faith_practices || { follows_individual_faith_diet: false },
  }))
}
