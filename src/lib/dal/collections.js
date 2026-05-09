import 'server-only'

import { isMockMode } from './require-user'
import {
  getMockCollections,
  getMockRecipeCollections,
  createMockCollection,
  updateMockCollection,
  deleteMockCollection,
  addRecipeToMockCollection,
  removeRecipeFromMockCollection,
} from './mock-store'

export async function getUserCollections(userId) {
  if (isMockMode()) {
    const cols = await getMockCollections()
    return cols.sort((a, b) => a.sort_order - b.sort_order)
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })

  if (error) throw new Error('Failed to load collections')
  return data
}

export async function getRecipeCollectionLinks(userId) {
  if (isMockMode()) {
    return getMockRecipeCollections()
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('recipe_collections')
    .select('recipe_id, collection_id')
    .eq('user_id', userId)

  if (error) throw new Error('Failed to load recipe collection links')
  return data
}

export async function createCollection(userId, col) {
  if (isMockMode()) {
    return createMockCollection(col)
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('collections')
    .insert({ ...col, user_id: userId })
    .select()
    .single()

  if (error) throw new Error('Failed to create collection')
  return data
}

export async function updateCollection(userId, colId, updates) {
  if (isMockMode()) {
    return updateMockCollection(colId, updates)
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('collections')
    .update(updates)
    .eq('user_id', userId)
    .eq('id', colId)
    .select()
    .single()

  if (error) throw new Error('Failed to update collection')
  return data
}

export async function deleteCollection(userId, colId) {
  if (isMockMode()) {
    return deleteMockCollection(colId)
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  // Junction rows will be cascade-deleted by FK constraint
  const { error } = await supabase
    .from('collections')
    .delete()
    .eq('user_id', userId)
    .eq('id', colId)

  if (error) throw new Error('Failed to delete collection')
  return true
}

export async function addRecipeToCollection(userId, recipeId, collectionId) {
  if (isMockMode()) {
    return addRecipeToMockCollection(recipeId, collectionId)
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase
    .from('recipe_collections')
    .insert({ user_id: userId, recipe_id: recipeId, collection_id: collectionId })

  if (error) throw new Error('Failed to add recipe to collection')
  return true
}

export async function removeRecipeFromCollection(userId, recipeId, collectionId) {
  if (isMockMode()) {
    return removeRecipeFromMockCollection(recipeId, collectionId)
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server')
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase
    .from('recipe_collections')
    .delete()
    .eq('user_id', userId)
    .eq('recipe_id', recipeId)
    .eq('collection_id', collectionId)

  if (error) throw new Error('Failed to remove recipe from collection')
  return true
}
