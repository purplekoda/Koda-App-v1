'use client'

import styled from 'styled-components'

const mealColors = {
  breakfast: { bg: 'amberLight', bgToday: 'amberMid', text: 'amberDark' },
  lunch: { bg: 'tealLight', bgToday: 'tealMid', text: 'tealDark' },
  dinner: { bg: 'purpleLight', bgToday: 'purpleMid', text: 'purpleDark' },
}

const Card = styled.div`
  background: ${({ $type, $isToday, theme }) => {
    const colors = mealColors[$type] || mealColors.lunch
    return theme.colors[$isToday ? colors.bgToday : colors.bg]
  }};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 10px 12px;
  min-height: 56px;
  cursor: pointer;
  transition: transform 0.1s ease;

  &:hover {
    transform: scale(1.02);
  }
`

const MealType = styled.span`
  display: block;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 500;
  color: ${({ $type, theme }) => {
    const colors = mealColors[$type] || mealColors.lunch
    return theme.colors[colors.text]
  }};
  margin-bottom: 2px;
  opacity: 0.8;
`

const MealName = styled.span`
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const EmptySlot = styled.div`
  background: ${({ theme }) => theme.colors.borderLight};
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 10px 12px;
  min-height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 20px;

  &:hover {
    background: ${({ theme }) => theme.colors.border};
  }
`

export default function MealCard({ type, name, isToday, onClick }) {
  if (!name) {
    return <EmptySlot onClick={onClick}>+</EmptySlot>
  }

  return (
    <Card $type={type} $isToday={isToday} onClick={onClick}>
      <MealType $type={type}>{type}</MealType>
      <MealName>{name}</MealName>
    </Card>
  )
}
