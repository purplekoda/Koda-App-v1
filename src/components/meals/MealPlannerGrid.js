'use client'

import styled from 'styled-components'
import MealCard from './MealCard'
import MealDetailInline from './MealDetailInline'

const Wrapper = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.spacing.sm};
  }
`

const DayColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    background: ${({ theme }) => theme.colors.surface};
    border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
    border-radius: ${({ theme }) => theme.radii.lg};
    padding: ${({ theme }) => theme.spacing.md};
  }
`

const DayHeader = styled.div`
  font-size: 14px;
  font-weight: ${({ $isToday }) => $isToday ? 600 : 500};
  color: ${({ $isToday, theme }) => $isToday ? theme.colors.teal : theme.colors.textPrimary};
  padding-bottom: ${({ theme }) => theme.spacing.sm};
  display: flex;
  align-items: center;
  gap: 6px;
  border-bottom: 2px solid ${({ $isToday, theme }) =>
    $isToday ? theme.colors.teal : theme.colors.borderLight};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`

const TodayDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.teal};
`

const DayDate = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: 400;
  margin-left: auto;
`

export default function MealPlannerGrid({
  meals,
  selectedMeal,
  onSelectMeal,
  onSwap,
  onAddToGrocery,
  onRemove,
}) {
  function handleCardClick(meal, day) {
    if (
      selectedMeal &&
      selectedMeal.day === day &&
      selectedMeal.type === meal.type
    ) {
      // Clicking the same card again closes the detail
      onSelectMeal(null)
    } else {
      onSelectMeal({ ...meal, day })
    }
  }

  return (
    <Wrapper>
      <Grid>
        {meals.map((day) => (
          <DayColumn key={day.day}>
            <DayHeader $isToday={day.isToday}>
              {day.day}
              {day.isToday && <TodayDot />}
              {day.isToday && <DayDate>Today</DayDate>}
            </DayHeader>
            {day.meals.map((meal) => {
              const isSelected =
                selectedMeal &&
                selectedMeal.day === day.day &&
                selectedMeal.type === meal.type

              return (
                <div key={meal.type}>
                  <MealCard
                    type={meal.type}
                    name={meal.name}
                    isToday={day.isToday}
                    isSelected={isSelected}
                    onClick={() => handleCardClick(meal, day.day)}
                  />
                  {isSelected && (
                    <MealDetailInline
                      meal={selectedMeal}
                      onClose={() => onSelectMeal(null)}
                      onSwap={() => onSwap && onSwap(selectedMeal)}
                      onAddToGrocery={() => onAddToGrocery && onAddToGrocery(selectedMeal)}
                      onRemove={() => onRemove && onRemove(selectedMeal)}
                    />
                  )}
                </div>
              )
            })}
          </DayColumn>
        ))}
      </Grid>
    </Wrapper>
  )
}
