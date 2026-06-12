'use client'

import styled, { keyframes } from 'styled-components'

const shimmer = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.45; }
  100% { opacity: 1; }
`

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
  padding-top: ${({ theme }) => theme.spacing.sm};
`

const Block = styled.div`
  background: ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  animation: ${shimmer} 1.6s ease-in-out infinite;
`

const TitleBar = styled(Block)`
  width: 200px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radii.md};
`

const Card = styled(Block)`
  width: 100%;
  height: 120px;
`

export default function PageSkeleton({ variant }) {
  return (
    <Wrapper>
      <TitleBar />
      <Card />
      <Card />
      <Card />
    </Wrapper>
  )
}
