import { requireUser } from '@/lib/dal/require-user';
import { getVoiceSettings } from '@/lib/dal/voice-settings';
import VoiceSettingsClient from './VoiceSettingsClient';

export default async function VoiceSettingsPage() {
  const user = await requireUser();

  const voiceSettings = await getVoiceSettings(user.id).catch(() => ({
    voice_responses_enabled: false,
  }));

  return <VoiceSettingsClient initialSettings={voiceSettings} />;
}
