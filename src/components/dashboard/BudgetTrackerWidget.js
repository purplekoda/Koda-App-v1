'use client';

import styled from 'styled-components';
import SectionHeader from '@/components/common/SectionHeader';

const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.lg};
`;

const AmountRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const Spent = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: 500;
  color: ${({ $overBudget, theme }) =>
    $overBudget ? theme.colors.coral : theme.colors.textPrimary};
`;

const Budget = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const BarTrack = styled.div`
  height: 8px;
  background: ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.pill};
  overflow: hidden;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const BarFill = styled.div`
  height: 100%;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ $pct, theme }) => {
    if ($pct > 100) return theme.colors.coral;
    if ($pct > 80) return theme.colors.amber;
    return theme.colors.teal;
  }};
  width: ${({ $pct }) => Math.min($pct, 100)}%;
  transition: width 0.3s ease;
`;

const SubLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const EmptyState = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl} 0;
`;

export default function BudgetTrackerWidget({ cookingPreferences }) {
  const budget = cookingPreferences?.weekly_budget;
  if (!budget || budget <= 0) {
    return (
      <Card>
        <SectionHeader title="Budget tracker" />
        <EmptyState>Set a weekly budget in Settings to track spending</EmptyState>
      </Card>
    );
  }

  // Mock projected spend based on grocery needs
  const projected = Math.round(budget * 0.72);
  const pct = Math.round((projected / budget) * 100);

  return (
    <Card>
      <SectionHeader title="Budget tracker" linkText="Settings" linkHref="/settings" />
      <AmountRow>
        <Spent $overBudget={pct > 100}>${projected}</Spent>
        <Budget>of ${budget}/week</Budget>
      </AmountRow>
      <BarTrack>
        <BarFill $pct={pct} />
      </BarTrack>
      <SubLabel>{pct}% of weekly budget &middot; projected from meal plan</SubLabel>
    </Card>
  );
}
