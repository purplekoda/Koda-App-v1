'use client';

import styled from 'styled-components';

const Card = styled.div`
  align-self: flex-start;
  max-width: 90%;
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
`;

const ItemName = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: 4px;
`;

const Description = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.4;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const CookTime = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const PantryBadge = styled.span`
  font-size: 11px;
  font-weight: 500;
  padding: 3px 8px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ $match, theme }) => ($match ? theme.colors.tealLight : theme.colors.amberLight)};
  color: ${({ $match, theme }) => ($match ? theme.colors.teal : theme.colors.amber)};
`;

const ButtonRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const ConfirmButton = styled.button`
  flex: 1;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
  border-radius: ${({ theme }) => theme.radii.md};
  border: none;
  cursor: pointer;
  background: ${({ theme }) => theme.colors.teal};
  color: white;

  &:hover:not(:disabled) {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const RejectButton = styled.button`
  flex: 1;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  cursor: pointer;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textSecondary};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.borderLight};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default function SuggestionCard({ card, onConfirm, onReject, disabled }) {
  const { suggestion } = card;
  if (!suggestion) return null;

  const needsCount = suggestion.ingredients_needed?.length || 0;

  return (
    <Card>
      <ItemName>{suggestion.item_name}</ItemName>
      <Description>{suggestion.description}</Description>
      <MetaRow>
        <CookTime>{suggestion.cook_time}</CookTime>
        <PantryBadge $match={suggestion.pantry_match}>
          {suggestion.pantry_match
            ? 'All in pantry'
            : `Needs ${needsCount} item${needsCount !== 1 ? 's' : ''}`}
        </PantryBadge>
      </MetaRow>
      <ButtonRow>
        <ConfirmButton onClick={() => onConfirm(card)} disabled={disabled}>
          Add to meal plan
        </ConfirmButton>
        <RejectButton onClick={() => onReject(card)} disabled={disabled}>
          Suggest something else
        </RejectButton>
      </ButtonRow>
    </Card>
  );
}
