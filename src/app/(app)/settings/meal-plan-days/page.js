import { requireUser } from '@/lib/dal/require-user';
import { getOnboardingProfile } from '@/lib/dal/onboarding';
import MealPlanDaysSettingsClient from './MealPlanDaysSettingsClient';

export default async function MealPlanDaysSettingsPage() {
  const user = await requireUser();
  const op = await getOnboardingProfile(user.id).catch(() => ({}));
  return (
    <MealPlanDaysSettingsClient
      planDays={op.meal_plan_days || [1, 2, 3, 4, 5]}
      prepDays={op.meal_prep_days || []}
    />
  );
}
