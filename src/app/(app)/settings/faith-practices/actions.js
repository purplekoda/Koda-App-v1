'use server';

import { revalidatePath } from 'next/cache';
import { requireUser, isMockMode } from '@/lib/dal/require-user';
import { apiLimiter } from '@/lib/rate-limit';
import { ok, fail } from '@/lib/action-result';
import { validateFaithPractices } from '@/lib/validators';
import { sanitizeString } from '@/lib/sanitize';
import { saveHouseholdFaithPractices, saveMemberFaithPractices } from '@/lib/dal/faith-practices';

export async function saveHouseholdFaithPracticesAction(data) {
  try {
    const user = await requireUser();
    const rate = apiLimiter.check(user.id);
    if (!rate.success) return fail('Too many requests. Please wait a moment.');

    const validation = validateFaithPractices(data);
    if (!validation.valid) return fail(validation.errors.join(', '));

    await saveHouseholdFaithPractices(user.id, validation.data);
    revalidatePath('/settings/faith-practices');
    revalidatePath('/settings');
    return ok(validation.data);
  } catch {
    return fail('Could not save faith-based practices.');
  }
}

export async function saveMemberFaithPracticesAction(memberId, data) {
  try {
    const user = await requireUser();
    const rate = apiLimiter.check(user.id);
    if (!rate.success) return fail('Too many requests. Please wait a moment.');

    const cleanMemberId = sanitizeString(memberId, 36);
    if (!cleanMemberId) {
      return fail('Invalid member ID.');
    }

    const validation = validateFaithPractices(data);
    if (!validation.valid) return fail(validation.errors.join(', '));

    // Rename for member-level storage
    const memberData = {
      ...validation.data,
      follows_individual_faith_diet: validation.data.follows_faith_based_diet,
      individual_faith_practices: validation.data.household_faith_practices,
    };
    delete memberData.follows_faith_based_diet;
    delete memberData.household_faith_practices;

    await saveMemberFaithPractices(user.id, cleanMemberId, memberData);
    revalidatePath('/settings/faith-practices');
    return ok(memberData);
  } catch {
    return fail('Could not save member faith practices.');
  }
}
