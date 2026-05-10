'use client';

import StepShell from '../shared/StepShell';
import SingleSelectCards from '../shared/SingleSelectCards';
import { ADVENTUROUSNESS_OPTIONS } from '@/data/onboarding-options';

export default function AdventurousnessStep({
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
      title="How adventurous are you with new recipes?"
      onNext={onNext}
      onBack={onBack}
      isPending={isPending}
      nextDisabled={!value}
      voiceMode={voiceMode}
    >
      <SingleSelectCards
        options={ADVENTUROUSNESS_OPTIONS}
        selected={value}
        onChange={onChange}
        voiceAnimatingValue={voiceAnimatingValue}
      />
    </StepShell>
  );
}
