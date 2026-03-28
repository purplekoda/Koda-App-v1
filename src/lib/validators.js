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
