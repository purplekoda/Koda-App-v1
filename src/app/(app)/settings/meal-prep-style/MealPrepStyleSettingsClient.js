'use client'

import { useState } from 'react'
import SettingsStepLayout from '@/components/settings/SettingsStepLayout'
import { useSettingsSave } from '@/components/settings/useSettingsSave'
import MealPrepStyleStep from '@/components/onboarding/steps/MealPrepStyleStep'
import { saveMealPrepStyleSettingsAction } from '../step-actions'

export default function MealPrepStyleSettingsClient({ mealPrepStyle: initial }) {
  const { save, isPending, error, toast, goBack } = useSettingsSave()
  const [mealPrepStyle, setMealPrepStyle] = useState(initial)

  function handleSave() {
    save(() => saveMealPrepStyleSettingsAction({ meal_prep_style: mealPrepStyle }))
  }

  return (
    <SettingsStepLayout error={error} toast={toast}>
      <MealPrepStyleStep
        value={mealPrepStyle}
        onChange={setMealPrepStyle}
        onNext={handleSave}
        onBack={goBack}
        isPending={isPending}
      />
    </SettingsStepLayout>
  )
}
