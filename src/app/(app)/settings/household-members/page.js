import { requireUser } from '@/lib/dal/require-user';
import { getHouseholdMembers } from '@/lib/dal/onboarding';
import HouseholdMembersSettingsClient from './HouseholdMembersSettingsClient';

export default async function HouseholdMembersSettingsPage() {
  const user = await requireUser();
  const members = await getHouseholdMembers(user.id).catch(() => []);
  const userName = user.user_metadata?.display_name || user.email?.split('@')[0] || '';

  return <HouseholdMembersSettingsClient members={members} userName={userName} />;
}
