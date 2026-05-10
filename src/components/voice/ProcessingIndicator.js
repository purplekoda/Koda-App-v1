'use client';

import styled, { keyframes } from 'styled-components';

const bounce = keyframes`
  0%, 80%, 100% { transform: scale(0.4); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
`;

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const DotsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const Dot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.amber};
  animation: ${bounce} 1.2s ease-in-out infinite;
  animation-delay: ${({ $delay }) => $delay};
`;

const Label = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.amber};
`;

/**
 * Thinking dots animation shown while processing the user's speech.
 */
export default function ProcessingIndicator({ label = 'Processing' }) {
  return (
    <Wrapper>
      <DotsContainer aria-label="Processing">
        <Dot $delay="0s" />
        <Dot $delay="0.15s" />
        <Dot $delay="0.3s" />
      </DotsContainer>
      {label && <Label>{label}</Label>}
    </Wrapper>
  );
}
