'use client';

import styled, { keyframes } from 'styled-components';

const grow = keyframes`
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Bubble = styled.div`
  max-width: 85%;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.tealLight};
  border: 1px solid ${({ theme }) => theme.colors.tealMid};
  font-size: 14px;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.tealDark};
  animation: ${grow} 0.15s ease;
  align-self: flex-end;
  word-wrap: break-word;
  white-space: pre-wrap;
`;

/**
 * Real-time growing transcript bubble shown as the user speaks.
 */
export default function TranscriptBubble({ text }) {
  if (!text) return null;
  return <Bubble>{text}</Bubble>;
}
