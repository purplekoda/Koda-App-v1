'use client';

import { useState } from 'react';
import SettingsStepLayout from '@/components/settings/SettingsStepLayout';
import { useSettingsSave } from '@/components/settings/useSettingsSave';
import FrustrationsStep from '@/components/onboarding/steps/FrustrationsStep';
import { saveFrustrationsSettingsAction } from '../step-actions';

export default function FrustrationsSettingsClient({ frustrations: initial }) {
  const { save, isPending, error, toast, goBack } = useSettingsSave();
  const [frustrations, setFrustrations] = useState(initial);

  function handleSave() {
    save(() => saveFrustrationsSettingsAction({ cooking_frustrations: frustrations }));
  }

  return (
    <SettingsStepLayout error={error} toast={toast}>
      <FrustrationsStep
        selected={frustrations}
        onChange={setFrustrations}
        onNext={handleSave}
        onBack={goBack}
        isPending={isPending}
      />
    </SettingsStepLayout>
  );
}
