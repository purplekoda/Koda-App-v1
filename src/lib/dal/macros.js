import 'server-only'

import { isMockMode } from '@/lib/dal/require-user'

const MEMBER_COLORS = ['#1D9E75', '#185FA5', '#7F77DD', '#BA7517', '#D85A30']

function buildMemberShape(m, idx, weeklyActuals) {
  const calTarget = m.daily_calorie_target || m.macro_calories || 2000
  const proteinTarget = m.daily_protein_target || m.macro_protein_g || 150
  const carbTarget = m.daily_carb_target || m.macro_carbs_g || 200
  const fatTarget = m.daily_fat_target || m.macro_fat_g || 65

  return {
    id: m.id,
    name: m.name,
    initial: m.name?.charAt(0)?.toUpperCase() || '?',
    color: MEMBER_COLORS[idx % MEMBER_COLORS.length],
    ageGroup: m.age ? (m.age < 18 ? `Child (${m.age})` : 'Adult') : 'Adult',
    healthGoals: [],
    trackMacros: m.track_macros,
    allowPhotoMacroLogging: true,
    isPrimary: m.is_primary ?? false,
    targets: { calories: calTarget, protein: proteinTarget, carbs: carbTarget, fat: fatTarget },
    weeklyActuals,
  }
}

function buildWeeklyActuals(memberId, logs) {
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const now = new Date()
  const jsDay = now.getDay()
  const mondayOffset = jsDay === 0 ? -6 : 1 - jsDay
  const monday = new Date(now)
  monday.setDate(now.getDate() + mondayOffset)

  return DAYS.map((day, dayIdx) => {
    const target = new Date(monday)
    target.setDate(monday.getDate() + dayIdx)
    const dateStr = target.toISOString().slice(0, 10)
    const dayLogs = logs.filter(l => l.household_member_id === memberId && l.log_date === dateStr)
    return {
      day,
      calories: dayLogs.reduce((s, l) => s + (l.calories || 0), 0),
      protein: dayLogs.reduce((s, l) => s + Number(l.protein_grams || 0), 0),
      carbs: dayLogs.reduce((s, l) => s + Number(l.carbohydrate_grams || 0), 0),
      fat: dayLogs.reduce((s, l) => s + Number(l.fat_grams || 0), 0),
      meals: [],
    }
  })
}

export async function getMacroMembers(userId) {
  if (isMockMode()) {
    const { mockMacroMembers } = await import('@/data/mock-macros')
    return JSON.parse(JSON.stringify(mockMacroMembers))
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()

  const { data: members, error } = await supabase
    .from('household_members')
    .select('*')
    .eq('user_id', userId)
    .eq('track_macros', true)
    .order('created_at', { ascending: true })

  if (error || !members?.length) return []

  const now = new Date()
  const jsDay = now.getDay()
  const mondayOffset = jsDay === 0 ? -6 : 1 - jsDay
  const monday = new Date(now)
  monday.setDate(now.getDate() + mondayOffset)
  const weekStartStr = monday.toISOString().slice(0, 10)
  const todayStr = now.toISOString().slice(0, 10)

  const { data: logs } = await supabase
    .from('macro_logs')
    .select('household_member_id, log_date, calories, protein_grams, carbohydrate_grams, fat_grams')
    .eq('user_id', userId)
    .in('household_member_id', members.map(m => m.id))
    .gte('log_date', weekStartStr)
    .lte('log_date', todayStr)

  return members.map((m, idx) =>
    buildMemberShape(m, idx, buildWeeklyActuals(m.id, logs || []))
  )
}

/**
 * Returns the current day index (0=Mon, 6=Sun) for highlighting.
 */
export function getTodayIndex() {
  const jsDay = new Date().getDay() // 0=Sun, 1=Mon...
  return jsDay === 0 ? 6 : jsDay - 1
}

// ── Macro Extras (macro_logs) ──────────────────────────

export async function getMacroExtras(userId, memberId, date) {
  if (isMockMode()) {
    const { getMockMacroExtras } = await import('@/lib/dal/mock-store')
    const all = await getMockMacroExtras()
    return all.filter(e => e.member_id === memberId && e.logged_date === date)
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('macro_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('household_member_id', memberId)
    .eq('log_date', date)
    .order('created_at', { ascending: true })

  if (error) return []
  return (data || []).map(row => ({
    id: row.id,
    member_id: row.household_member_id,
    logged_date: row.log_date,
    meal_time: row.meal_type,
    food_name: row.food_name,
    calories: row.calories,
    protein: Number(row.protein_grams),
    carbs: Number(row.carbohydrate_grams),
    fat: Number(row.fat_grams),
    confidence: row.confidence,
    gemini_notes: row.notes,
  }))
}

export async function getMacroExtrasForWeek(userId, memberId, weekStart) {
  if (isMockMode()) {
    const { getMockMacroExtras } = await import('@/lib/dal/mock-store')
    const all = await getMockMacroExtras()
    const start = new Date(weekStart)
    const end = new Date(start)
    end.setDate(end.getDate() + 7)
    return all.filter(e => {
      if (e.member_id !== memberId) return false
      const d = new Date(e.logged_date)
      return d >= start && d < end
    })
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const end = new Date(weekStart)
  end.setDate(end.getDate() + 7)
  const { data, error } = await supabase
    .from('macro_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('household_member_id', memberId)
    .gte('log_date', weekStart)
    .lt('log_date', end.toISOString().slice(0, 10))
    .order('log_date', { ascending: true })

  if (error) return []
  return data || []
}

export async function getMacroExtrasForMonth(userId, memberId, year, month) {
  if (isMockMode()) {
    const { getMockMacroExtras } = await import('@/lib/dal/mock-store')
    const all = await getMockMacroExtras()
    return all.filter(e => {
      if (e.member_id !== memberId) return false
      const d = new Date(e.logged_date)
      return d.getFullYear() === year && d.getMonth() === month
    })
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const monthStr = String(month + 1).padStart(2, '0')
  const start = `${year}-${monthStr}-01`
  const nextMonth = month === 11 ? `${year + 1}-01-01` : `${year}-${String(month + 2).padStart(2, '0')}-01`
  const { data, error } = await supabase
    .from('macro_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('household_member_id', memberId)
    .gte('log_date', start)
    .lt('log_date', nextMonth)
    .order('log_date', { ascending: true })

  if (error) return []
  return data || []
}

export async function getMacroExtrasTotal(userId, memberId, date) {
  const extras = await getMacroExtras(userId, memberId, date)
  const total = { calories: 0, protein: 0, carbs: 0, fat: 0 }
  for (const e of extras) {
    total.calories += e.calories || 0
    total.protein += e.protein || 0
    total.carbs += e.carbs || 0
    total.fat += e.fat || 0
  }
  return { extras, total }
}

export async function addMacroExtra(userId, data) {
  if (isMockMode()) {
    const { addMockMacroExtra } = await import('@/lib/dal/mock-store')
    return addMockMacroExtra({
      ...data,
      user_id: userId,
      logged_date: data.logged_date || new Date().toISOString().slice(0, 10),
    })
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { data: row, error } = await supabase
    .from('macro_logs')
    .insert({
      user_id: userId,
      household_member_id: data.member_id,
      log_date: data.logged_date || new Date().toISOString().slice(0, 10),
      meal_type: data.meal_time,
      food_name: data.food_name,
      serving_description: data.serving_description || null,
      calories: data.calories || 0,
      protein_grams: data.protein || 0,
      carbohydrate_grams: data.carbs || 0,
      fat_grams: data.fat || 0,
      source: data.source || 'manual',
      confidence: ['high', 'medium', 'low'].includes(data.confidence) ? data.confidence : null,
      notes: data.gemini_notes || null,
    })
    .select()
    .single()

  if (error) return null
  return {
    id: row.id,
    member_id: row.household_member_id,
    logged_date: row.log_date,
    meal_time: row.meal_type,
    food_name: row.food_name,
    calories: row.calories,
    protein: Number(row.protein_grams),
    carbs: Number(row.carbohydrate_grams),
    fat: Number(row.fat_grams),
  }
}

export async function updateMacroExtra(userId, extraId, updates) {
  if (isMockMode()) {
    const { updateMockMacroExtra } = await import('@/lib/dal/mock-store')
    return updateMockMacroExtra(extraId, updates)
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const dbUpdates = {}
  if (updates.food_name !== undefined) dbUpdates.food_name = updates.food_name
  if (updates.calories !== undefined) dbUpdates.calories = updates.calories
  if (updates.protein !== undefined) dbUpdates.protein_grams = updates.protein
  if (updates.carbs !== undefined) dbUpdates.carbohydrate_grams = updates.carbs
  if (updates.fat !== undefined) dbUpdates.fat_grams = updates.fat

  const { data, error } = await supabase
    .from('macro_logs')
    .update(dbUpdates)
    .eq('id', extraId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) return null
  return data
}

export async function saveMacroTargets(userId, data) {
  if (isMockMode()) {
    const { mockMacroMembers } = await import('@/data/mock-macros')
    const member = mockMacroMembers.find(m => m.id === data.member_id)
    if (member) {
      member.track_macros = data.track_macros
      if (data.track_macros) {
        member.targets = {
          calories: data.daily_calorie_target || member.targets?.calories || 2000,
          protein: data.daily_protein_target || member.targets?.protein || 150,
          carbs: data.daily_carb_target || member.targets?.carbs || 200,
          fat: data.daily_fat_target || member.targets?.fat || 65,
        }
        member.mealDistribution = data.macro_meal_distribution || { breakfast: 25, lunch: 35, dinner: 40 }
      }
    }
    return { success: true }
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase
    .from('household_members')
    .update({
      track_macros: data.track_macros,
      daily_calorie_target: data.daily_calorie_target || null,
      daily_protein_target: data.daily_protein_target || null,
      daily_carb_target: data.daily_carb_target || null,
      daily_fat_target: data.daily_fat_target || null,
      macro_meal_distribution: data.macro_meal_distribution || null,
    })
    .eq('id', data.member_id)
    .eq('user_id', userId)

  if (error) throw error
  return { success: true }
}
