'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import styled from 'styled-components'
import AIBar from '@/components/ai/AIBar'
import MealPlannerGrid from '@/components/meals/MealPlannerGrid'
import MealSwapModal from '@/components/meals/MealSwapModal'
import FillWeekButton from '@/components/meals/FillWeekButton'
import { swapMeal, removeMeal, fillWeek, addToGrocery } from './actions'

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};
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

const WeekNav = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const WeekLabel = styled.span`
  font-size: 15px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  min-width: 160px;
  text-align: center;
`

const NavButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.borderLight};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
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

const StatsRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  flex-wrap: wrap;
`

const StatChip = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const StatDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
`

const Toast = styled.div`
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: ${({ $error, theme }) => $error ? theme.colors.coral : theme.colors.textPrimary};
  color: white;
  padding: 12px 24px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 14px;
  font-weight: 500;
  z-index: 999;
  box-shadow: ${({ theme }) => theme.shadows.elevated};
`

function getWeekLabel() {
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - now.getDay() + 1)
  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 4)
  const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(monday)} \u2013 ${fmt(friday)}`
}

function countStats(meals) {
  let total = 0
  let filled = 0
  let needItems = 0
  meals.forEach(day => {
    day.meals.forEach(meal => {
      total++
      if (meal.name) filled++
      if (meal.ingredients) {
        needItems += meal.ingredients.filter(i => !i.have).length
      }
    })
  })
  return { total, filled, empty: total - filled, needItems }
}

export default function MealsPageClient({ initialMeals, swapSuggestions }) {
  const [meals, setMeals] = useState(initialMeals)
  const [selectedMeal, setSelectedMeal] = useState(null)
  const [swapMealTarget, setSwapMealTarget] = useState(null)
  const [toast, setToast] = useState(null)
  const [isPending, startTransition] = useTransition()
  const toastTimeoutRef = useRef(null)

  useEffect(() => () => clearTimeout(toastTimeoutRef.current), [])

  const stats = countStats(meals)

  function showToast(message, isError = false) {
    clearTimeout(toastTimeoutRef.current)
    setToast({ message, isError })
    toastTimeoutRef.current = setTimeout(() => setToast(null), 2500)
  }

  function handleSwapConfirm(newMeal) {
    if (!swapMealTarget) return

    // Optimistic update
    setMeals(prev => prev.map(day => {
      if (day.day !== swapMealTarget.day) return day
      return {
        ...day,
        meals: day.meals.map(m =>
          m.type === swapMealTarget.type
            ? { ...m, name: newMeal.name, ingredients: [] }
            : m
        ),
      }
    }))
    setSelectedMeal(null)
    setSwapMealTarget(null)
    showToast(`Swapped to ${newMeal.name}`)

    const snapshot = meals
    startTransition(async () => {
      const result = await swapMeal(swapMealTarget.day, swapMealTarget.type, newMeal.name)
      if (result.success && result.data?.meals) {
        setMeals(result.data.meals)
      } else if (!result.success) {
        setMeals(snapshot)
        showToast('Failed to swap meal. Please try again.', true)
      }
    })
  }

  function handleRemove(meal) {
    const target = meal || selectedMeal
    if (!target) return

    // Optimistic update
    setMeals(prev => prev.map(day => {
      if (day.day !== target.day) return day
      return {
        ...day,
        meals: day.meals.map(m =>
          m.type === target.type
            ? { ...m, name: null, ingredients: [] }
            : m
        ),
      }
    }))
    showToast(`Removed ${target.name}`)
    setSelectedMeal(null)

    const snapshot = meals
    startTransition(async () => {
      const result = await removeMeal(target.day, target.type)
      if (result.success && result.data?.meals) {
        setMeals(result.data.meals)
      } else if (!result.success) {
        setMeals(snapshot)
        showToast('Failed to remove meal. Please try again.', true)
      }
    })
  }

  function handleAddToGrocery(meal) {
    const target = meal || selectedMeal
    if (!target || !target.ingredients) return

    startTransition(async () => {
      const result = await addToGrocery(target.day, target.type)
      if (result.success) {
        showToast(`Added ${result.data.addedCount} items to grocery list`)
      } else {
        showToast('Failed to add to grocery list. Please try again.', true)
      }
    })
  }

  function handleFillWeek() {
    startTransition(async () => {
      const result = await fillWeek()
      if (result.success) {
        if (result.data?.meals) setMeals(result.data.meals)
        showToast('Koda filled your week!')
      } else {
        showToast('Failed to fill week. Please try again.', true)
      }
    })
  }

  return (
    <>
      <PageHeader>
        <div>
          <Title>Meal planner</Title>
          <Subtitle>{stats.filled} of {stats.total} meals planned this week</Subtitle>
        </div>
        <FillWeekButton onFill={handleFillWeek} isPending={isPending} />
      </PageHeader>

      <AIBar placeholder={'What should we have for dinner tonight?'} context="meals" />

      <WeekNav>
        <NavButton>{'\u2039'}</NavButton>
        <WeekLabel>{getWeekLabel()}</WeekLabel>
        <NavButton>{'\u203A'}</NavButton>
      </WeekNav>

      <StatsRow>
        <StatChip>
          <StatDot $color="#1D9E75" />
          {stats.filled} planned
        </StatChip>
        {stats.empty > 0 && (
          <StatChip>
            <StatDot $color="#9CA3AF" />
            {stats.empty} empty
          </StatChip>
        )}
        {stats.needItems > 0 && (
          <StatChip>
            <StatDot $color="#D85A30" />
            {stats.needItems} items to buy
          </StatChip>
        )}
      </StatsRow>

      <MealPlannerGrid
        meals={meals}
        selectedMeal={selectedMeal}
        onSelectMeal={setSelectedMeal}
        onSwap={(meal) => setSwapMealTarget(meal)}
        onAddToGrocery={handleAddToGrocery}
        onRemove={handleRemove}
      />

      {swapMealTarget && (
        <MealSwapModal
          meal={swapMealTarget}
          suggestions={swapSuggestions}
          onClose={() => setSwapMealTarget(null)}
          onConfirm={handleSwapConfirm}
        />
      )}

      {toast && <Toast $error={toast.isError}>{toast.message}</Toast>}
    </>
  )
}
