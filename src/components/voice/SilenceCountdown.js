'use client';

import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const Track = styled.div`
  width: 100%;
  max-width: 200px;
  height: 4px;
  border-radius: 2px;
  background: ${({ theme }) => theme.colors.borderLight};
  overflow: hidden;
  animation: ${fadeIn} 0.15s ease;
`;

const Fill = styled.div`
  height: 100%;
  border-radius: 2px;
  background: ${({ theme }) => theme.colors.teal};
  transition: width 60ms linear;
  width: ${({ $progress }) => `${(1 - $progress) * 100}%`};
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
`;

const HintText = styled.span`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.textMuted};
`;

/**
 * Visual 1.5s silence countdown bar.
 * progress: 0 (just started silence) to 1 (silence complete, submitting).
 */
export default function SilenceCountdown({ progress = 0, show = true }) {
  if (!show || progress <= 0) return null;

  return (
    <Wrapper>
      <Track>
        <Fill $progress={progress} />
      </Track>
      <HintText>Submitting when silence ends...</HintText>
    </Wrapper>
  );
}
