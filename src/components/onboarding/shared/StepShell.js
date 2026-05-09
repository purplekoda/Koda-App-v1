'use client'

import styled from 'styled-components'
import { useSettingsMode } from '@/components/settings/SettingsModeContext'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
`

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-bottom: ${({ theme }) => theme.spacing.xl};
`

const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 ${({ theme }) => theme.spacing.sm};
  line-height: 1.2;
`

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.body};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0 0 ${({ theme }) => theme.spacing.xl};
  line-height: 1.5;
`

const NavRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  padding-top: ${({ theme }) => theme.spacing.lg};
  border-top: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  flex-shrink: 0;
`

const PrimaryBtn = styled.button`
  flex: 1;
  height: ${({ theme }) => theme.touchTarget};
  border: none;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.teal};
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;

  &:hover { opacity: 0.9; }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`

const SecondaryBtn = styled.button`
  height: ${({ theme }) => theme.touchTarget};
  padding: 0 ${({ theme }) => theme.spacing.xl};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;

  &:hover { background: ${({ theme }) => theme.colors.background}; }
`

const SkipLink = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.textTertiary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.sm} 0;
  align-self: center;
  text-decoration: underline;
  text-decoration-color: transparent;
  transition: text-decoration-color 0.15s;

  &:hover { text-decoration-color: currentColor; }
`

export default function StepShell({
  title,
  subtitle,
  children,
  onNext,
  onBack,
  onSkip,
  nextLabel = 'Continue',
  skipLabel = 'Skip for now',
  nextDisabled = false,
  isPending = false,
  showBack = true,
  showSkip = false,
  voiceMode = false,
}) {
  const isSettings = useSettingsMode()

  // In voice mode, render only the form content — no title, subtitle, or nav
  if (voiceMode) {
    return <Wrapper><Content>{children}</Content></Wrapper>
  }

  const effectiveNextLabel = isSettings ? 'Save' : nextLabel
  const effectiveShowSkip = isSettings ? false : showSkip

  return (
    <Wrapper>
      <Content>
        {title && <Title>{title}</Title>}
        {subtitle && <Subtitle>{subtitle}</Subtitle>}
        {children}
      </Content>

      <NavRow>
        {showBack && onBack && (
          <SecondaryBtn type="button" onClick={onBack}>Back</SecondaryBtn>
        )}
        {onNext && (
          <PrimaryBtn
            type="button"
            onClick={onNext}
            disabled={nextDisabled || isPending}
          >
            {isPending ? 'Saving...' : effectiveNextLabel}
          </PrimaryBtn>
        )}
      </NavRow>

      {effectiveShowSkip && onSkip && (
        <SkipLink type="button" onClick={onSkip}>{skipLabel}</SkipLink>
      )}
    </Wrapper>
  )
}
