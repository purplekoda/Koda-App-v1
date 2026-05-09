'use client'

import styled from 'styled-components'

const mealColors = {
  breakfast: { bg: 'amberLight', bgToday: 'amberMid', text: 'amberDark' },
  lunch: { bg: 'tealLight', bgToday: 'tealMid', text: 'tealDark' },
  dinner: { bg: 'purpleLight', bgToday: 'purpleMid', text: 'purpleDark' },
  sides: { bg: 'coralLight', bgToday: 'coralMid', text: 'coral' },
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
  transition: all 0.15s ease;
  border: 2px solid ${({ $isSelected, $type, theme }) => {
    if (!$isSelected) return 'transparent'
    const colors = mealColors[$type] || mealColors.lunch
    return theme.colors[colors.text]
  }};

  &:hover {
    transform: scale(1.02);
  }
`

const CardInner = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
`

const CardText = styled.div`
  flex: 1;
  min-width: 0;
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const RecipeBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.tealDark};
  background: ${({ theme }) => theme.colors.tealMid};
  padding: 2px 6px;
  border-radius: ${({ theme }) => theme.radii.pill};
  margin-top: 4px;
  line-height: 1;
  white-space: nowrap;
`

const Thumbnail = styled.div`
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radii.sm};
  overflow: hidden;
  flex-shrink: 0;
  align-self: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`

const EmptySlot = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 10px 12px;
  min-height: 56px;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.borderLight};
  }
`

const EmptyMealType = styled.span`
  display: block;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 2px;
  opacity: 0.6;
`

const EmptyLabel = styled.span`
  display: block;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
  opacity: 0.4;
`

export default function MealCard({
  type,
  name,
  isToday,
  isSelected,
  onClick,
  // new props
  recipeId,
  slotId,
  imageUrl,
  onSlotClick,
  day,
}) {
  function handleClick() {
    if (onSlotClick) {
      onSlotClick(day, type, recipeId ?? null)
    } else if (onClick) {
      onClick()
    }
  }

  if (!name) {
    return (
      <EmptySlot onClick={handleClick}>
        <EmptyMealType>{type}</EmptyMealType>
        <EmptyLabel>—</EmptyLabel>
      </EmptySlot>
    )
  }

  return (
    <Card $type={type} $isToday={isToday} $isSelected={isSelected} onClick={handleClick}>
      <CardInner>
        <CardText>
          <MealType $type={type}>{type}</MealType>
          <MealName>{name}</MealName>
          {recipeId && (
            <RecipeBadge>recipe linked</RecipeBadge>
          )}
        </CardText>
        {recipeId && imageUrl && (
          <Thumbnail>
            <img src={imageUrl} alt={name} />
          </Thumbnail>
        )}
      </CardInner>
    </Card>
  )
}
