'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import styled from 'styled-components'
import ScanEntry from '@/components/kitchen/ScanEntry'
import ScanUpload from '@/components/kitchen/ScanUpload'
import PantryItems from '@/components/kitchen/PantryItems'
import DinnerIdeas from '@/components/kitchen/DinnerIdeas'
import { startScan, addToMealPlan } from './actions'

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

const Toast = styled.div`
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: ${({ theme }) => theme.colors.textPrimary};
  color: white;
  padding: 12px 24px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 14px;
  font-weight: 500;
  z-index: 999;
  box-shadow: ${({ theme }) => theme.shadows.elevated};
`

const RescanRow = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const RescanButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.borderLight};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;
  min-height: ${({ theme }) => theme.touchTarget};

  &:hover {
    background: ${({ theme }) => theme.colors.border};
  }
`

const screenSubtitles = {
  entry: 'Scan your fridge to see what you have',
  scanning: 'Koda is analyzing your photos...',
  results: 'Here\u2019s what Koda found in your fridge',
}

function initialScreen(pantryItems, lastScan) {
  // If we have saved pantry items, show results directly
  if (pantryItems?.length > 0 && lastScan) return 'results'
  return 'entry'
}

export default function KitchenPageClient({
  initialPantryItems,
  initialDinnerIdeas,
  initialLastScan,
}) {
  const [screen, setScreen] = useState(() =>
    initialScreen(initialPantryItems, initialLastScan)
  )
  const [toast, setToast] = useState(null)
  const [pantryItems, setPantryItems] = useState(initialPantryItems)
  const [dinnerIdeas, setDinnerIdeas] = useState(initialDinnerIdeas)
  const [lastScan, setLastScan] = useState(initialLastScan)
  const [isPending, startTransition] = useTransition()
  const toastTimeoutRef = useRef(null)

  useEffect(() => () => clearTimeout(toastTimeoutRef.current), [])

  function showToast(message) {
    clearTimeout(toastTimeoutRef.current)
    setToast(message)
    toastTimeoutRef.current = setTimeout(() => setToast(null), 2500)
  }

  function handleStartScan() {
    setScreen('scanning')
  }

  function handleScanComplete(imageData) {
    startTransition(async () => {
      const result = await startScan(imageData)
      if (result.success && result.data) {
        setPantryItems(result.data.pantryItems)
        setDinnerIdeas(result.data.dinnerIdeas)
        if (result.data.lastScan) setLastScan(result.data.lastScan)
        setScreen('results')
      } else {
        showToast(result?.error || 'Scan failed. Please try again.')
        setScreen('entry')
      }
    })
  }

  function handleAddToMealPlan(idea) {
    startTransition(async () => {
      const result = await addToMealPlan(idea.id)
      if (result.success) {
        showToast(`Added "${result.data?.addedMeal || idea.name}" to tonight\u2019s dinner`)
      } else {
        showToast('Failed to add to meal plan. Please try again.')
      }
    })
  }

  function handleRescan() {
    setScreen('scanning')
  }

  return (
    <>
      <PageHeader>
        <Title>Pantry scan</Title>
        <Subtitle>{screenSubtitles[screen]}</Subtitle>
      </PageHeader>

      {screen === 'entry' && (
        <ScanEntry lastScan={lastScan} onStartScan={handleStartScan} />
      )}

      {screen === 'scanning' && (
        <ScanUpload onScanComplete={handleScanComplete} />
      )}

      {screen === 'results' && (
        <>
          <PantryItems items={pantryItems} />

          <RescanRow>
            <RescanButton onClick={handleRescan}>
              Scan again
            </RescanButton>
          </RescanRow>

          {dinnerIdeas.length > 0 && (
            <DinnerIdeas ideas={dinnerIdeas} onAddToMealPlan={handleAddToMealPlan} />
          )}

          <ScanEntry lastScan={lastScan} onStartScan={handleStartScan} />
        </>
      )}

      {toast && <Toast>{toast}</Toast>}
    </>
  )
}
