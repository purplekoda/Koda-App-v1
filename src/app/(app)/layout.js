import { redirect } from 'next/navigation';
import AppShell from '@/components/layout/AppShell';
import { requireUser } from '@/lib/dal/require-user';
import { getOnboardingStatus, getHouseholdMembers } from '@/lib/dal/onboarding';
import { getVoiceSettings } from '@/lib/dal/voice-settings';
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { requireUser } from '@/lib/dal/require-user'
import { getOnboardingStatus, getHouseholdMembers } from '@/lib/dal/onboarding'
import { getVoiceSettings } from '@/lib/dal/voice-settings'
import { getChatButtonPosition } from '@/lib/dal/profile'

export default async function AppLayout({ children }) {
  const user = await requireUser();

  // Redirect to onboarding if not completed and not skipped
  const status = await getOnboardingStatus(user.id);
  if (!status.onboarding_completed && !status.onboarding_skipped) {
    redirect('/onboarding');
  }

  const [members, voiceSettings, chatButtonPosition] = await Promise.all([
    getHouseholdMembers(user.id),
    getVoiceSettings(user.id).catch(() => ({ voice_responses_enabled: false })),
  ]);
  const trackMacros = members.some((m) => m.track_macros);
    getChatButtonPosition(user.id).catch(() => ({ corner: 'bottom-right', offset: 0 })),
  ])
  const trackMacros = members.some(m => m.track_macros)

  const displayName = user.user_metadata?.display_name || 'User';
  const initials = user.user_metadata?.initials || displayName.charAt(0).toUpperCase();

  return (
    <AppShell
      user={{ displayName, initials }}
      trackMacros={trackMacros}
      voiceSettings={voiceSettings}
    >
    <AppShell user={{ displayName, initials }} trackMacros={trackMacros} voiceSettings={voiceSettings} chatButtonPosition={chatButtonPosition}>
      {children}
    </AppShell>
  );
}
