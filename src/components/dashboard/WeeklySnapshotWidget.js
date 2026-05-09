'use client'

import styled from 'styled-components'
import SectionHeader from '@/components/common/SectionHeader'

const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.lg};
`

const DaysRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: ${({ theme }) => theme.spacing.xs};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    gap: 2px;
  }
`

const DayCol = styled.div`
  text-align: center;
`

const DayLabel = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 500;
  color: ${({ $isToday, theme }) => $isToday ? theme.colors.teal : theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  text-transform: uppercase;
`

const MealDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $filled, $color, theme }) =>
    $filled ? (theme.colors[$color] || theme.colors.teal) : theme.colors.borderLight};
  margin: 2px auto;
`

const MealCount = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: ${({ theme }) => theme.spacing.xs};
`

const dotColors = { breakfast: 'amber', lunch: 'teal', dinner: 'purple' }
const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function WeeklySnapshotWidget({ weeklyMeals }) {
  const todayIndex = (new Date().getDay() + 6) % 7 // Mon=0

  return (
    <Card>
      <SectionHeader title="Weekly snapshot" linkText="Full planner" linkHref="/meals" />
      <DaysRow>
        {dayLabels.map((label, i) => {
          const dayData = weeklyMeals[i]
          const meals = dayData?.meals || []
          const filledCount = meals.filter(m => m.name).length

          return (
            <DayCol key={label}>
              <DayLabel $isToday={i === todayIndex}>{label}</DayLabel>
              {['breakfast', 'lunch', 'dinner'].map(type => {
                const meal = meals.find(m => m.type === type)
                return (
                  <MealDot
                    key={type}
                    $filled={!!meal?.name}
                    $color={dotColors[type]}
                  />
                )
              })}
              <MealCount>{filledCount}/3</MealCount>
            </DayCol>
          )
        })}
      </DaysRow>
    </Card>
  )
}
