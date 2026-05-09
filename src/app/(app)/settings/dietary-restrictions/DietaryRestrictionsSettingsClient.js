'use client'

import { useState } from 'react'
import SettingsStepLayout from '@/components/settings/SettingsStepLayout'
import { useSettingsSave } from '@/components/settings/useSettingsSave'
import DietaryRestrictionsStep from '@/components/onboarding/steps/DietaryRestrictionsStep'
import { saveDietaryRestrictionsSettingsAction } from '../step-actions'

export default function DietaryRestrictionsSettingsClient({ restrictions }) {
  const { save, isPending, error, toast, goBack } = useSettingsSave()
  const [selected, setSelected] = useState(restrictions || [])

  function handleSave() {
    save(() => saveDietaryRestrictionsSettingsAction(selected))
  }

  return (
    <SettingsStepLayout error={error} toast={toast}>
      <DietaryRestrictionsStep
        selected={selected}
        onChange={setSelected}
        onNext={handleSave}
        onBack={goBack}
        isPending={isPending}
      />
    </SettingsStepLayout>
  )
}
