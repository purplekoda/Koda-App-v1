import { requireUser } from '@/lib/dal/require-user';
import { getMacroMembers } from '@/lib/dal/macros';
import MacroLoggingSettingsClient from './MacroLoggingSettingsClient';

export default async function MacroLoggingSettingsPage() {
  const user = await requireUser();

  const members = await getMacroMembers(user.id).catch(() => []);

  return <MacroLoggingSettingsClient members={members} />;
}
