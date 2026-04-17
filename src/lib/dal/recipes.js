import 'server-only'

import { isMockMode } from './require-user'
import {
  getMockRecipes,
  getMockRecipeById,
  createMockRecipe,
  updateMockRecipe,
  deleteMockRecipe,
} from './mock-store'

export async function getUserRecipes(userId) {
  if (isMockMode()) {
    return getMockRecipes()
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) throw new Error('Failed to load recipes')
  return data
}

export async function getRecipeById(userId, recipeId) {
  if (isMockMode()) {
    return getMockRecipeById(recipeId)
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('user_id', userId)
    .eq('id', recipeId)
    .maybeSingle()

  if (error) throw new Error('Failed to load recipe')
  return data
}

export async function createRecipe(userId, recipe) {
  if (isMockMode()) {
    return createMockRecipe(recipe)
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('recipes')
    .insert({ ...recipe, user_id: userId })
    .select()
    .single()

  if (error) throw new Error('Failed to create recipe')
  return data
}

export async function updateRecipe(userId, recipeId, updates) {
  if (isMockMode()) {
    return updateMockRecipe(recipeId, updates)
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('recipes')
    .update(updates)
    .eq('user_id', userId)
    .eq('id', recipeId)
    .select()
    .single()

  if (error) throw new Error('Failed to update recipe')
  return data
}

export async function deleteRecipe(userId, recipeId) {
  if (isMockMode()) {
    return deleteMockRecipe(recipeId)
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('user_id', userId)
    .eq('id', recipeId)

  if (error) throw new Error('Failed to delete recipe')
  return true
}
