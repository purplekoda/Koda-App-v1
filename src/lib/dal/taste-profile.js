import 'server-only'

import { isMockMode } from './require-user'

/**
 * Fetch the user's taste profile.
 * Returns null if no profile exists yet.
 */
export async function getTasteProfile(userId) {
  if (isMockMode()) {
    const { getMockTasteProfile } = await import('./mock-store')
    return getMockTasteProfile()
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { data } = await supabase
    .from('user_taste_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  return data || null
}

/**
 * Upsert the user's taste profile.
 */
export async function saveTasteProfile(userId, updates) {
  if (isMockMode()) {
    const { saveMockTasteProfile } = await import('./mock-store')
    return saveMockTasteProfile(updates)
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase
    .from('user_taste_profiles')
    .upsert(
      { user_id: userId, ...updates, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )

  if (error) throw new Error('Failed to save taste profile: ' + error.message)
}

/**
 * Analyze a recipe and merge its traits into the user's taste profile.
 * Called silently after recipe save, meal plan add, or URL import.
 */
export async function analyzeAndUpdateTasteProfile(userId, recipe) {
  try {
    const profile = await getTasteProfile(userId) || {
      cuisine_types: [],
      cooking_styles: [],
      protein_preferences: [],
      flavor_profiles: [],
      avoided_ingredients: [],
      favorite_recipes: [],
      source_websites: [],
      recipe_count: 0,
      rejected_meals: [],
      disliked_ingredients: [],
    }

    const tags = (recipe.tags || []).map(t => t.toLowerCase())
    const ingredientNames = (recipe.ingredients || []).map(i => (i.name || '').toLowerCase())

    // Extract cuisine types from tags
    const CUISINES = ['italian', 'mexican', 'asian', 'chinese', 'japanese', 'thai', 'indian', 'mediterranean', 'french', 'greek', 'korean', 'american', 'middle eastern', 'vietnamese', 'spanish', 'cajun', 'southern', 'caribbean']
    const foundCuisines = tags.filter(t => CUISINES.includes(t))

    // Extract cooking styles from tags and recipe attributes
    const STYLES = ['quick', 'one pot', 'one-pot', 'grilled', 'baked', 'slow cooker', 'instant pot', 'air fryer', 'sheet pan', 'stir fry', 'no cook', 'meal prep', 'comfort food', 'healthy', 'light']
    const foundStyles = tags.filter(t => STYLES.includes(t))
    const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)
    if (totalTime > 0 && totalTime <= 30 && !foundStyles.includes('quick')) foundStyles.push('quick')

    // Extract protein preferences from ingredients
    const PROTEINS = ['chicken', 'beef', 'pork', 'turkey', 'salmon', 'shrimp', 'tofu', 'fish', 'lamb', 'sausage', 'bacon']
    const foundProteins = PROTEINS.filter(p => ingredientNames.some(i => i.includes(p)))
    if (tags.includes('vegetarian') || tags.includes('vegan')) foundProteins.push(tags.find(t => t === 'vegetarian' || t === 'vegan'))

    // Extract flavor profiles from tags
    const FLAVORS = ['spicy', 'savory', 'mild', 'sweet', 'tangy', 'smoky', 'umami', 'fresh', 'rich', 'creamy']
    const foundFlavors = tags.filter(t => FLAVORS.includes(t))

    // Track source website
    const sourceUrl = recipe.source
    let sourceHost = null
    if (sourceUrl && sourceUrl !== 'gemini' && sourceUrl.startsWith('http')) {
      try {
        sourceHost = new URL(sourceUrl).hostname.replace(/^www\./, '')
      } catch { /* ignore */ }
    }

    // Merge into profile (add new, don't remove existing)
    const mergeUnique = (existing, newItems) => [...new Set([...existing, ...newItems])]

    const updated = {
      cuisine_types: mergeUnique(profile.cuisine_types, foundCuisines),
      cooking_styles: mergeUnique(profile.cooking_styles, foundStyles),
      protein_preferences: mergeUnique(profile.protein_preferences, foundProteins),
      flavor_profiles: mergeUnique(profile.flavor_profiles, foundFlavors),
      avoided_ingredients: profile.avoided_ingredients,
      favorite_recipes: recipe.id
        ? mergeUnique(profile.favorite_recipes, [recipe.id])
        : profile.favorite_recipes,
      source_websites: sourceHost
        ? mergeUnique(profile.source_websites, [sourceHost])
        : profile.source_websites,
      recipe_count: profile.recipe_count + 1,
    }

    await saveTasteProfile(userId, updated)
  } catch (err) {
    // Taste profile updates are best-effort — never block the main flow
    console.error('[analyzeAndUpdateTasteProfile] error:', err?.message || err)
  }
}

/**
 * Build a system prompt section from the taste profile.
 * Returns an empty string if the profile is not active (< 5 recipes).
 */
export function buildTasteProfilePrompt(profile) {
  if (!profile || profile.recipe_count < 5) return ''

  const lines = [
    '',
    'USER TASTE PROFILE (learned from their cooking history):',
    'This user\'s taste profile shows they prefer the following. Prioritize recipes that match these preferences.',
  ]

  if (profile.cuisine_types?.length) {
    lines.push(`Favorite cuisines: ${profile.cuisine_types.join(', ')}`)
  }
  if (profile.cooking_styles?.length) {
    lines.push(`Cooking styles: ${profile.cooking_styles.join(', ')}`)
  }
  if (profile.protein_preferences?.length) {
    lines.push(`Protein preferences: ${profile.protein_preferences.join(', ')}`)
  }
  if (profile.flavor_profiles?.length) {
    lines.push(`Flavor profiles: ${profile.flavor_profiles.join(', ')}`)
  }
  if (profile.avoided_ingredients?.length) {
    lines.push(`AVOID these ingredients (user has removed or skipped them): ${profile.avoided_ingredients.join(', ')}`)
  }
  if (profile.rejected_meals?.length) {
    lines.push(`AVOID these meals (household has rejected them before): ${profile.rejected_meals.join(', ')}`)
  }
  if (profile.disliked_ingredients?.length) {
    lines.push(`AVOID recipes that use these disliked ingredients as primary ingredients: ${profile.disliked_ingredients.join(', ')}`)
  }

  lines.push('Find recipes that are similar in style and feel to the ones they already love.')
  return lines.join('\n')
}

/**
 * Get the user's most-imported websites (3+ imports).
 */
export function getFrequentWebsites(profile) {
  if (!profile?.source_websites?.length) return []
  // Count occurrences — source_websites stores every import, including duplicates
  // In our simplified model, we just return the list. The action calling this
  // counts recipe sources from the DB for exact counts.
  return profile.source_websites
}

/**
 * Add a meal name to the rejected_meals list, capped at 50 entries (oldest removed first).
 */
export async function updateRejectedMeals(userId, mealName) {
  try {
    const profile = await getTasteProfile(userId) || {}
    const existing = profile.rejected_meals || []
    if (existing.includes(mealName)) return
    const updated = [...existing, mealName].slice(-50)
    await saveTasteProfile(userId, { rejected_meals: updated })
  } catch {
    // best-effort
  }
}

/**
 * Add an ingredient to the disliked_ingredients list if not already present, capped at 30.
 */
export async function updateDislikedIngredients(userId, ingredient) {
  try {
    const profile = await getTasteProfile(userId) || {}
    const existing = profile.disliked_ingredients || []
    if (existing.includes(ingredient)) return
    const updated = [...existing, ingredient].slice(-30)
    await saveTasteProfile(userId, { disliked_ingredients: updated })
  } catch {
    // best-effort
  }
}

/**
 * Build an additional prompt section from learned behavioral feedback.
 * Returns empty string if there is nothing to surface.
 *
 * @param {object|null} profile  - taste profile object
 * @param {Array<{mealName, rating}>} recentFeedback
 */
export function buildTasteLearningPrompt(profile, recentFeedback = []) {
  const rejectedMeals = profile?.rejected_meals || []
  const dislikedIngredients = profile?.disliked_ingredients || []
  const thumbsUp = recentFeedback.filter(f => f.rating === 'thumbs_up').map(f => f.mealName)
  const thumbsDown = recentFeedback.filter(f => f.rating === 'thumbs_down').map(f => f.mealName)

  if (!rejectedMeals.length && !dislikedIngredients.length && !thumbsUp.length && !thumbsDown.length) {
    return ''
  }

  const lines = [
    '',
    'LEARNED PREFERENCES FROM PAST BEHAVIOR:',
  ]

  if (rejectedMeals.length) {
    lines.push(`Meals this household has rejected before: ${rejectedMeals.join(', ')}`)
  }
  if (dislikedIngredients.length) {
    lines.push(`Ingredients this household dislikes: ${dislikedIngredients.join(', ')}`)
  }
  if (thumbsUp.length) {
    lines.push(`Recently thumbs-upped meals: ${thumbsUp.join(', ')}`)
  }
  if (thumbsDown.length) {
    lines.push(`Recently thumbs-downed meals: ${thumbsDown.join(', ')}`)
  }

  lines.push(
    '',
    'INSTRUCTIONS:',
    'Never suggest any meal that appears in the rejected meals list.',
    'Never suggest any recipe that contains an ingredient in the disliked ingredients list as a primary ingredient.',
    'When you see thumbs-up meals, note the cuisine type and cooking style and lean toward similar suggestions.',
    'When you see thumbs-down meals, avoid that cuisine type and cooking style unless the household has explicitly listed it as a favorite cuisine.',
  )

  return lines.join('\n')
}
