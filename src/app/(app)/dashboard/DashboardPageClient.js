'use client'

import { useState, useTransition, useCallback, useRef } from 'react'
import styled from 'styled-components'
import MobileTopBar from '@/components/dashboard/MobileTopBar'
import DashboardGreeting from '@/components/dashboard/DashboardGreeting'
import DailyWeeklyToggle from '@/components/dashboard/DailyWeeklyToggle'
import WeeklyGrid from '@/components/meals/WeeklyGrid'
import DailyMealsCard from '@/components/dashboard/DailyMealsCard'
import TodayScheduleWidget from '@/components/dashboard/TodayScheduleWidget'
import TodoListWidget from '@/components/dashboard/TodoListWidget'
import WeeklySnapshotWidget from '@/components/dashboard/WeeklySnapshotWidget'
import PantryAlertsWidget from '@/components/dashboard/PantryAlertsWidget'
import GroceryStatusWidget from '@/components/dashboard/GroceryStatusWidget'
import RecipeSuggestionsWidget from '@/components/dashboard/RecipeSuggestionsWidget'
import BudgetTrackerWidget from '@/components/dashboard/BudgetTrackerWidget'
import MacroSummaryWidget from '@/components/dashboard/MacroSummaryWidget'
import CustomizeDashboardSheet from '@/components/dashboard/CustomizeDashboardSheet'
import MealRatingCards from '@/components/dashboard/MealRatingCards'
import { HIDDEN_SECTION_IDS } from '@/data/dashboard-sections'
import { toggleTodo, updateDashboardSections } from './actions'

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
  z-index: 1100;
  box-shadow: ${({ theme }) => theme.shadows.elevated};
  white-space: nowrap;
`

const SectionWrapper = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

/* Desktop-only: toggle + greeting row */
const DesktopToggle = styled.div`
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: none;
  }
`

function getDayName() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

function getMobileSubtitle() {
  const day = getDayName()
  return `${day} \u00B7 today\u2019s meals & schedule`
}

function getDesktopSubtitle(todayMeals) {
  const day = getDayName()
  const mealCount = todayMeals.filter(m => m.name).length
  const mealLabel = `${mealCount} meal${mealCount !== 1 ? 's' : ''} planned today`
  return `${day} \u00B7 ${mealLabel}`
}

export default function DashboardPageClient({
  weeklyMeals,
  todayMeals,
  todaySchedule,
  todos: initialTodos,
  user,
  dashboardSections: initialSections,
  pantryItems,
  groceryItems,
  macroMembers,
  dinnerIdeas,
  cookingPreferences,
  yesterdayKodaMeals = [],
}) {
  const [view, setView] = useState('daily')
  const [todos, setTodos] = useState(initialTodos)
  const [isPending, startTransition] = useTransition()
  const [sections, setSections] = useState(initialSections)
  const [showCustomize, setShowCustomize] = useState(false)
  const [toast, setToast] = useState(null)
  const toastRef = useRef(null)
  const prevSectionsRef = useRef(null)

  function showToast(msg) {
    if (toastRef.current) clearTimeout(toastRef.current)
    setToast(msg)
    toastRef.current = setTimeout(() => setToast(null), 3000)
  }

  function handleToggleTodo(todoId) {
    // Optimistic update
    setTodos(prev =>
      prev.map(t => t.id === todoId ? { ...t, done: !t.done } : t)
    )

    startTransition(async () => {
      const result = await toggleTodo(todoId)
      if (!result.success) {
        // Revert on failure
        setTodos(prev =>
          prev.map(t => t.id === todoId ? { ...t, done: !t.done } : t)
        )
      } else if (result.data?.todos) {
        setTodos(result.data.todos)
      }
    })
  }

  const handleSectionsUpdate = useCallback((newSections) => {
    setSections(prev => {
      prevSectionsRef.current = prev
      return newSections
    })
    startTransition(async () => {
      const result = await updateDashboardSections(newSections)
      if (!result.success) {
        setSections(prevSectionsRef.current)
        showToast(result.error || 'Could not save layout. Try again.')
      }
    })
  }, [startTransition])

  // Sort visible sections by sort_order
  const visibleSections = [...sections]
    .sort((a, b) => a.sort_order - b.sort_order)
    .filter(s => s.is_visible && !HIDDEN_SECTION_IDS.has(s.section_id))

  function renderSection(sectionId) {
    switch (sectionId) {
      case 'todays_meals':
        return (
          <>
            <DesktopToggle>
              <DailyWeeklyToggle view={view} onToggle={setView} />
            </DesktopToggle>
            {view === 'weekly' ? (
              <WeeklyGrid meals={weeklyMeals} />
            ) : (
              <DailyMealsCard meals={todayMeals} />
            )}
          </>
        )
      case 'weekly_snapshot':
        return <WeeklySnapshotWidget weeklyMeals={weeklyMeals} />
      case 'pantry_alerts':
        return <PantryAlertsWidget pantryItems={pantryItems} />
      case 'grocery_status':
        return <GroceryStatusWidget groceryItems={groceryItems} />
      case 'recipe_suggestions':
        return <RecipeSuggestionsWidget dinnerIdeas={dinnerIdeas} />
      case 'budget_tracker':
        return <BudgetTrackerWidget cookingPreferences={cookingPreferences} />
      case 'macro_summary':
        return <MacroSummaryWidget macroMembers={macroMembers} />
      case 'todo':
        return <TodoListWidget todos={todos} onToggleTodo={handleToggleTodo} />
      case 'today_schedule':
        return <TodayScheduleWidget schedule={todaySchedule} />
      default:
        return null
    }
  }

  return (
    <>
      {/* Mobile: top bar with logo + toggle + avatar */}
      <MobileTopBar view={view} onToggle={setView} initials={user.initials} />

      {/* Greeting */}
      <DashboardGreeting
        displayName={user.displayName}
        initials={user.initials}
        subtitle={getMobileSubtitle()}
        desktopSubtitle={getDesktopSubtitle(todayMeals)}
        onCustomize={() => setShowCustomize(true)}
      />

      {/* Meal rating cards for yesterday's Koda-suggested meals */}
      {yesterdayKodaMeals && yesterdayKodaMeals.length > 0 && (
        <SectionWrapper>
          <MealRatingCards
            meals={yesterdayKodaMeals}
            onRated={(mealName, rating) => {
              if (rating === 'thumbs_down') {
                showToast('Thanks — Koda will remember that!')
              }
            }}
          />
        </SectionWrapper>
      )}

      {/* Dynamic sections */}
      {visibleSections.map(section => (
        <SectionWrapper key={section.section_id}>
          {renderSection(section.section_id)}
        </SectionWrapper>
      ))}

      {/* Customization bottom sheet */}
      {showCustomize && (
        <CustomizeDashboardSheet
          sections={sections}
          onClose={() => setShowCustomize(false)}
          onUpdate={handleSectionsUpdate}
        />
      )}

      {toast && <Toast>{toast}</Toast>}
    </>
  )
}
