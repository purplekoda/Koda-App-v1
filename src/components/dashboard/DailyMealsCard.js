'use client'

import styled from 'styled-components'
import SectionHeader from '@/components/common/SectionHeader'

const mealColors = {
  breakfast: 'amberLight',
  lunch: 'tealLight',
  dinner: 'purpleLight',
}

const mealTextColors = {
  breakfast: 'amberDark',
  lunch: 'tealDark',
  dinner: 'purpleDark',
}

const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const MealRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  background: ${({ $type, theme }) => theme.colors[mealColors[$type]] || theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.md};
  min-height: ${({ theme }) => theme.touchTarget};
  cursor: pointer;

  & + & {
    margin-top: ${({ theme }) => theme.spacing.sm};
  }
`

const MealType = styled.span`
  font-size: 14px;
  font-weight: 400;
  color: ${({ $type, theme }) => theme.colors[mealTextColors[$type]] || theme.colors.textSecondary};
  min-width: 70px;
`

const MealName = styled.span`
  flex: 1;
  font-size: 15px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const MealTime = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

export default function DailyMealsCard({ meals }) {
  return (
    <Card>
      <SectionHeader title="Today's meals" linkText="Full planner" linkHref="/meals" />
      {meals.map((meal) => (
        <MealRow key={meal.type} $type={meal.type}>
          <MealType $type={meal.type}>
            {meal.type.charAt(0).toUpperCase() + meal.type.slice(1)}
          </MealType>
          <MealName>{meal.name}</MealName>
          <MealTime>{meal.time}</MealTime>
        </MealRow>
      ))}
    </Card>
  )
}
