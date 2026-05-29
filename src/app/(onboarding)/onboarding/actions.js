'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/dal/require-user'
import { apiLimiter } from '@/lib/rate-limit'
import { ok, fail } from '@/lib/action-result'
import { sanitizeString } from '@/lib/sanitize'
import {
  validateHouseholdStep,
  validateHouseholdMember,
  validateCookTimeStep,
  validateMealPlanDaysStep,
  validateAdventurousnessStep,
  validateMealPrepStyleStep,
  validateFrustrationsStep,
  validateBudgetStep,
  validateHealthGoalsStep,
} from '@/lib/validators'
import { updateOnboardingProfile, upsertHouseholdMembers, createInvite } from '@/lib/dal/onboarding'

// ── Helper: advance onboarding_step ───────────────────

async function advanceStep(userId, step, extraUpdates = {}) {
  await updateOnboardingProfile(userId, { onboarding_step: step, ...extraUpdates })
}

// ── Save onboarding mode ──────────────────────────────

export async function saveOnboardingModeAction(mode) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    if (mode !== 'manual' && mode !== 'voice') {
      return fail('Invalid onboarding mode.')
    }

    await updateOnboardingProfile(user.id, { onboarding_mode: mode })
    return ok({ mode })
  } catch {
    return fail('Could not save onboarding mode.')
  }
}

// ── Skip onboarding ───────────────────────────────────

export async function skipOnboardingAction() {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    await updateOnboardingProfile(user.id, {
      onboarding_skipped: true,
      onboarding_completed: true,
    })

    revalidatePath('/dashboard')
  } catch {
    return fail('Could not skip onboarding.')
  }
  redirect('/dashboard')
}

// ── Step 1: Household size ────────────────────────────

export async function saveHouseholdStepAction(formData) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const validation = validateHouseholdStep(formData)
    if (!validation.valid) return fail(validation.errors.join(', '))

    await advanceStep(user.id, 1, validation.data)
    return ok(validation.data)
  } catch {
    return fail('Could not save household info.')
  }
}

// ── Step 1B: Household members ────────────────────────

export async function saveHouseholdMembersAction(members) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    if (!Array.isArray(members)) return fail('Invalid member data.')

    const validated = []
    for (const m of members.slice(0, 10)) {
      const v = validateHouseholdMember(m)
      if (!v.valid) return fail(v.errors.join(', '))
      validated.push(v.data)
    }

    await upsertHouseholdMembers(user.id, validated)
    await advanceStep(user.id, 2)
    return ok(validated)
  } catch {
    return fail('Could not save household members.')
  }
}

// ── Step 2: Cook time ────────────��────────────────────

export async function saveCookTimeAction(formData) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const validation = validateCookTimeStep(formData)
    if (!validation.valid) return fail(validation.errors.join(', '))

    await advanceStep(user.id, 3, validation.data)
    return ok(validation.data)
  } catch {
    return fail('Could not save cook time preference.')
  }
}

// ── Step 3: Meal plan days ──────────────��─────────────

export async function saveMealPlanDaysAction(formData) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const validation = validateMealPlanDaysStep(formData)
    if (!validation.valid) return fail(validation.errors.join(', '))

    await advanceStep(user.id, 4, validation.data)
    return ok(validation.data)
  } catch {
    return fail('Could not save meal plan days.')
  }
}

// ── Step 4: Dietary restrictions ──────────────────────

export async function saveDietaryRestrictionsAction(restrictions) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const sanitized = (Array.isArray(restrictions) ? restrictions : [])
      .map(r => sanitizeString(r, 100))
      .filter(Boolean)

    const { isMockMode } = await import('@/lib/dal/require-user')
    if (isMockMode()) {
      const { saveMockDietaryRestrictions } = await import('@/lib/dal/mock-store')
      saveMockDietaryRestrictions(sanitized)
    } else {
      const { getSupabaseServerClient } = await import('@/lib/supabase/server')
      const supabase = await getSupabaseServerClient()

      await supabase
        .from('dietary_restrictions')
        .delete()
        .eq('user_id', user.id)
        .is('family_member_id', null)

      if (sanitized.length > 0) {
        const rows = sanitized.map(restriction => ({
          user_id: user.id,
          restriction,
          family_member_id: null,
        }))
        const { error } = await supabase.from('dietary_restrictions').insert(rows)
        if (error) throw error
      }
    }

    await advanceStep(user.id, 5)
    return ok(sanitized)
  } catch {
    return fail('Could not save dietary restrictions.')
  }
}

// ── Step 5: Cuisines ───────────────────���──────────────

export async function saveCuisinesAction(cuisines) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const sanitized = (Array.isArray(cuisines) ? cuisines : [])
      .slice(0, 20)
      .map(c => sanitizeString(c, 100))
      .filter(Boolean)

    const { saveTasteProfile } = await import('@/lib/dal/taste-profile')
    await saveTasteProfile(user.id, { cuisine_types: sanitized })

    await advanceStep(user.id, 6)
    return ok(sanitized)
  } catch {
    return fail('Could not save cuisine preferences.')
  }
}

// ── Step 6: Adventurousness ──────────────────��────────

export async function saveAdventurousnessAction(formData) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const validation = validateAdventurousnessStep(formData)
    if (!validation.valid) return fail(validation.errors.join(', '))

    await advanceStep(user.id, 7, validation.data)
    return ok(validation.data)
  } catch {
    return fail('Could not save adventurousness preference.')
  }
}

// ── Step 7: Meal prep style ───────────────────────────

export async function saveMealPrepStyleAction(formData) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const validation = validateMealPrepStyleStep(formData)
    if (!validation.valid) return fail(validation.errors.join(', '))

    await advanceStep(user.id, 8, validation.data)
    return ok(validation.data)
  } catch {
    return fail('Could not save meal prep style.')
  }
}

// ── Step 8: Frustrations ───────────────────���──────────

export async function saveFrustrationsAction(formData) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const validation = validateFrustrationsStep(formData)
    if (!validation.valid) return fail(validation.errors.join(', '))

    await advanceStep(user.id, 9, validation.data)
    return ok(validation.data)
  } catch {
    return fail('Could not save frustrations.')
  }
}

// ── Step 9: Budget ────────────────────────────────────

export async function saveBudgetAction(formData) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const validation = validateBudgetStep(formData)
    if (!validation.valid) return fail(validation.errors.join(', '))

    // weekly_budget and monthly_budget go into cooking_preferences JSONB
    const profileUpdates = { budget_priorities: validation.data.budget_priorities }
    const cookingPrefUpdates = {}
    if (validation.data.weekly_budget !== undefined) {
      cookingPrefUpdates.weekly_budget = validation.data.weekly_budget
    }
    if (validation.data.monthly_budget !== undefined) {
      cookingPrefUpdates.monthly_budget = validation.data.monthly_budget
    }
    cookingPrefUpdates.split_monthly_to_weekly = validation.data.split_monthly_to_weekly

    // Shopping style fields go directly on profile
    if (validation.data.shopping_style) {
      profileUpdates.shopping_style = validation.data.shopping_style
    }
    if (validation.data.preferred_delivery_service) {
      profileUpdates.preferred_delivery_service = validation.data.preferred_delivery_service
    }

    // Merge cooking_preferences
    if (Object.keys(cookingPrefUpdates).length > 0) {
      const { isMockMode } = await import('@/lib/dal/require-user')
      if (isMockMode()) {
        const { getMockCookingPreferences, saveMockCookingPreferences } = await import('@/lib/dal/mock-store')
        const existing = getMockCookingPreferences() || {}
        saveMockCookingPreferences({ ...existing, ...cookingPrefUpdates })
      } else {
        const { getSupabaseServerClient } = await import('@/lib/supabase/server')
        const supabase = await getSupabaseServerClient()
        const { data: profile } = await supabase
          .from('profiles')
          .select('cooking_preferences')
          .eq('id', user.id)
          .single()
        const merged = { ...(profile?.cooking_preferences || {}), ...cookingPrefUpdates }
        await supabase
          .from('profiles')
          .update({ cooking_preferences: merged, updated_at: new Date().toISOString() })
          .eq('id', user.id)
      }
    }

    await advanceStep(user.id, 10, profileUpdates)
    return ok(validation.data)
  } catch {
    return fail('Could not save budget preferences.')
  }
}

// ── Step 10: Favorite Stores ─────────────────────────

export async function saveFavoriteStoresAction(formData) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const preferred_stores = (Array.isArray(formData.preferred_stores) ? formData.preferred_stores : [])
      .slice(0, 20)
      .map(s => sanitizeString(s, 100))
      .filter(Boolean)

    const other_store_name = sanitizeString(formData.other_store_name, 100) || ''

    let store_category_assignments = {}
    if (formData.store_category_assignments && typeof formData.store_category_assignments === 'object') {
      for (const [key, cats] of Object.entries(formData.store_category_assignments)) {
        const safeKey = sanitizeString(key, 100)
        if (safeKey && Array.isArray(cats)) {
          store_category_assignments[safeKey] = cats
            .map(c => sanitizeString(c, 50))
            .filter(Boolean)
        }
      }
    }

    const profileUpdates = {
      preferred_stores,
      store_category_assignments,
    }

    // Also sync to grocery_preferences for the grocery page
    const { isMockMode } = await import('@/lib/dal/require-user')
    if (isMockMode()) {
      const { getMockGroceryPreferences, saveMockGroceryPreferences } = await import('@/lib/dal/mock-store')
      const existing = getMockGroceryPreferences()
      const storeList = preferred_stores.map((v, i) => ({
        value: v,
        label: v === 'other' ? (other_store_name || 'Other') : v,
        is_default: i === 0,
        categories: store_category_assignments[v] || [],
      }))
      saveMockGroceryPreferences({
        ...existing,
        store_list: storeList,
        stores: preferred_stores,
        other_store_name,
      })
    } else {
      const { getSupabaseServerClient } = await import('@/lib/supabase/server')
      const supabase = await getSupabaseServerClient()
      const { data: profile } = await supabase
        .from('profiles')
        .select('grocery_preferences')
        .eq('id', user.id)
        .single()
      const existing = profile?.grocery_preferences || {}
      const storeList = preferred_stores.map((v, i) => ({
        value: v,
        label: v === 'other' ? (other_store_name || 'Other') : v,
        is_default: i === 0,
        categories: store_category_assignments[v] || [],
      }))
      const merged = {
        ...existing,
        store_list: storeList,
        stores: preferred_stores,
        other_store_name,
      }
      await supabase
        .from('profiles')
        .update({ grocery_preferences: merged, updated_at: new Date().toISOString() })
        .eq('id', user.id)
    }

    await advanceStep(user.id, 11, profileUpdates)
    return ok({ preferred_stores, store_category_assignments })
  } catch {
    return fail('Could not save store preferences.')
  }
}

// ── Step 11: Health goals + macros ───────────────────

export async function saveHealthGoalsAction(formData) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const validation = validateHealthGoalsStep(formData)
    if (!validation.valid) return fail(validation.errors.join(', '))

    const { health_goals } = validation.data

    const profileUpdates = { health_goals }

    // Save daily carb limit when blood sugar management is selected
    const rawCarbLimit = formData.daily_carb_limit
    if (health_goals.includes('blood_sugar') && rawCarbLimit != null) {
      const carbLimit = Math.max(0, Math.min(500, Math.round(Number(rawCarbLimit))))
      profileUpdates.daily_carb_limit = carbLimit || null
    } else {
      profileUpdates.daily_carb_limit = null
    }

    await advanceStep(user.id, 12, profileUpdates)
    return ok(validation.data)
  } catch {
    return fail('Could not save health goals.')
  }
}

// ── Step 11: Invite family ─────────��──────────────────

export async function createInviteAction() {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const invite = await createInvite(user.id)
    return ok(invite)
  } catch {
    return fail('Could not create invite.')
  }
}

// ── Complete onboarding ────────────────────���──────────

// ── Faith-based practices ─────────────────────────────

export async function saveFaithPracticesOnboardingAction(data) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const { validateFaithPractices } = await import('@/lib/validators')
    const validation = validateFaithPractices(data)
    if (!validation.valid) return fail(validation.errors.join(', '))

    const { saveHouseholdFaithPractices } = await import('@/lib/dal/faith-practices')
    await saveHouseholdFaithPractices(user.id, validation.data)
    await advanceStep(user.id, 12)
    return ok(validation.data)
  } catch {
    return fail('Could not save faith practices.')
  }
}

export async function completeOnboardingAction() {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    await updateOnboardingProfile(user.id, {
      onboarding_completed: true,
      onboarding_step: 13,
    })

    // Auto-enable macro_summary on dashboard if any member tracks macros
    try {
      const { getHouseholdMembers } = await import('@/lib/dal/onboarding')
      const { getDashboardSections, saveDashboardSections } = await import('@/lib/dal/profile')
      const { DEFAULT_SECTIONS } = await import('@/data/dashboard-sections')

      const members = await getHouseholdMembers(user.id)
      const anyTracksMacros = members.some(m => m.track_macros)

      if (anyTracksMacros) {
        const sections = await getDashboardSections(user.id)
        const updated = (sections || DEFAULT_SECTIONS).map(s =>
          s.section_id === 'macro_summary' ? { ...s, is_visible: true } : s
        )
        await saveDashboardSections(user.id, updated)
      }
    } catch {
      // Non-critical — don't block onboarding completion
    }

    revalidatePath('/dashboard')
    revalidatePath('/meals')
    revalidatePath('/settings')
    return ok()
  } catch {
    return fail('Could not complete onboarding.')
  }
}
