'use client'

import styled from 'styled-components'

const Wrapper = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xxxl} ${({ theme }) => theme.spacing.xl};
`

const Icon = styled.div`
  font-size: 56px;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const Description = styled.p`
  font-size: 15px;
  color: ${({ theme }) => theme.colors.textSecondary};
  max-width: 400px;
  margin: 0 auto ${({ theme }) => theme.spacing.xxl};
  line-height: 1.5;
`

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.tealLight};
  color: ${({ theme }) => theme.colors.teal};
  font-size: 14px;
  font-weight: 500;
`

export default function PlaceholderPage({ icon, title, description }) {
  return (
    <Wrapper>
      <Icon>{icon}</Icon>
      <Title>{title}</Title>
      <Description>{description}</Description>
      <Badge>{'\u2728'} Coming soon</Badge>
    </Wrapper>
  )
}
