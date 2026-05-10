'use client';

import { useState } from 'react';
import SettingsStepLayout from '@/components/settings/SettingsStepLayout';
import { useSettingsSave } from '@/components/settings/useSettingsSave';
import MealPlanDaysStep from '@/components/onboarding/steps/MealPlanDaysStep';
import { saveMealPlanDaysSettingsAction } from '../step-actions';

export default function MealPlanDaysSettingsClient({ planDays: initPlan, prepDays: initPrep }) {
  const { save, isPending, error, toast, goBack } = useSettingsSave();
  const [planDays, setPlanDays] = useState(initPlan);
  const [prepDays, setPrepDays] = useState(initPrep);

  function handleSave() {
    save(() =>
      saveMealPlanDaysSettingsAction({
        meal_plan_days: planDays,
        meal_prep_days: prepDays,
      }),
    );
  }

  return (
    <SettingsStepLayout error={error} toast={toast}>
      <MealPlanDaysStep
        planDays={planDays}
        prepDays={prepDays}
        onChangePlan={setPlanDays}
        onChangePrep={setPrepDays}
        onNext={handleSave}
        onBack={goBack}
        isPending={isPending}
      />
    </SettingsStepLayout>
  );
}
