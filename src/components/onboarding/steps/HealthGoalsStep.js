'use client'

import { Fragment } from 'react'
import styled, { keyframes, css } from 'styled-components'
import StepShell from '../shared/StepShell'
import { HEALTH_GOAL_OPTIONS } from '@/data/onboarding-options'

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
  ${({ $connectedBelow }) => $connectedBelow && 'border-bottom-left-radius: 0; border-bottom-right-radius: 0;'}
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

const SubPanel = styled.div`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border: 1.5px solid ${({ theme }) => theme.colors.teal};
  border-top: none;
  border-radius: 0 0 ${({ theme }) => theme.radii.lg} ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.tealLight + '15'};
  margin-top: -1px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.5;
`

const CarbRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.sm};
`

const CarbInput = styled.input`
  width: 80px;
  padding: 6px 10px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 14px;
  text-align: center;

  &:focus {
    border-color: ${({ theme }) => theme.colors.teal};
    outline: none;
  }
`



export default function HealthGoalsStep({
  goals,
  onChangeGoals,
  carbLimit,
  onChangeCarbLimit,
  onNext, onBack, onSkip, isPending,
  voiceMode = false, voiceAnimatingItems = [],
}) {
  const allValues = HEALTH_GOAL_OPTIONS.map(o => o.value)
  const allSelected = allValues.every(v => goals.includes(v))
  const hasTrackMacros = goals.includes('track_macros')
  const hasBloodSugar = goals.includes('blood_sugar')

  const toggle = (value) => {
    if (goals.includes(value)) {
      onChangeGoals(goals.filter(v => v !== value))
    } else {
      onChangeGoals([...goals, value])
    }
  }

  const toggleAll = () => {
    onChangeGoals(allSelected ? [] : [...allValues])
  }

  return (
    <StepShell
      title="What are your primary health goals?"
      onNext={onNext}
      onBack={onBack}
      isPending={isPending}
      nextDisabled={goals.length === 0}
      showSkip
      onSkip={onSkip}
      skipLabel="Skip -- I don't have specific goals"
      voiceMode={voiceMode}
    >
      <HeaderRow>
        <CountText>{goals.length} selected</CountText>
        <SelectAllLink type="button" onClick={toggleAll}>
          {allSelected ? 'Deselect all' : 'Select all'}
        </SelectAllLink>
      </HeaderRow>

      <Stack>
        {HEALTH_GOAL_OPTIONS.map(opt => (
          <Fragment key={opt.value}>
            <Card
              type="button"
              $selected={goals.includes(opt.value)}
              $voiceAnimating={voiceAnimatingItems.includes(opt.value)}
              $connectedBelow={
                (opt.value === 'track_macros' && hasTrackMacros) ||
                (opt.value === 'blood_sugar' && hasBloodSugar)
              }
              onClick={() => toggle(opt.value)}
            >
              <Checkbox $selected={goals.includes(opt.value)}>
                {goals.includes(opt.value) && '\u2713'}
              </Checkbox>
              <CardBody>
                <CardLabel>{opt.label}</CardLabel>
                <CardSubtitle>{opt.subtitle}</CardSubtitle>
              </CardBody>
            </Card>

            {opt.value === 'track_macros' && hasTrackMacros && (
              <SubPanel>
                You can set your macro targets in your profile settings so Koda can help you stay on track.
              </SubPanel>
            )}

            {opt.value === 'blood_sugar' && hasBloodSugar && (
              <SubPanel>
                Set a daily carb limit so Koda can suggest meals that work for you.
                <CarbRow>
                  <CarbInput
                    type="number"
                    min={0}
                    max={500}
                    value={carbLimit || ''}
                    onChange={(e) => onChangeCarbLimit(Number(e.target.value) || null)}
                    placeholder="g"
                  />
                  <span>grams per day</span>
                </CarbRow>
              </SubPanel>
            )}
          </Fragment>
        ))}
      </Stack>

    </StepShell>
  )
}
