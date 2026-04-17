import { notFound } from 'next/navigation'
import { requireUser } from '@/lib/dal/require-user'
import { getRecipeById } from '@/lib/dal/recipes'
import RecipeDetailClient from './RecipeDetailClient'

export default async function RecipeDetailPage({ params }) {
  const { id } = await params
  const user = await requireUser()

  let recipe = null
  try {
    recipe = await getRecipeById(user.id, id)
  } catch (err) {
    console.error('[RecipeDetailPage] Failed to load recipe:', err?.message)
  }

  if (!recipe) notFound()

  return <RecipeDetailClient initialRecipe={recipe} />
}
