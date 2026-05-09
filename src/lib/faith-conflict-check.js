import {
  FAITH_PRACTICE_OPTIONS,
  FAITH_DIET_AUTO_MAPPINGS,
  FAITH_CONFLICT_KEYWORDS,
  ALCOHOL_SUBSTITUTIONS,
} from '@/data/faith-practices'

/**
 * Compute auto-applied dietary restrictions from active faith practices.
 *
 * @param {Object} faithPractices - The faith_practices JSONB object
 * @returns {string[]} Array of restriction keys to auto-apply
 */
export function getAutoAppliedRestrictions(faithPractices) {
  if (!faithPractices?.follows_faith_based_diet) return []

  const restrictions = new Set()
  const practices = faithPractices.household_faith_practices || []

  for (const practiceId of practices) {
    const practice = FAITH_PRACTICE_OPTIONS.find(p => p.id === practiceId)
    if (!practice) continue

    // Build the mapping key: practiceId_level or just practiceId for booleans
    if (practice.selectType === 'single' && practice.levelField) {
      const level = faithPractices[practice.levelField]
      if (level) {
        const key = `${practiceId}_${level}`
        const mapped = FAITH_DIET_AUTO_MAPPINGS[key]
        if (mapped) mapped.forEach(r => restrictions.add(r))
      }
    } else if (practice.selectType === 'multi_toggle' && practiceId === 'lds') {
      if (faithPractices.lds_no_coffee) {
        FAITH_DIET_AUTO_MAPPINGS.lds_no_coffee?.forEach(r => restrictions.add(r))
      }
      if (faithPractices.lds_no_alcohol) {
        FAITH_DIET_AUTO_MAPPINGS.lds_no_alcohol?.forEach(r => restrictions.add(r))
      }
      if (faithPractices.lds_no_black_tea) {
        FAITH_DIET_AUTO_MAPPINGS.lds_no_black_tea?.forEach(r => restrictions.add(r))
      }
    } else if (practice.selectType === 'boolean' || practice.selectType === 'boolean_with_toggle') {
      const key = practiceId === 'orthodox' ? 'orthodox_fasting' : practiceId
      const mapped = FAITH_DIET_AUTO_MAPPINGS[key]
      if (mapped) mapped.forEach(r => restrictions.add(r))
    }
  }

  return [...restrictions]
}

/**
 * Check recipe ingredients for conflicts with active faith practices.
 *
 * @param {Array} ingredients - Recipe ingredients (strings or objects with .name)
 * @param {Object} faithPractices - Household-level faith_practices JSONB
 * @param {Array} [memberFaithPractices] - Array of per-member faith practices
 * @returns {{ hasConflict: boolean, conflicts: Array<{ practice: string, ingredient: string, reason: string }> }}
 */
export function checkFaithConflicts(ingredients, faithPractices, memberFaithPractices = []) {
  const conflicts = []

  // Collect all active restrictions from household + members
  const allRestrictions = new Set()

  const householdRestrictions = getAutoAppliedRestrictions(faithPractices)
  householdRestrictions.forEach(r => allRestrictions.add(r))

  for (const member of memberFaithPractices) {
    const memberRestrictions = getAutoAppliedRestrictions(member.faith_practices || member)
    memberRestrictions.forEach(r => allRestrictions.add(r))
  }

  if (allRestrictions.size === 0) return { hasConflict: false, conflicts }

  // Normalize ingredients to lowercase strings
  const ingredientNames = ingredients.map(i =>
    (typeof i === 'string' ? i : i.name || i.ingredient_name || '').toLowerCase()
  )

  for (const restriction of allRestrictions) {
    const keywords = FAITH_CONFLICT_KEYWORDS[restriction]
    if (!keywords || keywords.length === 0) continue

    for (const ingredientName of ingredientNames) {
      for (const keyword of keywords) {
        if (ingredientName.includes(keyword.toLowerCase())) {
          // Find which practice this restriction came from
          const practiceName = getPracticeNameForRestriction(restriction, faithPractices, memberFaithPractices)
          conflicts.push({
            practice: practiceName,
            ingredient: ingredientName,
            reason: `Contains "${keyword}" which conflicts with ${restriction.replace(/-/g, ' ').replace('no ', '')} restriction`,
          })
          break // One conflict per ingredient is enough
        }
      }
    }
  }

  return { hasConflict: conflicts.length > 0, conflicts }
}

/**
 * Get alcohol substitution suggestions for recipe ingredients.
 *
 * @param {Array} ingredients - Recipe ingredients
 * @returns {{ hasAlcohol: boolean, substitutions: Array<{ ingredient: string, substitute: string }> }}
 */
export function getAlcoholSubstitutions(ingredients) {
  const substitutions = []
  const ingredientNames = ingredients.map(i =>
    (typeof i === 'string' ? i : i.name || i.ingredient_name || '').toLowerCase()
  )

  for (const ingredientName of ingredientNames) {
    for (const [alcohol, substitute] of Object.entries(ALCOHOL_SUBSTITUTIONS)) {
      if (ingredientName.includes(alcohol.toLowerCase())) {
        substitutions.push({ ingredient: ingredientName, substitute })
        break
      }
    }
  }

  return { hasAlcohol: substitutions.length > 0, substitutions }
}

/**
 * Determine the substitution label based on active practices.
 *
 * @param {Object} faithPractices - Household faith practices
 * @returns {string} Label for the substitution section
 */
export function getSubstitutionLabel(faithPractices) {
  if (!faithPractices) return 'Alcohol-free swap'
  const practices = faithPractices.household_faith_practices || []
  if (practices.includes('lds')) return 'Word of Wisdom friendly swap'
  return 'Alcohol-free swap'
}

// ── Internal helpers ──────────────────────────────────────

function getPracticeNameForRestriction(restriction, faithPractices, memberFaithPractices) {
  // Try to find the originating practice name
  for (const [key, mappedRestrictions] of Object.entries(FAITH_DIET_AUTO_MAPPINGS)) {
    if (mappedRestrictions.includes(restriction)) {
      const practiceId = key.split('_')[0]
      const practice = FAITH_PRACTICE_OPTIONS.find(p => p.id === practiceId)
      if (practice) return practice.name
    }
  }
  return 'Faith-based practice'
}
