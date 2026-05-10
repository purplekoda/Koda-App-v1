import 'server-only';

import { isMockMode } from './require-user';
export { STAPLE_CATEGORIES, SUGGESTED_STAPLES } from './staples-constants';

/**
 * Get all pantry staples for a household/user.
 */
export async function getStaples(userId) {
  if (isMockMode()) {
    const { getMockStaples } = await import('./mock-store');
    const items = await getMockStaples();
    return items.map((i) => ({ ...i }));
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server');
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from('pantry_staples')
    .select(
      'id, name, category, is_out_of_stock, out_of_stock_since, added_by, is_custom, created_at',
    )
    .eq('household_id', userId) // in single-user mock, household_id = user_id
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error) throw new Error('Failed to load pantry staples');
  return data || [];
}

/**
 * Add a new staple item.
 */
export async function addStaple(userId, staple) {
  if (isMockMode()) {
    const { addMockStaple } = await import('./mock-store');
    return addMockStaple(staple);
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server');
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from('pantry_staples')
    .insert({
      household_id: userId,
      name: staple.name,
      category: staple.category,
      is_out_of_stock: false,
      added_by: userId,
      is_custom: staple.is_custom ?? false,
    })
    .select()
    .single();

  if (error) throw new Error('Failed to add staple');
  return data;
}

/**
 * Delete a staple item (owner only).
 */
export async function deleteStaple(userId, stapleId) {
  if (isMockMode()) {
    const { deleteMockStaple } = await import('./mock-store');
    return deleteMockStaple(stapleId);
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server');
  const supabase = await getSupabaseServerClient();

  const { error } = await supabase
    .from('pantry_staples')
    .delete()
    .eq('id', stapleId)
    .eq('household_id', userId);

  if (error) throw new Error('Failed to delete staple');
}

/**
 * Toggle a staple's in-stock / out-of-stock status.
 * Any household member can do this.
 */
export async function toggleStapleStock(userId, stapleId, isOutOfStock) {
  if (isMockMode()) {
    const { toggleMockStapleStock } = await import('./mock-store');
    return toggleMockStapleStock(stapleId, isOutOfStock);
  }

  const { getSupabaseServerClient } = await import('@/lib/supabase/server');
  const supabase = await getSupabaseServerClient();

  const updates = {
    is_out_of_stock: isOutOfStock,
    out_of_stock_since: isOutOfStock ? new Date().toISOString() : null,
  };

  const { data, error } = await supabase
    .from('pantry_staples')
    .update(updates)
    .eq('id', stapleId)
    .select()
    .single();

  if (error) throw new Error('Failed to update staple stock status');
  return data;
}

/**
 * Get only in-stock staples (for AI prompt building).
 */
export async function getInStockStaples(userId) {
  const all = await getStaples(userId);
  return all.filter((s) => !s.is_out_of_stock);
}

/**
 * Get only out-of-stock staples (for AI prompt building).
 */
export async function getOutOfStockStaples(userId) {
  const all = await getStaples(userId);
  return all.filter((s) => s.is_out_of_stock);
}
