'use client'

import styled from 'styled-components'
import DailyWeeklyToggle from './DailyWeeklyToggle'

const TopBar = styled.div`
  display: none;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: ${({ theme }) => theme.spacing.md} 0;
    margin-bottom: ${({ theme }) => theme.spacing.md};
    border-bottom: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  }
`

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  font-size: 22px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.teal};
`

const LogoDot = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.teal};
`

const Avatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.purpleLight};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.purple};
  border: 1.5px solid ${({ theme }) => theme.colors.purpleMid};
`

export default function MobileTopBar({ view, onToggle, initials }) {
  return (
    <TopBar>
      <LogoSection>
        <LogoDot /> Koda
      </LogoSection>
      <DailyWeeklyToggle view={view} onToggle={onToggle} />
      <Avatar>{initials || 'JM'}</Avatar>
    </TopBar>
  )
}
