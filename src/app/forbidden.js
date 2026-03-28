'use client'

import styled from 'styled-components'
import Link from 'next/link'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: ${({ theme }) => theme.spacing.xl};
  text-align: center;
`

const Code = styled.h1`
  font-size: 72px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.coral};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const Message = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const HomeLink = styled(Link)`
  padding: 12px 32px;
  background: ${({ theme }) => theme.colors.teal};
  color: white;
  border-radius: ${({ theme }) => theme.radii.md};
  font-weight: 500;

  &:hover {
    opacity: 0.9;
  }
`

export default function Forbidden() {
  return (
    <Container>
      <Code>403</Code>
      <Message>You don't have permission to access this page.</Message>
      <HomeLink href="/dashboard">Go to Dashboard</HomeLink>
    </Container>
  )
}
