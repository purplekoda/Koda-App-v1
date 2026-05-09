'use client'

import styled from 'styled-components'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  flex: 1;
  gap: ${({ theme }) => theme.spacing.xxl};
  padding: ${({ theme }) => theme.spacing.xxxl} 0;
`

const Logo = styled.div`
  width: 80px;
  height: 80px;
  border-radius: ${({ theme }) => theme.radii.xl};
  background: ${({ theme }) => theme.colors.teal};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  font-weight: 800;
  color: white;
  letter-spacing: -1px;
`

const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.xxl};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
`

const Tagline = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.body};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
  max-width: 360px;
  line-height: 1.5;
`

const BtnStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  width: 100%;
  max-width: 320px;
`

const PrimaryBtn = styled.button`
  width: 100%;
  height: 48px;
  border: none;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.teal};
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;

  &:hover { opacity: 0.9; }
`

const SkipBtn = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textTertiary};
  font-size: 14px;
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.sm};

  &:hover { color: ${({ theme }) => theme.colors.textSecondary}; }
`

export default function WelcomeStep({ onStart, onSkip }) {
  return (
    <Wrapper>
      <Logo>K</Logo>
      <div>
        <Title>Koda</Title>
        <Tagline>
          Your smart meal planner that learns what you love and helps you waste nothing.
        </Tagline>
      </div>
      <BtnStack>
        <PrimaryBtn type="button" onClick={onStart}>Get started</PrimaryBtn>
        <SkipBtn type="button" onClick={onSkip}>
          Skip &mdash; I'll set this up later
        </SkipBtn>
      </BtnStack>
    </Wrapper>
  )
}
