import { requireUser } from '@/lib/dal/require-user';
import { getOnboardingProfile, getHouseholdMembers } from '@/lib/dal/onboarding';
import HouseholdSettingsClient from './HouseholdSettingsClient';

export default async function HouseholdSettingsPage() {
  const user = await requireUser();
  const [onboardingProfile, members] = await Promise.all([
    getOnboardingProfile(user.id).catch(() => ({})),
    getHouseholdMembers(user.id).catch(() => []),
  ]);
  const userName = user.user_metadata?.display_name || user.email?.split('@')[0] || '';

  return (
    <HouseholdSettingsClient
      onboardingProfile={onboardingProfile}
      members={members}
      userName={userName}
    />
  );
}
