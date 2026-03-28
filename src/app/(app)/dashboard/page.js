'use client'

import { useState } from 'react'
import styled from 'styled-components'
import DashboardGreeting from '@/components/dashboard/DashboardGreeting'
import DailyWeeklyToggle from '@/components/dashboard/DailyWeeklyToggle'
import AIBar from '@/components/ai/AIBar'
import WeeklyGrid from '@/components/meals/WeeklyGrid'
import UpcomingEventsWidget from '@/components/dashboard/UpcomingEventsWidget'
import TodoListWidget from '@/components/dashboard/TodoListWidget'
import MealCard from '@/components/meals/MealCard'
import SectionHeader from '@/components/common/SectionHeader'
import { mockWeeklyMeals, mockTodayMeals } from '@/data/mock-meals'
import { mockUpcomingEvents, mockTodos } from '@/data/mock-events'

const TwoColumn = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.xl};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`

const DailyMeals = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const DailyGrid = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
  }
`

const DailyCard = styled.div`
  flex: 1;
`

function getDayName() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' })
}

function getSubtitle() {
  const day = getDayName()
  return `${day} \u00B7 3 meals planned today \u00B7 Emma's birthday in 12 days`
}

export default function DashboardPage() {
  const [view, setView] = useState('daily')

  return (
    <>
      <DashboardGreeting
        displayName="Jessica"
        initials="JM"
        subtitle={getSubtitle()}
      />
      <DailyWeeklyToggle view={view} onToggle={setView} />
      <AIBar placeholder={'Ask Koda anything \u2014 "what can I make tonight?" or "plan Emma\'s party"'} />

      {view === 'weekly' ? (
        <WeeklyGrid meals={mockWeeklyMeals} />
      ) : (
        <DailyMeals>
          <SectionHeader title="Today's meals" linkText="Full planner" linkHref="/meals" />
          <DailyGrid>
            {mockTodayMeals.map((meal) => (
              <DailyCard key={meal.type}>
                <MealCard type={meal.type} name={meal.name} isToday />
              </DailyCard>
            ))}
          </DailyGrid>
        </DailyMeals>
      )}

      <TwoColumn>
        <UpcomingEventsWidget events={mockUpcomingEvents} />
        <TodoListWidget todos={mockTodos} />
      </TwoColumn>
    </>
  )
}
