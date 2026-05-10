'use client';

import { useState } from 'react';
import SettingsStepLayout from '@/components/settings/SettingsStepLayout';
import { useSettingsSave } from '@/components/settings/useSettingsSave';
import HouseholdSizeStep from '@/components/onboarding/steps/HouseholdSizeStep';
import { saveHouseholdSettingsAction, saveHouseholdMembersSettingsAction } from '../step-actions';

export default function HouseholdSettingsClient({ onboardingProfile, members, userName }) {
  const { save, isPending, error, toast, goBack } = useSettingsSave();
  const op = onboardingProfile || {};

  const initAdults =
    op.household_type === 'includes_kids'
      ? Math.max(1, (op.household_size || 2) - 1)
      : op.household_size || 1;
  const initChildren =
    op.household_type === 'includes_kids' ? Math.max(1, (op.household_size || 2) - initAdults) : 0;

  const [numAdults, setNumAdults] = useState(initAdults);
  const [numChildren, setNumChildren] = useState(initChildren);
  const [householdMembers, setHouseholdMembers] = useState(members || []);

  function handleSave() {
    save(async () => {
      let total, type;
      if (householdMembers.length > 0) {
        const kids = householdMembers.filter((m) => m.age_group === 'child').length;
        total = householdMembers.length;
        type = kids > 0 ? 'includes_kids' : 'adults_only';
      } else {
        total = numAdults + numChildren;
        type = numChildren > 0 ? 'includes_kids' : 'adults_only';
      }
      const result = await saveHouseholdSettingsAction({
        household_size: total,
        household_type: type,
      });
      if (result?.success === false) return result;
      if (householdMembers.length > 0) {
        return saveHouseholdMembersSettingsAction(householdMembers);
      }
      return result;
    });
  }

  return (
    <SettingsStepLayout error={error} toast={toast}>
      <HouseholdSizeStep
        numAdults={numAdults}
        numChildren={numChildren}
        members={householdMembers}
        userName={userName}
        onChangeAdults={setNumAdults}
        onChangeChildren={setNumChildren}
        onChangeMembers={setHouseholdMembers}
        onNext={handleSave}
        onBack={goBack}
        isPending={isPending}
      />
    </SettingsStepLayout>
  );
}
