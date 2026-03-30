'use client'

import { useState } from 'react'
import styled from 'styled-components'
import AIBar from '@/components/ai/AIBar'
import GroceryStepBar from '@/components/grocery/GroceryStepBar'
import StepReviewMeals from '@/components/grocery/StepReviewMeals'
import StepPantryCheck from '@/components/grocery/StepPantryCheck'
import StepChooseStore from '@/components/grocery/StepChooseStore'
import StepSent from '@/components/grocery/StepSent'
import { mockWeeklyMeals } from '@/data/mock-meals'
import { mockGroceryItems, mockStores, mockWeekSummary } from '@/data/mock-grocery'

const PageHeader = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Subtitle = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 4px;
`

const ButtonRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.xl};
`

const NavButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 24px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 15px;
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

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const stepSubtitles = [
  'Review your meals and see what ingredients you need',
  'Check what you already have at home',
  'Pick your preferred grocery store',
  'Your list is ready!',
]

export default function GroceryPage() {
  const [step, setStep] = useState(0)
  const [selectedStore, setSelectedStore] = useState('target')

  const selectedStoreObj = mockStores.find(s => s.id === selectedStore)
  const needCount = mockGroceryItems.filter(i => i.status === 'need').length

  function handleNext() {
    if (step < 3) setStep(step + 1)
  }

  function handleBack() {
    if (step > 0) setStep(step - 1)
  }

  function handleStartOver() {
    setStep(0)
    setSelectedStore('target')
  }

  return (
    <>
      <PageHeader>
        <Title>Grocery list</Title>
        <Subtitle>{stepSubtitles[step]}</Subtitle>
      </PageHeader>

      <AIBar placeholder={'Add items or ask about substitutions\u2026'} context="grocery" />

      <GroceryStepBar currentStep={step} />

      {step === 0 && (
        <StepReviewMeals meals={mockWeeklyMeals} summary={mockWeekSummary} />
      )}

      {step === 1 && (
        <StepPantryCheck items={mockGroceryItems} />
      )}

      {step === 2 && (
        <StepChooseStore
          stores={mockStores}
          selectedStore={selectedStore}
          onSelectStore={setSelectedStore}
          preferredStore="target"
        />
      )}

      {step === 3 && (
        <StepSent
          store={selectedStoreObj}
          itemCount={needCount}
          onStartOver={handleStartOver}
        />
      )}

      {step < 3 && (
        <ButtonRow>
          {step > 0 ? (
            <NavButton onClick={handleBack}>
              {'\u2039'} Back
            </NavButton>
          ) : (
            <div />
          )}
          <NavButton $variant="primary" onClick={handleNext}>
            {step === 2 ? `Send to ${selectedStoreObj?.name || 'store'}` : 'Continue'} {'\u203A'}
          </NavButton>
        </ButtonRow>
      )}
    </>
  )
}
