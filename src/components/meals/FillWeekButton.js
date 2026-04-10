'use client'


import styled, { keyframes } from 'styled-components'

const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: 200px 0; }
`

const ButtonWrapper = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: 12px 24px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ $loading, theme }) =>
    $loading
      ? `linear-gradient(90deg, ${theme.colors.purpleLight} 0%, ${theme.colors.purpleMid} 50%, ${theme.colors.purpleLight} 100%)`
      : theme.colors.purple};
  background-size: 400px 100%;
  animation: ${({ $loading }) => $loading ? shimmer : 'none'} 1.5s ease infinite;
  color: ${({ $loading }) => $loading ? '#7F77DD' : '#FFFFFF'};
  font-size: 15px;
  font-weight: 500;
  min-height: ${({ theme }) => theme.touchTarget};
  cursor: ${({ $loading }) => $loading ? 'wait' : 'pointer'};
  transition: all 0.2s ease;
  border: none;

  &:hover {
    opacity: ${({ $loading }) => $loading ? 1 : 0.9};
    transform: ${({ $loading }) => $loading ? 'none' : 'translateY(-1px)'};
  }
`

const PurpleDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $loading }) => $loading ? '#7F77DD' : 'rgba(255,255,255,0.6)'};
`

export default function FillWeekButton({ onFill, isPending }) {
  return (
    <ButtonWrapper $loading={isPending} onClick={() => !isPending && onFill?.()} disabled={isPending}>
      <PurpleDot $loading={isPending} />
      {isPending ? 'Koda is planning...' : 'Fill week with AI'}
    </ButtonWrapper>
  )
}
