'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/dal/require-user'
import { apiLimiter } from '@/lib/rate-limit'
import { ok, fail } from '@/lib/action-result'
import { validateProfileUpdate, validateCookingPreferences } from '@/lib/validators'
import { sanitizeString, sanitizeEnum } from '@/lib/sanitize'
import { getProfile, updateProfile, saveGroceryPreferences, saveRecipeCardSettings } from '@/lib/dal/profile'
import { saveVoiceSettings, getVoiceSettings } from '@/lib/dal/voice-settings'
import { saveCookingPreferences } from '@/lib/dal/cooking-preferences'
import { GROCERY_STORES, FULFILLMENT_OPTIONS } from '@/data/grocery-stores'

export async function saveProfileAction(formData) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const validation = validateProfileUpdate({
      display_name: formData.display_name,
      location: formData.location,
      preferred_store: formData.preferred_store,
    })
    if (!validation.valid) return fail(validation.errors.join(', '))

    // family_name is not in validateProfileUpdate, sanitize separately
    const updates = { ...validation.data }
    if (formData.family_name !== undefined) {
      updates.family_name = sanitizeString(formData.family_name, 100)
    }

    await updateProfile(user.id, updates)
    revalidatePath('/settings')
    return ok(updates)
  } catch {
    return fail('Could not save profile.')
  }
}

export async function saveCookingPreferencesAction(formData) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const validation = validateCookingPreferences(formData)
    if (!validation.valid) return fail(validation.errors.join(', '))

    await saveCookingPreferences(user.id, validation.data)
    revalidatePath('/settings')
    return ok(validation.data)
  } catch {
    return fail('Could not save preferences.')
  }
}

export async function saveDietaryRestrictionsAction(restrictions) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const ALLOWED = [
      'nut-free', 'lactose-free', 'gluten-free', 'vegetarian',
      'vegan', 'keto', 'pescatarian', 'dairy-free', 'egg-free',
      'soy-free', 'shellfish-free',
    ]

    const sanitized = (Array.isArray(restrictions) ? restrictions : [])
      .map(r => sanitizeEnum(r, ALLOWED))
      .filter(Boolean)

    const { isMockMode } = await import('@/lib/dal/require-user')
    if (isMockMode()) {
      const { saveMockDietaryRestrictions } = await import('@/lib/dal/mock-store')
      saveMockDietaryRestrictions(sanitized)
      return ok(sanitized)
    }

    const { getSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = await getSupabaseServerClient()

    // Replace all user-level restrictions atomically
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

    revalidatePath('/settings')
    return ok(sanitized)
  } catch {
    return fail('Could not save dietary restrictions.')
  }
}

export async function saveGroceryPreferencesAction(formData) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const VALID_STORES = GROCERY_STORES.map(s => s.value)
    const VALID_FULFILLMENT = FULFILLMENT_OPTIONS.map(f => f.value)
    const VALID_CATEGORIES = ['Produce','Meat','Dairy','Pantry','Snacks','Frozen','Household','Specialty','Organic']

    // Rich store_list from the grocery store settings page
    const store_list = Array.isArray(formData.store_list)
      ? formData.store_list.map(s => ({
          value: sanitizeEnum(s.value, VALID_STORES) || 'other',
          label: sanitizeString(s.label, 100) || s.value,
          is_default: Boolean(s.is_default),
          categories: (Array.isArray(s.categories) ? s.categories : [])
            .map(c => sanitizeEnum(c, VALID_CATEGORIES))
            .filter(Boolean),
        })).filter(s => s.value)
      : []

    // Derive flat stores array for backward compat (header component)
    const stores = store_list.map(s => s.value)
    const other_store_name = store_list.find(s => s.value === 'other')?.label || ''

    const fulfillment = sanitizeEnum(formData.fulfillment, VALID_FULFILLMENT) || ''
    const delivery_address = sanitizeString(formData.delivery_address, 300)
    const split_by_store = Boolean(formData.split_by_store)
    const allow_override = Boolean(formData.allow_override)
    const smart_suggestions = Boolean(formData.smart_suggestions)

    const prefs = {
      store_list, stores, other_store_name,
      fulfillment, delivery_address,
      split_by_store, allow_override, smart_suggestions,
    }
    await saveGroceryPreferences(user.id, prefs)
    revalidatePath('/settings')
    revalidatePath('/settings/grocery-stores')
    revalidatePath('/grocery')
    return ok(prefs)
  } catch {
    return fail('Could not save grocery preferences.')
  }
}

export async function saveShoppingPreferencesAction(formData) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const VALID_STYLES = ['deal_hunter', 'convenience', 'pickup_only', 'delivery_preferred', 'flexible']
    const VALID_SERVICES = ['instacart', 'doordash', 'walmart_plus', 'amazon_fresh', 'other']

    const shopping_style = sanitizeEnum(formData.shopping_style, VALID_STYLES) || null
    const preferred_delivery_service = sanitizeEnum(formData.preferred_delivery_service, VALID_SERVICES) || null

    const updates = { shopping_style, preferred_delivery_service }

    const { isMockMode } = await import('@/lib/dal/require-user')
    if (isMockMode()) {
      const { saveMockProfile, saveMockOnboardingProfile } = await import('@/lib/dal/mock-store')
      saveMockProfile(updates)
      saveMockOnboardingProfile(updates)
    } else {
      await updateProfile(user.id, updates)
    }

    revalidatePath('/settings')
    revalidatePath('/settings/shopping-preferences')
    revalidatePath('/grocery')
    return ok(updates)
  } catch {
    return fail('Could not save shopping preferences.')
  }
}

const RECIPE_CARD_DEFAULTS = {
  show_photo: true,
  show_description: true,
  show_cook_time: true,
  show_servings: true,
  show_categories: true,
  show_macros: false,
  show_rating: true,
  show_review_count: false,
  show_difficulty: false,
  show_source: false,
  show_calories: true,
  show_protein: true,
  show_carbs: true,
  show_fat: true,
  card_layout: 'grid',
  photo_position: 'right',
}

export async function saveRecipeCardSettingsAction(formData) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const VALID_LAYOUTS = ['grid', 'list']
    const VALID_POSITIONS = ['right', 'top']

    const settings = {
      show_photo: Boolean(formData.show_photo),
      show_description: Boolean(formData.show_description),
      show_cook_time: Boolean(formData.show_cook_time),
      show_servings: Boolean(formData.show_servings),
      show_categories: Boolean(formData.show_categories),
      show_macros: Boolean(formData.show_macros),
      show_rating: Boolean(formData.show_rating),
      show_review_count: Boolean(formData.show_review_count),
      show_difficulty: Boolean(formData.show_difficulty),
      show_source: Boolean(formData.show_source),
      show_calories: Boolean(formData.show_calories),
      show_protein: Boolean(formData.show_protein),
      show_carbs: Boolean(formData.show_carbs),
      show_fat: Boolean(formData.show_fat),
      card_layout: sanitizeEnum(formData.card_layout, VALID_LAYOUTS) || 'grid',
      photo_position: sanitizeEnum(formData.photo_position, VALID_POSITIONS) || 'right',
    }

    await saveRecipeCardSettings(user.id, settings)
    revalidatePath('/settings')
    revalidatePath('/settings/recipe-card')
    revalidatePath('/recipes')
    return ok(settings)
  } catch {
    return fail('Could not save recipe card settings.')
  }
}

export async function resetRecipeCardSettingsAction() {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    await saveRecipeCardSettings(user.id, RECIPE_CARD_DEFAULTS)
    revalidatePath('/settings')
    revalidatePath('/settings/recipe-card')
    revalidatePath('/recipes')
    return ok(RECIPE_CARD_DEFAULTS)
  } catch {
    return fail('Could not reset recipe card settings.')
  }
}

export async function saveTasteProfileAction(formData) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const safeArray = (arr) => (Array.isArray(arr) ? arr : [])
      .map(v => sanitizeString(v, 100))
      .filter(Boolean)

    const updates = {
      cuisine_types: safeArray(formData.cuisine_types),
      cooking_styles: safeArray(formData.cooking_styles),
      protein_preferences: safeArray(formData.protein_preferences),
      flavor_profiles: safeArray(formData.flavor_profiles),
      avoided_ingredients: safeArray(formData.avoided_ingredients),
    }

    const { saveTasteProfile } = await import('@/lib/dal/taste-profile')
    await saveTasteProfile(user.id, updates)
    revalidatePath('/settings')
    return ok(updates)
  } catch {
    return fail('Could not save taste profile.')
  }
}

export async function saveVoiceSettingsAction(formData) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const settings = {
      voice_responses_enabled: Boolean(formData.voice_responses_enabled),
      hands_free_chat_enabled: Boolean(formData.hands_free_chat_enabled),
    }

    await saveVoiceSettings(user.id, settings)
    revalidatePath('/settings')
    revalidatePath('/settings/voice')
    return ok(settings)
  } catch {
    return fail('Could not save voice settings.')
  }
}

/**
 * Toggle photo macro logging for a household member.
 */
export async function saveMacroLoggingSettingsAction(memberId, allowed) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const cleanId = sanitizeString(memberId, 36)
    if (!cleanId) return fail('Invalid member')

    const { isMockMode } = await import('@/lib/dal/require-user')

    if (isMockMode()) {
      // In mock mode, just acknowledge — the toggle is cosmetic
      revalidatePath('/settings')
      revalidatePath('/settings/macro-logging')
      revalidatePath('/macros')
      return ok({ memberId: cleanId, allow_photo_macro_logging: Boolean(allowed) })
    }

    // Production: update household_members row
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { error } = await supabase
      .from('household_members')
      .update({ allow_photo_macro_logging: Boolean(allowed) })
      .eq('id', cleanId)
      .eq('user_id', user.id)

    if (error) return fail('Could not update setting.')

    revalidatePath('/settings')
    revalidatePath('/settings/macro-logging')
    revalidatePath('/macros')
    return ok({ memberId: cleanId, allow_photo_macro_logging: Boolean(allowed) })
  } catch {
    return fail('Could not save macro logging settings.')
  }
}

export async function toggleHandsFreeAction(enabled) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const current = await getVoiceSettings(user.id)
    const updated = { ...current, hands_free_chat_enabled: Boolean(enabled) }
    await saveVoiceSettings(user.id, updated)
    return ok(updated)
  } catch {
    return fail('Could not save hands-free preference.')
  }
}
