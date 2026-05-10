'use client';

import { useState } from 'react';
import SettingsStepLayout from '@/components/settings/SettingsStepLayout';
import { useSettingsSave } from '@/components/settings/useSettingsSave';
import HealthGoalsStep from '@/components/onboarding/steps/HealthGoalsStep';
import { saveHealthGoalsSettingsAction } from '../step-actions';

export default function HealthGoalsSettingsClient({ goals: initGoals }) {
  const { save, isPending, error, toast, goBack } = useSettingsSave();
  const [goals, setGoals] = useState(initGoals);

  function handleSave() {
    save(() =>
      saveHealthGoalsSettingsAction({
        health_goals: goals,
      }),
    );
  }

  return (
    <SettingsStepLayout error={error} toast={toast}>
      <HealthGoalsStep
        goals={goals}
        onChangeGoals={setGoals}
        onNext={handleSave}
        onBack={goBack}
        isPending={isPending}
      />
    </SettingsStepLayout>
  );
}
