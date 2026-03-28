'use client'

import styled from 'styled-components'

const Wrapper = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const Left = styled.div``

const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: 4px;
`

const Subtitle = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Right = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`

const NotificationDot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.coral};
  cursor: pointer;
`

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.borderLight};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  border: 2px solid ${({ theme }) => theme.colors.border};
`

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function DashboardGreeting({ displayName, initials, subtitle }) {
  return (
    <Wrapper>
      <Left>
        <Title>{getGreeting()}, {displayName || 'there'}</Title>
        <Subtitle>{subtitle}</Subtitle>
      </Left>
      <Right>
        <NotificationDot />
        <Avatar>{initials || '?'}</Avatar>
      </Right>
    </Wrapper>
  )
}
