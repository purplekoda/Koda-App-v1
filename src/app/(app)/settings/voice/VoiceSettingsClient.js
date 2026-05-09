'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import styled from 'styled-components'
import { saveVoiceSettingsAction } from '../actions'

// ── Styled components ─────────────────────────────────

const PageWrapper = styled.div`
  max-width: 640px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xxl} ${({ theme }) => theme.spacing.xl};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.lg};
    padding-bottom: calc(${({ theme }) => theme.bottomNavHeight} + ${({ theme }) => theme.spacing.xl});
  }
`

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
  text-decoration: none;
  margin-bottom: ${({ theme }) => theme.spacing.lg};

  &:hover { color: ${({ theme }) => theme.colors.textPrimary}; }
`

const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const Section = styled.section`
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  box-shadow: ${({ theme }) => theme.shadows.card};
`

const SectionTitle = styled.h2`
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const SectionNote = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-style: italic;
  margin: ${({ theme }) => theme.spacing.md} 0 0;
  line-height: 1.4;
`

const ToggleRow = styled.label`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md} 0;
  cursor: pointer;

  & + & {
    border-top: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  }
`

const ToggleInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
`

const ToggleLabel = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const ToggleDesc = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.3;
`

const Switch = styled.div`
  width: 42px;
  height: 24px;
  border-radius: 12px;
  background: ${({ $on, theme }) => ($on ? theme.colors.teal : theme.colors.border)};
  position: relative;
  flex-shrink: 0;
  transition: background 0.15s ease;
  margin-top: 2px;

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${({ $on }) => ($on ? '20px' : '2px')};
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    transition: left 0.15s ease;
  }
`

const StatusText = styled.span`
  font-size: 12px;
  color: ${({ $error, theme }) =>
    $error ? theme.colors.error : theme.colors.success};
  text-align: center;
  display: block;
  margin-top: ${({ theme }) => theme.spacing.sm};
`

const InfoCard = styled.div`
  background: ${({ theme }) => theme.colors.purpleLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const InfoTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.purpleDark};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const InfoText = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.purpleDark};
  line-height: 1.5;
  opacity: 0.85;
`

// ── Component ─────────────────────────────────────────

export default function VoiceSettingsClient({ initialSettings }) {
  const [settings, setSettings] = useState({
    voice_responses_enabled: false,
    ...initialSettings,
  })
  const [status, setStatus] = useState(null)
  const [isPending, startSaveTransition] = useTransition()

  function toggle(key) {
    const next = { ...settings, [key]: !settings[key] }
    setSettings(next)
    save(next)
  }

  function save(data) {
    setStatus(null)
    startSaveTransition(async () => {
      const result = await saveVoiceSettingsAction(data)
      if (!result.success) {
        setStatus({ ok: false, msg: result.error })
      }
    })
  }

  return (
    <PageWrapper>
      <BackLink href="/settings">{'\u2190'} Settings</BackLink>
      <PageTitle>Voice</PageTitle>

      <InfoCard>
        <InfoTitle>Talk to Koda</InfoTitle>
        <InfoText>
          Use the microphone button in the chat bar to speak to Koda.
          When voice responses are on, Koda will read replies aloud automatically.
          You can also tap the speaker icon on any message to hear it.
        </InfoText>
      </InfoCard>

      <Section>
        <SectionTitle>Voice responses</SectionTitle>
        <ToggleRow onClick={() => toggle('voice_responses_enabled')}>
          <ToggleInfo>
            <ToggleLabel>Read responses aloud</ToggleLabel>
            <ToggleDesc>
              When Koda replies, automatically speak the response using text-to-speech.
              You can stop playback at any time by tapping the speaker icon.
            </ToggleDesc>
          </ToggleInfo>
          <Switch $on={settings.voice_responses_enabled} />
        </ToggleRow>
        <SectionNote>
          Voice input (microphone) is always available regardless of this setting.
          This only controls whether Koda reads responses out loud.
        </SectionNote>
      </Section>

      <Section>
        <SectionTitle>Browser support</SectionTitle>
        <SectionNote style={{ margin: 0, fontStyle: 'normal' }}>
          Voice input works best in Chrome and Safari. Text-to-speech is supported
          in all modern browsers. On mobile, Koda uses your device{'\u2019'}s built-in
          speech engine for the most natural experience.
        </SectionNote>
      </Section>

      {status && (
        <StatusText $error={!status.ok}>{status.msg}</StatusText>
      )}
    </PageWrapper>
  )
}
