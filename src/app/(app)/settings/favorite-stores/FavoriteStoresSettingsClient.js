'use client'

import { useState } from 'react'
import SettingsStepLayout from '@/components/settings/SettingsStepLayout'
import { useSettingsSave } from '@/components/settings/useSettingsSave'
import FavoriteStoresStep from '@/components/onboarding/steps/FavoriteStoresStep'
import { saveFavoriteStoresSettingsAction } from '../step-actions'

export default function FavoriteStoresSettingsClient({ stores: initStores, categoryAssignments: initCats }) {
  const { save, isPending, error, toast, goBack } = useSettingsSave()
  const [selectedStores, setSelectedStores] = useState(initStores)
  const [otherStoreName, setOtherStoreName] = useState('')
  const [categoryAssignments, setCategoryAssignments] = useState(initCats)

  function handleSave() {
    save(() => saveFavoriteStoresSettingsAction({
      preferred_stores: selectedStores,
      other_store_name: otherStoreName,
      store_category_assignments: categoryAssignments,
    }))
  }

  return (
    <SettingsStepLayout error={error} toast={toast}>
      <FavoriteStoresStep
        selectedStores={selectedStores}
        otherStoreName={otherStoreName}
        categoryAssignments={categoryAssignments}
        onChangeStores={setSelectedStores}
        onChangeOtherName={setOtherStoreName}
        onChangeCategoryAssignments={setCategoryAssignments}
        onNext={handleSave}
        onBack={goBack}
        isPending={isPending}
      />
    </SettingsStepLayout>
  )
}
