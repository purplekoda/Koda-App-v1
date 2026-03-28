'use client'

import { useState } from 'react'
import styled from 'styled-components'
import MobileTopBar from '@/components/dashboard/MobileTopBar'
import DashboardGreeting from '@/components/dashboard/DashboardGreeting'
import DailyWeeklyToggle from '@/components/dashboard/DailyWeeklyToggle'
import AIBar from '@/components/ai/AIBar'
import WeeklyGrid from '@/components/meals/WeeklyGrid'
import DailyMealsCard from '@/components/dashboard/DailyMealsCard'
import TodayScheduleWidget from '@/components/dashboard/TodayScheduleWidget'
import UpcomingEventsWidget from '@/components/dashboard/UpcomingEventsWidget'
import TodoListWidget from '@/components/dashboard/TodoListWidget'
import { mockWeeklyMeals, mockTodayMeals } from '@/data/mock-meals'
import { mockUpcomingEvents, mockTodaySchedule, mockTodos } from '@/data/mock-events'

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

function getDesktopSubtitle() {
  const day = getDayName()
  return `${day} \u00B7 3 meals planned today \u00B7 Emma\u2019s birthday in 12 days`
}

export default function DashboardPage() {
  const [view, setView] = useState('daily')

  return (
    <>
      {/* Mobile: top bar with logo + toggle + avatar */}
      <MobileTopBar view={view} onToggle={setView} initials="JM" />

      {/* Greeting */}
      <DashboardGreeting
        displayName="Jessica"
        initials="JM"
        subtitle={getMobileSubtitle()}
        desktopSubtitle={getDesktopSubtitle()}
      />

      {/* Desktop only: toggle below greeting */}
      <DesktopToggle>
        <DailyWeeklyToggle view={view} onToggle={setView} />
      </DesktopToggle>

      {/* AI bar */}
      <AIBar placeholder={'Ask Koda anything\u2026'} />

      {/* Meal section */}
      {view === 'weekly' ? (
        <WeeklyGrid meals={mockWeeklyMeals} />
      ) : (
        <DailyMealsCard meals={mockTodayMeals} />
      )}

      {/* Bottom section: schedule + to-do (daily) or events + to-do (weekly) */}
      <TwoColumn>
        <TwoColumnCard>
          {view === 'daily' ? (
            <TodayScheduleWidget schedule={mockTodaySchedule} />
          ) : (
            <UpcomingEventsWidget events={mockUpcomingEvents} />
          )}
        </TwoColumnCard>
        <TwoColumnCard>
          <TodoListWidget todos={mockTodos} />
        </TwoColumnCard>
      </TwoColumn>
    </>
  )
}
