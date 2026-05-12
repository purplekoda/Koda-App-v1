'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/dal/require-user';
import { sanitizeString, sanitizeEnum } from '@/lib/sanitize';
import { apiLimiter } from '@/lib/rate-limit';
import { ok, fail } from '@/lib/action-result';
import { STAPLE_CATEGORIES } from '@/lib/dal/staples-constants';

export async function addStapleAction(name, category, isCustom = false) {
  try {
    const user = await requireUser();
    const rate = apiLimiter.check(user.id);
    if (!rate.success) return fail('Too many requests. Please wait a moment.');

    const cleanName = sanitizeString(name, 200);
    if (!cleanName) return fail('Staple name is required.');

    const cleanCategory = sanitizeEnum(category, STAPLE_CATEGORIES) || 'Other';

    const { addStaple } = await import('@/lib/dal/staples');
    const item = await addStaple(user.id, {
      name: cleanName,
      category: cleanCategory,
      is_custom: Boolean(isCustom),
    });

    revalidatePath('/pantry');
    return ok(item);
  } catch (err) {
    console.error('[addStapleAction]', err?.message);
    return fail('Could not add staple.');
  }
}

export async function deleteStapleAction(stapleId) {
  try {
    const user = await requireUser();
    const rate = apiLimiter.check(user.id);
    if (!rate.success) return fail('Too many requests. Please wait a moment.');

    const cleanId = sanitizeString(stapleId, 80);
    if (!cleanId) return fail('Invalid staple.');

    const { deleteStaple } = await import('@/lib/dal/staples');
    await deleteStaple(user.id, cleanId);

    revalidatePath('/pantry');
    return ok();
  } catch (err) {
    console.error('[deleteStapleAction]', err?.message);
    return fail('Could not delete staple.');
  }
}

export async function toggleStapleStockAction(stapleId, isOutOfStock) {
  try {
    const user = await requireUser();
    const rate = apiLimiter.check(user.id);
    if (!rate.success) return fail('Too many requests. Please wait a moment.');

    const cleanId = sanitizeString(stapleId, 80);
    if (!cleanId) return fail('Invalid staple.');

    const { toggleStapleStock } = await import('@/lib/dal/staples');
    const item = await toggleStapleStock(user.id, cleanId, Boolean(isOutOfStock));

    // When marking out of stock, also add to grocery list
    if (isOutOfStock && item) {
      try {
        const { isMockMode } = await import('@/lib/dal/require-user');
        if (isMockMode()) {
          const { addMockGroceryItems } = await import('@/lib/dal/mock-store');
          await addMockGroceryItems([item.name]);
        } else {
          const { getSupabaseServerClient } = await import('@/lib/supabase/server');
          const supabase = await getSupabaseServerClient();
          await supabase.from('grocery_list').insert({
          const { getSupabaseServerClient } = await import('@/lib/supabase/server')
          const supabase = await getSupabaseServerClient()
          await supabase.from('grocery_items').insert({
            user_id: user.id,
            name: item.name,
            quantity: '1',
            category: item.category || 'Other',
            status: 'need',
            source: 'staple',
            from_staples: true,
          });
        }
      } catch {
        // Grocery integration is best-effort — don't fail the stock toggle
      }
    }

    revalidatePath('/pantry');
    revalidatePath('/grocery');
    return ok(item);
  } catch (err) {
    console.error('[toggleStapleStockAction]', err?.message);
    return fail('Could not update stock status.');
  }
}
