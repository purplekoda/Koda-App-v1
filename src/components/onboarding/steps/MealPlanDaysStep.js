'use client'

import styled from 'styled-components'
import StepShell from '../shared/StepShell'
import DayGrid from '../shared/DayGrid'

const Section = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
`

const SectionLabel = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const Tip = styled.div`
  margin-top: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.tealLight}15;
  border: 1px solid ${({ theme }) => theme.colors.tealLight}40;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.5;
`

const NoPrepChip = styled.button`
  margin-top: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1.5px solid ${({ $selected, theme }) => $selected ? theme.colors.teal : theme.colors.border};
  background: ${({ $selected, theme }) => $selected ? theme.colors.tealLight + '30' : theme.colors.surface};
  color: ${({ $selected, theme }) => $selected ? theme.colors.teal : theme.colors.textPrimary};
  font-size: 13px;
  cursor: pointer;
  display: block;
  margin-left: auto;
  margin-right: auto;
`

export default function MealPlanDaysStep({ planDays, prepDays, onChangePlan, onChangePrep, onNext, onBack, isPending, voiceMode = false, voiceAnimatingDays = [] }) {
  const noPrep = prepDays.length === 0 && planDays.length > 0

  return (
    <StepShell
      title="Which days do you usually plan meals for?"
      onNext={onNext}
      onBack={onBack}
      isPending={isPending}
      voiceMode={voiceMode}
    >
      <Section>
        <DayGrid selected={planDays} onChange={onChangePlan} voiceAnimatingDays={voiceAnimatingDays} />
      </Section>

      <Section style={{ marginTop: '24px' }}>
        <SectionLabel>Which days do you usually meal prep on?</SectionLabel>
        <DayGrid selected={prepDays} onChange={onChangePrep} voiceAnimatingDays={voiceAnimatingDays} />
        <Tip>
          Koda will schedule batch cooking on prep days and plan the rest of the week around it.
        </Tip>
        <NoPrepChip
          type="button"
          $selected={noPrep}
          onClick={() => onChangePrep([])}
        >
          I don't meal prep
        </NoPrepChip>
      </Section>
    </StepShell>
  )
}
