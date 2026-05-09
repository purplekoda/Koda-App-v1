'use client'

import styled, { keyframes, css } from 'styled-components'
import StepShell from '../shared/StepShell'
import { FRUSTRATION_OPTIONS } from '@/data/onboarding-options'

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const CountText = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textTertiary};
`

const SelectAllLink = styled.button`
  background: none;
  border: none;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.teal};
  cursor: pointer;
  font-weight: 500;
`

const voicePulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(29,158,117,0.5); }
  70% { box-shadow: 0 0 0 8px rgba(29,158,117,0); }
  100% { box-shadow: 0 0 0 0 rgba(29,158,117,0); }
`

const Card = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border: 1.5px solid ${({ $selected, theme }) => $selected ? theme.colors.teal : theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ $selected, theme }) => $selected ? theme.colors.tealLight + '20' : theme.colors.surface};
  cursor: pointer;
  text-align: left;
  transition: all 0.15s;
  min-height: 56px;
  ${({ $voiceAnimating }) => $voiceAnimating && css`animation: ${voicePulse} 0.6s ease-out;`}

  &:hover { border-color: ${({ theme }) => theme.colors.teal}; }
`

const Checkbox = styled.div`
  width: 18px;
  height: 18px;
  border-radius: 3px;
  border: 2px solid ${({ $selected, theme }) => $selected ? theme.colors.teal : theme.colors.border};
  background: ${({ $selected, theme }) => $selected ? theme.colors.teal : 'transparent'};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: white;
  font-size: 12px;
  transition: all 0.15s;
`

const CardBody = styled.div`
  flex: 1;
`

const CardLabel = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const CardSubtitle = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 1px;
`

const Tip = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textTertiary};
  text-align: center;
  padding-top: ${({ theme }) => theme.spacing.sm};
`

export default function FrustrationsStep({ selected, onChange, onNext, onBack, isPending, voiceMode = false, voiceAnimatingItems = [] }) {
  const allValues = FRUSTRATION_OPTIONS.map(o => o.value)
  const allSelected = allValues.every(v => selected.includes(v))

  const toggle = (value) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const toggleAll = () => {
    onChange(allSelected ? [] : [...allValues])
  }

  return (
    <StepShell
      title="What are your biggest cooking frustrations?"
      onNext={onNext}
      onBack={onBack}
      isPending={isPending}
      nextDisabled={selected.length === 0}
      voiceMode={voiceMode}
    >
      <HeaderRow>
        <CountText>{selected.length} selected</CountText>
        <SelectAllLink type="button" onClick={toggleAll}>
          {allSelected ? 'Deselect all' : 'Select all'}
        </SelectAllLink>
      </HeaderRow>
      <Stack>
        {FRUSTRATION_OPTIONS.map(opt => (
          <Card
            key={opt.value}
            type="button"
            $selected={selected.includes(opt.value)}
            $voiceAnimating={voiceAnimatingItems.includes(opt.value)}
            onClick={() => toggle(opt.value)}
          >
            <Checkbox $selected={selected.includes(opt.value)}>
              {selected.includes(opt.value) && '\u2713'}
            </Checkbox>
            <CardBody>
              <CardLabel>{opt.label}</CardLabel>
              <CardSubtitle>{opt.subtitle}</CardSubtitle>
            </CardBody>
          </Card>
        ))}
      </Stack>
      {selected.length === 0 && <Tip>Select at least one to continue</Tip>}
    </StepShell>
  )
}
