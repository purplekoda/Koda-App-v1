import { requireUser } from '@/lib/dal/require-user';
import { getRecipeCardSettings } from '@/lib/dal/profile';
import RecipeCardSettingsClient from './RecipeCardSettingsClient';

export default async function RecipeCardSettingsPage() {
  const user = await requireUser();

  const settings = await getRecipeCardSettings(user.id).catch(() => null);

  return <RecipeCardSettingsClient initialSettings={settings} />;
}
