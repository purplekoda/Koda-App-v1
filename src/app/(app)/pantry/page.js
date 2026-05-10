import { requireUser } from '@/lib/dal/require-user';
import { getManagedPantryItems } from '@/lib/dal/pantry-management';
import { getPantryItems, getDinnerIdeas, getLastScan } from '@/lib/dal/pantry';
import { getStaples } from '@/lib/dal/staples';
import PantryPageClient from './PantryPageClient';

export const metadata = { title: 'Pantry — Koda' };

export default async function PantryPage() {
  const user = await requireUser();

  const [items, scanItems, dinnerIdeas, lastScan, staples] = await Promise.all([
    getManagedPantryItems(user.id, { includeDepleted: false }).catch(() => []),
    getPantryItems(user.id).catch(() => []),
    getDinnerIdeas(user.id).catch(() => []),
    getLastScan(user.id).catch(() => null),
    getStaples(user.id).catch(() => []),
  ]);

  return (
    <PantryPageClient
      initialItems={items}
      initialScanItems={scanItems}
      initialDinnerIdeas={dinnerIdeas}
      initialLastScan={lastScan}
      initialStaples={staples}
    />
  );
}
