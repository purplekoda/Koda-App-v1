'use client';

import styled from 'styled-components';

const Track = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: ${({ theme }) => theme.spacing.lg} 0;
`;

const Dot = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  transition: background 0.2s ease, transform 0.2s ease;
  background: ${({ $state, theme }) =>
    $state === 'completed'
      ? theme.colors.teal
      : $state === 'current'
        ? theme.colors.tealLight
        : theme.colors.borderLight};
  ${({ $state, theme }) =>
    $state === 'current' &&
    `
    border: 2px solid ${theme.colors.teal};
    transform: scale(1.2);
  `}
`;

// Bar variant for voice split-screen mode
const BarTrack = styled.div`
  width: 100%;
  height: 4px;
  background: ${({ theme }) => theme.colors.borderLight};
  border-radius: 2px;
  overflow: hidden;
`;

const BarFill = styled.div`
  height: 100%;
  background: ${({ theme }) => theme.colors.teal};
  border-radius: 2px;
  transition: width 0.4s ease;
`;

export default function ProgressBar({ currentStep, totalSteps = 10, variant = 'dots' }) {
  if (variant === 'bar') {
    const pct = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;
    return (
      <BarTrack>
        <BarFill style={{ width: `${pct}%` }} />
      </BarTrack>
    );
  }

  return (
    <Track>
      {Array.from({ length: totalSteps }, (_, i) => {
        const stepNum = i + 1;
        const state =
          stepNum < currentStep ? 'completed' : stepNum === currentStep ? 'current' : 'future';
        return <Dot key={i} $state={state} />;
      })}
    </Track>
  );
}
