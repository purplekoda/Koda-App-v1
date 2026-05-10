'use client';

import { useState } from 'react';
import styled from 'styled-components';
import StepShell from '../shared/StepShell';

const CardsRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.lg};
  width: 100%;
  margin-bottom: ${({ theme }) => theme.spacing.md};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
  }
`;

const ModeCard = styled.button`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.xl};
  border: 2px solid ${({ $selected, theme }) =>
    $selected ? theme.colors.teal : theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.xl};
  background: ${({ $selected, theme }) =>
    $selected ? theme.colors.tealLight : theme.colors.surface};
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;

  &:hover {
    border-color: ${({ theme }) => theme.colors.teal};
    box-shadow: ${({ theme }) => theme.shadows.card};
  }
`;

const ModeIcon = styled.span`
  font-size: 36px;
  line-height: 1;
`;

const ModeLabel = styled.span`
  font-size: 17px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const ModeDesc = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.4;
`;

const TimeEstimate = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: 500;
`;

const DisabledCard = styled(ModeCard)`
  opacity: 0.5;
  pointer-events: none;
  cursor: not-allowed;
  position: relative;

  &:hover {
    border-color: ${({ theme }) => theme.colors.border};
    box-shadow: none;
  }
`;

const ComingSoonBadge = styled.span`
  display: inline-block;
  padding: 2px 10px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.warningBg || '#FEF3C7'};
  color: ${({ theme }) => theme.colors.warningText || '#92400E'};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
`;

const DisabledTooltip = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-style: italic;
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

const DisabledCardWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export default function ModeSelectionStep({ onSelectMode, onSkip }) {
  const [selected, setSelected] = useState(null);

  return (
    <StepShell
      title="How would you like to set up Koda?"
      subtitle="Choose how you'd like to tell us about your household."
      onNext={selected ? () => onSelectMode(selected) : undefined}
      nextDisabled={!selected}
      showBack={false}
      showSkip
      onSkip={onSkip}
      skipLabel="Skip &mdash; I'll set this up later"
    >
      <CardsRow>
        <ModeCard
          type="button"
          $selected={selected === 'manual'}
          onClick={() => setSelected('manual')}
        >
          <ModeIcon>&#9997;&#65039;</ModeIcon>
          <ModeLabel>Do it myself</ModeLabel>
          <ModeDesc>Fill in your preferences at your own pace</ModeDesc>
          <TimeEstimate>About 3 minutes</TimeEstimate>
        </ModeCard>

        <DisabledCardWrapper>
          <DisabledCard as="div" aria-disabled="true" tabIndex={-1}>
            <ModeIcon>&#127908;</ModeIcon>
            <ModeLabel>Let Koda ask me</ModeLabel>
            <ModeDesc>Koda will guide you through setup with voice</ModeDesc>
            <ComingSoonBadge>Coming Soon</ComingSoonBadge>
          </DisabledCard>
          <DisabledTooltip>
            Voice setup is coming soon &mdash; check back for an update!
          </DisabledTooltip>
        </DisabledCardWrapper>
      </CardsRow>
    </StepShell>
  );
}
