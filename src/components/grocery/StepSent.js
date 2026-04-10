'use client'

import styled, { keyframes } from 'styled-components'

const popIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`

const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.xxxl} ${({ theme }) => theme.spacing.xl};
  text-align: center;
  animation: ${popIn} 0.3s ease-out;
`

const Icon = styled.div`
  font-size: 56px;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const Title = styled.h3`
  font-size: 22px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const Subtitle = styled.p`
  font-size: 15px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
  max-width: 360px;
  margin-left: auto;
  margin-right: auto;
`

const DeepLinkButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: 14px 32px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ $color }) => $color};
  color: white;
  font-size: 16px;
  font-weight: 500;
  text-decoration: none;
  min-height: ${({ theme }) => theme.touchTarget};
  transition: all 0.15s ease;
  margin-bottom: ${({ theme }) => theme.spacing.xl};

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
`

const StoreIcon = styled.span`
  font-size: 20px;
`

const SecondaryActions = styled.div`
  display: flex;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
`

const SecondaryButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.borderLight};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;
  min-height: ${({ theme }) => theme.touchTarget};

  &:hover {
    background: ${({ theme }) => theme.colors.border};
  }
`

const DeepLinkWrapper = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const ItemCount = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.tealLight};
  color: ${({ theme }) => theme.colors.teal};
  font-size: 14px;
  font-weight: 500;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

export default function StepSent({ store, itemCount, onStartOver }) {
  if (!store) return null

  return (
    <Card>
      <Icon>{'\u2705'}</Icon>
      <Title>List sent to {store.name}!</Title>
      <Subtitle>
        Your grocery list has been prepared and is ready to view in your {store.name} cart.
      </Subtitle>

      <ItemCount>
        {'\uD83D\uDED2'} {itemCount} items ready
      </ItemCount>

      <DeepLinkWrapper>
        <DeepLinkButton
          href={store.deepLinkBase}
          target="_blank"
          rel="noopener noreferrer"
          $color={store.color}
        >
          <StoreIcon>{store.icon}</StoreIcon>
          Go to {store.name} cart {'\u2192'}
        </DeepLinkButton>
      </DeepLinkWrapper>

      <SecondaryActions>
        <SecondaryButton onClick={onStartOver}>
          {'\u21BA'} Start over
        </SecondaryButton>
      </SecondaryActions>
    </Card>
  )
}
