import { sanitizeString, sanitizeEmail, sanitizeInteger, sanitizeEnum, sanitizeJson } from './sanitize'

/**
 * Validation result type: { valid: boolean, data?: object, errors?: string[] }
 */

function makeResult(valid, data = null, errors = []) {
  return { valid, data, errors }
}

/**
 * Validate profile update data.
 */
export function validateProfileUpdate(body) {
  const errors = []
  const data = {}

  if (body.display_name !== undefined) {
    const name = sanitizeString(body.display_name, 100)
    if (!name || name.length < 1) errors.push('Display name is required')
    else data.display_name = name
  }

  if (body.location !== undefined) {
    data.location = sanitizeString(body.location, 200)
  }

  if (body.preferred_store !== undefined) {
    data.preferred_store = sanitizeString(body.preferred_store, 100)
  }

  if (body.onboarding_completed !== undefined) {
    if (typeof body.onboarding_completed !== 'boolean') {
      errors.push('onboarding_completed must be a boolean')
    } else {
      data.onboarding_completed = body.onboarding_completed
    }
  }

  return errors.length > 0
    ? makeResult(false, null, errors)
    : makeResult(true, data)
}

/**
 * Validate family member data.
 */
export function validateFamilyMember(body) {
  const errors = []
  const data = {}

  const name = sanitizeString(body.name, 100)
  if (!name) errors.push('Name is required')
  else data.name = name

  const ageGroup = sanitizeEnum(body.age_group, ['infant', 'toddler', 'child', 'teen', 'adult'])
  if (!ageGroup) errors.push('Invalid age group')
  else data.age_group = ageGroup

  return errors.length > 0
    ? makeResult(false, null, errors)
    : makeResult(true, data)
}

/**
 * Validate meal slot data.
 */
export function validateMealSlot(body) {
  const errors = []
  const data = {}

  const dayOfWeek = sanitizeInteger(body.day_of_week, 1, 7)
  if (dayOfWeek === null) errors.push('day_of_week must be 1-7')
  else data.day_of_week = dayOfWeek

  const mealType = sanitizeEnum(body.meal_type, ['breakfast', 'lunch', 'dinner'])
  if (!mealType) errors.push('Invalid meal type')
  else data.meal_type = mealType

  if (body.recipe_id) {
    data.recipe_id = sanitizeString(body.recipe_id, 36)
  }

  if (body.custom_meal_name) {
    data.custom_meal_name = sanitizeString(body.custom_meal_name, 200)
  }

  if (!data.recipe_id && !data.custom_meal_name) {
    errors.push('Either recipe_id or custom_meal_name is required')
  }

  return errors.length > 0
    ? makeResult(false, null, errors)
    : makeResult(true, data)
}

/**
 * Validate grocery item data.
 */
export function validateGroceryItem(body) {
  const errors = []
  const data = {}

  const name = sanitizeString(body.name, 200)
  if (!name) errors.push('Item name is required')
  else data.name = name

  if (body.quantity !== undefined) {
    data.quantity = sanitizeString(body.quantity, 50)
  }

  if (body.category !== undefined) {
    data.category = sanitizeString(body.category, 100)
  }

  if (body.in_pantry !== undefined) {
    data.in_pantry = Boolean(body.in_pantry)
  }

  return errors.length > 0
    ? makeResult(false, null, errors)
    : makeResult(true, data)
}

/**
 * Validate recipe input (create or update).
 */
export function validateRecipe(body) {
  const errors = []
  const data = {}

  const name = sanitizeString(body.name, 200)
  if (!name) errors.push('Recipe name is required')
  else data.name = name

  if (body.description !== undefined) {
    data.description = sanitizeString(body.description, 1000)
  }

  if (body.instructions !== undefined) {
    data.instructions = sanitizeString(body.instructions, 5000)
  }

  if (body.prep_time_minutes !== undefined && body.prep_time_minutes !== null && body.prep_time_minutes !== '') {
    const prep = sanitizeInteger(body.prep_time_minutes, 0, 1440)
    if (prep === null) errors.push('Prep time must be 0-1440 minutes')
    else data.prep_time_minutes = prep
  }

  if (body.cook_time_minutes !== undefined && body.cook_time_minutes !== null && body.cook_time_minutes !== '') {
    const cook = sanitizeInteger(body.cook_time_minutes, 0, 1440)
    if (cook === null) errors.push('Cook time must be 0-1440 minutes')
    else data.cook_time_minutes = cook
  }

  if (body.servings !== undefined && body.servings !== null && body.servings !== '') {
    const servings = sanitizeInteger(body.servings, 1, 100)
    if (servings === null) errors.push('Servings must be 1-100')
    else data.servings = servings
  }

  if (body.source !== undefined) {
    data.source = sanitizeString(body.source, 500)
  }

  if (Array.isArray(body.ingredients)) {
    data.ingredients = body.ingredients
      .slice(0, 100)
      .map(item => ({
        name: sanitizeString(item?.name, 200),
        quantity: sanitizeString(item?.quantity, 50),
      }))
      .filter(item => item.name)
  } else if (body.ingredients !== undefined) {
    data.ingredients = []
  }

  if (Array.isArray(body.tags)) {
    data.tags = body.tags
      .slice(0, 20)
      .map(tag => sanitizeString(tag, 50))
      .filter(Boolean)
  } else if (body.tags !== undefined) {
    data.tags = []
  }

  if (body.nutrition !== undefined && body.nutrition !== null) {
    const nutrition = sanitizeJson(body.nutrition)
    if (nutrition && typeof nutrition === 'object' && typeof nutrition.calories === 'number') {
      data.nutrition = nutrition
    }
  }

  if (body.nutrition_is_estimated !== undefined) {
    data.nutrition_is_estimated = !!body.nutrition_is_estimated
  }

  if (body.imported_from !== undefined && body.imported_from !== null) {
    data.imported_from = sanitizeString(body.imported_from, 50)
  }

  if (body.imported_at !== undefined && body.imported_at !== null) {
    data.imported_at = body.imported_at
  }

  if (body.image_url !== undefined && body.image_url !== null && typeof body.image_url === 'string') {
    const trimmed = body.image_url.trim()
    // Cap at 400 KB encoded (≈ 300 KB image). Slicing base64 corrupts the URI.
    if (trimmed.length > 400_000) {
      errors.push('Recipe photo is too large. Please use a smaller image.')
    } else if (trimmed.startsWith('data:image/') || trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
      data.image_url = trimmed
    }
  }

  return errors.length > 0
    ? makeResult(false, null, errors)
    : makeResult(true, data)
}

/**
 * Validate cooking preferences.
 */
export function validateCookingPreferences(body) {
  const errors = []
  const data = {}

  if (body.skill_level !== undefined) {
    const skill = sanitizeEnum(body.skill_level, ['beginner', 'intermediate', 'advanced'])
    if (!skill) errors.push('Invalid skill level')
    else data.skill_level = skill
  }

  if (body.time_preference !== undefined) {
    const time = sanitizeEnum(body.time_preference, ['quick', 'medium', 'elaborate'])
    if (!time) errors.push('Invalid time preference')
    else data.time_preference = time
  }

  if (Array.isArray(body.cuisine_preferences)) {
    data.cuisine_preferences = body.cuisine_preferences
      .slice(0, 10)
      .map(c => sanitizeString(c, 50))
      .filter(Boolean)
  }

  if (body.serving_size !== undefined && body.serving_size !== null && body.serving_size !== '') {
    const size = sanitizeInteger(body.serving_size, 1, 20)
    if (size === null) errors.push('Serving size must be 1-20')
    else data.serving_size = size
  }

  if (body.notes !== undefined) {
    data.notes = sanitizeString(body.notes, 300)
  }

  // Macro targets (daily grams)
  if (body.macro_protein !== undefined && body.macro_protein !== null && body.macro_protein !== '') {
    const v = sanitizeInteger(body.macro_protein, 0, 500)
    if (v === null) errors.push('Protein target must be 0-500g')
    else data.macro_protein = v
  }
  if (body.macro_carbs !== undefined && body.macro_carbs !== null && body.macro_carbs !== '') {
    const v = sanitizeInteger(body.macro_carbs, 0, 800)
    if (v === null) errors.push('Carbs target must be 0-800g')
    else data.macro_carbs = v
  }
  if (body.macro_fat !== undefined && body.macro_fat !== null && body.macro_fat !== '') {
    const v = sanitizeInteger(body.macro_fat, 0, 300)
    if (v === null) errors.push('Fat target must be 0-300g')
    else data.macro_fat = v
  }
  if (body.macro_calories !== undefined && body.macro_calories !== null && body.macro_calories !== '') {
    const v = sanitizeInteger(body.macro_calories, 0, 10000)
    if (v === null) errors.push('Calorie target must be 0-10000')
    else data.macro_calories = v
  }

  // Weekly grocery budget
  if (body.weekly_budget !== undefined && body.weekly_budget !== null && body.weekly_budget !== '') {
    const v = sanitizeInteger(body.weekly_budget, 0, 5000)
    if (v === null) errors.push('Weekly budget must be $0-$5000')
    else data.weekly_budget = v
  }

  return errors.length > 0
    ? makeResult(false, null, errors)
    : makeResult(true, data)
}

/**
 * Validate AI prompt input.
 */
export function validateAIPrompt(body) {
  const errors = []

  const prompt = sanitizeString(body.prompt, 500)
  if (!prompt || prompt.length < 1) {
    errors.push('Prompt is required')
    return makeResult(false, null, errors)
  }

  const context = sanitizeEnum(body.context, [
    'dashboard', 'meals', 'grocery', 'pantry', 'recipes', 'events', 'general'
  ]) || 'general'

  return makeResult(true, { prompt, context })
}

/**
 * Validate a single AI-generated meal plan slot.
 * Used to sanitize Gemini output before writing to the database.
 */
export function validateMealPlanSlot(slot) {
  const errors = []
  const data = {}

  const dayOfWeek = sanitizeInteger(slot?.day_of_week, 1, 7)
  if (dayOfWeek === null) errors.push('day_of_week must be 1-7')
  else data.day_of_week = dayOfWeek

  const mealType = sanitizeEnum(slot?.meal_type, ['breakfast', 'lunch', 'dinner'])
  if (!mealType) errors.push('Invalid meal_type')
  else data.meal_type = mealType

  const mealName = sanitizeString(slot?.meal_name, 100)
  if (!mealName) errors.push('meal_name is required')
  else data.meal_name = mealName

  if (slot?.recipe_id != null) {
    const recipeId = sanitizeString(slot.recipe_id, 36)
    // Must look like a UUID (36 chars with hyphens) or be null.
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (recipeId && UUID_RE.test(recipeId)) {
      data.recipe_id = recipeId
    } else {
      data.recipe_id = null
    }
  } else {
    data.recipe_id = null
  }

  return errors.length > 0
    ? makeResult(false, null, errors)
    : makeResult(true, data)
}

// ── Onboarding Validators ──────────────────────────────

/**
 * Validate household step data.
 */
export function validateHouseholdStep(body) {
  const errors = []
  const data = {}

  const size = sanitizeInteger(body.household_size, 1, 10)
  if (size === null) errors.push('Household size must be 1-10')
  else data.household_size = size

  const type = sanitizeEnum(body.household_type, ['includes_kids', 'adults_only', 'varies'])
  if (!type) errors.push('Invalid household type')
  else data.household_type = type

  return errors.length > 0 ? makeResult(false, null, errors) : makeResult(true, data)
}

/**
 * Validate a household member.
 */
export function validateHouseholdMember(body) {
  const errors = []
  const data = {}

  const name = sanitizeString(body.name, 100)
  if (!name) errors.push('Name is required')
  else data.name = name

  if (body.age !== undefined && body.age !== null && body.age !== '') {
    const age = sanitizeInteger(body.age, 0, 120)
    if (age === null) errors.push('Age must be 0-120')
    else data.age = age
  }

  data.is_picky_eater = Boolean(body.is_picky_eater)

  if (Array.isArray(body.picky_issues)) {
    data.picky_issues = body.picky_issues.slice(0, 20).map(i => sanitizeString(i, 100)).filter(Boolean)
  } else {
    data.picky_issues = []
  }

  if (Array.isArray(body.allergies)) {
    data.allergies = body.allergies.slice(0, 20).map(a => sanitizeString(a, 100)).filter(Boolean)
  } else {
    data.allergies = []
  }

  if (Array.isArray(body.dietary_restrictions)) {
    data.dietary_restrictions = body.dietary_restrictions.slice(0, 20).map(d => sanitizeString(d, 100)).filter(Boolean)
  } else {
    data.dietary_restrictions = []
  }

  data.track_macros = Boolean(body.track_macros)
  if (data.track_macros) {
    if (body.macro_calories != null) data.macro_calories = sanitizeInteger(body.macro_calories, 0, 10000)
    if (body.macro_protein_g != null) data.macro_protein_g = sanitizeInteger(body.macro_protein_g, 0, 500)
    if (body.macro_carbs_g != null) data.macro_carbs_g = sanitizeInteger(body.macro_carbs_g, 0, 800)
    if (body.macro_fat_g != null) data.macro_fat_g = sanitizeInteger(body.macro_fat_g, 0, 400)
  }

  return errors.length > 0 ? makeResult(false, null, errors) : makeResult(true, data)
}

/**
 * Validate cook time step.
 */
export function validateCookTimeStep(body) {
  const errors = []
  const data = {}

  const time = sanitizeEnum(body.cook_time_preference, ['under_20', '20_to_40', 'up_to_60', 'depends'])
  if (!time) errors.push('Invalid cook time preference')
  else data.cook_time_preference = time

  return errors.length > 0 ? makeResult(false, null, errors) : makeResult(true, data)
}

/**
 * Validate meal plan days step.
 */
export function validateMealPlanDaysStep(body) {
  const errors = []
  const data = {}

  if (Array.isArray(body.meal_plan_days)) {
    data.meal_plan_days = body.meal_plan_days
      .map(d => sanitizeInteger(d, 1, 7))
      .filter(d => d !== null)
  } else {
    data.meal_plan_days = []
  }

  if (Array.isArray(body.meal_prep_days)) {
    data.meal_prep_days = body.meal_prep_days
      .map(d => sanitizeInteger(d, 1, 7))
      .filter(d => d !== null)
  } else {
    data.meal_prep_days = []
  }

  return makeResult(true, data)
}

/**
 * Validate adventurousness step.
 */
export function validateAdventurousnessStep(body) {
  const errors = []
  const data = {}

  const level = sanitizeEnum(body.adventurousness, ['familiar', 'mix_it_up', 'surprise_me'])
  if (!level) errors.push('Invalid adventurousness level')
  else data.adventurousness = level

  return errors.length > 0 ? makeResult(false, null, errors) : makeResult(true, data)
}

/**
 * Validate meal prep style step.
 */
export function validateMealPrepStyleStep(body) {
  const errors = []
  const data = {}

  const style = sanitizeEnum(body.meal_prep_style, ['meal_prep', 'cook_fresh', 'mix'])
  if (!style) errors.push('Invalid meal prep style')
  else data.meal_prep_style = style

  return errors.length > 0 ? makeResult(false, null, errors) : makeResult(true, data)
}

/**
 * Validate frustrations step.
 */
export function validateFrustrationsStep(body) {
  const errors = []
  const data = {}

  const ALLOWED = ['food_waste', 'deciding', 'not_enough_time', 'grocery_budget', 'boring_meals', 'too_many_trips', 'eating_healthy']

  if (Array.isArray(body.cooking_frustrations) && body.cooking_frustrations.length > 0) {
    data.cooking_frustrations = body.cooking_frustrations
      .map(f => sanitizeEnum(f, ALLOWED))
      .filter(Boolean)
    if (data.cooking_frustrations.length === 0) errors.push('Select at least one frustration')
  } else {
    errors.push('Select at least one frustration')
  }

  return errors.length > 0 ? makeResult(false, null, errors) : makeResult(true, data)
}

/**
 * Validate budget step.
 */
export function validateBudgetStep(body) {
  const errors = []
  const data = {}

  if (body.weekly_budget !== undefined && body.weekly_budget !== null && body.weekly_budget !== '') {
    const v = sanitizeInteger(body.weekly_budget, 0, 5000)
    if (v === null) errors.push('Weekly budget must be $0-$5000')
    else data.weekly_budget = v
  }

  const ALLOWED_PRIORITIES = ['fewer_trips', 'buy_bulk', 'store_brands', 'fresh_over_frozen', 'frozen_fine', 'organic']
  if (Array.isArray(body.budget_priorities)) {
    data.budget_priorities = body.budget_priorities
      .map(p => sanitizeEnum(p, ALLOWED_PRIORITIES))
      .filter(Boolean)
  } else {
    data.budget_priorities = []
  }

  // Shopping style (added to budget step)
  if (body.shopping_style) {
    const style = sanitizeEnum(body.shopping_style, ['deal_hunter', 'convenience', 'pickup_only', 'delivery_preferred', 'flexible'])
    if (style) data.shopping_style = style
  }

  if (body.preferred_delivery_service) {
    const svc = sanitizeEnum(body.preferred_delivery_service, ['instacart', 'doordash', 'walmart_plus', 'amazon_fresh', 'other'])
    if (svc) data.preferred_delivery_service = svc
  }

  return errors.length > 0 ? makeResult(false, null, errors) : makeResult(true, data)
}

/**
 * Validate health goals step.
 */
export function validateHealthGoalsStep(body) {
  const errors = []
  const data = {}

  const ALLOWED_GOALS = ['weight_loss', 'muscle_gain', 'maintenance', 'more_energy', 'heart_health', 'track_macros', 'gut_health', 'blood_sugar', 'just_eating_well']

  if (Array.isArray(body.health_goals)) {
    data.health_goals = body.health_goals
      .map(g => sanitizeEnum(g, ALLOWED_GOALS))
      .filter(Boolean)
  } else {
    data.health_goals = []
  }

  return errors.length > 0 ? makeResult(false, null, errors) : makeResult(true, data)
}

/**
 * Validate dietary restriction.
 */
export function validateFaithPractices(body) {
  const errors = []
  const data = {}

  data.follows_faith_based_diet = Boolean(body.follows_faith_based_diet)

  // Validate practices array
  const ALLOWED_PRACTICES = [
    'buddhist', 'catholic_lenten', 'lds', 'orthodox', 'halal',
    'hindu', 'ital', 'jain', 'kosher', 'adventist', 'other',
  ]
  if (Array.isArray(body.household_faith_practices)) {
    data.household_faith_practices = body.household_faith_practices
      .slice(0, 15)
      .map(p => sanitizeEnum(p, ALLOWED_PRACTICES) || sanitizeString(p, 100))
      .filter(Boolean)
  } else {
    data.household_faith_practices = []
  }

  // Validate level fields
  const LEVEL_ENUMS = {
    kosher_level: ['basic', 'traditional', 'certified'],
    halal_level: ['basic', 'certified_meat', 'full'],
    hindu_level: ['beef_free', 'vegetarian', 'strict'],
    jain_level: ['standard', 'strict'],
    buddhist_level: ['vegetarian', 'vegan', 'pungent_free'],
    adventist_level: ['vegetarian', 'kosher_style'],
    ital_level: ['basic', 'strict'],
  }

  for (const [field, allowed] of Object.entries(LEVEL_ENUMS)) {
    if (body[field] !== undefined && body[field] !== null && body[field] !== '') {
      const val = sanitizeEnum(body[field], allowed)
      if (!val) errors.push(`Invalid ${field} value`)
      else data[field] = val
    }
  }

  // Boolean fields
  const BOOL_FIELDS = [
    'catholic_lenten', 'orthodox_fasting', 'orthodox_fasting_calendar',
    'is_lds', 'lds_no_coffee', 'lds_no_alcohol', 'lds_no_black_tea',
  ]
  for (const field of BOOL_FIELDS) {
    if (body[field] !== undefined) {
      data[field] = Boolean(body[field])
    }
  }

  // Freeform custom practice text
  if (body.custom_practice) {
    data.custom_practice = sanitizeString(body.custom_practice, 200)
  }

  return errors.length > 0
    ? makeResult(false, null, errors)
    : makeResult(true, data)
}

export function validateDietaryRestriction(body) {
  const errors = []
  const data = {}

  const restriction = sanitizeEnum(body.restriction, [
    'nut-free', 'lactose-free', 'gluten-free', 'vegetarian',
    'vegan', 'keto', 'pescatarian', 'dairy-free', 'egg-free',
    'soy-free', 'shellfish-free'
  ])
  if (!restriction) {
    // Allow custom restriction but sanitize it
    const custom = sanitizeString(body.restriction, 50)
    if (!custom) errors.push('Restriction is required')
    else data.restriction = custom
  } else {
    data.restriction = restriction
  }

  if (body.family_member_id) {
    data.family_member_id = sanitizeString(body.family_member_id, 36)
  }

  return errors.length > 0
    ? makeResult(false, null, errors)
    : makeResult(true, data)
}

// ── Macro Extra ───────────────────────────────────────

const MEAL_TIME_VALUES = [
  'breakfast_addition', 'morning_snack', 'lunch_addition',
  'afternoon_snack', 'evening_snack',
]

export function validateMacroExtra(body) {
  const errors = []
  const data = {}

  const foodName = sanitizeString(body.food_name, 200)
  if (!foodName) errors.push('Food name is required')
  else data.food_name = foodName

  const mealTime = sanitizeEnum(body.meal_time, MEAL_TIME_VALUES)
  if (!mealTime) errors.push('Invalid meal time')
  else data.meal_time = mealTime

  const memberId = sanitizeString(body.member_id, 36)
  if (!memberId) errors.push('Member is required')
  else data.member_id = memberId

  const calories = sanitizeInteger(body.calories, 0, 10000)
  if (calories === null) errors.push('Calories must be 0-10,000')
  else data.calories = calories

  // Protein, carbs, fat — parse as floats with bounds
  for (const key of ['protein', 'carbs', 'fat']) {
    const val = parseFloat(body[key])
    if (isNaN(val) || val < 0 || val > 1000) {
      errors.push(`${key.charAt(0).toUpperCase() + key.slice(1)} must be 0-1,000`)
    } else {
      data[key] = Math.round(val * 10) / 10
    }
  }

  // Optional fields
  if (body.label_found !== undefined) data.label_found = !!body.label_found
  if (body.confidence) data.confidence = sanitizeEnum(body.confidence, ['low', 'medium', 'high'])
  if (body.gemini_notes) data.gemini_notes = sanitizeString(body.gemini_notes, 500)
  if (body.photo_url) data.photo_url = sanitizeString(body.photo_url, 2000)

  return errors.length > 0
    ? makeResult(false, null, errors)
    : makeResult(true, data)
}

// ── Dashboard Sections ───────────────────────────────

import { VALID_SECTION_IDS } from '@/data/dashboard-sections'

export function validateDashboardSections(sections) {
  const errors = []

  if (!Array.isArray(sections)) {
    return makeResult(false, null, ['Sections must be an array'])
  }

  if (sections.length > 20) {
    return makeResult(false, null, ['Too many sections'])
  }

  const seenIds = new Set()
  const data = []

  for (let i = 0; i < sections.length; i++) {
    const s = sections[i]

    if (!s || typeof s !== 'object') {
      errors.push(`Section ${i} is invalid`)
      continue
    }

    const sectionId = sanitizeString(s.section_id, 50)
    if (!sectionId || !VALID_SECTION_IDS.has(sectionId)) {
      errors.push(`Section ${i} has invalid section_id`)
      continue
    }

    if (seenIds.has(sectionId)) {
      errors.push(`Duplicate section_id: ${sectionId}`)
      continue
    }
    seenIds.add(sectionId)

    const sortOrder = sanitizeInteger(s.sort_order, 0, 100)
    if (sortOrder === null) {
      errors.push(`Section ${i} has invalid sort_order`)
      continue
    }

    data.push({
      section_id: sectionId,
      is_visible: sectionId === 'todays_meals' ? true : !!s.is_visible,
      sort_order: sortOrder,
    })
  }

  return errors.length > 0
    ? makeResult(false, null, errors)
    : makeResult(true, data)
}
