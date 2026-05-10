import { requireUser } from '@/lib/dal/require-user';
import { getProfile } from '@/lib/dal/profile';
import ProfileSettingsClient from './ProfileSettingsClient';

export default async function ProfileSettingsPage() {
  const user = await requireUser();
  const profile = await getProfile(user.id).catch(() => ({}));

  return <ProfileSettingsClient user={{ email: user.email, id: user.id }} profile={profile} />;
}
