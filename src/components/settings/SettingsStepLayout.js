'use client'

import styled, { keyframes } from 'styled-components'
import { SettingsModeProvider } from './SettingsModeContext'

const PageWrapper = styled.div`
  max-width: 560px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xl};
  min-height: 100dvh;
  display: flex;
  flex-direction: column;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme }) => theme.spacing.lg};
    padding-bottom: calc(${({ theme }) => theme.bottomNavHeight} + ${({ theme }) => theme.spacing.xl});
  }
`

const ErrorBanner = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radii.md};
  background: #FEE2E2;
  color: #991B1B;
  font-size: 13px;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`

const fadeOut = keyframes`
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(12px); }
`

const Toast = styled.div`
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: ${({ theme }) => theme.colors.teal};
  color: white;
  padding: 10px 24px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 14px;
  font-weight: 500;
  box-shadow: ${({ theme }) => theme.shadows.elevated};
  z-index: 1000;
  animation: ${fadeIn} 0.2s ease, ${fadeOut} 0.2s ease 1.3s forwards;
`

export default function SettingsStepLayout({ children, error, toast }) {
  return (
    <SettingsModeProvider>
      <PageWrapper>
        {error && <ErrorBanner>{error}</ErrorBanner>}
        {children}
        {toast && <Toast>{toast}</Toast>}
      </PageWrapper>
    </SettingsModeProvider>
  )
}
