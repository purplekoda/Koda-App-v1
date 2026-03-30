'use client'

import { useState } from 'react'
import styled from 'styled-components'
import AIBar from '@/components/ai/AIBar'
import MealPlannerGrid from '@/components/meals/MealPlannerGrid'
import MealSwapModal from '@/components/meals/MealSwapModal'
import FillWeekButton from '@/components/meals/FillWeekButton'
import { mockWeeklyMeals, mockSwapSuggestions } from '@/data/mock-meals'

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
  background: ${({ theme }) => theme.colors.textPrimary};
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

export default function MealsPage() {
  const [meals, setMeals] = useState(mockWeeklyMeals)
  const [selectedMeal, setSelectedMeal] = useState(null)
  const [swapMeal, setSwapMeal] = useState(null)
  const [toast, setToast] = useState(null)

  const stats = countStats(meals)

  function showToast(message) {
    setToast(message)
    setTimeout(() => setToast(null), 2500)
  }

  function handleSwapConfirm(newMeal) {
    if (!swapMeal) return
    setMeals(prev => prev.map(day => {
      if (day.day !== swapMeal.day) return day
      return {
        ...day,
        meals: day.meals.map(m =>
          m.type === swapMeal.type
            ? { ...m, name: newMeal.name, ingredients: [] }
            : m
        ),
      }
    }))
    setSelectedMeal(null)
    showToast(`Swapped to ${newMeal.name}`)
  }

  function handleRemove(meal) {
    const target = meal || selectedMeal
    if (!target) return
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
  }

  function handleAddToGrocery(meal) {
    const target = meal || selectedMeal
    if (!target || !target.ingredients) return
    const needCount = target.ingredients.filter(i => !i.have).length
    showToast(`Added ${needCount} items to grocery list`)
  }

  function handleFillWeek() {
    const fillerMeals = {
      breakfast: ['French toast', 'Egg muffins', 'Banana bread', 'Cereal', 'Bagel & cream cheese'],
      lunch: ['Caesar salad', 'BLT sandwich', 'Quinoa bowl', 'Veggie wrap', 'Ramen'],
      dinner: ['Lasagna', 'Grilled chicken', 'Fish tacos', 'Beef stew', 'Pad thai'],
    }
    setMeals(prev => prev.map(day => ({
      ...day,
      meals: day.meals.map(m => {
        if (m.name) return m
        const options = fillerMeals[m.type] || fillerMeals.dinner
        const randomName = options[Math.floor(Math.random() * options.length)]
        return { ...m, name: randomName, ingredients: [] }
      }),
    })))
    showToast('Koda filled your week!')
  }

  return (
    <>
      <PageHeader>
        <div>
          <Title>Meal planner</Title>
          <Subtitle>{stats.filled} of {stats.total} meals planned this week</Subtitle>
        </div>
        <FillWeekButton onFill={handleFillWeek} />
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
        onSwap={(meal) => setSwapMeal(meal)}
        onAddToGrocery={handleAddToGrocery}
        onRemove={handleRemove}
      />

      {swapMeal && (
        <MealSwapModal
          meal={swapMeal}
          suggestions={mockSwapSuggestions}
          onClose={() => setSwapMeal(null)}
          onConfirm={handleSwapConfirm}
        />
      )}

      {toast && <Toast>{toast}</Toast>}
    </>
  )
}
