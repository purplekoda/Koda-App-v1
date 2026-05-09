'use client'

import { useState } from 'react'
import StepShell from '../shared/StepShell'
import FaithPracticeToggle from '@/components/faith/FaithPracticeToggle'
import FaithPracticeCards from '@/components/faith/FaithPracticeCards'

export default function FaithPracticesStep({ data, onChange, onNext, onBack, onSkip, isPending }) {
  const [enabled, setEnabled] = useState(data?.follows_faith_based_diet || false)
  const [practices, setPractices] = useState(data?.household_faith_practices || [])
  const [details, setDetails] = useState(data || {})

  function handleToggle(val) {
    setEnabled(val)
    const updated = { ...details, follows_faith_based_diet: val }
    onChange(updated)
  }

  function handleChange(newPractices, newDetails) {
    setPractices(newPractices)
    setDetails(newDetails)
    onChange({
      ...newDetails,
      follows_faith_based_diet: enabled,
      household_faith_practices: newPractices,
    })
  }

  function handleNext() {
    onNext({
      ...details,
      follows_faith_based_diet: enabled,
      household_faith_practices: practices,
    })
  }

  return (
    <StepShell
      title="Faith-based and cultural practices"
      subtitle="Does your household observe any faith-based dietary guidelines? This is completely optional."
      onNext={handleNext}
      onBack={onBack}
      onSkip={onSkip}
      showSkip
      skipLabel="Skip \u2014 not applicable to us"
      isPending={isPending}
      showBack
    >
      <FaithPracticeToggle
        enabled={enabled}
        onToggle={handleToggle}
        label="Our household follows faith-based dietary guidelines"
      />

      {enabled && (
        <FaithPracticeCards
          practices={practices}
          practiceDetails={details}
          onChange={handleChange}
        />
      )}
    </StepShell>
  )
}
