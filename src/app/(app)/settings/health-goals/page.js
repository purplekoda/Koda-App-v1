import { requireUser } from '@/lib/dal/require-user';
import { getOnboardingProfile } from '@/lib/dal/onboarding';
import HealthGoalsSettingsClient from './HealthGoalsSettingsClient';

export default async function HealthGoalsSettingsPage() {
  const user = await requireUser();
  const op = await getOnboardingProfile(user.id).catch(() => ({}));

  return <HealthGoalsSettingsClient goals={op.health_goals || []} />;
}
