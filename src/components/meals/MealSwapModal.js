'use client'

import { useState } from 'react'
import styled from 'styled-components'

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: ${({ theme }) => theme.spacing.lg};
`

const Modal = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: ${({ theme }) => theme.spacing.xl};
  max-width: 480px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
`

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const ModalTitle = styled.h3`
  font-size: 20px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const CloseButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.borderLight};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.border};
  }
`

const StepIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const StepDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $active, $done, theme }) =>
    $active || $done ? theme.colors.teal : theme.colors.border};
  transition: all 0.2s ease;
`

const StepLabel = styled.span`
  font-size: 12px;
  color: ${({ $active, theme }) => $active ? theme.colors.teal : theme.colors.textMuted};
  font-weight: ${({ $active }) => $active ? 500 : 400};
`

const StepLine = styled.div`
  flex: 1;
  height: 1px;
  background: ${({ $done, theme }) => $done ? theme.colors.teal : theme.colors.border};
`

const CurrentMeal = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.lg};

  strong {
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

const SuggestionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const SuggestionCard = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border: 1.5px solid ${({ $selected, theme }) =>
    $selected ? theme.colors.teal : theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.md};
  cursor: pointer;
  background: ${({ $selected, theme }) =>
    $selected ? theme.colors.tealLight : theme.colors.surface};
  transition: all 0.15s ease;
  min-height: ${({ theme }) => theme.touchTarget};

  &:hover {
    border-color: ${({ theme }) => theme.colors.teal};
  }
`

const RadioDot = styled.div`
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid ${({ $selected, theme }) =>
    $selected ? theme.colors.teal : theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &::after {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${({ $selected, theme }) =>
      $selected ? theme.colors.teal : 'transparent'};
  }
`

const SuggestionInfo = styled.div`
  flex: 1;
`

const SuggestionName = styled.div`
  font-size: 15px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const SuggestionReason = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 2px;
`

const TagRow = styled.div`
  display: flex;
  gap: 4px;
  margin-top: 4px;
`

const Tag = styled.span`
  font-size: 11px;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.grayLight};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: 500;
`

const CookTime = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
  white-space: nowrap;
`

/* Step 2: Review */
const ReviewSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const ReviewLabel = styled.div`
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const ReviewCard = styled.div`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ $variant, theme }) =>
    $variant === 'old' ? theme.colors.coralLight : theme.colors.tealLight};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const ReviewMealName = styled.div`
  font-size: 15px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const ReviewNote = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.grayLight};
  border-radius: ${({ theme }) => theme.radii.md};
`

/* Step 3: Confirm */
const ConfirmMessage = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl} 0;
`

const ConfirmIcon = styled.div`
  font-size: 48px;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const ConfirmText = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const ConfirmSubtext = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const ButtonRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  justify-content: flex-end;
`

const Button = styled.button`
  padding: 10px 20px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 14px;
  font-weight: 500;
  min-height: ${({ theme }) => theme.touchTarget};
  cursor: pointer;
  transition: all 0.15s ease;

  background: ${({ $variant, theme }) =>
    $variant === 'primary' ? theme.colors.teal : theme.colors.borderLight};
  color: ${({ $variant, theme }) =>
    $variant === 'primary' ? '#FFFFFF' : theme.colors.textPrimary};
  border: ${({ $variant, theme }) =>
    $variant === 'primary' ? 'none' : `0.5px solid ${theme.colors.border}`};

  &:hover {
    opacity: 0.9;
  }
`

const steps = ['Choose', 'Review', 'Done']

export default function MealSwapModal({ meal, suggestions, onClose, onConfirm }) {
  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState(null)

  function handleNext() {
    if (step === 0 && selected !== null) {
      setStep(1)
    } else if (step === 1) {
      setStep(2)
      if (onConfirm && selected !== null) {
        onConfirm(suggestions[selected])
      }
    } else if (step === 2) {
      onClose()
    }
  }

  const selectedMeal = selected !== null ? suggestions[selected] : null

  return (
    <Overlay onClick={(e) => e.target === e.currentTarget && onClose()}>
      <Modal>
        <ModalHeader>
          <ModalTitle>Swap meal</ModalTitle>
          <CloseButton onClick={onClose}>{'\u2715'}</CloseButton>
        </ModalHeader>

        <StepIndicator>
          {steps.map((s, i) => (
            <span key={s} style={{ display: 'contents' }}>
              <StepDot $active={step === i} $done={step > i} />
              <StepLabel $active={step === i}>{s}</StepLabel>
              {i < steps.length - 1 && <StepLine $done={step > i} />}
            </span>
          ))}
        </StepIndicator>

        {step === 0 && (
          <>
            <CurrentMeal>
              Replacing <strong>{meal.name}</strong> on {meal.day}
            </CurrentMeal>
            <SuggestionList>
              {suggestions.map((s, i) => (
                <SuggestionCard
                  key={s.name}
                  $selected={selected === i}
                  onClick={() => setSelected(i)}
                >
                  <RadioDot $selected={selected === i} />
                  <SuggestionInfo>
                    <SuggestionName>{s.name}</SuggestionName>
                    <SuggestionReason>{s.reason}</SuggestionReason>
                    <TagRow>
                      {s.tags.map(t => <Tag key={t}>{t}</Tag>)}
                    </TagRow>
                  </SuggestionInfo>
                  <CookTime>{s.cookTime}</CookTime>
                </SuggestionCard>
              ))}
            </SuggestionList>
          </>
        )}

        {step === 1 && selectedMeal && (
          <>
            <ReviewSection>
              <ReviewLabel>Removing</ReviewLabel>
              <ReviewCard $variant="old">
                <ReviewMealName>{meal.name}</ReviewMealName>
              </ReviewCard>
            </ReviewSection>
            <ReviewSection>
              <ReviewLabel>Adding</ReviewLabel>
              <ReviewCard $variant="new">
                <ReviewMealName>{selectedMeal.name}</ReviewMealName>
              </ReviewCard>
            </ReviewSection>
            <ReviewNote>
              {'\u2139\uFE0F'} Your grocery list will be updated automatically with new ingredients.
            </ReviewNote>
          </>
        )}

        {step === 2 && selectedMeal && (
          <ConfirmMessage>
            <ConfirmIcon>{'\u2705'}</ConfirmIcon>
            <ConfirmText>Meal swapped!</ConfirmText>
            <ConfirmSubtext>
              {selectedMeal.name} is now on {meal.day}
            </ConfirmSubtext>
          </ConfirmMessage>
        )}

        <ButtonRow>
          {step < 2 && (
            <Button onClick={onClose}>Cancel</Button>
          )}
          <Button
            $variant="primary"
            onClick={handleNext}
            disabled={step === 0 && selected === null}
          >
            {step === 0 ? 'Next' : step === 1 ? 'Confirm swap' : 'Done'}
          </Button>
        </ButtonRow>
      </Modal>
    </Overlay>
  )
}
