import { requireUser } from '@/lib/dal/require-user';
import { getTasteProfile } from '@/lib/dal/taste-profile';
import CuisinesSettingsClient from './CuisinesSettingsClient';

export default async function CuisinesSettingsPage() {
  const user = await requireUser();
  const taste = await getTasteProfile(user.id).catch(() => null);
  return <CuisinesSettingsClient cuisines={taste?.cuisine_types || []} />;
}
