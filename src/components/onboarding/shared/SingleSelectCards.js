'use client'

import styled, { keyframes, css } from 'styled-components'

const voicePulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(29,158,117,0.5); }
  70% { box-shadow: 0 0 0 8px rgba(29,158,117,0); }
  100% { box-shadow: 0 0 0 0 rgba(29,158,117,0); }
`

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`

const Card = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.xl};
  border: 1.5px solid ${({ $selected, theme }) => $selected ? theme.colors.teal : theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ $selected, theme }) => $selected ? theme.colors.tealLight + '20' : theme.colors.surface};
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;
  min-height: 64px;
  ${({ $voiceAnimating }) => $voiceAnimating && css`animation: ${voicePulse} 0.6s ease-out;`}

  &:hover {
    border-color: ${({ theme }) => theme.colors.teal};
  }
`

const Radio = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid ${({ $selected, theme }) => $selected ? theme.colors.teal : theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: border-color 0.15s;

  &::after {
    content: '';
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: ${({ $selected, theme }) => $selected ? theme.colors.teal : 'transparent'};
    transition: background 0.15s;
  }
`

const CardBody = styled.div`
  flex: 1;
  min-width: 0;
`

const CardLabel = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: 2px;
`

const CardSubtitle = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.4;
`

export default function SingleSelectCards({ options, selected, onChange, voiceAnimatingValue = null }) {
  return (
    <Stack>
      {options.map(option => (
        <Card
          key={option.value}
          type="button"
          $selected={selected === option.value}
          $voiceAnimating={voiceAnimatingValue === option.value}
          onClick={() => onChange(option.value)}
        >
          <Radio $selected={selected === option.value} />
          <CardBody>
            <CardLabel>{option.label}</CardLabel>
            {option.subtitle && <CardSubtitle>{option.subtitle}</CardSubtitle>}
          </CardBody>
        </Card>
      ))}
    </Stack>
  )
}
