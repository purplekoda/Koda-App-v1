'use client'

import StepShell from '../shared/StepShell'
import SingleSelectCards from '../shared/SingleSelectCards'
import { COOK_TIME_OPTIONS } from '@/data/onboarding-options'

export default function CookTimeStep({ value, onChange, onNext, onBack, isPending, voiceMode = false, voiceAnimatingValue = null }) {
  return (
    <StepShell
      title="How much time do you have to cook on weeknights?"
      onNext={onNext}
      onBack={onBack}
      isPending={isPending}
      nextDisabled={!value}
      voiceMode={voiceMode}
    >
      <SingleSelectCards
        options={COOK_TIME_OPTIONS}
        selected={value}
        onChange={onChange}
        voiceAnimatingValue={voiceAnimatingValue}
      />
    </StepShell>
  )
}
