'use client'

import { useState, useEffect, useRef } from 'react'
import styled from 'styled-components'
import QRCode from 'qrcode'
import StepShell from '../shared/StepShell'
import { PERMISSION_GROUPS } from '@/data/onboarding-options'

const Section = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
`

const SectionLabel = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

// Household members list
const MemberRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md} 0;

  & + & {
    border-top: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  }
`

const Avatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.tealLight}40;
  color: ${({ theme }) => theme.colors.teal};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
  flex-shrink: 0;
`

const MemberName = styled.div`
  flex: 1;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const RoleBadge = styled.span`
  font-size: 12px;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ $owner, theme }) => $owner ? theme.colors.tealLight + '30' : '#FEF3C7'};
  color: ${({ $owner }) => $owner ? '#15803D' : '#92400E'};
  font-weight: 500;
`

// Invite link section
const InviteBox = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface};
`

const InviteUrl = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const UrlText = styled.span`
  flex: 1;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: monospace;
`

const CopyBtn = styled.button`
  padding: 4px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ $copied, theme }) => $copied ? '#22C55E' : theme.colors.teal};
  background: ${({ $copied }) => $copied ? '#22C55E' : 'transparent'};
  color: ${({ $copied, theme }) => $copied ? 'white' : theme.colors.teal};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
`

const ShareRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
`

const ShareBtn = styled.button`
  flex: 1;
  min-width: 0;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface};
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s;

  &:hover { background: ${({ theme }) => theme.colors.background}; }
`

const Tip = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textTertiary};
  margin-top: ${({ theme }) => theme.spacing.sm};
`

const QRWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.lg} 0;
  margin-top: ${({ theme }) => theme.spacing.md};
  border-top: 0.5px solid ${({ theme }) => theme.colors.borderLight};
`

const QRLabel = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textTertiary};
  margin-top: ${({ theme }) => theme.spacing.sm};
`

const ExpiryText = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textTertiary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const GenerateBtn = styled.button`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.teal};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.teal};
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;

  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

// Permissions section
const PermGroup = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const PermGroupLabel = styled.div`
  font-size: 12px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textTertiary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const PermRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.sm} 0;
  & + & { border-top: 0.5px solid ${({ theme }) => theme.colors.borderLight}; }
`

const PermInfo = styled.div`
  flex: 1;
`

const PermLabel = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const PermDesc = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textTertiary};
`

const Toggle = styled.button`
  width: 40px;
  height: 22px;
  border-radius: 11px;
  border: none;
  background: ${({ $active, theme }) => $active ? theme.colors.teal : theme.colors.border};
  position: relative;
  cursor: pointer;
  transition: background 0.2s;
  flex-shrink: 0;

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${({ $active }) => $active ? '20px' : '2px'};
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: white;
    transition: left 0.2s;
  }
`

export default function InviteFamilyStep({
  members, invite, permissions, onCreateInvite, onChangePermissions,
  onNext, onBack, onSkip, isPending,
}) {
  const [copied, setCopied] = useState(false)
  const qrCanvasRef = useRef(null)

  const inviteUrl = invite?.invite_code
    ? `koda.app/join/${invite.invite_code}`
    : null

  useEffect(() => {
    if (inviteUrl && qrCanvasRef.current) {
      QRCode.toCanvas(qrCanvasRef.current, `https://${inviteUrl}`, {
        width: 160,
        margin: 2,
        color: { dark: '#1A1A2E', light: '#FFFFFF' },
      }).catch(() => {})
    }
  }, [inviteUrl])

  const handleCopy = async () => {
    if (!inviteUrl) return
    try {
      await navigator.clipboard.writeText(`https://${inviteUrl}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  const handleShare = async (method) => {
    const url = `https://${inviteUrl}`
    const text = `Join my Koda household for shared meal planning!`

    if (method === 'native' && navigator.share) {
      try {
        await navigator.share({ title: 'Join my Koda household', text, url })
      } catch { /* user cancelled */ }
      return
    }

    if (method === 'email') {
      window.open(`mailto:?subject=${encodeURIComponent('Join my Koda household')}&body=${encodeURIComponent(`${text}\n\n${url}`)}`)
    } else if (method === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`)
    } else if (method === 'message') {
      window.open(`sms:?body=${encodeURIComponent(`${text} ${url}`)}`)
    }
  }

  const togglePermission = (key) => {
    onChangePermissions({ ...permissions, [key]: !permissions[key] })
  }

  return (
    <StepShell
      title="Invite your family to Koda"
      subtitle="Share your meal plan, pantry, and recipes with your household."
      onNext={onNext}
      onBack={onBack}
      isPending={isPending}
      nextLabel="Continue"
      showSkip
      onSkip={onSkip}
      skipLabel="Skip for now"
    >
      {/* Current household */}
      {members.length > 0 && (
        <Section>
          <SectionLabel>Your household</SectionLabel>
          <MemberRow>
            <Avatar>You</Avatar>
            <MemberName>You</MemberName>
            <RoleBadge $owner>Owner</RoleBadge>
          </MemberRow>
          {members.map((m, i) => (
            <MemberRow key={i}>
              <Avatar>{(m.name || '?')[0].toUpperCase()}</Avatar>
              <MemberName>{m.name}</MemberName>
              <RoleBadge>Member</RoleBadge>
            </MemberRow>
          ))}
        </Section>
      )}

      {/* Invite link */}
      <Section>
        <SectionLabel>Share an invite link</SectionLabel>
        {inviteUrl ? (
          <InviteBox>
            <InviteUrl>
              <UrlText>{inviteUrl}</UrlText>
              <CopyBtn type="button" $copied={copied} onClick={handleCopy}>
                {copied ? 'Copied!' : 'Copy'}
              </CopyBtn>
            </InviteUrl>
            <ExpiryText>Link expires in 7 days</ExpiryText>
            <ShareRow>
              <ShareBtn type="button" onClick={() => handleShare('message')}>Message</ShareBtn>
              <ShareBtn type="button" onClick={() => handleShare('email')}>Email</ShareBtn>
              <ShareBtn type="button" onClick={() => handleShare('whatsapp')}>WhatsApp</ShareBtn>
              {typeof navigator !== 'undefined' && navigator.share && (
                <ShareBtn type="button" onClick={() => handleShare('native')}>Share</ShareBtn>
              )}
            </ShareRow>
            <Tip>Anyone with this link can request to join your Koda household.</Tip>
            <QRWrapper>
              <canvas ref={qrCanvasRef} style={{ borderRadius: 8 }} />
              <QRLabel>Or scan this QR code</QRLabel>
            </QRWrapper>
          </InviteBox>
        ) : (
          <GenerateBtn type="button" onClick={onCreateInvite} disabled={isPending}>
            {isPending ? 'Creating...' : 'Generate invite link'}
          </GenerateBtn>
        )}
      </Section>

      {/* Permissions */}
      <Section>
        <SectionLabel>Default permissions for new members</SectionLabel>
        {PERMISSION_GROUPS.map(group => (
          <PermGroup key={group.label}>
            <PermGroupLabel>{group.label}</PermGroupLabel>
            {group.permissions.map(perm => (
              <PermRow key={perm.key}>
                <PermInfo>
                  <PermLabel>{perm.label}</PermLabel>
                  <PermDesc>{perm.description}</PermDesc>
                </PermInfo>
                <Toggle
                  type="button"
                  $active={permissions[perm.key] ?? perm.defaultValue}
                  onClick={() => togglePermission(perm.key)}
                />
              </PermRow>
            ))}
          </PermGroup>
        ))}
      </Section>
    </StepShell>
  )
}
