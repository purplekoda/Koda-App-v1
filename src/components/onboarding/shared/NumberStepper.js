'use client';

import styled from 'styled-components';

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xl};
  justify-content: center;
`;

const StepperBtn = styled.button`
  width: ${({ theme }) => theme.touchTarget};
  height: ${({ theme }) => theme.touchTarget};
  border-radius: 50%;
  border: 2px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 22px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.teal};
    color: ${({ theme }) => theme.colors.teal};
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;

const Value = styled.span`
  font-size: 48px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textPrimary};
  min-width: 80px;
  text-align: center;
  line-height: 1;
  transition: transform 0.3s ease, color 0.3s ease;
  ${({ $voiceAnimating }) =>
    $voiceAnimating &&
    `
    transform: scale(1.1);
    color: #1D9E75;
  `}
`;

export default function NumberStepper({
  value,
  onChange,
  min = 1,
  max = 10,
  voiceAnimating = false,
}) {
  return (
    <Wrapper>
      <StepperBtn
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Decrease"
      >
        -
      </StepperBtn>
      <Value $voiceAnimating={voiceAnimating}>{value}</Value>
      <StepperBtn
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase"
      >
        +
      </StepperBtn>
    </Wrapper>
  );
}
