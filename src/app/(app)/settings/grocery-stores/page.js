import { requireUser } from '@/lib/dal/require-user';
import { getGroceryPreferences } from '@/lib/dal/profile';
import GroceryStoreSettingsClient from './GroceryStoreSettingsClient';

export default async function GroceryStoreSettingsPage() {
  const user = await requireUser();
  const groceryPreferences = await getGroceryPreferences(user.id).catch(() => ({}));

  return <GroceryStoreSettingsClient groceryPreferences={groceryPreferences} />;
}
