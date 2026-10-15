import 'server-only'

import { isMockMode } from './require-user'
import { getMockMeals, getMockTodayMeals, getMockSwapSuggestions } from './mock-store'
import { enrichRecipesWithSignedUrls } from '@/lib/storage'

const DAYS = [
  { day: 'Mon', dayOfWeek: 1 },
  { day: 'Tue', dayOfWeek: 2 },
  { day: 'Wed', dayOfWeek: 3 },
  { day: 'Thu', dayOfWeek: 4 },
  { day: 'Fri', dayOfWeek: 5 },
  { day: 'Sat', dayOfWeek: 6 },
  { day: 'Sun', dayOfWeek: 7 },
]
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'sides']

const DEFAULT_TZ = 'America/Denver'

// Day-of-week (Mon=1..Sun=7) in the household timezone. UTC on the server
// otherwise flips "today" late each evening in Mountain Time.
export function getLocalDayOfWeek(tz = DEFAULT_TZ, now = new Date()) {
  const name = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: tz }).format(now)
  const map = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }
  return map[name] || 7
}

function getLocalParts(tz = DEFAULT_TZ, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric', month: '2-digit', day: '2-digit', timeZone: tz,
  }).formatToParts(now)
  const get = t => parts.find(p => p.type === t)?.value
  return { year: Number(get('year')), month: Number(get('month')), day: Number(get('day')) }
}

export function buildWeekScaffold(rows = [], weekOffset = 0) {
  const todayDow = getLocalDayOfWeek()

  const EXTRA_SIDES = ['sides2', 'sides3', 'sides4', 'breakfast_side', 'lunch_side', 'dinner_dessert']

  return DAYS.map(({ day, dayOfWeek }) => {
    const meals = MEAL_TYPES.map((type) => {
      const row = (rows || []).find(
        (r) => r.day_of_week === dayOfWeek && r.meal_type === type
      )
      return {
        type,
        name: row?.custom_meal_name ?? row?.recipes?.name ?? null,
        recipeId: row?.recipe_id ?? null,
        slotId: row?.id ?? null,
        recipe: row?.recipes ?? null,
        ingredients: row?.recipes?.ingredients ?? [],
      }
    })

    // Also include any extra sides rows (sides2–4) that exist in the DB
    EXTRA_SIDES.forEach((type) => {
      const row = (rows || []).find(
        (r) => r.day_of_week === dayOfWeek && r.meal_type === type
      )
      if (row) {
        meals.push({
          type,
          name: row.custom_meal_name ?? row.recipes?.name ?? null,
          recipeId: row.recipe_id ?? null,
          slotId: row.id ?? null,
          recipe: row.recipes ?? null,
          ingredients: row.recipes?.ingredients ?? [],
        })
      }
    })

    return { day, dayOfWeek, isToday: weekOffset === 0 && dayOfWeek === todayDow, meals }
  })
}

// Returns the ISO Monday date string (YYYY-MM-DD) for a given week offset,
// computed in the household timezone (defaults to America/Denver).
export function getWeekMonday(weekOffset = 0, tz = DEFAULT_TZ) {
  const now = new Date()
  const dow = getLocalDayOfWeek(tz, now)
  const { year, month, day } = getLocalParts(tz, now)
  // Build a UTC date for midnight of the local calendar day, then shift by
  // (dow-1) days backward to the local Monday, then by weekOffset weeks.
  const localMidnight = new Date(Date.UTC(year, month - 1, day))
  localMidnight.setUTCDate(localMidnight.getUTCDate() - (dow - 1) + weekOffset * 7)
  return localMidnight.toISOString().slice(0, 10)
}

// Returns the ISO Monday date string (YYYY-MM-DD) for the current week.
function getCurrentWeekMonday() {
  return getWeekMonday(0)
}

// Upserts a meal_plans row for the given user + week and returns its id.
export async function getOrCreateMealPlan(userId, supabase, weekOffset = 0) {
  const weekStart = getWeekMonday(weekOffset)

  const { data, error } = await supabase
    .from('meal_plans')
    .upsert(
      { user_id: userId, week_start: weekStart },
      { onConflict: 'user_id,week_start' }
    )
    .select('id')
    .single()

  if (error) throw new Error('Failed to resolve meal plan: ' + error.message)
  return data.id
}

export async function getWeeklyMeals(userId, weekOffset = 0) {
  if (isMockMode()) {
    return getMockMeals()
  }

  const weekStart = getWeekMonday(weekOffset)
  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()

  // Look up the meal plan for this week — if none exists, return empty scaffold
  const { data: plan } = await supabase
    .from('meal_plans')
    .select('id')
    .eq('user_id', userId)
    .eq('week_start', weekStart)
    .single()

  if (!plan) return buildWeekScaffold([], weekOffset)

  const { data, error } = await supabase
    .from('meal_slots')
    .select('*, recipes(id, name, description, image_url, photo_path, tags, prep_time_minutes, cook_time_minutes, servings, ingredients, instructions)')
    .eq('meal_plan_id', plan.id)
    .order('day_of_week')

  if (error) return buildWeekScaffold([], weekOffset)

  const nestedRecipes = (data || []).map(r => r.recipes).filter(Boolean)
  const enriched = await enrichRecipesWithSignedUrls(nestedRecipes)
  const recipeMap = Object.fromEntries(enriched.map(r => [r.id, r]))
  const enrichedData = data.map(row => ({
    ...row,
    recipes: row.recipes ? (recipeMap[row.recipes.id] ?? row.recipes) : null,
  }))
  return buildWeekScaffold(enrichedData, weekOffset)
}

export async function getUserRecipesForPicker(userId) {
  if (isMockMode()) {
    const { getMockRecipes } = await import('./mock-store')
    const recipes = await getMockRecipes()
    return recipes.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description ?? null,
      image_url: r.image_url ?? null,
      tags: r.tags ?? [],
      prep_time_minutes: r.prep_time_minutes ?? null,
      cook_time_minutes: r.cook_time_minutes ?? null,
    }))
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('recipes')
    .select('id, name, description, image_url, photo_path, tags, prep_time_minutes, cook_time_minutes')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) throw new Error('Failed to load recipes')
  return enrichRecipesWithSignedUrls(data)
}

export async function getTodayMeals(userId) {
  if (isMockMode()) {
    return getMockTodayMeals()
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const today = getLocalDayOfWeek()
  const weekStart = getCurrentWeekMonday()

  // Scope to the current week's meal plan to avoid returning slots from past weeks
  const { data: plan } = await supabase
    .from('meal_plans')
    .select('id')
    .eq('user_id', userId)
    .eq('week_start', weekStart)
    .single()

  if (!plan) return []

  const { data, error } = await supabase
    .from('meal_slots')
    .select('*')
    .eq('meal_plan_id', plan.id)
    .eq('day_of_week', today)

  if (error) throw new Error('Failed to load today meals')

  const MEAL_TIMES = { breakfast: '8:00 AM', lunch: '12:00 PM', dinner: '6:00 PM' }
  return (data || []).map(row => ({
    id: row.id,
    type: row.meal_type,
    name: row.custom_meal_name || null,
    time: MEAL_TIMES[row.meal_type] || '',
  }))
}

export async function getSwapSuggestions(userId) {
  if (isMockMode()) {
    return getMockSwapSuggestions()
  }

  // In production, this could call an AI service or query recipes
  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .limit(4)

  if (error) throw new Error('Failed to load swap suggestions')
  return data
}
