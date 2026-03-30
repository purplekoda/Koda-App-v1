'use client'

import styled from 'styled-components'

const Bar = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const StepItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`

const StepCircle = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
  transition: all 0.2s ease;

  background: ${({ $state, theme }) => {
    if ($state === 'active') return theme.colors.teal
    if ($state === 'done') return theme.colors.tealLight
    return theme.colors.borderLight
  }};
  color: ${({ $state, theme }) => {
    if ($state === 'active') return '#FFFFFF'
    if ($state === 'done') return theme.colors.teal
    return theme.colors.textMuted
  }};
  border: 2px solid ${({ $state, theme }) => {
    if ($state === 'active') return theme.colors.teal
    if ($state === 'done') return theme.colors.teal
    return theme.colors.border
  }};
`

const StepLabel = styled.span`
  font-size: 13px;
  font-weight: ${({ $active }) => $active ? 600 : 400};
  color: ${({ $active, theme }) => $active ? theme.colors.textPrimary : theme.colors.textMuted};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: ${({ $active }) => $active ? 'inline' : 'none'};
  }
`

const StepLine = styled.div`
  flex: 1;
  height: 2px;
  background: ${({ $done, theme }) => $done ? theme.colors.teal : theme.colors.border};
  min-width: 16px;
`

const steps = ['Review meals', 'Pantry check', 'Choose store', 'Sent!']

export default function GroceryStepBar({ currentStep }) {
  return (
    <Bar>
      {steps.map((label, i) => {
        const state = i < currentStep ? 'done' : i === currentStep ? 'active' : 'upcoming'
        return (
          <span key={label} style={{ display: 'contents' }}>
            <StepItem>
              <StepCircle $state={state}>
                {state === 'done' ? '\u2713' : i + 1}
              </StepCircle>
              <StepLabel $active={state === 'active'}>{label}</StepLabel>
            </StepItem>
            {i < steps.length - 1 && <StepLine $done={i < currentStep} />}
          </span>
        )
      })}
    </Bar>
  )
}
