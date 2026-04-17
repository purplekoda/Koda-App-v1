'use client'

import { useState, useTransition } from 'react'
import styled from 'styled-components'
import MobileTopBar from '@/components/dashboard/MobileTopBar'
import DashboardGreeting from '@/components/dashboard/DashboardGreeting'
import DailyWeeklyToggle from '@/components/dashboard/DailyWeeklyToggle'
import WeeklyGrid from '@/components/meals/WeeklyGrid'
import DailyMealsCard from '@/components/dashboard/DailyMealsCard'
import TodayScheduleWidget from '@/components/dashboard/TodayScheduleWidget'
import TodoListWidget from '@/components/dashboard/TodoListWidget'
import { toggleTodo } from './actions'

const TwoColumn = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.xl};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.spacing.md};
  }
`

const TwoColumnCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.lg};
`

/* Desktop-only: toggle + greeting row */
const DesktopToggle = styled.div`
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    display: none;
  }
`

function getDayName() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' })
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
}) {
  const [view, setView] = useState('daily')
  const [todos, setTodos] = useState(initialTodos)
  const [isPending, startTransition] = useTransition()

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
      />

      {/* Desktop only: toggle below greeting */}
      <DesktopToggle>
        <DailyWeeklyToggle view={view} onToggle={setView} />
      </DesktopToggle>

      {/* Meal section */}
      {view === 'weekly' ? (
        <WeeklyGrid meals={weeklyMeals} />
      ) : (
        <DailyMealsCard meals={todayMeals} />
      )}

      {/* Bottom section: schedule + to-do */}
      <TwoColumn>
        <TwoColumnCard>
          <TodayScheduleWidget schedule={todaySchedule} />
        </TwoColumnCard>
        <TwoColumnCard>
          <TodoListWidget todos={todos} onToggleTodo={handleToggleTodo} />
        </TwoColumnCard>
      </TwoColumn>
    </>
  )
}
