'use client'

import { useState } from 'react'
import styled from 'styled-components'
import AIBar from '@/components/ai/AIBar'
import ScanEntry from '@/components/kitchen/ScanEntry'
import ScanUpload from '@/components/kitchen/ScanUpload'
import PantryItems from '@/components/kitchen/PantryItems'
import DinnerIdeas from '@/components/kitchen/DinnerIdeas'
import { mockPantryItems, mockDinnerIdeas, mockLastScan } from '@/data/mock-pantry'

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

export default function KitchenPage() {
  const [screen, setScreen] = useState('entry') // entry, scanning, results
  const [toast, setToast] = useState(null)

  function showToast(message) {
    setToast(message)
    setTimeout(() => setToast(null), 2500)
  }

  function handleStartScan() {
    setScreen('scanning')
  }

  function handleScanComplete() {
    setScreen('results')
  }

  function handleAddToMealPlan(idea) {
    showToast(`Added "${idea.name}" to tonight\u2019s dinner`)
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
        <ScanEntry lastScan={mockLastScan} onStartScan={handleStartScan} />
      )}

      {screen === 'scanning' && (
        <ScanUpload onScanComplete={handleScanComplete} />
      )}

      {screen === 'results' && (
        <>
          <PantryItems items={mockPantryItems} />

          <RescanRow>
            <RescanButton onClick={handleRescan}>
              {'\uD83D\uDCF7'} Scan again
            </RescanButton>
          </RescanRow>

          <DinnerIdeas ideas={mockDinnerIdeas} onAddToMealPlan={handleAddToMealPlan} />
        </>
      )}

      {toast && <Toast>{toast}</Toast>}
    </>
  )
}
