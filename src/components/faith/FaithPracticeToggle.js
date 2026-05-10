'use client';

import styled from 'styled-components';

const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.lg} 0;
`;

const ToggleLabel = styled.span`
  font-size: 15px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  flex: 1;
`;

const Switch = styled.button`
  position: relative;
  width: 44px;
  height: 24px;
  border-radius: 12px;
  border: none;
  background: ${({ $on, theme }) => ($on ? theme.colors.teal : theme.colors.borderLight)};
  cursor: pointer;
  transition: background 0.2s ease;
  flex-shrink: 0;

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${({ $on }) => ($on ? '22px' : '2px')};
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    transition: left 0.2s ease;
  }
`;

export default function FaithPracticeToggle({ enabled, onToggle, label }) {
  return (
    <ToggleRow>
      <ToggleLabel>{label}</ToggleLabel>
      <Switch
        type="button"
        $on={enabled}
        onClick={() => onToggle(!enabled)}
        role="switch"
        aria-checked={enabled}
        aria-label={label}
      />
    </ToggleRow>
  );
}
