'use client'

import { useState } from 'react'
import SettingsStepLayout from '@/components/settings/SettingsStepLayout'
import { useSettingsSave } from '@/components/settings/useSettingsSave'
import CuisinesStep from '@/components/onboarding/steps/CuisinesStep'
import { saveCuisinesSettingsAction } from '../step-actions'

export default function CuisinesSettingsClient({ cuisines: initial }) {
  const { save, isPending, error, toast, goBack } = useSettingsSave()
  const [cuisines, setCuisines] = useState(initial)

  function handleSave() {
    save(() => saveCuisinesSettingsAction(cuisines))
  }

  return (
    <SettingsStepLayout error={error} toast={toast}>
      <CuisinesStep
        selected={cuisines}
        onChange={setCuisines}
        onNext={handleSave}
        onBack={goBack}
        isPending={isPending}
      />
    </SettingsStepLayout>
  )
}
