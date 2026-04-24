'use client'

import styled from 'styled-components'

const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ $isStale, theme }) =>
    $isStale ? theme.colors.expiringAmberBg : theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.xxxl} ${({ theme }) => theme.spacing.xl};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const Icon = styled.div`
  font-size: 56px;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const Title = styled.h3`
  font-size: 20px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const Desc = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  max-width: 400px;
  margin: 0 auto ${({ theme }) => theme.spacing.xl};
  line-height: 1.5;
`

const ScanButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: 14px 32px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.teal};
  color: white;
  font-size: 16px;
  font-weight: 500;
  min-height: ${({ theme }) => theme.touchTarget};
  cursor: pointer;
  border: none;
  transition: all 0.15s ease;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
`

const LastScanInfo = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xl};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
`

const StaleBadge = styled.div`
  display: inline-block;
  padding: 6px 16px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.expiringAmberBg};
  color: ${({ theme }) => theme.colors.amber};
  font-size: 13px;
  font-weight: 500;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

function getDaysAgo(scannedAt) {
  if (!scannedAt) return null
  const diff = Date.now() - new Date(scannedAt).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export default function ScanEntry({ lastScan, onStartScan }) {
  const daysAgo = getDaysAgo(lastScan?.scannedAt)
  const isStale = daysAgo !== null && daysAgo >= 7

  return (
    <Card $isStale={isStale}>
      {isStale && (
        <StaleBadge>
          {daysAgo} days since your last scan
        </StaleBadge>
      )}
      <Icon>{isStale ? '\u23F0' : '\uD83D\uDCF7'}</Icon>
      <Title>{isStale ? 'Time for a fresh scan' : 'Scan your fridge'}</Title>
      <Desc>
        {isStale
          ? 'Your pantry data is over a week old. Re-scan to update freshness, find expiring items, and get new dinner ideas.'
          : 'Take a photo of your fridge and Koda will detect items, check freshness, and suggest meals you can make tonight.'}
      </Desc>
      <ScanButton onClick={onStartScan}>
        {isStale ? 'Re-scan now' : 'Scan fridge'}
      </ScanButton>
      {lastScan && (
        <LastScanInfo>
          Last scan: {lastScan.date} at {lastScan.time} {'\u00B7'} {lastScan.itemsDetected} items detected
        </LastScanInfo>
      )}
    </Card>
  )
}
