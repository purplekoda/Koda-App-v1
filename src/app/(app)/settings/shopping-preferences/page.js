import { requireUser } from '@/lib/dal/require-user';
import { getProfile } from '@/lib/dal/profile';
import ShoppingPreferencesClient from './ShoppingPreferencesClient';

export default async function ShoppingPreferencesPage() {
  const user = await requireUser();
  const profile = await getProfile(user.id).catch(() => ({}));

  return (
    <ShoppingPreferencesClient
      shoppingStyle={profile?.shopping_style || null}
      deliveryService={profile?.preferred_delivery_service || null}
    />
  );
}
