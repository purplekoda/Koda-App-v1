import { requireUser } from '@/lib/dal/require-user';
import { getHouseholdMembers } from '@/lib/dal/onboarding';
import InviteFamilySettingsClient from './InviteFamilySettingsClient';

export default async function InviteFamilySettingsPage() {
  const user = await requireUser();
  const members = await getHouseholdMembers(user.id).catch(() => []);
  return <InviteFamilySettingsClient members={members} />;
}
