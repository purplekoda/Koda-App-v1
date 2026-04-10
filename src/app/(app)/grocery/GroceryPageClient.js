'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import styled from 'styled-components'
import AIBar from '@/components/ai/AIBar'
import GroceryStepBar from '@/components/grocery/GroceryStepBar'
import StepReviewMeals from '@/components/grocery/StepReviewMeals'
import StepPantryCheck from '@/components/grocery/StepPantryCheck'
import StepChooseStore from '@/components/grocery/StepChooseStore'
import StepSent from '@/components/grocery/StepSent'
import { toggleGroceryItem, sendToStore } from './actions'

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

const Toast = styled.div`
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: ${({ theme }) => theme.colors.coral};
  color: white;
  padding: 12px 24px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 14px;
  font-weight: 500;
  z-index: 999;
  box-shadow: ${({ theme }) => theme.shadows.elevated};
`

const stepSubtitles = [
  'Review your meals and see what ingredients you need',
  'Check what you already have at home',
  'Pick your preferred grocery store',
  'Your list is ready!',
]

export default function GroceryPageClient({
  initialGroceryItems,
  stores,
  weekSummary,
  weeklyMeals,
}) {
  const [step, setStep] = useState(0)
  const [selectedStore, setSelectedStore] = useState('target')
  const [groceryItems, setGroceryItems] = useState(initialGroceryItems)
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState(null)
  const toastTimeoutRef = useRef(null)

  useEffect(() => () => clearTimeout(toastTimeoutRef.current), [])

  const selectedStoreObj = stores.find(s => s.id === selectedStore)
  const needCount = groceryItems.filter(i => i.status === 'need').length

  function showToast(message) {
    clearTimeout(toastTimeoutRef.current)
    setToast(message)
    toastTimeoutRef.current = setTimeout(() => setToast(null), 2500)
  }

  function handleNext() {
    if (step === 2) {
      startTransition(async () => {
        const result = await sendToStore(selectedStore)
        if (result.success) {
          setStep(3)
        } else {
          showToast('Failed to send list. Please try again.')
        }
      })
      return
    }
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
        <StepReviewMeals meals={weeklyMeals} summary={weekSummary} />
      )}

      {step === 1 && (
        <StepPantryCheck items={groceryItems} />
      )}

      {step === 2 && (
        <StepChooseStore
          stores={stores}
          needCount={needCount}
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
          <NavButton $variant="primary" onClick={handleNext} disabled={isPending}>
            {isPending ? 'Sending...' : step === 2 ? `Send to ${selectedStoreObj?.name || 'store'}` : 'Continue'} {'\u203A'}
          </NavButton>
        </ButtonRow>
      )}
      {toast && <Toast>{toast}</Toast>}
    </>
  )
}
