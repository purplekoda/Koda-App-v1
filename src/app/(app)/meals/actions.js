'use server'

import { revalidatePath } from 'next/cache'
import { requireUser, isMockMode } from '@/lib/dal/require-user'
import { sanitizeString, sanitizeEnum } from '@/lib/sanitize'
import { apiLimiter, aiLimiter } from '@/lib/rate-limit'
import { ok, fail } from '@/lib/action-result'
import {
  updateMockMeal,
  clearMockMeal,
  fillMockWeek,
  getMockMeals,
  setMockMealRecipe,
  getMockPantry,
  getMockCookingPreferences,
  getMockDietaryRestrictions,
  getMockRecipes,
} from '@/lib/dal/mock-store'
import { validateMealPlanSlot } from '@/lib/validators'

const DAY_TO_INT = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }

export async function swapMeal(day, mealType, newMealName) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const cleanName = sanitizeString(newMealName, 200)
    const cleanType = sanitizeEnum(mealType, ['breakfast', 'lunch', 'dinner', 'sides', 'sides2', 'sides3', 'sides4', 'breakfast_side', 'lunch_side', 'dinner_dessert'])
    const cleanDay = sanitizeString(day, 10)

    if (!cleanName) return fail('Meal name is required')
    if (!cleanType) return fail('Invalid meal type')
    if (!cleanDay) return fail('Day is required')

    if (isMockMode()) {
      const updated = await updateMockMeal(cleanDay, cleanType, {
        name: cleanName,
        recipeId: null,
        recipe: null,
        ingredients: [],
      })
      if (!updated) return fail('Meal slot not found')
      const meals = await getMockMeals()
      return ok({ meals, swappedTo: cleanName })
    }

    const dayInt = DAY_TO_INT[cleanDay]
    if (!dayInt) return fail('Invalid day')

    const { getSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = await getSupabaseServerClient()

    const mealPlanId = await import('@/lib/dal/meals').then(m => m.getOrCreateMealPlan(user.id, supabase))

    const { error } = await supabase
      .from('meal_slots')
      .upsert(
        {
          user_id: user.id,
          meal_plan_id: mealPlanId,
          day_of_week: dayInt,
          meal_type: cleanType,
          custom_meal_name: cleanName,
          recipe_id: null,
          suggested_by_koda: false,
        },
        { onConflict: 'meal_plan_id,day_of_week,meal_type' }
      )

    if (error) return fail('Failed to swap meal')
    return ok({ swappedTo: cleanName })
  } catch {
    return fail('Something went wrong')
  }
}

export async function removeMeal(day, mealType) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const cleanType = sanitizeEnum(mealType, ['breakfast', 'lunch', 'dinner', 'sides', 'sides2', 'sides3', 'sides4', 'breakfast_side', 'lunch_side', 'dinner_dessert'])
    const cleanDay = sanitizeString(day, 10)

    if (!cleanType || !cleanDay) return fail('Invalid meal slot')

    if (isMockMode()) {
      await clearMockMeal(cleanDay, cleanType)
      const meals = await getMockMeals()
      return ok({ meals })
    }

    const dayInt = DAY_TO_INT[cleanDay]
    if (!dayInt) return fail('Invalid day')

    const { getSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = await getSupabaseServerClient()
    const { error } = await supabase
      .from('meal_slots')
      .delete()
      .eq('user_id', user.id)
      .eq('day_of_week', dayInt)
      .eq('meal_type', cleanType)

    if (error) return fail('Failed to remove meal')
    return ok()
  } catch {
    return fail('Something went wrong')
  }
}

export async function fillWeek() {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    if (isMockMode()) {
      const result = await fillMockWeek()
      return ok({ meals: result.meals, filledCount: result.filledCount })
    }

    // Supabase path: would query empty slots and insert suggestions
    return ok({ filledCount: 0 })
  } catch {
    return fail('Something went wrong')
  }
}

export async function addToGrocery(day, mealType) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    if (isMockMode()) {
      const meals = await getMockMeals()
      const dayObj = meals.find(d => d.day === day)
      if (!dayObj) return fail('Day not found')
      const meal = dayObj.meals.find(m => m.type === mealType)
      if (!meal || !meal.ingredients) return fail('Meal has no ingredients')
      const needCount = meal.ingredients.filter(i => !i.have).length
      return ok({ addedCount: needCount })
    }

    return ok({ addedCount: 0 })
  } catch {
    return fail('Something went wrong')
  }
}

export async function assignRecipeToSlot(day, mealType, recipeId) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const cleanDay = sanitizeString(day, 10)
    const cleanType = sanitizeEnum(mealType, ['breakfast', 'lunch', 'dinner', 'sides', 'sides2', 'sides3', 'sides4', 'breakfast_side', 'lunch_side', 'dinner_dessert'])
    // recipeId may be a number (mock data) or null (unassign) — coerce to string only when present
    const isUnassign = recipeId === null || recipeId === undefined
    const cleanRecipeId = isUnassign ? null : sanitizeString(String(recipeId), 36)

    if (!cleanDay) return fail('Day is required')
    if (!cleanType) return fail('Invalid meal type')
    if (!isUnassign && !cleanRecipeId) return fail('Recipe ID is required')

    if (isMockMode()) {
      if (isUnassign) {
        await clearMockMeal(cleanDay, cleanType)
        const meals = await getMockMeals()
        revalidatePath('/meals')
        return ok({ recipeName: null, meals })
      }
      const recipes = await getMockRecipes()
      const recipe = recipes.find(r => String(r.id) === String(cleanRecipeId))
      if (!recipe) return fail('Recipe not found')
      await setMockMealRecipe(cleanDay, cleanType, cleanRecipeId, recipe.name)
      const meals = await getMockMeals()
      revalidatePath('/meals')
      return ok({ recipeName: recipe.name, meals })
    }

    const dayInt = DAY_TO_INT[cleanDay]
    if (!dayInt) return fail('Invalid day')

    const { getSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = await getSupabaseServerClient()

    const mealPlanId = await import('@/lib/dal/meals').then(m => m.getOrCreateMealPlan(user.id, supabase))

    if (isUnassign) {
      const { error } = await supabase
        .from('meal_slots')
        .delete()
        .eq('user_id', user.id)
        .eq('meal_plan_id', mealPlanId)
        .eq('day_of_week', dayInt)
        .eq('meal_type', cleanType)
      if (error) {
        console.error('[assignRecipeToSlot DELETE error]', error)
        return fail('Failed to remove recipe')
      }
      revalidatePath('/meals')
      return ok({ recipeName: null })
    }

    // Verify the recipe belongs to this user before assigning it.
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .select('id, name')
      .eq('id', cleanRecipeId)
      .eq('user_id', user.id)
      .single()

    if (recipeError || !recipe) {
      console.error('[assignRecipeToSlot recipe lookup error]', recipeError, 'recipeId=', cleanRecipeId, 'userId=', user.id)
      return fail('Recipe not found')
    }

    const { error } = await supabase
      .from('meal_slots')
      .upsert(
        {
          user_id: user.id,
          meal_plan_id: mealPlanId,
          day_of_week: dayInt,
          meal_type: cleanType,
          recipe_id: cleanRecipeId,
          custom_meal_name: null,
        },
        { onConflict: 'meal_plan_id,day_of_week,meal_type' }
      )

    if (error) {
      console.error('[assignRecipeToSlot UPSERT error]', error, 'payload:', { day: cleanDay, type: cleanType, recipeId: cleanRecipeId })
      return fail('Failed to assign recipe')
    }
    revalidatePath('/meals')
    return ok({ recipeName: recipe.name })
  } catch (err) {
    console.error('[assignRecipeToSlot caught]', err)
    return fail('Something went wrong')
  }
}

/**
 * AI-powered meal planning with multi-select planning modes.
 *
 * @param {string} userInstructions  Free-text instructions from the user.
 * @param {string[]} modes  One or more of: 'my-recipes', 'web-search', 'fill-for-me'.
 *   - 'my-recipes'   — fill slots using saved recipes only
 *   - 'web-search'   — search the web for highly-rated recipes
 *   - 'fill-for-me'  — mix saved recipes + AI-generated ideas
 *   When multiple modes are selected the AI blends sources intelligently.
 */
export async function aiFillWeekAction(userInstructions, modes = ['fill-for-me'], weekOffset = 0, filters = {}) {
  try {
    const user = await requireUser()
    const rate = aiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const cleanInstructions = sanitizeString(userInstructions, 500)
    const validModes = new Set(['my-recipes', 'web-search', 'fill-for-me'])
    const selectedModes = (modes || ['fill-for-me']).filter(m => validModes.has(m))
    if (selectedModes.length === 0) selectedModes.push('fill-for-me')

    // ── Helper: build existing-meals context string ───────────────────────────
    function buildExistingMealsContext(existingMeals) {
      if (!existingMeals.length) return ''
      const lines = [
        '',
        'The user has already added the following meals to their week. Review these recipes and their ingredients before filling any remaining slots.',
        'Make sure the meals you suggest complement what is already planned, avoid ingredient duplication where possible, maintain nutritional balance across the full week, and continue to prioritize pantry stock and expiring ingredients as always.',
        '',
      ]
      existingMeals.forEach(m => {
        const DAY_NAMES = { 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday', 7: 'Sunday' }
        lines.push(`- ${DAY_NAMES[m.dayOfWeek] || m.day} ${m.type}: ${m.name}`)
      })
      return lines.join('\n')
    }

    // ── Helper: build mode instruction for the system prompt ──────────────────
    function buildModeInstruction(selectedModes, hasUserRecipes) {
      const lines = []
      const useMyRecipes = selectedModes.includes('my-recipes')
      const useWebSearch = selectedModes.includes('web-search')
      const useFillForMe = selectedModes.includes('fill-for-me')

      if (useMyRecipes && !useWebSearch && !useFillForMe) {
        lines.push('PLANNING MODE: Use saved recipes only. Fill empty slots exclusively from the user\'s Recipe Box. Do not suggest new or unknown recipes.')
      } else if (useWebSearch && !useMyRecipes && !useFillForMe) {
        lines.push('PLANNING MODE: Web search only. Suggest highly-rated, popular recipes for each slot. All suggestions should be well-known recipes with high community ratings.')
      } else if (useFillForMe && !useMyRecipes && !useWebSearch) {
        lines.push('PLANNING MODE: Mixed. Combine the user\'s saved recipes with new AI-generated ideas to build a balanced, full week.')
      } else if (useMyRecipes && useWebSearch && !useFillForMe) {
        lines.push('PLANNING MODE: Blend saved recipes and web-found recipes. Fill some slots from the Recipe Box and search online for the rest, prioritizing pantry fit.')
      } else if (useMyRecipes && useFillForMe && !useWebSearch) {
        lines.push('PLANNING MODE: Saved recipes first, then AI ideas. Use saved recipes as the primary source and fill remaining gaps with AI-generated ideas. Skip web search.')
      } else if (useWebSearch && useFillForMe && !useMyRecipes) {
        lines.push('PLANNING MODE: Web search + AI ideas. Search online for highly-rated suggestions and supplement with AI-generated ideas for any remaining slots.')
      } else {
        lines.push('PLANNING MODE: Comprehensive. Use saved recipes first, fill gaps with online search results, and use AI-generated ideas for any remaining empty slots.')
      }
      return lines.join('\n')
    }

    // ── Helper: build filters instruction for the system prompt ────────────────
    function buildFiltersInstruction(filters) {
      const lines = []

      if (filters.weeklyBudget) {
        lines.push(`\nBUDGET CONSTRAINT: The user has a weekly grocery budget of $${filters.weeklyBudget}. Choose affordable ingredients and cost-effective meals.`)
        if (filters.stores?.length > 0) {
          const storeNames = filters.stores.map(s => s.label || s.value).join(', ')
          lines.push(`The user shops at: ${storeNames}. When possible, suggest meals that use ingredients commonly on sale or competitively priced at these stores.`)
        }
      }

      if (filters.macros && Object.keys(filters.macros).length > 0) {
        const m = filters.macros
        const parts = []
        if (m.calories) parts.push(`${m.calories} calories`)
        if (m.protein) parts.push(`${m.protein}g protein`)
        if (m.carbs) parts.push(`${m.carbs}g carbs`)
        if (m.fat) parts.push(`${m.fat}g fat`)
        if (parts.length > 0) {
          lines.push(`\nMACRO TARGETS (daily): ${parts.join(', ')}. Plan meals so the daily total across breakfast, lunch, and dinner roughly hits these targets. Distribute protein evenly across meals.`)
        }
      }

      if (filters.timePerDay) {
        const TIME_MAP = { quick: 'under 30 min', medium: '30-60 min', elaborate: '60+ min' }
        const DAY_FULL = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' }
        lines.push('\nTIME CONSTRAINTS PER DAY:')
        Object.entries(filters.timePerDay).forEach(([day, time]) => {
          const isCrockpot = filters.crockpotDays?.includes(day)
          const label = `${DAY_FULL[day] || day}: ${TIME_MAP[time] || time}`
          lines.push(`- ${label}${isCrockpot ? ' (crockpot/slow cooker meal preferred)' : ''}`)
        })
      } else if (filters.timeAll) {
        const TIME_MAP = { quick: 'under 30 minutes', medium: '30-60 minutes', elaborate: '60+ minutes' }
        lines.push(`\nTIME CONSTRAINT: All meals should take ${TIME_MAP[filters.timeAll] || filters.timeAll} total cook time.`)
      }

      return lines.join('\n')
    }

    if (isMockMode()) {
      // Gather mock context
      const [currentMeals, pantryItems, preferences, dietaryRestrictions, userRecipes] =
        await Promise.all([
          getMockMeals(),
          getMockPantry(),
          getMockCookingPreferences(),
          Promise.resolve(getMockDietaryRestrictions()),
          getMockRecipes(),
        ])

      // Identify filled and empty slots
      const existingMeals = []
      const emptySlots = []
      currentMeals.forEach(dayObj => {
        dayObj.meals.forEach(meal => {
          if (meal.name) {
            existingMeals.push({ day: dayObj.day, dayOfWeek: dayObj.dayOfWeek, type: meal.type, name: meal.name })
          } else {
            emptySlots.push({ day: dayObj.day, dayOfWeek: dayObj.dayOfWeek, type: meal.type })
          }
        })
      })

      if (emptySlots.length === 0) return ok({ meals: currentMeals, filledCount: 0 })

      const { buildMealPlanPrompt } = await import('@/lib/buildMealPlanPrompt')
      const { systemPromptPrefix } = await buildMealPlanPrompt(user.id)

      // Load taste profile for AI context
      const { getTasteProfile, buildTasteProfilePrompt } = await import('@/lib/dal/taste-profile')
      const tasteProfile = await getTasteProfile(user.id)
      const tastePrompt = buildTasteProfilePrompt(tasteProfile)

      const { generateMealPlan } = await import('@/lib/gemini')
      const recipeList = userRecipes.map(r => ({ name: r.name, tags: r.tags || [] }))
      const existingContext = buildExistingMealsContext(existingMeals)
      const modeInstruction = buildModeInstruction(selectedModes, recipeList.length > 0)
      const filtersInstruction = buildFiltersInstruction(filters)
      const result = await generateMealPlan(emptySlots, {
        pantryItems,
        preferences,
        dietaryRestrictions,
        userRecipes: recipeList,
        userInstructions: cleanInstructions,
        mealPlanSystemPrompt: systemPromptPrefix,
        existingMealsContext: existingContext,
        modeInstruction,
        tasteProfilePrompt: tastePrompt,
        filtersInstruction,
      })

      let filledCount = 0
      const unlinkedSlots = []

      for (const slot of result.slots || []) {
        const validation = validateMealPlanSlot(slot)
        if (!validation.valid) continue

        const dayLabel = Object.keys(DAY_TO_INT).find(k => DAY_TO_INT[k] === slot.day_of_week)
        if (!dayLabel) continue

        let linkedRecipeId = null

        // Auto-link saved recipes by name matching
        if (slot.is_saved_recipe) {
          const match = userRecipes.find(r =>
            r.name.toLowerCase().trim() === (slot.meal_name || '').toLowerCase().trim()
          )
          if (match) linkedRecipeId = match.id || null
        }

        await updateMockMeal(dayLabel, slot.meal_type, {
          name: slot.meal_name,
          recipeId: linkedRecipeId,
          recipe: null,
          ingredients: [],
          suggestedByKoda: true,
        })
        filledCount++

        // Collect AI-generated ideas that need recipe linking
        if (!slot.is_saved_recipe || !linkedRecipeId) {
          unlinkedSlots.push({
            day: dayLabel,
            dayOfWeek: slot.day_of_week,
            type: slot.meal_type,
            mealName: slot.meal_name,
          })
        }
      }

      const meals = await getMockMeals()
      return ok({ meals, filledCount, unlinkedSlots })
    }

    // Supabase path
    const { getSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = await getSupabaseServerClient()

    // Get (or create) the viewed week's meal plan so we scope slot queries correctly
    const { getOrCreateMealPlan } = await import('@/lib/dal/meals')
    const mealPlanId = await getOrCreateMealPlan(user.id, supabase, weekOffset)

    // Gather context in parallel
    const [slotsResult, pantryResult, prefsResult, dietResult, recipesResult] = await Promise.all([
      supabase
        .from('meal_slots')
        .select('day_of_week, meal_type, custom_meal_name, recipe_id')
        .eq('meal_plan_id', mealPlanId),
      supabase
        .from('pantry_items')
        .select('name, category, freshness, days_left')
        .eq('user_id', user.id)
        .limit(60),
      supabase
        .from('profiles')
        .select('cooking_preferences')
        .eq('id', user.id)
        .single(),
      supabase
        .from('dietary_restrictions')
        .select('restriction')
        .eq('user_id', user.id),
      supabase
        .from('recipes')
        .select('id, name, tags')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(50),
    ])

    const allSlots = slotsResult.data || []
    const filledSlots = allSlots.filter(s => s.custom_meal_name || s.recipe_id)
    const filledDayTypes = new Set(filledSlots.map(s => `${s.day_of_week}:${s.meal_type}`))

    // Build existing meals context for the AI
    const existingMeals = filledSlots.map(s => ({
      dayOfWeek: s.day_of_week,
      type: s.meal_type,
      name: s.custom_meal_name || '(linked recipe)',
    }))

    const emptySlots = []
    const DAYS_LIST = [
      { day: 'Mon', dayOfWeek: 1 },
      { day: 'Tue', dayOfWeek: 2 },
      { day: 'Wed', dayOfWeek: 3 },
      { day: 'Thu', dayOfWeek: 4 },
      { day: 'Fri', dayOfWeek: 5 },
      { day: 'Sat', dayOfWeek: 6 },
      { day: 'Sun', dayOfWeek: 7 },
    ]
    const MEAL_TYPES_LIST = ['breakfast', 'lunch', 'dinner']

    DAYS_LIST.forEach(({ day, dayOfWeek }) => {
      MEAL_TYPES_LIST.forEach(type => {
        if (!filledDayTypes.has(`${dayOfWeek}:${type}`)) {
          emptySlots.push({ day, dayOfWeek, type })
        }
      })
    })

    if (emptySlots.length === 0) {
      const { getWeeklyMeals } = await import('@/lib/dal/meals')
      const meals = await getWeeklyMeals(user.id, weekOffset)
      return ok({ meals, filledCount: 0 })
    }

    const pantryItems = (pantryResult.data || []).map(i => ({
      name: i.name,
      category: i.category,
      freshness: i.freshness,
      daysLeft: i.days_left,
    }))
    const preferences = prefsResult.data?.cooking_preferences ?? null
    const dietaryRestrictions = (dietResult.data || []).map(d => d.restriction)
    const userRecipes = (recipesResult.data || []).map(r => ({ name: r.name, tags: r.tags || [] }))

    const { buildMealPlanPrompt } = await import('@/lib/buildMealPlanPrompt')
    const { systemPromptPrefix } = await buildMealPlanPrompt(user.id)

    // Load taste profile for AI context
    const { getTasteProfile, buildTasteProfilePrompt } = await import('@/lib/dal/taste-profile')
    const tasteProfile = await getTasteProfile(user.id)
    const tastePrompt = buildTasteProfilePrompt(tasteProfile)

    const existingContext = buildExistingMealsContext(existingMeals)
    const modeInstruction = buildModeInstruction(selectedModes, userRecipes.length > 0)
    const filtersInstruction = buildFiltersInstruction(filters)

    const { generateMealPlan } = await import('@/lib/gemini')
    const result = await generateMealPlan(emptySlots, {
      pantryItems,
      preferences,
      dietaryRestrictions,
      userRecipes,
      userInstructions: cleanInstructions,
      mealPlanSystemPrompt: systemPromptPrefix,
      existingMealsContext: existingContext,
      modeInstruction,
      tasteProfilePrompt: tastePrompt,
      filtersInstruction,
    })

    let filledCount = 0
    const upsertRows = []
    const unlinkedSlots = []

    // Full recipe list with IDs for name-matching
    const fullRecipes = (recipesResult.data || []).map(r => ({ id: r.id, name: r.name, tags: r.tags || [] }))

    for (const slot of result.slots || []) {
      const validation = validateMealPlanSlot(slot)
      if (!validation.valid) continue

      let linkedRecipeId = null

      // Auto-link saved recipes by name matching
      if (slot.is_saved_recipe) {
        const match = fullRecipes.find(r =>
          r.name.toLowerCase().trim() === (slot.meal_name || '').toLowerCase().trim()
        )
        if (match) linkedRecipeId = match.id
      }

      const dayLabel = Object.keys(DAY_TO_INT).find(k => DAY_TO_INT[k] === slot.day_of_week)

      upsertRows.push({
        user_id: user.id,
        meal_plan_id: mealPlanId,
        day_of_week: slot.day_of_week,
        meal_type: slot.meal_type,
        custom_meal_name: slot.meal_name,
        recipe_id: linkedRecipeId,
        suggested_by_koda: true,
      })
      filledCount++

      // Collect AI-generated ideas that need recipe linking
      if (!slot.is_saved_recipe || !linkedRecipeId) {
        unlinkedSlots.push({
          day: dayLabel || 'Mon',
          dayOfWeek: slot.day_of_week,
          type: slot.meal_type,
          mealName: slot.meal_name,
        })
      }
    }

    if (upsertRows.length > 0) {
      const { error } = await supabase
        .from('meal_slots')
        .upsert(upsertRows, { onConflict: 'meal_plan_id,day_of_week,meal_type' })
      if (error) return fail('Failed to save AI meal plan')
    }

    revalidatePath('/meals')
    const { getWeeklyMeals } = await import('@/lib/dal/meals')
    const meals = await getWeeklyMeals(user.id, weekOffset)
    return ok({ meals, filledCount, unlinkedSlots })
  } catch (err) {
    console.error('[aiFillWeekAction] error:', err?.message || err)
    return fail('Something went wrong')
  }
}

/**
 * Check if the user has a favorite website (3+ recipes imported from the same site).
 * Returns the hostname if found, null otherwise.
 */
/**
 * Search for 3 diverse, pantry-aware web recipe suggestions per unlinked meal slot.
 * Prioritizes ingredient reuse across the week to reduce food waste.
 * Called after aiFillWeekAction returns unlinkedSlots.
 *
 * @param {Array<{ day, dayOfWeek, type, mealName }>} unlinkedSlots
 * @param {number} weekOffset
 */
export async function searchRecipeSuggestionsAction(unlinkedSlots, weekOffset = 0) {
  try {
    const user = await requireUser()
    const rate = aiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    if (!Array.isArray(unlinkedSlots) || unlinkedSlots.length === 0) {
      return ok({ slotSuggestions: [] })
    }

    // Sanitize input
    const cleanSlots = unlinkedSlots.slice(0, 21).map(s => ({
      day: sanitizeString(s.day, 10) || 'Mon',
      dayOfWeek: Number(s.dayOfWeek) || 1,
      type: sanitizeEnum(s.type, ['breakfast', 'lunch', 'dinner']) || 'dinner',
      mealName: sanitizeString(s.mealName, 200) || 'meal',
    }))

    // Load pantry items and the full week's meals for context
    let pantryItems = []
    let weekMeals = []

    if (isMockMode()) {
      const [pantry, meals] = await Promise.all([
        getMockPantry(),
        getMockMeals(),
      ])
      pantryItems = pantry
      weekMeals = meals.flatMap(dayObj =>
        dayObj.meals.filter(m => m.name).map(m => ({ day: dayObj.day, type: m.type, name: m.name }))
      )
    } else {
      const { getSupabaseServerClient } = await import('@/lib/supabase/server')
      const supabase = await getSupabaseServerClient()
      const { getOrCreateMealPlan } = await import('@/lib/dal/meals')
      const mealPlanId = await getOrCreateMealPlan(user.id, supabase, weekOffset)

      const [pantryResult, slotsResult] = await Promise.all([
        supabase.from('pantry_items').select('name, category, freshness, days_left').eq('user_id', user.id).limit(60),
        supabase.from('meal_slots').select('day_of_week, meal_type, meal_name').eq('meal_plan_id', mealPlanId),
      ])
      pantryItems = (pantryResult.data || []).map(i => ({
        name: i.name, category: i.category, freshness: i.freshness, daysLeft: i.days_left,
      }))
      weekMeals = (slotsResult.data || []).filter(s => s.meal_name).map(s => ({
        day: Object.keys(DAY_TO_INT).find(k => DAY_TO_INT[k] === s.day_of_week) || '?',
        type: s.meal_type,
        name: s.meal_name,
      }))
    }

    const { searchRecipeSuggestionsForSlots } = await import('@/lib/gemini')
    const slotSuggestions = await searchRecipeSuggestionsForSlots(cleanSlots, { pantryItems, weekMeals })

    // Return pantry item names so the client can highlight matches in recipe previews
    const pantryNames = pantryItems.map(i => i.name.toLowerCase())
    return ok({ slotSuggestions, pantryNames })
  } catch (err) {
    console.error('[searchRecipeSuggestionsAction] error:', err?.message || err)
    return fail('Could not find recipe suggestions.')
  }
}

export async function getFavoriteWebsiteAction() {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    if (isMockMode()) {
      const { getMockRecipes } = await import('@/lib/dal/mock-store')
      const recipes = await getMockRecipes()
      return ok({ favoriteWebsite: findFavoriteWebsite(recipes) })
    }

    const { getSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = await getSupabaseServerClient()
    const { data } = await supabase
      .from('recipes')
      .select('source')
      .eq('user_id', user.id)
      .not('source', 'is', null)
      .not('source', 'eq', 'gemini')

    return ok({ favoriteWebsite: findFavoriteWebsite(data || []) })
  } catch {
    return ok({ favoriteWebsite: null })
  }
}

function findFavoriteWebsite(recipes) {
  const counts = {}
  for (const r of recipes) {
    const src = r.source
    if (!src || src === 'gemini' || !src.startsWith('http')) continue
    try {
      const host = new URL(src).hostname.replace(/^www\./, '')
      counts[host] = (counts[host] || 0) + 1
    } catch { /* ignore */ }
  }
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
  return top && top[1] >= 3 ? top[0] : null
}

/**
 * Surprise Me — find a viral TikTok recipe matching pantry + taste profile.
 */
export async function surpriseMeAction(mealType) {
  try {
    const user = await requireUser()
    const rate = aiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const cleanMealType = mealType ? sanitizeEnum(mealType, ['breakfast', 'lunch', 'dinner']) : null

    // Always call buildMealPlanPrompt first
    const { buildMealPlanPrompt } = await import('@/lib/buildMealPlanPrompt')
    const { systemPromptPrefix } = await buildMealPlanPrompt(user.id)

    // Load taste profile
    const { getTasteProfile, buildTasteProfilePrompt } = await import('@/lib/dal/taste-profile')
    const tasteProfile = await getTasteProfile(user.id)
    const tastePrompt = buildTasteProfilePrompt(tasteProfile)

    const { searchSurpriseMeRecipe, isSideDishName } = await import('@/lib/gemini')
    let recipe = await searchSurpriseMeRecipe({
      mealPlanSystemPrompt: systemPromptPrefix,
      tasteProfilePrompt: tastePrompt,
      mealType: cleanMealType,
    })

    if (isSideDishName(recipe.name, recipe.description)) {
      recipe = await searchSurpriseMeRecipe({
        mealPlanSystemPrompt: systemPromptPrefix,
        tasteProfilePrompt: tastePrompt,
        mealType: cleanMealType,
        retryHint: 'The previous suggestion was a side dish — please suggest a complete main dish instead.',
      })
    }

    return ok({ recipe })
  } catch (err) {
    console.error('[surpriseMeAction] error:', err?.message || err)
    return fail('Could not find a surprise recipe. Try again!')
  }
}

export async function surpriseMeBatchAction(count, mealTypes) {
  try {
    const user = await requireUser()
    const rate = aiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const cleanCount = Math.max(1, Math.min(Number(count) || 1, 7))
    const validTypes = ['breakfast', 'lunch', 'dinner']
    const cleanTypes = (mealTypes || [])
      .map(t => sanitizeEnum(t, validTypes))
      .filter(Boolean)

    const { buildMealPlanPrompt } = await import('@/lib/buildMealPlanPrompt')
    const { systemPromptPrefix } = await buildMealPlanPrompt(user.id)

    const { getTasteProfile, buildTasteProfilePrompt } = await import('@/lib/dal/taste-profile')
    const tasteProfile = await getTasteProfile(user.id)
    const tastePrompt = buildTasteProfilePrompt(tasteProfile)

    const { searchSurpriseMeRecipes, searchSurpriseMeRecipe, isSideDishName } = await import('@/lib/gemini')
    let recipes = await searchSurpriseMeRecipes({
      mealPlanSystemPrompt: systemPromptPrefix,
      tasteProfilePrompt: tastePrompt,
      mealTypes: cleanTypes,
      count: cleanCount,
    })

    // Validate each recipe — retry side dishes individually
    const validated = await Promise.all(
      recipes.map(async (recipe, i) => {
        if (!isSideDishName(recipe.name, recipe.description)) return recipe
        try {
          const mealType = cleanTypes[i % cleanTypes.length] || null
          return await searchSurpriseMeRecipe({
            mealPlanSystemPrompt: systemPromptPrefix,
            tasteProfilePrompt: tastePrompt,
            mealType,
            retryHint: 'The previous suggestion was a side dish — please suggest a complete main dish instead.',
          })
        } catch {
          return recipe
        }
      })
    )

    return ok({ recipes: validated })
  } catch (err) {
    console.error('[surpriseMeBatchAction] error:', err?.message || err)
    return fail('Could not find surprise recipes. Try again!')
  }
}

/**
 * Surprise Me — Koda generates 3 complementary side dish suggestions.
 */
export async function surpriseMeSideKodaAction(mainDishName, preference) {
  try {
    const user = await requireUser()
    const rate = aiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const cleanName = sanitizeString(mainDishName, 200)
    const cleanPref = sanitizeString(preference || '', 300)
    if (!cleanName) return fail('Main dish name is required')

    const { buildMealPlanPrompt } = await import('@/lib/buildMealPlanPrompt')
    const { systemPromptPrefix } = await buildMealPlanPrompt(user.id)

    const { getTasteProfile, buildTasteProfilePrompt } = await import('@/lib/dal/taste-profile')
    const tasteProfile = await getTasteProfile(user.id)
    const tastePrompt = buildTasteProfilePrompt(tasteProfile)

    const { generateSideSuggestions } = await import('@/lib/gemini')
    const suggestions = await generateSideSuggestions(cleanName, {
      mealPlanSystemPrompt: systemPromptPrefix,
      tasteProfilePrompt: tastePrompt,
      preference: cleanPref,
    })

    return ok({ suggestions })
  } catch (err) {
    console.error('[surpriseMeSideKodaAction] error:', err?.message || err)
    return fail('Could not generate side dish suggestions. Try again!')
  }
}

/**
 * Surprise Me — Koda generates 3 complementary dessert suggestions.
 */
export async function surpriseMeDessertKodaAction(mainDishName, preference) {
  try {
    const user = await requireUser()
    const rate = aiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const cleanName = sanitizeString(mainDishName, 200)
    const cleanPref = sanitizeString(preference || '', 300)
    if (!cleanName) return fail('Main dish name is required')

    const { buildMealPlanPrompt } = await import('@/lib/buildMealPlanPrompt')
    const { systemPromptPrefix } = await buildMealPlanPrompt(user.id)

    const { getTasteProfile, buildTasteProfilePrompt } = await import('@/lib/dal/taste-profile')
    const tasteProfile = await getTasteProfile(user.id)
    const tastePrompt = buildTasteProfilePrompt(tasteProfile)

    const { generateDessertSuggestions } = await import('@/lib/gemini')
    const suggestions = await generateDessertSuggestions(cleanName, {
      mealPlanSystemPrompt: systemPromptPrefix,
      tasteProfilePrompt: tastePrompt,
      preference: cleanPref,
    })

    return ok({ suggestions })
  } catch (err) {
    console.error('[surpriseMeDessertKodaAction] error:', err?.message || err)
    return fail('Could not generate dessert suggestions. Try again!')
  }
}

/**
 * Surprise Me — Search the web for 2 highly-rated side dish recipes.
 */
export async function surpriseMeSideWebAction(mainDishName, preference) {
  try {
    const user = await requireUser()
    const rate = aiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const cleanName = sanitizeString(mainDishName, 200)
    const cleanPref = sanitizeString(preference || '', 300)
    if (!cleanName) return fail('Main dish name is required')

    const queryParts = [cleanName, 'side dish recipe']
    if (cleanPref) queryParts.push(cleanPref)

    const { searchWebRecipes } = await import('@/lib/gemini')
    const recipes = await searchWebRecipes(queryParts.join(' '))

    return ok({ recipes })
  } catch (err) {
    console.error('[surpriseMeSideWebAction] error:', err?.message || err)
    return fail('Could not find side dish recipes. Try again!')
  }
}

/**
 * Surprise Me — Search the web for 2 highly-rated dessert recipes.
 */
export async function surpriseMeDessertWebAction(mainDishName, preference) {
  try {
    const user = await requireUser()
    const rate = aiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const cleanName = sanitizeString(mainDishName, 200)
    const cleanPref = sanitizeString(preference || '', 300)
    if (!cleanName) return fail('Main dish name is required')

    const queryParts = [cleanName, 'dessert recipe']
    if (cleanPref) queryParts.push(cleanPref)

    const { searchWebRecipes } = await import('@/lib/gemini')
    const recipes = await searchWebRecipes(queryParts.join(' '))

    return ok({ recipes })
  } catch (err) {
    console.error('[surpriseMeDessertWebAction] error:', err?.message || err)
    return fail('Could not find dessert recipes. Try again!')
  }
}

/**
 * Search the web for 2 highly-rated recipe suggestions per empty meal slot.
 * Returns slot-keyed results so the client can show a picker UI.
 */
export async function webSearchSlotsAction(weekOffset = 0) {
  try {
    const user = await requireUser()
    const rate = aiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    let emptySlots = []
    let pantryItems = []
    let dietaryRestrictions = []
    let preferences = null

    if (isMockMode()) {
      const [currentMeals, pantry, prefs, diet] = await Promise.all([
        getMockMeals(),
        getMockPantry(),
        getMockCookingPreferences(),
        Promise.resolve(getMockDietaryRestrictions()),
      ])
      currentMeals.forEach(dayObj => {
        dayObj.meals.forEach(meal => {
          if (!meal.name) {
            emptySlots.push({ day: dayObj.day, dayOfWeek: dayObj.dayOfWeek, type: meal.type })
          }
        })
      })
      pantryItems = pantry
      preferences = prefs
      dietaryRestrictions = diet
    } else {
      const { getSupabaseServerClient } = await import('@/lib/supabase/server')
      const supabase = await getSupabaseServerClient()
      const { getOrCreateMealPlan } = await import('@/lib/dal/meals')
      const mealPlanId = await getOrCreateMealPlan(user.id, supabase, weekOffset)

      const [slotsResult, pantryResult, prefsResult, dietResult] = await Promise.all([
        supabase.from('meal_slots').select('day_of_week, meal_type, custom_meal_name, recipe_id').eq('meal_plan_id', mealPlanId),
        supabase.from('pantry_items').select('name, category, freshness, days_left').eq('user_id', user.id).limit(60),
        supabase.from('profiles').select('cooking_preferences').eq('id', user.id).single(),
        supabase.from('dietary_restrictions').select('restriction').eq('user_id', user.id),
      ])

      const filledDayTypes = new Set(
        (slotsResult.data || []).filter(s => s.custom_meal_name || s.recipe_id).map(s => `${s.day_of_week}:${s.meal_type}`)
      )
      const DAYS_LIST = [
        { day: 'Mon', dayOfWeek: 1 }, { day: 'Tue', dayOfWeek: 2 }, { day: 'Wed', dayOfWeek: 3 },
        { day: 'Thu', dayOfWeek: 4 }, { day: 'Fri', dayOfWeek: 5 }, { day: 'Sat', dayOfWeek: 6 }, { day: 'Sun', dayOfWeek: 7 },
      ]
      DAYS_LIST.forEach(({ day, dayOfWeek }) => {
        ;['breakfast', 'lunch', 'dinner'].forEach(type => {
          if (!filledDayTypes.has(`${dayOfWeek}:${type}`)) emptySlots.push({ day, dayOfWeek, type })
        })
      })
      pantryItems = (pantryResult.data || []).map(i => ({ name: i.name, category: i.category, freshness: i.freshness, daysLeft: i.days_left }))
      preferences = prefsResult.data?.cooking_preferences ?? null
      dietaryRestrictions = (dietResult.data || []).map(d => d.restriction)
    }

    if (emptySlots.length === 0) return ok({ slotResults: [] })

    const { searchWebRecipesForSlots } = await import('@/lib/gemini')
    const slotResults = await searchWebRecipesForSlots(emptySlots, { pantryItems, dietaryRestrictions, preferences })

    return ok({ slotResults })
  } catch (err) {
    console.error('[webSearchSlotsAction] error:', err?.message || err)
    return fail('Something went wrong')
  }
}

export async function getWeekMealsAction(weekOffset = 0) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')
    const { getWeeklyMeals } = await import('@/lib/dal/meals')
    const meals = await getWeeklyMeals(user.id, weekOffset)
    return ok({ meals })
  } catch (err) {
    return fail('Failed to load week')
  }
}

export async function repeatMealAction(sourceDay, mealType, targetDays, weekOffset = 0) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const cleanSourceDay = sanitizeString(sourceDay, 10)
    const cleanType = sanitizeEnum(mealType, ['breakfast', 'lunch', 'dinner', 'sides', 'sides2', 'sides3', 'sides4', 'breakfast_side', 'lunch_side', 'dinner_dessert'])

    if (!cleanSourceDay) return fail('Source day is required')
    if (!cleanType) return fail('Invalid meal type')
    if (!Array.isArray(targetDays) || targetDays.length === 0) return fail('No target days selected')

    const cleanTargetDays = targetDays
      .map(d => sanitizeString(d, 10))
      .filter(d => d && DAY_TO_INT[d] && d !== cleanSourceDay)

    if (cleanTargetDays.length === 0) return fail('No valid target days')

    if (isMockMode()) {
      // Look up source meal
      const meals = await getMockMeals()
      const sourceDayObj = meals.find(d => d.day === cleanSourceDay)
      if (!sourceDayObj) return fail('Source day not found')
      const sourceMeal = sourceDayObj.meals.find(m => m.type === cleanType)
      if (!sourceMeal || !sourceMeal.name) return fail('No meal in source slot')

      for (const targetDay of cleanTargetDays) {
        await updateMockMeal(targetDay, cleanType, {
          name: sourceMeal.name,
          recipeId: sourceMeal.recipeId ?? null,
          recipe: sourceMeal.recipe ?? null,
          ingredients: sourceMeal.ingredients ?? [],
        })
      }

      const updatedMeals = await getMockMeals()
      return ok({ meals: updatedMeals })
    }

    const sourceDayInt = DAY_TO_INT[cleanSourceDay]
    if (!sourceDayInt) return fail('Invalid source day')

    const { getSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = await getSupabaseServerClient()
    const { getOrCreateMealPlan, getWeeklyMeals } = await import('@/lib/dal/meals')

    const mealPlanId = await getOrCreateMealPlan(user.id, supabase)

    // Look up the source slot by meal_plan_id
    const { data: sourceSlot, error: sourceError } = await supabase
      .from('meal_slots')
      .select('custom_meal_name, recipe_id')
      .eq('meal_plan_id', mealPlanId)
      .eq('day_of_week', sourceDayInt)
      .eq('meal_type', cleanType)
      .maybeSingle()

    if (sourceError) return fail('Failed to read source meal')
    if (!sourceSlot || (!sourceSlot.custom_meal_name && !sourceSlot.recipe_id)) {
      return fail('No meal in source slot')
    }

    const upsertRows = cleanTargetDays.map(targetDay => ({
      user_id: user.id,
      meal_plan_id: mealPlanId,
      day_of_week: DAY_TO_INT[targetDay],
      meal_type: cleanType,
      custom_meal_name: sourceSlot.custom_meal_name ?? null,
      recipe_id: sourceSlot.recipe_id ?? null,
    }))

    const { error } = await supabase
      .from('meal_slots')
      .upsert(upsertRows, { onConflict: 'meal_plan_id,day_of_week,meal_type' })

    if (error) return fail('Failed to repeat meal')

    revalidatePath('/meals')
    const meals = await getWeeklyMeals(user.id, weekOffset)
    return ok({ meals })
  } catch {
    return fail('Something went wrong')
  }
}

/**
 * Confirm the current week's meal plan and deplete matching pantry items.
 * Called when the user taps "Confirm plan & use pantry".
 */
export async function confirmMealPlanAction() {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    if (isMockMode()) {
      return ok({ depletedCount: 0, message: 'Plan confirmed (mock mode — pantry not updated)' })
    }

    const { getSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = await getSupabaseServerClient()

    // Get current week's meal plan ID
    const { getOrCreateMealPlan } = await import('@/lib/dal/meals')
    const mealPlanId = await getOrCreateMealPlan(user.id, supabase)

    const { depleteIngredientsForMealPlan } = await import('@/lib/dal/pantry-management')
    const { depletedCount } = await depleteIngredientsForMealPlan(user.id, mealPlanId)

    revalidatePath('/pantry')
    return ok({ depletedCount })
  } catch (err) {
    console.error('[confirmMealPlanAction]', err?.message)
    return fail('Something went wrong')
  }
}

let _mockPlanningDraft = null

export async function generateMealPlanPreviewAction(userInstructions, modes = ['fill-for-me'], weekOffset = 0, filters = {}) {
  try {
    const user = await requireUser()
    const rate = aiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const cleanInstructions = sanitizeString(userInstructions, 500)
    const validModes = new Set(['my-recipes', 'web-search', 'fill-for-me'])
    const selectedModes = (modes || ['fill-for-me']).filter(m => validModes.has(m))
    if (selectedModes.length === 0) selectedModes.push('fill-for-me')

    function buildExistingMealsContext(existingMeals) {
      if (!existingMeals.length) return ''
      const lines = [
        '',
        'The user has already added the following meals to their week. Review these recipes and their ingredients before filling any remaining slots.',
        'Make sure the meals you suggest complement what is already planned, avoid ingredient duplication where possible, maintain nutritional balance across the full week, and continue to prioritize pantry stock and expiring ingredients as always.',
        '',
      ]
      existingMeals.forEach(m => {
        const DAY_NAMES = { 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday', 7: 'Sunday' }
        lines.push(`- ${DAY_NAMES[m.dayOfWeek] || m.day} ${m.type}: ${m.name}`)
      })
      return lines.join('\n')
    }

    function buildModeInstruction(selectedModes, hasUserRecipes) {
      const lines = []
      const useMyRecipes = selectedModes.includes('my-recipes')
      const useWebSearch = selectedModes.includes('web-search')
      const useFillForMe = selectedModes.includes('fill-for-me')

      if (useMyRecipes && !useWebSearch && !useFillForMe) {
        lines.push('PLANNING MODE: Use saved recipes only. Fill empty slots exclusively from the user\'s Recipe Box. Do not suggest new or unknown recipes.')
      } else if (useWebSearch && !useMyRecipes && !useFillForMe) {
        lines.push('PLANNING MODE: Web search only. Suggest highly-rated, popular recipes for each slot. All suggestions should be well-known recipes with high community ratings.')
      } else if (useFillForMe && !useMyRecipes && !useWebSearch) {
        lines.push('PLANNING MODE: Mixed. Combine the user\'s saved recipes with new AI-generated ideas to build a balanced, full week.')
      } else if (useMyRecipes && useWebSearch && !useFillForMe) {
        lines.push('PLANNING MODE: Blend saved recipes and web-found recipes. Fill some slots from the Recipe Box and search online for the rest, prioritizing pantry fit.')
      } else if (useMyRecipes && useFillForMe && !useWebSearch) {
        lines.push('PLANNING MODE: Saved recipes first, then AI ideas. Use saved recipes as the primary source and fill remaining gaps with AI-generated ideas. Skip web search.')
      } else if (useWebSearch && useFillForMe && !useMyRecipes) {
        lines.push('PLANNING MODE: Web search + AI ideas. Search online for highly-rated suggestions and supplement with AI-generated ideas for any remaining slots.')
      } else {
        lines.push('PLANNING MODE: Comprehensive. Use saved recipes first, fill gaps with online search results, and use AI-generated ideas for any remaining empty slots.')
      }
      return lines.join('\n')
    }

    function buildFiltersInstruction(filters) {
      const lines = []

      if (filters.weeklyBudget) {
        lines.push(`\nBUDGET CONSTRAINT: The user has a weekly grocery budget of $${filters.weeklyBudget}. Choose affordable ingredients and cost-effective meals.`)
        if (filters.stores?.length > 0) {
          const storeNames = filters.stores.map(s => s.label || s.value).join(', ')
          lines.push(`The user shops at: ${storeNames}. When possible, suggest meals that use ingredients commonly on sale or competitively priced at these stores.`)
        }
      }

      if (filters.macros && Object.keys(filters.macros).length > 0) {
        const m = filters.macros
        const parts = []
        if (m.calories) parts.push(`${m.calories} calories`)
        if (m.protein) parts.push(`${m.protein}g protein`)
        if (m.carbs) parts.push(`${m.carbs}g carbs`)
        if (m.fat) parts.push(`${m.fat}g fat`)
        if (parts.length > 0) {
          lines.push(`\nMACRO TARGETS (daily): ${parts.join(', ')}. Plan meals so the daily total across breakfast, lunch, and dinner roughly hits these targets. Distribute protein evenly across meals.`)
        }
      }

      if (filters.timePerDay) {
        const TIME_MAP = { quick: 'under 30 min', medium: '30-60 min', elaborate: '60+ min' }
        const DAY_FULL = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' }
        lines.push('\nTIME CONSTRAINTS PER DAY:')
        Object.entries(filters.timePerDay).forEach(([day, time]) => {
          const isCrockpot = filters.crockpotDays?.includes(day)
          const label = `${DAY_FULL[day] || day}: ${TIME_MAP[time] || time}`
          lines.push(`- ${label}${isCrockpot ? ' (crockpot/slow cooker meal preferred)' : ''}`)
        })
      } else if (filters.timeAll) {
        const TIME_MAP = { quick: 'under 30 minutes', medium: '30-60 minutes', elaborate: '60+ minutes' }
        lines.push(`\nTIME CONSTRAINT: All meals should take ${TIME_MAP[filters.timeAll] || filters.timeAll} total cook time.`)
      }

      return lines.join('\n')
    }

    if (isMockMode()) {
      const [currentMeals, pantryItems, preferences, dietaryRestrictions, userRecipes] =
        await Promise.all([
          getMockMeals(),
          getMockPantry(),
          getMockCookingPreferences(),
          Promise.resolve(getMockDietaryRestrictions()),
          getMockRecipes(),
        ])

      const PLANNABLE_TYPES = new Set(['breakfast', 'lunch', 'dinner'])
      const existingMeals = []
      const emptySlots = []
      currentMeals.forEach(dayObj => {
        dayObj.meals.forEach(meal => {
          if (!PLANNABLE_TYPES.has(meal.type)) return
          if (meal.name) {
            existingMeals.push({ day: dayObj.day, dayOfWeek: dayObj.dayOfWeek, type: meal.type, name: meal.name })
            if (filters.replanAll) {
              emptySlots.push({ day: dayObj.day, dayOfWeek: dayObj.dayOfWeek, type: meal.type })
            }
          } else {
            emptySlots.push({ day: dayObj.day, dayOfWeek: dayObj.dayOfWeek, type: meal.type })
          }
        })
      })

      if (!filters.replanAll && emptySlots.length === 0) return ok({ previewSlots: [] })

      const { buildMealPlanPrompt } = await import('@/lib/buildMealPlanPrompt')
      const { systemPromptPrefix } = await buildMealPlanPrompt(user.id)

      const { getTasteProfile, buildTasteProfilePrompt } = await import('@/lib/dal/taste-profile')
      const tasteProfile = await getTasteProfile(user.id)
      const tastePrompt = buildTasteProfilePrompt(tasteProfile)

      const { generateMealPlan, generateFullMealPlanRecipes } = await import('@/lib/gemini')
      const recipeList = userRecipes.map(r => ({ name: r.name, tags: r.tags || [] }))
      const existingContext = buildExistingMealsContext(existingMeals)
      const modeInstruction = buildModeInstruction(selectedModes, recipeList.length > 0)
      const filtersInstruction = buildFiltersInstruction(filters)

      const result = await generateMealPlan(emptySlots, {
        pantryItems,
        preferences,
        dietaryRestrictions,
        userRecipes: recipeList,
        userInstructions: cleanInstructions,
        mealPlanSystemPrompt: systemPromptPrefix,
        existingMealsContext: existingContext,
        modeInstruction,
        tasteProfilePrompt: tastePrompt,
        filtersInstruction,
      })

      const pantryNames = pantryItems.map(i => i.name.toLowerCase())
      const newAiSlots = []
      const savedSlots = []

      for (const slot of result.slots || []) {
        const dayLabel = Object.keys(DAY_TO_INT).find(k => DAY_TO_INT[k] === slot.day_of_week)
        if (!dayLabel) continue

        if (slot.is_saved_recipe) {
          const match = userRecipes.find(r =>
            r.name.toLowerCase().trim() === (slot.meal_name || '').toLowerCase().trim()
          )
          savedSlots.push({ slot, dayLabel, matchedRecipe: match || null })
        } else {
          newAiSlots.push({
            dayOfWeek: slot.day_of_week,
            day: dayLabel,
            type: slot.meal_type,
            mealName: slot.meal_name,
          })
        }
      }

      const fullRecipeData = newAiSlots.length > 0
        ? await generateFullMealPlanRecipes(newAiSlots, { pantryItems, preferences, dietaryRestrictions })
        : { slots: [] }

      const fullRecipeMap = {}
      for (const r of fullRecipeData.slots || []) {
        const key = `${r.day_of_week}:${r.meal_type}`
        fullRecipeMap[key] = r
      }

      const previewSlots = []

      for (const { slot, dayLabel, matchedRecipe } of savedSlots) {
        const fullRecipe = matchedRecipe
          ? userRecipes.find(r => r.name.toLowerCase().trim() === slot.meal_name.toLowerCase().trim())
          : null
        previewSlots.push({
          day: dayLabel,
          dayOfWeek: slot.day_of_week,
          type: slot.meal_type,
          recipe: {
            id: fullRecipe?.id ?? null,
            name: slot.meal_name,
            description: fullRecipe?.description ?? null,
            emoji: null,
            ingredients: (fullRecipe?.ingredients || []).map(ing => ({
              name: ing.name,
              quantity: ing.quantity,
              inPantry: pantryNames.includes(ing.name.toLowerCase()),
              isStaple: false,
            })),
            instructions: fullRecipe?.instructions
              ? (typeof fullRecipe.instructions === 'string'
                  ? fullRecipe.instructions.split('\n').filter(Boolean)
                  : fullRecipe.instructions)
              : [],
            cook_time_minutes: fullRecipe?.cook_time_minutes ?? null,
            prep_time_minutes: fullRecipe?.prep_time_minutes ?? null,
            servings: fullRecipe?.servings ?? null,
            estimated_cost: null,
            macros: null,
            isFromRecipeBox: true,
          },
        })
      }

      for (const aiSlot of newAiSlots) {
        const key = `${aiSlot.dayOfWeek}:${aiSlot.type}`
        const r = fullRecipeMap[key]
        previewSlots.push({
          day: aiSlot.day,
          dayOfWeek: aiSlot.dayOfWeek,
          type: aiSlot.type,
          recipe: {
            id: null,
            name: r?.meal_name ?? aiSlot.mealName,
            description: r?.description ?? null,
            emoji: r?.emoji ?? null,
            ingredients: (r?.ingredients || []).map(ing => ({
              name: ing.name,
              quantity: ing.quantity,
              inPantry: pantryNames.includes(ing.name.toLowerCase()),
              isStaple: false,
            })),
            instructions: r?.instructions ?? [],
            cook_time_minutes: r?.cook_time_minutes ?? null,
            prep_time_minutes: r?.prep_time_minutes ?? null,
            servings: r?.servings ?? null,
            estimated_cost: r?.estimated_cost ?? null,
            macros: r?.macros ?? null,
            isFromRecipeBox: false,
          },
        })
      }

      return ok({ previewSlots })
    }

    const { getSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = await getSupabaseServerClient()

    const { getOrCreateMealPlan } = await import('@/lib/dal/meals')
    const mealPlanId = await getOrCreateMealPlan(user.id, supabase, weekOffset)

    const [slotsResult, pantryResult, prefsResult, dietResult, recipesResult] = await Promise.all([
      supabase
        .from('meal_slots')
        .select('day_of_week, meal_type, custom_meal_name, recipe_id')
        .eq('meal_plan_id', mealPlanId),
      supabase
        .from('pantry_items')
        .select('name, category, freshness, days_left')
        .eq('user_id', user.id)
        .limit(60),
      supabase
        .from('profiles')
        .select('cooking_preferences')
        .eq('id', user.id)
        .single(),
      supabase
        .from('dietary_restrictions')
        .select('restriction')
        .eq('user_id', user.id),
      supabase
        .from('recipes')
        .select('id, name, tags, description, ingredients, instructions, prep_time_minutes, cook_time_minutes, servings')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(50),
    ])

    const allSlots = slotsResult.data || []
    const filledSlots = allSlots.filter(s => s.custom_meal_name || s.recipe_id)
    const filledDayTypes = new Set(filledSlots.map(s => `${s.day_of_week}:${s.meal_type}`))

    const existingMeals = filledSlots.map(s => ({
      dayOfWeek: s.day_of_week,
      type: s.meal_type,
      name: s.custom_meal_name || '(linked recipe)',
    }))

    const emptySlots = []
    const DAYS_LIST = [
      { day: 'Mon', dayOfWeek: 1 }, { day: 'Tue', dayOfWeek: 2 }, { day: 'Wed', dayOfWeek: 3 },
      { day: 'Thu', dayOfWeek: 4 }, { day: 'Fri', dayOfWeek: 5 }, { day: 'Sat', dayOfWeek: 6 }, { day: 'Sun', dayOfWeek: 7 },
    ]
    const MEAL_TYPES_LIST = ['breakfast', 'lunch', 'dinner']

    DAYS_LIST.forEach(({ day, dayOfWeek }) => {
      MEAL_TYPES_LIST.forEach(type => {
        if (filters.replanAll || !filledDayTypes.has(`${dayOfWeek}:${type}`)) {
          emptySlots.push({ day, dayOfWeek, type })
        }
      })
    })

    if (!filters.replanAll && emptySlots.length === 0) return ok({ previewSlots: [] })

    const pantryItems = (pantryResult.data || []).map(i => ({
      name: i.name, category: i.category, freshness: i.freshness, daysLeft: i.days_left,
    }))
    const preferences = prefsResult.data?.cooking_preferences ?? null
    const dietaryRestrictions = (dietResult.data || []).map(d => d.restriction)
    const fullUserRecipes = recipesResult.data || []
    const userRecipesList = fullUserRecipes.map(r => ({ name: r.name, tags: r.tags || [] }))

    const pantryNames = pantryItems.map(i => i.name.toLowerCase())

    const { buildMealPlanPrompt } = await import('@/lib/buildMealPlanPrompt')
    const { systemPromptPrefix } = await buildMealPlanPrompt(user.id)

    const { getTasteProfile, buildTasteProfilePrompt } = await import('@/lib/dal/taste-profile')
    const tasteProfile = await getTasteProfile(user.id)
    const tastePrompt = buildTasteProfilePrompt(tasteProfile)

    const existingContext = buildExistingMealsContext(existingMeals)
    const modeInstruction = buildModeInstruction(selectedModes, userRecipesList.length > 0)
    const filtersInstruction = buildFiltersInstruction(filters)

    const { generateMealPlan, generateFullMealPlanRecipes } = await import('@/lib/gemini')
    const result = await generateMealPlan(emptySlots, {
      pantryItems,
      preferences,
      dietaryRestrictions,
      userRecipes: userRecipesList,
      userInstructions: cleanInstructions,
      mealPlanSystemPrompt: systemPromptPrefix,
      existingMealsContext: existingContext,
      modeInstruction,
      tasteProfilePrompt: tastePrompt,
      filtersInstruction,
    })

    const newAiSlots = []
    const savedSlots = []

    for (const slot of result.slots || []) {
      const dayLabel = Object.keys(DAY_TO_INT).find(k => DAY_TO_INT[k] === slot.day_of_week)
      if (!dayLabel) continue

      if (slot.is_saved_recipe) {
        const match = fullUserRecipes.find(r =>
          r.name.toLowerCase().trim() === (slot.meal_name || '').toLowerCase().trim()
        )
        savedSlots.push({ slot, dayLabel, matchedRecipe: match || null })
      } else {
        newAiSlots.push({
          dayOfWeek: slot.day_of_week,
          day: dayLabel,
          type: slot.meal_type,
          mealName: slot.meal_name,
        })
      }
    }

    const fullRecipeData = newAiSlots.length > 0
      ? await generateFullMealPlanRecipes(newAiSlots, { pantryItems, preferences, dietaryRestrictions })
      : { slots: [] }

    const fullRecipeMap = {}
    for (const r of fullRecipeData.slots || []) {
      const key = `${r.day_of_week}:${r.meal_type}`
      fullRecipeMap[key] = r
    }

    const previewSlots = []

    for (const { slot, dayLabel, matchedRecipe } of savedSlots) {
      previewSlots.push({
        day: dayLabel,
        dayOfWeek: slot.day_of_week,
        type: slot.meal_type,
        recipe: {
          id: matchedRecipe?.id ?? null,
          name: slot.meal_name,
          description: matchedRecipe?.description ?? null,
          emoji: null,
          ingredients: (matchedRecipe?.ingredients || []).map(ing => ({
            name: ing.name,
            quantity: ing.quantity,
            inPantry: pantryNames.includes(ing.name.toLowerCase()),
            isStaple: false,
          })),
          instructions: matchedRecipe?.instructions
            ? (typeof matchedRecipe.instructions === 'string'
                ? matchedRecipe.instructions.split('\n').filter(Boolean)
                : matchedRecipe.instructions)
            : [],
          cook_time_minutes: matchedRecipe?.cook_time_minutes ?? null,
          prep_time_minutes: matchedRecipe?.prep_time_minutes ?? null,
          servings: matchedRecipe?.servings ?? null,
          estimated_cost: null,
          macros: null,
          isFromRecipeBox: true,
        },
      })
    }

    for (const aiSlot of newAiSlots) {
      const key = `${aiSlot.dayOfWeek}:${aiSlot.type}`
      const r = fullRecipeMap[key]
      previewSlots.push({
        day: aiSlot.day,
        dayOfWeek: aiSlot.dayOfWeek,
        type: aiSlot.type,
        recipe: {
          id: null,
          name: r?.meal_name ?? aiSlot.mealName,
          description: r?.description ?? null,
          emoji: r?.emoji ?? null,
          ingredients: (r?.ingredients || []).map(ing => ({
            name: ing.name,
            quantity: ing.quantity,
            inPantry: pantryNames.includes(ing.name.toLowerCase()),
            isStaple: false,
          })),
          instructions: r?.instructions ?? [],
          cook_time_minutes: r?.cook_time_minutes ?? null,
          prep_time_minutes: r?.prep_time_minutes ?? null,
          servings: r?.servings ?? null,
          estimated_cost: r?.estimated_cost ?? null,
          macros: r?.macros ?? null,
          isFromRecipeBox: false,
        },
      })
    }

    return ok({ previewSlots })
  } catch (err) {
    console.error('[generateMealPlanPreviewAction] error:', err?.message || err)
    return fail('Something went wrong')
  }
}

export async function savePlanningModeAction(slotsData, weekOffset = 0) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    if (!Array.isArray(slotsData) || slotsData.length === 0) return fail('No slots provided')

    if (isMockMode()) {
      for (const slot of slotsData) {
        const cleanDay = sanitizeString(slot.day, 10)
        const cleanType = sanitizeEnum(slot.type, ['breakfast', 'lunch', 'dinner', 'sides', 'sides2', 'sides3', 'sides4', 'breakfast_side', 'lunch_side', 'dinner_dessert'])
        if (!cleanDay || !cleanType) continue
        await updateMockMeal(cleanDay, cleanType, {
          name: slot.recipe?.name ?? '',
          recipeId: slot.recipe?.id ?? null,
          recipe: null,
          ingredients: [],
        })
      }
      revalidatePath('/meals')
      return ok({ savedCount: slotsData.length, groceryCount: 0 })
    }

    const { getSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = await getSupabaseServerClient()

    const { getOrCreateMealPlan } = await import('@/lib/dal/meals')
    const mealPlanId = await getOrCreateMealPlan(user.id, supabase, weekOffset)

    let savedCount = 0
    const allCheckedIngredients = []

    for (const slot of slotsData) {
      const cleanDay = sanitizeString(slot.day, 10)
      const cleanType = sanitizeEnum(slot.type, ['breakfast', 'lunch', 'dinner', 'sides', 'sides2', 'sides3', 'sides4', 'breakfast_side', 'lunch_side', 'dinner_dessert'])
      if (!cleanDay || !cleanType || !slot.recipe) continue

      const dayInt = DAY_TO_INT[cleanDay]
      if (!dayInt) continue

      let recipeId = slot.recipe.id ?? null

      if (!recipeId) {
        const { data: newRecipe, error: recipeError } = await supabase
          .from('recipes')
          .insert({
            user_id: user.id,
            name: sanitizeString(slot.recipe.name, 200) || 'Untitled',
            description: slot.recipe.description ? sanitizeString(slot.recipe.description, 500) : null,
            ingredients: slot.recipe.ingredients || [],
            instructions: Array.isArray(slot.recipe.instructions)
              ? slot.recipe.instructions.join('\n')
              : (slot.recipe.instructions || ''),
            prep_time_minutes: slot.recipe.prep_time_minutes || null,
            cook_time_minutes: slot.recipe.cook_time_minutes || null,
            servings: slot.recipe.servings || null,
            source: 'koda-planning',
            tags: ['koda-generated'],
          })
          .select('id')
          .single()

        if (!recipeError && newRecipe) {
          recipeId = newRecipe.id
        }
      }

      const { error } = await supabase
        .from('meal_slots')
        .upsert(
          {
            user_id: user.id,
            meal_plan_id: mealPlanId,
            day_of_week: dayInt,
            meal_type: cleanType,
            recipe_id: recipeId,
            custom_meal_name: !slot.recipe.id ? sanitizeString(slot.recipe.name, 200) : null,
          },
          { onConflict: 'meal_plan_id,day_of_week,meal_type' }
        )

      if (!error) savedCount++

      if (Array.isArray(slot.checkedIngredients)) {
        for (const ing of slot.checkedIngredients) {
          const cleanIng = sanitizeString(ing, 200)
          if (cleanIng) allCheckedIngredients.push(cleanIng)
        }
      }
    }

    let groceryCount = 0
    if (allCheckedIngredients.length > 0) {
      const groceryRows = allCheckedIngredients.map(name => ({
        user_id: user.id,
        name,
        status: 'need',
        category: 'Other',
      }))
      const { error: groceryError } = await supabase
        .from('grocery_items')
        .insert(groceryRows)
      if (!groceryError) groceryCount = groceryRows.length
    }

    revalidatePath('/meals')
    revalidatePath('/grocery')
    return ok({ savedCount, groceryCount })
  } catch (err) {
    console.error('[savePlanningModeAction] error:', err?.message || err)
    return fail('Something went wrong')
  }
}

export async function saveMealPlanDraftAction(previewSlots, weekOffset = 0) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    if (isMockMode()) {
      _mockPlanningDraft = { previewSlots, weekOffset }
      return ok()
    }

    const { getSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = await getSupabaseServerClient()

    const { getWeekMonday } = await import('@/lib/dal/meals')
    const weekStart = getWeekMonday(weekOffset)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    try {
      await supabase
        .from('meal_plan_drafts')
        .upsert(
          {
            user_id: user.id,
            week_start: weekStart,
            draft_data: { previewSlots, weekOffset },
            expires_at: expiresAt,
          },
          { onConflict: 'user_id' }
        )
    } catch {
      // Table may not exist yet — degrade gracefully
    }

    return ok()
  } catch {
    return fail('Something went wrong')
  }
}

export async function getMealPlanDraftAction() {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    if (isMockMode()) {
      return ok({ draft: _mockPlanningDraft || null })
    }

    const { getSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = await getSupabaseServerClient()

    try {
      const { data } = await supabase
        .from('meal_plan_drafts')
        .select('draft_data, expires_at')
        .eq('user_id', user.id)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()

      return ok({ draft: data?.draft_data ?? null })
    } catch {
      return ok({ draft: null })
    }
  } catch {
    return fail('Something went wrong')
  }
}

export async function dismissMealPlanDraftAction() {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    if (isMockMode()) {
      _mockPlanningDraft = null
      return ok()
    }

    const { getSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = await getSupabaseServerClient()

    try {
      await supabase
        .from('meal_plan_drafts')
        .delete()
        .eq('user_id', user.id)
    } catch {
      // Degrade gracefully if table doesn't exist
    }

    return ok()
  } catch {
    return fail('Something went wrong')
  }
}

/**
 * Save feedback when a meal is swapped out.
 * Best-effort — always returns ok() so it never blocks the swap flow.
 */
export async function saveFeedbackAction({ mealName, swapReason, ingredients = [], weekStart }) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return ok()

    const cleanMealName = sanitizeString(mealName, 200)
    const cleanSwapReason = swapReason ? sanitizeString(swapReason, 200) : null
    const cleanWeekStart = sanitizeString(weekStart, 20)
    const cleanIngredients = Array.isArray(ingredients)
      ? ingredients.map(i => sanitizeString(i, 100)).filter(Boolean).slice(0, 20)
      : []

    if (!cleanMealName) return ok()

    const { saveMealFeedback } = await import('@/lib/dal/meal-feedback')
    const { updateRejectedMeals } = await import('@/lib/dal/taste-profile')

    await saveMealFeedback(user.id, {
      mealName: cleanMealName,
      swapReason: cleanSwapReason,
      ingredients: cleanIngredients,
      suggestedByKoda: true,
      weekStart: cleanWeekStart,
      rating: null,
    })

    // Always add to rejected meals list
    await updateRejectedMeals(user.id, cleanMealName)

    return ok()
  } catch {
    // best-effort — never block the swap
    return ok()
  }
}

/**
 * Rate a Koda-suggested meal with thumbs up or down.
 */
export async function rateMealAction({ mealName, rating, weekStart }) {
  try {
    const user = await requireUser()
    const rate = apiLimiter.check(user.id)
    if (!rate.success) return fail('Too many requests. Please wait a moment.')

    const cleanMealName = sanitizeString(mealName, 200)
    const cleanRating = sanitizeEnum(rating, ['thumbs_up', 'thumbs_down'])
    const cleanWeekStart = sanitizeString(weekStart, 20)

    if (!cleanMealName) return fail('Meal name is required')
    if (!cleanRating) return fail('Invalid rating')

    const { saveMealFeedback } = await import('@/lib/dal/meal-feedback')
    await saveMealFeedback(user.id, {
      mealName: cleanMealName,
      swapReason: null,
      ingredients: [],
      suggestedByKoda: true,
      weekStart: cleanWeekStart,
      rating: cleanRating,
    })

    return ok()
  } catch {
    return fail('Something went wrong')
  }
}

/**
 * Return Koda-suggested meals from yesterday for display as rating cards on the dashboard.
 */
export async function getYesterdayKodaMealsAction() {
  try {
    const user = await requireUser()

    if (isMockMode()) {
      const { getMockYesterdayKodaMeals } = await import('@/lib/dal/mock-store')
      const meals = await getMockYesterdayKodaMeals()
      return ok({ meals })
    }

    const { getSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = await getSupabaseServerClient()

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayDayOfWeek = yesterday.getDay() === 0 ? 7 : yesterday.getDay()

    // Find the Monday of the week containing yesterday
    const mondayOfYesterdaysWeek = new Date(yesterday)
    const daysSinceMonday = (yesterday.getDay() + 6) % 7
    mondayOfYesterdaysWeek.setDate(yesterday.getDate() - daysSinceMonday)
    const weekStart = mondayOfYesterdaysWeek.toISOString().split('T')[0]

    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

    const { data } = await supabase
      .from('meal_slots')
      .select('meal_type, custom_meal_name, meal_plans!inner(week_start)')
      .eq('user_id', user.id)
      .eq('day_of_week', yesterdayDayOfWeek)
      .eq('suggested_by_koda', true)
      .gte('created_at', cutoff)
      .eq('meal_plans.week_start', weekStart)

    const meals = (data || []).map(s => ({
      name: s.custom_meal_name,
      type: s.meal_type,
      weekStart,
    })).filter(m => m.name)

    return ok({ meals })
  } catch {
    return ok({ meals: [] })
  }
}
