'use client';

import StepShell from '../shared/StepShell';
import SingleSelectCards from '../shared/SingleSelectCards';
import { MEAL_PREP_STYLE_OPTIONS } from '@/data/onboarding-options';

export default function MealPrepStyleStep({
  value,
  onChange,
  onNext,
  onBack,
  isPending,
  voiceMode = false,
  voiceAnimatingValue = null,
}) {
  return (
    <StepShell
      title="Do you meal prep or cook fresh each day?"
      onNext={onNext}
      onBack={onBack}
      isPending={isPending}
      nextDisabled={!value}
      voiceMode={voiceMode}
    >
      <SingleSelectCards
        options={MEAL_PREP_STYLE_OPTIONS}
        selected={value}
        onChange={onChange}
        voiceAnimatingValue={voiceAnimatingValue}
      />
    </StepShell>
  );
}
