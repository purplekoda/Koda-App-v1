import { requireUser } from '@/lib/dal/require-user';
import { getOnboardingProfile } from '@/lib/dal/onboarding';
import FavoriteStoresSettingsClient from './FavoriteStoresSettingsClient';

export default async function FavoriteStoresSettingsPage() {
  const user = await requireUser();
  const op = await getOnboardingProfile(user.id).catch(() => ({}));

  return (
    <FavoriteStoresSettingsClient
      stores={op.preferred_stores || []}
      categoryAssignments={op.store_category_assignments || {}}
    />
  );
}
