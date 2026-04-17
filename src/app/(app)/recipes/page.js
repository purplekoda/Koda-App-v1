import { requireUser } from '@/lib/dal/require-user'
import { getUserRecipes } from '@/lib/dal/recipes'
import RecipesPageClient from './RecipesPageClient'

export default async function RecipesPage() {
  const user = await requireUser()

  let recipes = []
  try {
    recipes = await getUserRecipes(user.id)
  } catch (err) {
    console.error('[RecipesPage] Failed to load recipes:', err?.message)
  }

  return <RecipesPageClient initialRecipes={recipes} />
}
