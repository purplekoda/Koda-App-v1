'use client';

import styled, { keyframes } from 'styled-components';

const pulseRing = keyframes`
  0% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.15); opacity: 0.3; }
  100% { transform: scale(1); opacity: 0.6; }
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const MicCircle = styled.div`
  position: relative;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.teal};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
`;

const PulseRing = styled.span`
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  border: 2.5px solid ${({ theme }) => theme.colors.teal};
  animation: ${pulseRing} 1.5s ease-in-out infinite;
  pointer-events: none;
`;

const Label = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.teal};
`;

/**
 * Pulsing green mic ring shown when the continuous mic is listening.
 */
export default function ListeningIndicator({ label = 'Listening', showMic = true }) {
  return (
    <Wrapper>
      {showMic && (
        <MicCircle aria-label="Microphone active">
          {'\uD83C\uDFA4'}
          <PulseRing />
        </MicCircle>
      )}
      {label && <Label>{label}</Label>}
    </Wrapper>
  );
}
