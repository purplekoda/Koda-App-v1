import { requireUser } from '@/lib/dal/require-user'
import { getPantryItems, getDinnerIdeas, getLastScan } from '@/lib/dal/pantry'
import KitchenPageClient from './KitchenPageClient'

export default async function KitchenPage() {
  const user = await requireUser()

  let pantryItems = [], dinnerIdeas = [], lastScan = null
  try {
    ;[pantryItems, dinnerIdeas, lastScan] = await Promise.all([
      getPantryItems(user.id),
      getDinnerIdeas(user.id),
      getLastScan(user.id),
    ])
  } catch (err) {
    console.error('[KitchenPage] Failed to load data:', err?.message)
  }

  return (
    <KitchenPageClient
      initialPantryItems={pantryItems}
      initialDinnerIdeas={dinnerIdeas}
      initialLastScan={lastScan}
    />
  )
}
