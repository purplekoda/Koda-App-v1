import 'server-only'

import { isMockMode } from './require-user'

// ── Onboarding Status ─────────────────────────────────

export async function getOnboardingStatus(userId) {
  if (isMockMode()) {
    const { getMockOnboardingProfile } = await import('./mock-store')
    const p = getMockOnboardingProfile()
    return {
      onboarding_completed: p.onboarding_completed,
      onboarding_skipped: p.onboarding_skipped,
      onboarding_step: p.onboarding_step,
      onboarding_mode: p.onboarding_mode || null,
    }
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()

  // First try with all onboarding columns
  const { data, error } = await supabase
    .from('profiles')
    .select('onboarding_completed, onboarding_skipped, onboarding_step, onboarding_mode')
    .eq('id', userId)
    .single()

  // If the query fails (e.g. columns don't exist yet), fall back to just onboarding_completed
  if (error) {
    const { data: fallback } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', userId)
      .single()

    // If even that fails, assume completed to avoid redirect loops
    if (!fallback) return { onboarding_completed: true, onboarding_skipped: false, onboarding_step: 0 }

    return {
      onboarding_completed: fallback.onboarding_completed ?? true,
      onboarding_skipped: false,
      onboarding_step: 0,
    }
  }

  return {
    onboarding_completed: data?.onboarding_completed ?? false,
    onboarding_skipped: data?.onboarding_skipped ?? false,
    onboarding_step: data?.onboarding_step ?? 0,
    onboarding_mode: data?.onboarding_mode ?? null,
  }
}

// ── Full Onboarding Profile ───────────────────────────

const ONBOARDING_COLUMNS = [
  'onboarding_completed', 'onboarding_skipped', 'onboarding_step', 'onboarding_mode',
  'onboarding_conversation_history', 'onboarding_partial_data',
  'household_size', 'household_type', 'cook_time_preference',
  'meal_plan_days', 'meal_prep_days', 'adventurousness', 'meal_prep_style',
  'cooking_frustrations', 'health_goals', 'track_macros',
  'budget_priorities', 'cooking_preferences',
  'shopping_style', 'preferred_delivery_service', 'preferred_stores',
  'store_category_assignments', 'location_state',
].join(', ')

export async function getOnboardingProfile(userId) {
  if (isMockMode()) {
    const { getMockOnboardingProfile, getMockCookingPreferences } = await import('./mock-store')
    return { ...getMockOnboardingProfile(), cooking_preferences: getMockCookingPreferences() }
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()

  // Try full onboarding columns first
  const { data, error } = await supabase
    .from('profiles')
    .select(ONBOARDING_COLUMNS)
    .eq('id', userId)
    .single()

  if (!error && data) return data

  // Fallback: columns may not exist yet — return safe defaults
  const { data: basic } = await supabase
    .from('profiles')
    .select('onboarding_completed, cooking_preferences')
    .eq('id', userId)
    .single()

  return {
    onboarding_completed: basic?.onboarding_completed ?? false,
    onboarding_skipped: false,
    onboarding_step: 0,
    household_size: 2,
    household_type: null,
    cook_time_preference: null,
    meal_plan_days: [],
    meal_prep_days: [],
    adventurousness: null,
    meal_prep_style: null,
    cooking_frustrations: [],
    health_goals: [],
    track_macros: false,
    budget_priorities: [],
    cooking_preferences: basic?.cooking_preferences || null,
  }
}

export async function updateOnboardingProfile(userId, updates) {
  if (isMockMode()) {
    const { saveMockOnboardingProfile } = await import('./mock-store')
    return saveMockOnboardingProfile(updates)
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) throw new Error('Failed to update onboarding profile')
  return updates
}

// ── Household Members ─────────────────────────────────

export async function getHouseholdMembers(userId) {
  if (isMockMode()) {
    const { getMockHouseholdMembers } = await import('./mock-store')
    return getMockHouseholdMembers()
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('household_members')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) return []
  return data || []
}

export async function upsertHouseholdMembers(userId, members) {
  if (isMockMode()) {
    const { saveMockHouseholdMembers } = await import('./mock-store')
    return saveMockHouseholdMembers(members)
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()

  // Delete existing members and re-insert (atomic replace)
  await supabase.from('household_members').delete().eq('user_id', userId)

  if (members.length === 0) return []

  const rows = members.map(m => ({
    user_id: userId,
    name: m.name,
    age: m.age ?? null,
    is_picky_eater: m.is_picky_eater ?? false,
    picky_issues: m.picky_issues || [],
    allergies: m.allergies || [],
    dietary_restrictions: m.dietary_restrictions || [],
    track_macros: m.track_macros ?? false,
    macro_calories: m.macro_calories ?? null,
    macro_protein_g: m.macro_protein_g ?? null,
    macro_carbs_g: m.macro_carbs_g ?? null,
    macro_fat_g: m.macro_fat_g ?? null,
  }))

  const { data, error } = await supabase
    .from('household_members')
    .insert(rows)
    .select()

  if (error) throw new Error('Failed to save household members')
  return data || []
}

// ── Invites ───────────────────────────────────────────

function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function createInvite(userId) {
  const code = generateInviteCode()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  if (isMockMode()) {
    const { addMockInvite } = await import('./mock-store')
    return addMockInvite({ inviter_id: userId, invite_code: code, expires_at: expiresAt })
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('invites')
    .insert({
      inviter_id: userId,
      invite_code: code,
      status: 'pending',
      expires_at: expiresAt,
    })
    .select()
    .single()

  if (error) throw new Error('Failed to create invite')
  return data
}

export async function getInvites(userId) {
  if (isMockMode()) {
    const { getMockInvites } = await import('./mock-store')
    return getMockInvites()
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('invites')
    .select('*')
    .eq('inviter_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) return []
  return data || []
}
