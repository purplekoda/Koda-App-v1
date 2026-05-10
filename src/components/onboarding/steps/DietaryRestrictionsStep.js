'use client';

import StepShell from '../shared/StepShell';
import ChipSelector from '../shared/ChipSelector';
import { DIETARY_RESTRICTION_OPTIONS } from '@/data/onboarding-options';

export default function DietaryRestrictionsStep({
  selected,
  onChange,
  onNext,
  onBack,
  onSkip,
  isPending,
  voiceMode = false,
  voiceAnimatingItems = [],
  ambiguousItems = [],
}) {
  return (
    <StepShell
      title="Any dietary restrictions or allergies?"
      onNext={onNext}
      onBack={onBack}
      isPending={isPending}
      showSkip
      onSkip={onSkip}
      skipLabel="No restrictions"
      voiceMode={voiceMode}
    >
      <ChipSelector
        options={DIETARY_RESTRICTION_OPTIONS}
        selected={selected}
        onChange={onChange}
        allowCustom
        voiceAnimatingItems={voiceAnimatingItems}
        ambiguousItems={ambiguousItems}
      />
    </StepShell>
  );
}
