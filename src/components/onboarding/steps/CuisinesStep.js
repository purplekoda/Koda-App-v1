'use client'

import styled, { keyframes, css } from 'styled-components'
import StepShell from '../shared/StepShell'
import { CUISINE_OPTIONS } from '@/data/onboarding-options'

const voiceSelectAnim = keyframes`
  0% { transform: scale(1); }
  40% { transform: scale(1.15); }
  100% { transform: scale(1); }
`

const voiceAmberPulse = keyframes`
  0%, 100% { border-color: #BA7517; }
  50% { border-color: transparent; }
`

const ChipGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`

const Chip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1.5px solid ${({ $selected, $ambiguous, theme }) =>
    $ambiguous ? theme.colors.amber
    : $selected ? theme.colors.teal : theme.colors.border};
  background: ${({ $selected, theme }) => $selected ? theme.colors.tealLight + '30' : theme.colors.surface};
  color: ${({ $selected, theme }) => $selected ? theme.colors.teal : theme.colors.textPrimary};
  font-size: 14px;
  font-weight: ${({ $selected }) => $selected ? 600 : 400};
  cursor: pointer;
  transition: all 0.15s;
  ${({ $voiceAnimating }) => $voiceAnimating && css`animation: ${voiceSelectAnim} 0.4s ease-out;`}
  ${({ $ambiguous }) => $ambiguous && css`animation: ${voiceAmberPulse} 0.8s ease-in-out 3;`}
`

export default function CuisinesStep({ selected, onChange, onNext, onBack, isPending, voiceMode = false, voiceAnimatingItems = [], ambiguousItems = [] }) {
  const toggle = (value) => {
    onChange(
      selected.includes(value)
        ? selected.filter(v => v !== value)
        : [...selected, value]
    )
  }

  return (
    <StepShell
      title="What cuisines do you love?"
      subtitle="Select all that apply."
      onNext={onNext}
      onBack={onBack}
      isPending={isPending}
      voiceMode={voiceMode}
    >
      <ChipGrid>
        {CUISINE_OPTIONS.map(opt => (
          <Chip
            key={opt.value}
            type="button"
            $selected={selected.includes(opt.value)}
            $voiceAnimating={voiceAnimatingItems.includes(opt.value)}
            $ambiguous={ambiguousItems.includes(opt.value)}
            onClick={() => toggle(opt.value)}
          >
            <span>{opt.flag}</span>
            {opt.label}
          </Chip>
        ))}
      </ChipGrid>
    </StepShell>
  )
}
