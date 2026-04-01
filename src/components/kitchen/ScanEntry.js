'use client'

import styled from 'styled-components'

const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
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

export default function ScanEntry({ lastScan, onStartScan }) {
  return (
    <Card>
      <Icon>{'\uD83D\uDCF7'}</Icon>
      <Title>Scan your fridge</Title>
      <Desc>
        Take a photo of your fridge and Koda will detect items, check freshness, and suggest meals you can make tonight.
      </Desc>
      <ScanButton onClick={onStartScan}>
        {'\uD83D\uDCF7'} Scan fridge
      </ScanButton>
      {lastScan && (
        <LastScanInfo>
          Last scan: {lastScan.date} at {lastScan.time} {'\u00B7'} {lastScan.itemsDetected} items detected
        </LastScanInfo>
      )}
    </Card>
  )
}
