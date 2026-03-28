'use client'

import styled from 'styled-components'

const ToggleWrapper = styled.div`
  display: inline-flex;
  background: ${({ theme }) => theme.colors.grayLight};
  border-radius: ${({ theme }) => theme.radii.pill};
  padding: 3px;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const ToggleOption = styled.button`
  padding: 8px 20px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 14px;
  font-weight: 500;
  min-height: ${({ theme }) => theme.touchTarget};
  transition: all 0.2s ease;
  color: ${({ $active, theme }) => $active ? theme.colors.surface : theme.colors.textSecondary};
  background: ${({ $active, theme }) => $active ? theme.colors.teal : 'transparent'};
`

export default function DailyWeeklyToggle({ view, onToggle }) {
  return (
    <ToggleWrapper>
      <ToggleOption $active={view === 'daily'} onClick={() => onToggle('daily')}>
        Daily
      </ToggleOption>
      <ToggleOption $active={view === 'weekly'} onClick={() => onToggle('weekly')}>
        Weekly
      </ToggleOption>
    </ToggleWrapper>
  )
}
