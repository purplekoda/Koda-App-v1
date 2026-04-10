'use client'

import styled from 'styled-components'

const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const Title = styled.h3`
  font-size: 18px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const Subtitle = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const StoreGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`

const StoreCard = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg};
  border: 2px solid ${({ $selected, $color, theme }) =>
    $selected ? $color : theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  cursor: pointer;
  background: ${({ $selected, $color }) =>
    $selected ? $color + '10' : 'transparent'};
  transition: all 0.15s ease;
  min-height: ${({ theme }) => theme.touchTarget};

  &:hover {
    border-color: ${({ $color }) => $color};
  }
`

const StoreIcon = styled.span`
  font-size: 28px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ $color }) => $color + '15'};
  border-radius: ${({ theme }) => theme.radii.md};
`

const StoreInfo = styled.div`
  flex: 1;
`

const StoreName = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const StoreDesc = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 2px;
`

const RadioDot = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid ${({ $selected, $color, theme }) =>
    $selected ? $color : theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &::after {
    content: '';
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: ${({ $selected, $color }) =>
      $selected ? $color : 'transparent'};
  }
`

const PreferredBadge = styled.span`
  font-size: 10px;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.tealLight};
  color: ${({ theme }) => theme.colors.teal};
  font-weight: 600;
  margin-left: 6px;
`

const AddStoreButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: ${({ theme }) => theme.spacing.lg};
  border: 2px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 14px;
  min-height: ${({ theme }) => theme.touchTarget};

  &:hover {
    border-color: ${({ theme }) => theme.colors.textSecondary};
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`

const storeDescriptions = {
  target: 'Same-day delivery & pickup',
  instacart: 'Delivery from local stores',
  walmart: 'Pickup & delivery',
  kroger: 'Pickup & delivery',
}

export default function StepChooseStore({ stores, needCount, selectedStore, onSelectStore, preferredStore }) {
  return (
    <Card>
      <Title>Where should we send your list?</Title>
      <Subtitle>Your {needCount} item{needCount !== 1 ? 's' : ''} will be added to your cart.</Subtitle>

      <StoreGrid>
        {stores.map((store) => (
          <StoreCard
            key={store.id}
            $selected={selectedStore === store.id}
            $color={store.color}
            onClick={() => onSelectStore(store.id)}
          >
            <StoreIcon $color={store.color}>{store.icon}</StoreIcon>
            <StoreInfo>
              <StoreName>
                {store.name}
                {store.id === preferredStore && <PreferredBadge>Preferred</PreferredBadge>}
              </StoreName>
              <StoreDesc>{storeDescriptions[store.id] || 'Grocery delivery'}</StoreDesc>
            </StoreInfo>
            <RadioDot $selected={selectedStore === store.id} $color={store.color} />
          </StoreCard>
        ))}
        <AddStoreButton>
          + Add another store
        </AddStoreButton>
      </StoreGrid>
    </Card>
  )
}
