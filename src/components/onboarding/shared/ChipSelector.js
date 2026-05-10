'use client';

import { useState } from 'react';
import styled, { keyframes, css } from 'styled-components';

const voiceSelectAnim = keyframes`
  0% { transform: scale(1); }
  40% { transform: scale(1.15); }
  100% { transform: scale(1); }
`;

const voiceAmberPulse = keyframes`
  0%, 100% { border-color: #BA7517; }
  50% { border-color: transparent; }
`;

const Grid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Chip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1.5px solid ${({ $selected, $ambiguous, theme }) =>
    $ambiguous ? theme.colors.amber : $selected ? theme.colors.teal : theme.colors.border};
  background: ${({ $selected, theme }) => ($selected ? theme.colors.tealLight + '30' : theme.colors.surface)};
  color: ${({ $selected, theme }) => ($selected ? theme.colors.teal : theme.colors.textPrimary)};
  font-size: 14px;
  font-weight: ${({ $selected }) => ($selected ? 600 : 400)};
  cursor: pointer;
  transition: all 0.15s ease;
  min-height: 36px;
  ${({ $voiceAnimating }) => $voiceAnimating && css`animation: ${voiceSelectAnim} 0.4s ease-out;`}
  ${({ $ambiguous }) => $ambiguous && css`animation: ${voiceAmberPulse} 0.8s ease-in-out 3;`}

  &:hover {
    border-color: ${({ theme }) => theme.colors.teal};
  }
`;

const CustomRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const CustomInput = styled.input`
  flex: 1;
  height: 36px;
  padding: 0 ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 14px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};
  outline: none;

  &:focus {
    border-color: ${({ theme }) => theme.colors.teal};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.tealLight}40;
  }
`;

const AddBtn = styled.button`
  height: 36px;
  padding: 0 ${({ theme }) => theme.spacing.lg};
  border: 1px solid ${({ theme }) => theme.colors.teal};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.teal};
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;

  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const CountText = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textTertiary};
`;

const SelectAllLink = styled.button`
  background: none;
  border: none;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.teal};
  cursor: pointer;
  font-weight: 500;
`;

export default function ChipSelector({
  options,
  selected = [],
  onChange,
  allowCustom = false,
  showCount = false,
  showSelectAll = false,
  renderLabel,
  voiceAnimatingItems = [],
  ambiguousItems = [],
}) {
  const [customValue, setCustomValue] = useState('');

  const toggle = (value) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const addCustom = () => {
    const trimmed = customValue.trim();
    if (trimmed && !selected.includes(trimmed)) {
      onChange([...selected, trimmed]);
      setCustomValue('');
    }
  };

  const allValues = options.map((o) => (typeof o === 'string' ? o : o.value));
  const allSelected = allValues.length > 0 && allValues.every((v) => selected.includes(v));

  const toggleSelectAll = () => {
    if (allSelected) {
      onChange(selected.filter((v) => !allValues.includes(v)));
    } else {
      onChange([...new Set([...selected, ...allValues])]);
    }
  };

  return (
    <div>
      {(showCount || showSelectAll) && (
        <HeaderRow>
          {showCount && <CountText>{selected.length} selected</CountText>}
          {showSelectAll && (
            <SelectAllLink type="button" onClick={toggleSelectAll}>
              {allSelected ? 'Deselect all' : 'Select all'}
            </SelectAllLink>
          )}
        </HeaderRow>
      )}
      <Grid>
        {options.map((option) => {
          const value = typeof option === 'string' ? option : option.value;
          const label = typeof option === 'string' ? option : option.label;
          return (
            <Chip
              key={value}
              type="button"
              $selected={selected.includes(value)}
              $voiceAnimating={voiceAnimatingItems.includes(value)}
              $ambiguous={ambiguousItems.includes(value)}
              onClick={() => toggle(value)}
            >
              {renderLabel ? renderLabel(option, selected.includes(value)) : label}
            </Chip>
          );
        })}
      </Grid>
      {allowCustom && (
        <CustomRow>
          <CustomInput
            type="text"
            placeholder="Add custom..."
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustom()}
            maxLength={100}
          />
          <AddBtn type="button" onClick={addCustom} disabled={!customValue.trim()}>
            Add
          </AddBtn>
        </CustomRow>
      )}
    </div>
  );
}
