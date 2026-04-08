import 'server-only'

import { isMockMode } from './require-user'
import { getMockEvents, getMockSchedule, getMockTodos } from './mock-store'

export async function getUpcomingEvents(userId) {
  if (isMockMode()) {
    return getMockEvents()
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('user_id', userId)
    .gte('date', new Date().toISOString())
    .order('date')
    .limit(5)

  if (error) throw new Error('Failed to load events')
  return data
}

export async function getTodaySchedule(userId) {
  if (isMockMode()) {
    return getMockSchedule()
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const today = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .order('time')

  if (error) throw new Error('Failed to load schedule')
  return data
}

export async function getTodos(userId) {
  if (isMockMode()) {
    return getMockTodos()
  }

  // In production, fetch from a todos table
  return []
}
