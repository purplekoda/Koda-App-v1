'use server'

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
import { updateOnboardingProfile, upsertHouseholdMembers } from '@/lib/dal/onboarding'

function revalidateSettings() {
  revalidatePath('/settings')
  revalidatePath('/meals')
  revalidatePath('/grocery')
}

// ── Household size ───────────────────────────────────

export async function saveHouseholdSettingsAction(formData) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const validation = validateHouseholdStep(formData)
    if (!validation.valid) return fail(validation.errors.join(', '))

    await updateOnboardingProfile(user.id, validation.data)
    revalidateSettings()
    return ok(validation.data)
  } catch {
    return fail('Could not save household info.')
  }
}

// ── Household members ────────────────────────────────

export async function saveHouseholdMembersSettingsAction(members) {
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
    revalidateSettings()
    return ok(validated)
  } catch {
    return fail('Could not save household members.')
  }
}

// ── Cook time ────────────────────────────────────────

export async function saveCookTimeSettingsAction(formData) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const validation = validateCookTimeStep(formData)
    if (!validation.valid) return fail(validation.errors.join(', '))

    await updateOnboardingProfile(user.id, validation.data)
    revalidateSettings()
    return ok(validation.data)
  } catch {
    return fail('Could not save cook time preference.')
  }
}

// ── Meal plan days ───────────────────────────────────

export async function saveMealPlanDaysSettingsAction(formData) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const validation = validateMealPlanDaysStep(formData)
    if (!validation.valid) return fail(validation.errors.join(', '))

    await updateOnboardingProfile(user.id, validation.data)
    revalidateSettings()
    return ok(validation.data)
  } catch {
    return fail('Could not save meal plan days.')
  }
}

// ── Dietary restrictions ─────────────────────────────

export async function saveDietaryRestrictionsSettingsAction(restrictions) {
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

    revalidateSettings()
    return ok(sanitized)
  } catch {
    return fail('Could not save dietary restrictions.')
  }
}

// ── Cuisines ─────────────────────────────────────────

export async function saveCuisinesSettingsAction(cuisines) {
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

    revalidateSettings()
    return ok(sanitized)
  } catch {
    return fail('Could not save cuisine preferences.')
  }
}

// ── Adventurousness (recipe style) ───────────────────

export async function saveRecipeStyleSettingsAction(formData) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const validation = validateAdventurousnessStep(formData)
    if (!validation.valid) return fail(validation.errors.join(', '))

    await updateOnboardingProfile(user.id, validation.data)
    revalidateSettings()
    return ok(validation.data)
  } catch {
    return fail('Could not save recipe style preference.')
  }
}

// ── Meal prep style ──────────────────────────────────

export async function saveMealPrepStyleSettingsAction(formData) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const validation = validateMealPrepStyleStep(formData)
    if (!validation.valid) return fail(validation.errors.join(', '))

    await updateOnboardingProfile(user.id, validation.data)
    revalidateSettings()
    return ok(validation.data)
  } catch {
    return fail('Could not save meal prep style.')
  }
}

// ── Frustrations ─────────────────────────────────────

export async function saveFrustrationsSettingsAction(formData) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const validation = validateFrustrationsStep(formData)
    if (!validation.valid) return fail(validation.errors.join(', '))

    await updateOnboardingProfile(user.id, validation.data)
    revalidateSettings()
    return ok(validation.data)
  } catch {
    return fail('Could not save frustrations.')
  }
}

// ── Budget ───────────────────────────────────────────

export async function saveBudgetSettingsAction(formData) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const validation = validateBudgetStep(formData)
    if (!validation.valid) return fail(validation.errors.join(', '))

    const profileUpdates = { budget_priorities: validation.data.budget_priorities }
    const cookingPrefUpdates = {}
    if (validation.data.weekly_budget !== undefined) {
      cookingPrefUpdates.weekly_budget = validation.data.weekly_budget
    }
    if (validation.data.shopping_style) {
      profileUpdates.shopping_style = validation.data.shopping_style
    }
    if (validation.data.preferred_delivery_service) {
      profileUpdates.preferred_delivery_service = validation.data.preferred_delivery_service
    }

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

    await updateOnboardingProfile(user.id, profileUpdates)
    revalidateSettings()
    return ok(validation.data)
  } catch {
    return fail('Could not save budget preferences.')
  }
}

// ── Favorite stores ──────────────────────────────────

export async function saveFavoriteStoresSettingsAction(formData) {
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

    const profileUpdates = { preferred_stores, store_category_assignments }

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
      const merged = { ...existing, store_list: storeList, stores: preferred_stores, other_store_name }
      await supabase
        .from('profiles')
        .update({ grocery_preferences: merged, updated_at: new Date().toISOString() })
        .eq('id', user.id)
    }

    await updateOnboardingProfile(user.id, profileUpdates)
    revalidateSettings()
    return ok({ preferred_stores, store_category_assignments })
  } catch {
    return fail('Could not save store preferences.')
  }
}

// ── Health goals ─────────────────────────────────────

export async function saveHealthGoalsSettingsAction(formData) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const validation = validateHealthGoalsStep(formData)
    if (!validation.valid) return fail(validation.errors.join(', '))

    const { health_goals } = validation.data
    const profileUpdates = { health_goals }

    await updateOnboardingProfile(user.id, profileUpdates)
    revalidateSettings()
    return ok(validation.data)
  } catch {
    return fail('Could not save health goals.')
  }
}

// ── Faith practices ──────────────────────────────────

export async function saveFaithPracticesSettingsAction(data) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const { validateFaithPractices } = await import('@/lib/validators')
    const validation = validateFaithPractices(data)
    if (!validation.valid) return fail(validation.errors.join(', '))

    const { saveHouseholdFaithPractices } = await import('@/lib/dal/faith-practices')
    await saveHouseholdFaithPractices(user.id, validation.data)
    revalidateSettings()
    return ok(validation.data)
  } catch {
    return fail('Could not save faith practices.')
  }
}
