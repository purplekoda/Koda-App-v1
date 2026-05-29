'use client'

import { useState } from 'react'
import styled from 'styled-components'

const MEAL_TIMES = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
]

function getDefaultMealTime() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 10) return 'breakfast'
  if (hour >= 10 && hour < 14) return 'lunch'
  if (hour >= 14 && hour < 18) return 'snack'
  if (hour >= 18 && hour < 22) return 'dinner'
  return 'snack'
}

const Wrapper = styled.div`
  padding: ${({ theme }) => theme.spacing.xl};
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
`

const Title = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const Subtitle = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const OptionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`

const Option = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  min-height: ${({ theme }) => theme.touchTarget};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  background: ${({ $active, theme }) =>
    $active ? theme.colors.tealLight : theme.colors.grayLight};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.teal : theme.colors.textPrimary};
  border: 1.5px solid ${({ $active }) =>
    $active ? '#1D9E75' : 'transparent'};
`

const Radio = styled.span`
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid ${({ $active }) => $active ? '#1D9E75' : '#CCCCCC'};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &::after {
    content: '';
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: ${({ $active }) => $active ? '#1D9E75' : 'transparent'};
  }
`

const ButtonRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.xl};
`

const ContinueButton = styled.button`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.md};
  min-height: ${({ theme }) => theme.touchTarget};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 15px;
  font-weight: 600;
  background: ${({ theme }) => theme.colors.teal};
  color: white;
  opacity: ${({ disabled }) => disabled ? 0.5 : 1};
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
`

const CancelButton = styled.button`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  min-height: ${({ theme }) => theme.touchTarget};
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textMuted};
`

export default function MealTimePicker({ onSelect, onCancel }) {
  const [selected, setSelected] = useState(getDefaultMealTime)

  return (
    <Wrapper>
      <Title>Where does this fit in your day?</Title>
      <Subtitle>Choose when you had this food or snack</Subtitle>

      <OptionList>
        {MEAL_TIMES.map(mt => (
          <Option
            key={mt.value}
            $active={selected === mt.value}
            onClick={() => setSelected(mt.value)}
          >
            <Radio $active={selected === mt.value} />
            {mt.label}
          </Option>
        ))}
      </OptionList>

      <ButtonRow>
        <CancelButton onClick={onCancel}>Cancel</CancelButton>
        <ContinueButton
          disabled={!selected}
          onClick={() => selected && onSelect(selected)}
        >
          Continue
        </ContinueButton>
      </ButtonRow>
    </Wrapper>
  )
}
