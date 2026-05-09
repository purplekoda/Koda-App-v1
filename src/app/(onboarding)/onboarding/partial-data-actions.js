'use server'

import { requireUser } from '@/lib/dal/require-user'
import { apiLimiter } from '@/lib/rate-limit'
import { ok, fail } from '@/lib/action-result'
import { determineManualStep } from '@/lib/onboarding-step-mapping'

// ── Save partial data (merge with existing) ──────────

export async function savePartialDataAction(partialData) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    if (!partialData || typeof partialData !== 'object') {
      return fail('Invalid partial data.')
    }

    const { isMockMode } = await import('@/lib/dal/require-user')
    const { updateOnboardingProfile } = await import('@/lib/dal/onboarding')

    // Load existing partial data and merge
    let existing = {}
    if (isMockMode()) {
      const { getMockOnboardingProfile } = await import('@/lib/dal/mock-store')
      existing = getMockOnboardingProfile().onboarding_partial_data || {}
    } else {
      const { getSupabaseServerClient } = await import('@/lib/supabase/server')
      const supabase = await getSupabaseServerClient()
      const { data } = await supabase
        .from('profiles')
        .select('onboarding_partial_data')
        .eq('id', user.id)
        .single()
      existing = data?.onboarding_partial_data || {}
    }

    const merged = mergePartialData(existing, partialData)
    await updateOnboardingProfile(user.id, { onboarding_partial_data: merged })
    return ok(merged)
  } catch {
    return fail('Could not save partial data.')
  }
}

// ── Switch to manual: extract + merge + save ─────────

export async function switchToManualAction({ messages }) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const { updateOnboardingProfile } = await import('@/lib/dal/onboarding')

    // 1. Extract partial data from conversation
    let extractedData = {}
    if (messages?.length > 1) {
      const { extractPartialOnboardingData } = await import('./conversation-actions')
      const extraction = await extractPartialOnboardingData({ messages })
      if (extraction.success && extraction.data) {
        extractedData = extraction.data.data || extraction.data
      }
    }

    // 2. Load existing partial data
    const { isMockMode } = await import('@/lib/dal/require-user')
    let existing = {}
    if (isMockMode()) {
      const { getMockOnboardingProfile } = await import('@/lib/dal/mock-store')
      existing = getMockOnboardingProfile().onboarding_partial_data || {}
    } else {
      const { getSupabaseServerClient } = await import('@/lib/supabase/server')
      const supabase = await getSupabaseServerClient()
      const { data } = await supabase
        .from('profiles')
        .select('onboarding_partial_data')
        .eq('id', user.id)
        .single()
      existing = data?.onboarding_partial_data || {}
    }

    // 3. Merge: existing + extracted (extracted wins on conflicts)
    const merged = mergePartialData(existing, extractedData)
    const targetStep = determineManualStep(merged)

    // 4. Save everything atomically
    await updateOnboardingProfile(user.id, {
      onboarding_mode: 'manual',
      onboarding_partial_data: merged,
      onboarding_step: targetStep,
      onboarding_conversation_history: messages || [],
    })

    return ok({ partialData: merged, targetStep })
  } catch (err) {
    console.error('[switchToManualAction] Error:', err?.message)
    return fail('Could not switch to manual setup.')
  }
}

// ── Switch to voice: save manual data + build context ─

export async function switchToVoiceAction(partialData) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const { updateOnboardingProfile } = await import('@/lib/dal/onboarding')

    // 1. Merge and save partial data
    const { isMockMode } = await import('@/lib/dal/require-user')
    let existing = {}
    if (isMockMode()) {
      const { getMockOnboardingProfile } = await import('@/lib/dal/mock-store')
      existing = getMockOnboardingProfile().onboarding_partial_data || {}
    } else {
      const { getSupabaseServerClient } = await import('@/lib/supabase/server')
      const supabase = await getSupabaseServerClient()
      const { data } = await supabase
        .from('profiles')
        .select('onboarding_partial_data')
        .eq('id', user.id)
        .single()
      existing = data?.onboarding_partial_data || {}
    }

    const merged = mergePartialData(existing, partialData || {})

    await updateOnboardingProfile(user.id, {
      onboarding_mode: 'voice',
      onboarding_partial_data: merged,
    })

    // 2. Build context summary for Gemini
    const contextMessage = buildManualDataSummary(merged)

    return ok({ contextMessage })
  } catch (err) {
    console.error('[switchToVoiceAction] Error:', err?.message)
    return fail('Could not switch to voice setup.')
  }
}

// ── Helpers ──────────────────────────────────────────

function mergePartialData(existing, incoming) {
  const merged = { ...existing }

  for (const [key, value] of Object.entries(incoming)) {
    if (value == null) continue
    // Arrays: take the longer/newer version
    if (Array.isArray(value)) {
      if (!Array.isArray(merged[key]) || value.length > 0) {
        merged[key] = value
      }
    }
    // Objects (non-array): deep merge one level
    else if (typeof value === 'object') {
      merged[key] = { ...(merged[key] || {}), ...value }
    }
    // Scalars: incoming wins
    else {
      merged[key] = value
    }
  }

  return merged
}

function buildManualDataSummary(partialData) {
  const d = partialData
  if (!d || Object.keys(d).length === 0) return ''

  const parts = []

  if (d.household_size) {
    parts.push(`Household of ${d.household_size} people`)
  }
  if (d.members?.length) {
    const memberList = d.members.map(m => {
      let desc = m.name || 'unnamed'
      if (m.age) desc += `, age ${m.age}`
      if (m.allergies?.length) desc += `, allergies: ${m.allergies.join(', ')}`
      if (m.dietary_restrictions?.length) desc += `, dietary: ${m.dietary_restrictions.join(', ')}`
      if (m.is_picky_eater) desc += ', picky eater'
      if (m.track_macros) desc += ', tracks macros'
      return desc
    })
    parts.push(`Members: ${memberList.join('; ')}`)
  }
  if (d.cook_time_preference) {
    parts.push(`Cook time preference: ${d.cook_time_preference.replace(/_/g, ' ')}`)
  }
  if (d.meal_plan_days?.length) {
    const dayNames = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    parts.push(`Meal plan days: ${d.meal_plan_days.map(n => dayNames[n]).join(', ')}`)
  }
  if (d.dietary_restrictions?.length) {
    parts.push(`Dietary restrictions: ${d.dietary_restrictions.join(', ')}`)
  }
  if (d.cuisines?.length) {
    parts.push(`Favorite cuisines: ${d.cuisines.join(', ')}`)
  }
  if (d.adventurousness) {
    parts.push(`Adventurousness: ${d.adventurousness.replace(/_/g, ' ')}`)
  }
  if (d.meal_prep_style) {
    parts.push(`Meal prep style: ${d.meal_prep_style.replace(/_/g, ' ')}`)
  }
  if (d.cooking_frustrations?.length) {
    parts.push(`Cooking frustrations: ${d.cooking_frustrations.map(f => f.replace(/_/g, ' ')).join(', ')}`)
  }
  if (d.weekly_budget) {
    parts.push(`Weekly budget: $${d.weekly_budget}`)
  }
  if (d.shopping_style) {
    parts.push(`Shopping style: ${d.shopping_style.replace(/_/g, ' ')}`)
  }
  if (d.preferred_stores?.length) {
    parts.push(`Preferred stores: ${d.preferred_stores.join(', ')}`)
  }
  if (d.health_goals?.length) {
    parts.push(`Health goals: ${d.health_goals.map(g => g.replace(/_/g, ' ')).join(', ')}`)
  }
  if (d.faith_practices?.has_faith_practices != null) {
    parts.push(`Faith-based practices: ${d.faith_practices.has_faith_practices ? 'yes' : 'none'}`)
  }

  if (parts.length === 0) return ''

  return `The user has switched back to voice setup. They previously filled in some preferences using manual forms. Here is what has already been confirmed:\n\n${parts.join('\n')}\n\nReview what has already been confirmed and continue the conversation collecting only what is still missing. Do not repeat any questions that have already been answered.`
}
