import 'server-only'

import { isMockMode } from './require-user'
import { getMockVoiceSettings, saveMockVoiceSettings } from './mock-store'

export async function getVoiceSettings(userId) {
  if (isMockMode()) {
    return getMockVoiceSettings()
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('voice_settings')
    .eq('id', userId)
    .single()

  if (error) throw new Error('Failed to load voice settings')
  return data?.voice_settings || { voice_responses_enabled: false, hands_free_chat_enabled: false }
}

export async function saveVoiceSettings(userId, settings) {
  if (isMockMode()) {
    return saveMockVoiceSettings(settings)
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase
    .from('profiles')
    .update({ voice_settings: settings, updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) throw new Error('Failed to save voice settings')
  return settings
}

export async function getHandsFreePref(userId) {
  const settings = await getVoiceSettings(userId)
  return settings.hands_free_chat_enabled ?? false
}

export async function saveHandsFreePref(userId, enabled) {
  const settings = await getVoiceSettings(userId)
  return saveVoiceSettings(userId, { ...settings, hands_free_chat_enabled: !!enabled })
}
