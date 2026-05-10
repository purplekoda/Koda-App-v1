'use client';

import { useState } from 'react';
import SettingsStepLayout from '@/components/settings/SettingsStepLayout';
import { useSettingsSave } from '@/components/settings/useSettingsSave';
import AdventurousnessStep from '@/components/onboarding/steps/AdventurousnessStep';
import { saveRecipeStyleSettingsAction } from '../step-actions';

export default function RecipeStyleSettingsClient({ adventurousness: initial }) {
  const { save, isPending, error, toast, goBack } = useSettingsSave();
  const [adventurousness, setAdventurousness] = useState(initial);

  function handleSave() {
    save(() => saveRecipeStyleSettingsAction({ adventurousness }));
  }

  return (
    <SettingsStepLayout error={error} toast={toast}>
      <AdventurousnessStep
        value={adventurousness}
        onChange={setAdventurousness}
        onNext={handleSave}
        onBack={goBack}
        isPending={isPending}
      />
    </SettingsStepLayout>
  );
}
