import { requireUser } from '@/lib/dal/require-user';
import { getOnboardingProfile } from '@/lib/dal/onboarding';
import CookTimeSettingsClient from './CookTimeSettingsClient';

export default async function CookTimeSettingsPage() {
  const user = await requireUser();
  const op = await getOnboardingProfile(user.id).catch(() => ({}));
  return <CookTimeSettingsClient cookTime={op.cook_time_preference || null} />;
}
