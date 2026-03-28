'use client'

import styled from 'styled-components'
import MealCard from './MealCard'
import SectionHeader from '@/components/common/SectionHeader'

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xl};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: repeat(3, 1fr);
  }
`

const DayColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`

const DayHeader = styled.div`
  font-size: 14px;
  font-weight: ${({ $isToday }) => $isToday ? 500 : 400};
  color: ${({ $isToday, theme }) => $isToday ? theme.colors.textPrimary : theme.colors.textSecondary};
  padding-bottom: ${({ theme }) => theme.spacing.sm};
  display: flex;
  align-items: center;
  gap: 4px;
`

const TodayDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.teal};
`

const Section = styled.section`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

export default function WeeklyGrid({ meals }) {
  return (
    <Section>
      <SectionHeader title="This week's meals" linkText="Full planner" linkHref="/meals" />
      <Grid>
        {meals.map((day) => (
          <DayColumn key={day.day}>
            <DayHeader $isToday={day.isToday}>
              {day.day} {day.isToday && <TodayDot />}
            </DayHeader>
            {day.meals.map((meal) => (
              <MealCard
                key={meal.type}
                type={meal.type}
                name={meal.name}
                isToday={day.isToday}
              />
            ))}
          </DayColumn>
        ))}
      </Grid>
    </Section>
  )
}
