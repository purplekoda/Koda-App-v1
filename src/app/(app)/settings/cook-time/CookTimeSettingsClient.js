'use client';

import { useState } from 'react';
import SettingsStepLayout from '@/components/settings/SettingsStepLayout';
import { useSettingsSave } from '@/components/settings/useSettingsSave';
import CookTimeStep from '@/components/onboarding/steps/CookTimeStep';
import { saveCookTimeSettingsAction } from '../step-actions';

export default function CookTimeSettingsClient({ cookTime: initial }) {
  const { save, isPending, error, toast, goBack } = useSettingsSave();
  const [cookTime, setCookTime] = useState(initial);

  function handleSave() {
    save(() => saveCookTimeSettingsAction({ cook_time_preference: cookTime }));
  }

  return (
    <SettingsStepLayout error={error} toast={toast}>
      <CookTimeStep
        value={cookTime}
        onChange={setCookTime}
        onNext={handleSave}
        onBack={goBack}
        isPending={isPending}
      />
    </SettingsStepLayout>
  );
}
