'use client'

import styled from 'styled-components'
import SectionHeader from '@/components/common/SectionHeader'

const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.lg};
`

const ItemRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.sm} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};

  &:last-child {
    border-bottom: none;
  }
`

const ItemName = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const StatusBadge = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 500;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ $status, theme }) =>
    $status === 'expired' ? theme.colors.coralLight : theme.colors.amberLight};
  color: ${({ $status, theme }) =>
    $status === 'expired' ? theme.colors.coral : theme.colors.amber};
`

const EmptyState = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl} 0;
`

export default function PantryAlertsWidget({ pantryItems }) {
  // Items expiring within 3 days or already expired (daysLeft <= 0)
  const alerts = (pantryItems || [])
    .filter(item => {
      if (item.is_depleted) return false
      if (item.expiry_date) {
        const daysLeft = Math.ceil(
          (new Date(item.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)
        )
        return daysLeft <= 3
      }
      // Legacy mock format
      if (item.daysLeft !== undefined && item.daysLeft !== null) {
        return item.daysLeft <= 3
      }
      return false
    })
    .map(item => {
      let daysLeft
      if (item.expiry_date) {
        daysLeft = Math.ceil(
          (new Date(item.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)
        )
      } else {
        daysLeft = item.daysLeft ?? 0
      }
      const name = item.ingredient_name || item.name
      return { id: item.id, name, daysLeft }
    })
    .sort((a, b) => a.daysLeft - b.daysLeft)

  function getStatusLabel(daysLeft) {
    if (daysLeft <= 0) return { label: 'Expired', status: 'expired' }
    if (daysLeft === 1) return { label: '1 day left', status: 'expiring' }
    return { label: `${daysLeft} days left`, status: 'expiring' }
  }

  return (
    <Card>
      <SectionHeader title="Pantry alerts" linkText="View pantry" linkHref="/pantry" />
      {alerts.length === 0 ? (
        <EmptyState>No items expiring soon</EmptyState>
      ) : (
        alerts.map(item => {
          const { label, status } = getStatusLabel(item.daysLeft)
          return (
            <ItemRow key={item.id}>
              <ItemName>{item.name}</ItemName>
              <StatusBadge $status={status}>{label}</StatusBadge>
            </ItemRow>
          )
        })
      )}
    </Card>
  )
}
