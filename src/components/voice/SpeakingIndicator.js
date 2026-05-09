'use client'

import styled, { keyframes } from 'styled-components'

const waveAnimation = keyframes`
  0%, 100% { transform: scaleY(0.3); }
  50% { transform: scaleY(1); }
`

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`

const WaveContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  height: 20px;
`

const Bar = styled.span`
  width: 3px;
  height: 18px;
  border-radius: 2px;
  background: ${({ $color, theme }) => $color || theme.colors.blue};
  animation: ${waveAnimation} 0.7s ease-in-out infinite;
  animation-delay: ${({ $delay }) => $delay || '0s'};
  transform-origin: center;
`

const Label = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: ${({ $color, theme }) => $color || theme.colors.blue};
`

const DELAYS = ['0s', '0.1s', '0.2s', '0.3s', '0.15s']

/**
 * Animated sound wave shown when Koda is speaking.
 */
export default function SpeakingIndicator({ label = 'Speaking', color }) {
  return (
    <Wrapper>
      <WaveContainer aria-label="Koda is speaking">
        {DELAYS.map((delay, i) => (
          <Bar key={i} $delay={delay} $color={color} />
        ))}
      </WaveContainer>
      {label && <Label $color={color}>{label}</Label>}
    </Wrapper>
  )
}
