'use client'

import styled from 'styled-components'

const freshnessConfig = {
  fresh: { bg: 'freshGreenBg', color: 'freshGreen', label: 'Fresh', icon: '\u2705' },
  expiring: { bg: 'expiringAmberBg', color: 'expiringAmber', label: 'Expiring soon', icon: '\u26A0\uFE0F' },
  low: { bg: 'lowCoralBg', color: 'lowCoral', label: 'Low / empty', icon: '\uD83D\uDFE0' },
}

const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const Title = styled.h3`
  font-size: 18px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const ItemCount = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const SectionLabel = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  font-size: 13px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ $color, theme }) => theme.colors[$color]};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.lg};

  &:first-of-type {
    margin-top: 0;
  }
`

const Badge = styled.span`
  font-size: 11px;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ $bg, theme }) => theme.colors[$bg]};
  color: ${({ $color, theme }) => theme.colors[$color]};
  font-weight: 600;
`

const ItemList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`

const ItemRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radii.md};
  min-height: ${({ theme }) => theme.touchTarget};
  background: ${({ $freshness, theme }) => {
    const config = freshnessConfig[$freshness]
    return config ? theme.colors[config.bg] : 'transparent'
  }};
`

const FreshnessDot = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ $freshness, theme }) => {
    const config = freshnessConfig[$freshness]
    return config ? theme.colors[config.color] : theme.colors.border
  }};
  flex-shrink: 0;
`

const ItemName = styled.span`
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const ItemCategory = styled.span`
  font-size: 11px;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.grayLight};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: 500;
`

const DaysLeft = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: ${({ $freshness, theme }) => {
    const config = freshnessConfig[$freshness]
    return config ? theme.colors[config.color] : theme.colors.textMuted
  }};
  white-space: nowrap;
`

function renderSection(items, freshness) {
  const config = freshnessConfig[freshness]
  const sectionItems = items.filter(i => i.freshness === freshness)
  if (sectionItems.length === 0) return null

  return (
    <>
      <SectionLabel $color={config.color}>
        {config.icon} {config.label}
        <Badge $bg={config.bg} $color={config.color}>{sectionItems.length}</Badge>
      </SectionLabel>
      <ItemList>
        {sectionItems.map(item => (
          <ItemRow key={item.id} $freshness={freshness}>
            <FreshnessDot $freshness={freshness} />
            <ItemName>{item.name}</ItemName>
            <ItemCategory>{item.category}</ItemCategory>
            <DaysLeft $freshness={freshness}>
              {item.daysLeft === null ? 'Low' :
               item.daysLeft === 0 ? 'Empty' :
               item.daysLeft === 1 ? '1 day' :
               `${item.daysLeft} days`}
            </DaysLeft>
          </ItemRow>
        ))}
      </ItemList>
    </>
  )
}

export default function PantryItems({ items }) {
  return (
    <Card>
      <Header>
        <Title>Items detected</Title>
        <ItemCount>{items.length} items</ItemCount>
      </Header>

      {renderSection(items, 'expiring')}
      {renderSection(items, 'low')}
      {renderSection(items, 'fresh')}
    </Card>
  )
}
