'use client'

import { useState } from 'react'
import SettingsStepLayout from '@/components/settings/SettingsStepLayout'
import { useSettingsSave } from '@/components/settings/useSettingsSave'
import HouseholdMembersStep from '@/components/onboarding/steps/HouseholdMembersStep'
import { saveHouseholdMembersSettingsAction } from '../step-actions'

export default function HouseholdMembersSettingsClient({ members, userName }) {
  const { save, isPending, error, toast, goBack } = useSettingsSave()
  const [householdMembers, setHouseholdMembers] = useState(members || [])

  function handleSave() {
    save(() => saveHouseholdMembersSettingsAction(householdMembers))
  }

  return (
    <SettingsStepLayout error={error} toast={toast}>
      <HouseholdMembersStep
        members={householdMembers}
        onChange={setHouseholdMembers}
        onNext={handleSave}
        onBack={goBack}
        isPending={isPending}
        userName={userName}
      />
    </SettingsStepLayout>
  )
}
