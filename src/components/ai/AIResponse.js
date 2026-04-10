'use client'

import styled, { keyframes } from 'styled-components'

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`

const Wrapper = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.purpleLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  animation: ${fadeIn} 0.3s ease-out;
`

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const PurpleDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.purple};
`

const Label = styled.span`
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.purple};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`

const CloseButton = styled.button`
  margin-left: auto;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.borderLight};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.border};
  }
`

const Text = styled.p`
  font-size: 14px;
  color: ${({ $error, theme }) => $error ? theme.colors.coral : theme.colors.textPrimary};
  line-height: 1.5;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const ChipRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
`

const Chip = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.purpleLight};
  border: none;
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.purple};
  cursor: pointer;
  min-height: 36px;
  transition: all 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.purpleMid};
  }
`

export default function AIResponse({ response, onClose, onChipClick }) {
  if (!response) return null

  return (
    <Wrapper>
      <Header>
        <PurpleDot />
        <Label>Koda</Label>
        <CloseButton onClick={onClose}>{'\u2715'}</CloseButton>
      </Header>
      <Text $error={response.isError}>{response.text}</Text>
      {response.chips && response.chips.length > 0 && (
        <ChipRow>
          {response.chips.map((chip) => (
            <Chip key={chip} onClick={() => onChipClick && onChipClick(chip)}>
              {chip}
            </Chip>
          ))}
        </ChipRow>
      )}
    </Wrapper>
  )
}
