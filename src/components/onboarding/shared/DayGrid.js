'use client';

import styled, { keyframes, css } from 'styled-components';
import { DAY_OPTIONS, DAY_PRESETS } from '@/data/onboarding-options';

const voiceSelectAnim = keyframes`
  0% { transform: scale(1); }
  40% { transform: scale(1.15); }
  100% { transform: scale(1); }
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const Grid = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  justify-content: center;
`;

const DayBtn = styled.button`
  width: 44px;
  height: 44px;
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 1.5px solid ${({ $selected, theme }) => ($selected ? theme.colors.teal : theme.colors.border)};
  background: ${({ $selected, theme }) => ($selected ? theme.colors.teal : theme.colors.surface)};
  color: ${({ $selected, theme }) => ($selected ? 'white' : theme.colors.textPrimary)};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  ${({ $voiceAnimating }) => $voiceAnimating && css`animation: ${voiceSelectAnim} 0.4s ease-out;`}

  &:hover {
    border-color: ${({ theme }) => theme.colors.teal};
  }
`;

const DayEmoji = styled.span`
  font-size: 10px;
  line-height: 1;
`;

const Presets = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
  justify-content: center;
`;

const PresetBtn = styled.button`
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.teal};
    color: ${({ theme }) => theme.colors.teal};
  }
`;

export default function DayGrid({ selected = [], onChange, voiceAnimatingDays = [] }) {
  const toggle = (day) => {
    if (selected.includes(day)) {
      onChange(selected.filter((d) => d !== day));
    } else {
      onChange([...selected, day].sort((a, b) => a - b));
    }
  };

  return (
    <Wrapper>
      <Grid>
        {DAY_OPTIONS.map((day) => (
          <DayBtn
            key={day.value}
            type="button"
            $selected={selected.includes(day.value)}
            $voiceAnimating={voiceAnimatingDays.includes(day.value)}
            onClick={() => toggle(day.value)}
          >
            <DayEmoji>{day.value <= 5 ? '\u{1F319}' : '\u{2600}\u{FE0F}'}</DayEmoji>
            {day.label}
          </DayBtn>
        ))}
      </Grid>
      <Presets>
        {DAY_PRESETS.map((preset) => (
          <PresetBtn key={preset.label} type="button" onClick={() => onChange([...preset.days])}>
            {preset.label}
          </PresetBtn>
        ))}
      </Presets>
    </Wrapper>
  );
}
