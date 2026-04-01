'use client'

import styled from 'styled-components'

const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const Title = styled.h3`
  font-size: 18px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.xl};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`

const StatCard = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ $bg, theme }) => theme.colors[$bg] || theme.colors.grayLight};
  border-radius: ${({ theme }) => theme.radii.md};
`

const StatNumber = styled.div`
  font-size: 28px;
  font-weight: 600;
  color: ${({ $color, theme }) => theme.colors[$color] || theme.colors.textPrimary};
`

const StatLabel = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 4px;
`

const MealList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`

const DayRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.sm} 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};

  &:last-child {
    border-bottom: none;
  }
`

const DayName = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${({ $isToday, theme }) => $isToday ? theme.colors.teal : theme.colors.textPrimary};
  min-width: 40px;
`

const MealChips = styled.div`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  flex: 1;
`

const mealChipColors = {
  breakfast: { bg: 'amberLight', text: 'amberDark' },
  lunch: { bg: 'tealLight', text: 'tealDark' },
  dinner: { bg: 'purpleLight', text: 'purpleDark' },
}

const MealChip = styled.span`
  font-size: 12px;
  padding: 3px 10px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ $type, theme }) => {
    const c = mealChipColors[$type] || mealChipColors.lunch
    return theme.colors[c.bg]
  }};
  color: ${({ $type, theme }) => {
    const c = mealChipColors[$type] || mealChipColors.lunch
    return theme.colors[c.text]
  }};
  font-weight: 500;
`

const NeedCount = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.coral};
  font-weight: 500;
  white-space: nowrap;
`

export default function StepReviewMeals({ meals, summary }) {
  return (
    <>
      <Card>
        <Title>Week at a glance</Title>
        <StatsGrid>
          <StatCard $bg="grayLight">
            <StatNumber $color="textPrimary">{summary.totalIngredients}</StatNumber>
            <StatLabel>Total ingredients</StatLabel>
          </StatCard>
          <StatCard $bg="tealLight">
            <StatNumber $color="teal">{summary.haveCount}</StatNumber>
            <StatLabel>Already have</StatLabel>
          </StatCard>
          <StatCard $bg="coralLight">
            <StatNumber $color="coral">{summary.needCount}</StatNumber>
            <StatLabel>Need to buy</StatLabel>
          </StatCard>
        </StatsGrid>

        <Title>Meals this week</Title>
        <MealList>
          {meals.map((day) => {
            const needItems = day.meals.reduce((sum, m) =>
              sum + (m.ingredients ? m.ingredients.filter(i => !i.have).length : 0), 0)
            return (
              <DayRow key={day.day}>
                <DayName $isToday={day.isToday}>{day.day}</DayName>
                <MealChips>
                  {day.meals.map((m) => (
                    <MealChip key={m.type} $type={m.type}>{m.name}</MealChip>
                  ))}
                </MealChips>
                {needItems > 0 && <NeedCount>{needItems} need</NeedCount>}
              </DayRow>
            )
          })}
        </MealList>
      </Card>
    </>
  )
}
