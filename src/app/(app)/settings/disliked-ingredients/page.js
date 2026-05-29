import { requireUser } from '@/lib/dal/require-user'
import { getTasteProfile } from '@/lib/dal/taste-profile'
import DislikedIngredientsClient from './DislikedIngredientsClient'

export const metadata = { title: "Ingredients I don't like" }

export default async function DislikedIngredientsPage() {
  let dislikedIngredients = []
  try {
    const user = await requireUser()
    const profile = await getTasteProfile(user.id)
    dislikedIngredients = profile?.disliked_ingredients || []
  } catch {
    // fallback to empty
  }
  return <DislikedIngredientsClient initialIngredients={dislikedIngredients} />
}
