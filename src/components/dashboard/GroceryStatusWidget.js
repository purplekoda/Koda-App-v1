'use client';

import styled from 'styled-components';
import Link from 'next/link';
import SectionHeader from '@/components/common/SectionHeader';

const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.lg};
`;

const StatsRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Stat = styled.div`
  text-align: center;
`;

const StatNumber = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: 500;
  color: ${({ $color, theme }) => theme.colors[$color] || theme.colors.textPrimary};
`;

const StatLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const SendButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.teal};
  color: white;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 14px;
  font-weight: 500;
  min-height: ${({ theme }) => theme.touchTarget};
  text-decoration: none;
  transition: opacity 0.15s ease;

  &:hover {
    opacity: 0.9;
  }
`;

export default function GroceryStatusWidget({ groceryItems }) {
  const items = groceryItems || [];
  const needCount = items.filter((i) => i.status === 'need').length;
  const lowCount = items.filter((i) => i.status === 'low').length;
  const totalPending = needCount + lowCount;

  return (
    <Card>
      <SectionHeader title="Grocery list" linkText="Full list" linkHref="/grocery" />
      <StatsRow>
        <Stat>
          <StatNumber $color="coral">{needCount}</StatNumber>
          <StatLabel>Need</StatLabel>
        </Stat>
        <Stat>
          <StatNumber $color="amber">{lowCount}</StatNumber>
          <StatLabel>Low</StatLabel>
        </Stat>
        <Stat>
          <StatNumber $color="textPrimary">{totalPending}</StatNumber>
          <StatLabel>Total</StatLabel>
        </Stat>
      </StatsRow>
      <SendButton href="/grocery">Send list</SendButton>
    </Card>
  );
}
