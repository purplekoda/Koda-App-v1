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

  const dayOfWeek = sanitizeInteger(body.day_of_week, 1, 5)
  if (dayOfWeek === null) errors.push('day_of_week must be 1-5')
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

  if (body.image_url !== undefined && body.image_url !== null) {
    const url = sanitizeString(body.image_url, 500_000)
    if (url) data.image_url = url
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
 * Validate dietary restriction.
 */
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
