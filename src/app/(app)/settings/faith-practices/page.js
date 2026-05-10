import { requireUser } from '@/lib/dal/require-user';
import { getHouseholdFaithPractices, getAllMemberFaithPractices } from '@/lib/dal/faith-practices';
import { getHouseholdMembers } from '@/lib/dal/onboarding';
import FaithPracticesClient from './FaithPracticesClient';

export default async function FaithPracticesPage() {
  const user = await requireUser();

  const [faithPractices, members, memberFaithData] = await Promise.all([
    getHouseholdFaithPractices(user.id).catch(() => ({ follows_faith_based_diet: false })),
    getHouseholdMembers(user.id).catch(() => []),
    getAllMemberFaithPractices(user.id).catch(() => []),
  ]);

  return (
    <FaithPracticesClient
      faithPractices={faithPractices}
      members={members}
      memberFaithData={memberFaithData}
    />
  );
}
