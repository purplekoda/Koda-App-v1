'use client'

import { useState, useTransition } from 'react'
import styled from 'styled-components'
import AIBar from '@/components/ai/AIBar'
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
  scanning: 'Koda is analyzing your photo...',
  results: 'Here\u2019s what Koda found in your fridge',
}

export default function KitchenPageClient({
  initialPantryItems,
  initialDinnerIdeas,
  initialLastScan,
}) {
  const [screen, setScreen] = useState('entry')
  const [toast, setToast] = useState(null)
  const [pantryItems, setPantryItems] = useState(initialPantryItems)
  const [dinnerIdeas, setDinnerIdeas] = useState(initialDinnerIdeas)
  const [lastScan, setLastScan] = useState(initialLastScan)
  const [isPending, startTransition] = useTransition()

  function showToast(message) {
    setToast(message)
    setTimeout(() => setToast(null), 2500)
  }

  function handleStartScan() {
    setScreen('scanning')
  }

  function handleScanComplete() {
    // Fetch results from server
    startTransition(async () => {
      const result = await startScan()
      if (result.success && result.data) {
        setPantryItems(result.data.pantryItems)
        setDinnerIdeas(result.data.dinnerIdeas)
        if (result.data.lastScan) setLastScan(result.data.lastScan)
      }
      setScreen('results')
    })
  }

  function handleAddToMealPlan(idea) {
    startTransition(async () => {
      const result = await addToMealPlan(idea.id)
      if (result.success) {
        showToast(`Added "${result.data?.addedMeal || idea.name}" to tonight\u2019s dinner`)
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

      <AIBar placeholder={'What can I make with what\u2019s in my fridge?'} context="kitchen" />

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
              {'\uD83D\uDCF7'} Scan again
            </RescanButton>
          </RescanRow>

          <DinnerIdeas ideas={dinnerIdeas} onAddToMealPlan={handleAddToMealPlan} />
        </>
      )}

      {toast && <Toast>{toast}</Toast>}
    </>
  )
}
