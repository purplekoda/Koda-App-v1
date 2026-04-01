'use client'

import styled from 'styled-components'

const mealColors = {
  breakfast: { bg: 'amberLight', accent: 'amber', text: 'amberDark' },
  lunch: { bg: 'tealLight', accent: 'teal', text: 'tealDark' },
  dinner: { bg: 'purpleLight', accent: 'purple', text: 'purpleDark' },
}

const Panel = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const MealInfo = styled.div``

const MealType = styled.span`
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ $type, theme }) => {
    const c = mealColors[$type] || mealColors.lunch
    return theme.colors[c.text]
  }};
  background: ${({ $type, theme }) => {
    const c = mealColors[$type] || mealColors.lunch
    return theme.colors[c.bg]
  }};
  padding: 4px 10px;
  border-radius: ${({ theme }) => theme.radii.pill};
`

const MealName = styled.h3`
  font-size: 20px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-top: ${({ theme }) => theme.spacing.sm};
`

const DayLabel = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const CloseButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.borderLight};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.border};
  }
`

const IngredientsTitle = styled.h4`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const IngredientsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const IngredientRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} 0;
`

const StatusDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $have, theme }) => $have ? theme.colors.teal : theme.colors.coral};
  flex-shrink: 0;
`

const IngredientName = styled.span`
  flex: 1;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const IngredientStatus = styled.span`
  font-size: 12px;
  color: ${({ $have, theme }) => $have ? theme.colors.teal : theme.colors.coral};
  font-weight: 500;
`

const Summary = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const SummaryChip = styled.span`
  font-size: 12px;
  padding: 4px 12px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ $variant, theme }) => {
    if ($variant === 'have') return theme.colors.tealLight
    if ($variant === 'need') return theme.colors.coralLight
    return theme.colors.grayLight
  }};
  color: ${({ $variant, theme }) => {
    if ($variant === 'have') return theme.colors.tealDark
    if ($variant === 'need') return theme.colors.coral
    return theme.colors.textSecondary
  }};
  font-weight: 500;
`

const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
`

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 14px;
  font-weight: 500;
  min-height: ${({ theme }) => theme.touchTarget};
  cursor: pointer;
  transition: all 0.15s ease;

  background: ${({ $variant, theme }) => {
    if ($variant === 'primary') return theme.colors.teal
    if ($variant === 'danger') return theme.colors.coralLight
    return theme.colors.borderLight
  }};
  color: ${({ $variant, theme }) => {
    if ($variant === 'primary') return '#FFFFFF'
    if ($variant === 'danger') return theme.colors.coral
    return theme.colors.textPrimary
  }};
  border: ${({ $variant, theme }) => {
    if ($variant === 'primary' || $variant === 'danger') return 'none'
    return `0.5px solid ${theme.colors.border}`
  }};

  &:hover {
    opacity: 0.9;
  }
`

export default function MealDetail({ meal, onClose, onSwap, onAddToGrocery, onRemove }) {
  if (!meal) return null

  const ingredients = meal.ingredients || []
  const haveCount = ingredients.filter(i => i.have).length
  const needCount = ingredients.filter(i => !i.have).length

  return (
    <Panel>
      <Header>
        <MealInfo>
          <MealType $type={meal.type}>{meal.type}</MealType>
          <MealName>{meal.name}</MealName>
          <DayLabel>{meal.day} {meal.time && `\u00B7 ${meal.time}`}</DayLabel>
        </MealInfo>
        <CloseButton onClick={onClose}>{'\u2715'}</CloseButton>
      </Header>

      {ingredients.length > 0 && (
        <>
          <Summary>
            <SummaryChip $variant="total">{ingredients.length} ingredients</SummaryChip>
            <SummaryChip $variant="have">{haveCount} have</SummaryChip>
            {needCount > 0 && <SummaryChip $variant="need">{needCount} need</SummaryChip>}
          </Summary>

          <IngredientsTitle>Ingredients</IngredientsTitle>
          <IngredientsList>
            {ingredients.map((ing) => (
              <IngredientRow key={ing.name}>
                <StatusDot $have={ing.have} />
                <IngredientName>{ing.name}</IngredientName>
                <IngredientStatus $have={ing.have}>
                  {ing.have ? 'have' : 'need'}
                </IngredientStatus>
              </IngredientRow>
            ))}
          </IngredientsList>
        </>
      )}

      <Actions>
        <ActionButton $variant="default" onClick={onSwap}>
          {'\u21C4'} Swap meal
        </ActionButton>
        {needCount > 0 && (
          <ActionButton $variant="primary" onClick={onAddToGrocery}>
            {'\u002B'} Add {needCount} to grocery list
          </ActionButton>
        )}
        <ActionButton $variant="danger" onClick={onRemove}>
          {'\u2715'} Remove
        </ActionButton>
      </Actions>
    </Panel>
  )
}
