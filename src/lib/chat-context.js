import 'server-only'

import { isMockMode } from '@/lib/dal/require-user'

async function fetchRecentReceipts(userId) {
  if (isMockMode()) {
    const { getMockReceipts, getMockReceiptItems } = await import('@/lib/dal/mock-store')
    const all = await getMockReceipts()
    const recent = all.slice(0, 8)
    return Promise.all(
      recent.map(async r => ({
        ...r,
        receipt_items: await getMockReceiptItems(r.id),
      }))
    )
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 28)

  const { data } = await supabase
    .from('receipts')
    .select('id, store_name, created_at, total_amount, receipt_items(item_name)')
    .eq('user_id', userId)
    .gte('created_at', cutoff.toISOString())
    .order('created_at', { ascending: false })
    .limit(10)

  return data ?? []
}

async function fetchCurrentMealPlan(userId) {
  const { getWeeklyMeals } = await import('@/lib/dal/meals')
  return getWeeklyMeals(userId, 0)
}

async function fetchRecipeSummaries(userId) {
  const { getUserRecipes } = await import('@/lib/dal/recipes')
  const recipes = await getUserRecipes(userId)
  return (recipes || []).map(r => ({
    id: r.id,
    name: r.name,
    tags: r.tags || [],
  }))
}

async function fetchBudgetSummary(userId) {
  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()

  const { data: budget } = await supabase
    .from('user_budgets')
    .select('weekly_budget, monthly_budget')
    .eq('user_id', userId)
    .single()

  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  weekStart.setHours(0, 0, 0, 0)

  const { data: receipts } = await supabase
    .from('receipts')
    .select('total_amount')
    .eq('user_id', userId)
    .gte('receipt_date', weekStart.toISOString().split('T')[0])

  const spent = receipts?.reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0
  return {
    weekly_budget: budget?.weekly_budget || null,
    spent_this_week: spent,
    remaining: budget?.weekly_budget ? budget.weekly_budget - spent : null,
  }
}

async function fetchMacroSummary(userId) {
  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()

  const today = new Date().toISOString().split('T')[0]

  const { data: members } = await supabase
    .from('household_members')
    .select('name, track_macros, daily_calorie_target, daily_protein_target, daily_carb_target, daily_fat_target')
    .eq('user_id', userId)
    .eq('track_macros', true)

  if (!members?.length) return null

  const { data: logs } = await supabase
    .from('macro_logs')
    .select('household_member_id, calories, protein_grams, carbohydrate_grams, fat_grams')
    .eq('user_id', userId)
    .eq('log_date', today)

  return { members, logs: logs || [] }
}

/**
 * Build supplemental chat context (receipts, meal plan, recipe box) for every Gemini call.
 * Pantry, staples, household members, and taste profile come from buildMealPlanPrompt.
 *
 * @param {string} userId
 * @returns {Promise<string>} Formatted context block to prepend to the system prompt.
 */
export async function buildChatContext(userId) {
  const [receipts, mealPlan, recipes, budgetData, macroData] = await Promise.all([
    fetchRecentReceipts(userId).catch(() => []),
    fetchCurrentMealPlan(userId).catch(() => []),
    fetchRecipeSummaries(userId).catch(() => []),
    fetchBudgetSummary(userId).catch(() => null),
    fetchMacroSummary(userId).catch(() => null),
  ])

  const lines = []

  // Recent receipts (last 4 weeks)
  if (receipts.length > 0) {
    lines.push('RECENT GROCERY PURCHASES (last 4 weeks):')
    for (const r of receipts) {
      const date = r.created_at
        ? new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : 'Unknown date'
      const total = r.total_amount ? ` — $${Number(r.total_amount).toFixed(2)}` : ''
      const items = (r.receipt_items || [])
        .map(i => i.item_name)
        .slice(0, 8)
        .join(', ')
      lines.push(
        `  ${r.store_name || 'Unknown store'} on ${date}${total}${items ? ': ' + items : ''}`
      )
    }
  } else {
    lines.push('RECENT GROCERY PURCHASES: none in the last 4 weeks')
  }

  // Current meal plan
  const filledDays = (mealPlan || []).filter(d => d.meals.some(m => m.name))
  if (filledDays.length > 0) {
    lines.push('\nTHIS WEEK\'S MEAL PLAN:')
    for (const day of filledDays) {
      const meals = day.meals.filter(m => m.name).map(m => `${m.type}: ${m.name}`)
      lines.push(`  ${day.day}: ${meals.join(' | ')}`)
    }
  } else {
    lines.push('\nTHIS WEEK\'S MEAL PLAN: not filled yet')
  }

  // Recipe box summary
  if (recipes.length > 0) {
    const names = recipes.slice(0, 25).map(r => r.name).join(', ')
    lines.push(`\nRECIPE BOX (${recipes.length} saved recipes): ${names}`)
  } else {
    lines.push('\nRECIPE BOX: empty')
  }

  // Budget summary
  if (budgetData?.weekly_budget) {
    lines.push(`\nBUDGET THIS WEEK: $${budgetData.spent_this_week.toFixed(2)} spent of $${budgetData.weekly_budget.toFixed(2)} budget — $${budgetData.remaining.toFixed(2)} remaining`)
  } else {
    lines.push('\nBUDGET: no weekly budget set')
  }

  // Macro summary for tracking members
  if (macroData?.members?.length) {
    lines.push('\nMACRO TRACKING TODAY:')
    for (const member of macroData.members) {
      const memberLogs = macroData.logs.filter(l => l.household_member_id === member.id)
      const consumed = {
        calories: memberLogs.reduce((s, l) => s + (l.calories || 0), 0),
        protein: memberLogs.reduce((s, l) => s + (l.protein_grams || 0), 0),
        carbs: memberLogs.reduce((s, l) => s + (l.carbohydrate_grams || 0), 0),
        fat: memberLogs.reduce((s, l) => s + (l.fat_grams || 0), 0),
      }
      lines.push(` ${member.name}: ${consumed.calories}/${member.daily_calorie_target || '?'} cal, ${consumed.protein}/${member.daily_protein_target || '?'}g protein, ${consumed.carbs}/${member.daily_carb_target || '?'}g carbs, ${consumed.fat}/${member.daily_fat_target || '?'}g fat`)
    }
  }

  return lines.join('\n')
}
