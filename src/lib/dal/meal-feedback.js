import 'server-only'

import { isMockMode } from './require-user'

/**
 * Save feedback when a user swaps or rates a Koda-suggested meal.
 * Best-effort — errors are swallowed so the main flow is never blocked.
 */
export async function saveMealFeedback(userId, {
  mealName,
  swapReason = null,
  ingredients = [],
  suggestedByKoda = false,
  weekStart,
  rating = null,
}) {
  try {
    if (isMockMode()) {
      const { addMockMealFeedback } = await import('./mock-store')
      addMockMealFeedback({
        user_id: userId,
        meal_name: mealName,
        swap_reason: swapReason,
        ingredients,
        suggested_by_koda: suggestedByKoda,
        week_start: weekStart,
        rating,
      })
      return
    }

    const { getSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = await getSupabaseServerClient()
    await supabase.from('meal_feedback').upsert(
      {
        user_id: userId,
        meal_name: mealName,
        swap_reason: swapReason,
        ingredients,
        suggested_by_koda: suggestedByKoda,
        week_start: weekStart,
        rating,
        created_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,meal_name,week_start' }
    )
  } catch {
    // best-effort — never block the main flow
  }
}

/**
 * Get recent meal ratings for use in Gemini prompt context.
 * Returns only entries with an explicit thumbs_up or thumbs_down rating.
 */
export async function getRecentRatings(userId, days = 30) {
  try {
    if (isMockMode()) {
      const { getMockMealFeedback } = await import('./mock-store')
      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
      return getMockMealFeedback()
        .filter(f => f.user_id === userId && (f.rating === 'thumbs_up' || f.rating === 'thumbs_down') && f.created_at >= cutoff)
        .map(f => ({ mealName: f.meal_name, rating: f.rating, createdAt: f.created_at }))
    }

    const { getSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = await getSupabaseServerClient()
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    const { data } = await supabase
      .from('meal_feedback')
      .select('meal_name, rating, created_at')
      .eq('user_id', userId)
      .in('rating', ['thumbs_up', 'thumbs_down'])
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(100)

    return (data || []).map(f => ({ mealName: f.meal_name, rating: f.rating, createdAt: f.created_at }))
  } catch {
    return []
  }
}

/**
 * Get yesterday's Koda-suggested meals for the dashboard rating cards.
 * Rating cards expire after 48 hours and only show Koda-suggested meals.
 */
export async function getYesterdayKodaMeals(userId) {
  try {
    if (isMockMode()) {
      const { getMockYesterdayKodaMeals } = await import('./mock-store')
      return getMockYesterdayKodaMeals()
    }

    const { getSupabaseServerClient } = await import('@/lib/supabase/server')
    const supabase = await getSupabaseServerClient()

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayDayOfWeek = yesterday.getDay() === 0 ? 7 : yesterday.getDay()

    const mondayOfYesterdaysWeek = new Date(yesterday)
    const daysSinceMonday = (yesterday.getDay() + 6) % 7
    mondayOfYesterdaysWeek.setDate(yesterday.getDate() - daysSinceMonday)
    const weekStart = mondayOfYesterdaysWeek.toISOString().split('T')[0]

    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

    const { data } = await supabase
      .from('meal_slots')
      .select('meal_type, custom_meal_name, meal_plans!inner(week_start)')
      .eq('user_id', userId)
      .eq('day_of_week', yesterdayDayOfWeek)
      .eq('suggested_by_koda', true)
      .gte('created_at', cutoff)
      .eq('meal_plans.week_start', weekStart)

    return (data || [])
      .map(s => ({ name: s.custom_meal_name, type: s.meal_type, weekStart }))
      .filter(m => m.name)
  } catch {
    return []
  }
}
