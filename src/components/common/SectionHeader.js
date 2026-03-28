'use client'

import styled from 'styled-components'
import Link from 'next/link'

const Wrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const Left = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`

const Title = styled.h2`
  font-size: 20px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Badge = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.teal};
`

const BadgeDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.teal};
`

const StyledLink = styled(Link)`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: 500;
  transition: color 0.15s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

export default function SectionHeader({ title, badge, linkText, linkHref }) {
  return (
    <Wrapper>
      <Left>
        <Title>{title}</Title>
        {badge && (
          <Badge>
            <BadgeDot /> {badge}
          </Badge>
        )}
      </Left>
      {linkText && (
        <StyledLink href={linkHref || '#'}>
          {linkText} {'\u2192'}
        </StyledLink>
      )}
    </Wrapper>
  )
}
