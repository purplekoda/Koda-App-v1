'use client'

import styled, { keyframes } from 'styled-components'

const mealColors = {
  breakfast: { bg: 'amberLight', accent: 'amber', text: 'amberDark' },
  lunch: { bg: 'tealLight', accent: 'teal', text: 'tealDark' },
  dinner: { bg: 'purpleLight', accent: 'purple', text: 'purpleDark' },
}

const slideDown = keyframes`
  from {
    opacity: 0;
    max-height: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    max-height: 600px;
    transform: translateY(0);
  }
`

const Panel = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1.5px solid ${({ $type, theme }) => {
    const c = mealColors[$type] || mealColors.lunch
    return theme.colors[c.accent]
  }};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.xs};
  animation: ${slideDown} 0.2s ease-out;
  overflow: hidden;
`

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const MealName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const DayLabel = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 2px;
`

const CloseButton = styled.button`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.borderLight};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  flex-shrink: 0;

  &:hover {
    background: ${({ theme }) => theme.colors.border};
  }
`

const ChipRow = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
`

const Chip = styled.span`
  font-size: 10px;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-weight: 500;
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
`

const Divider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.borderLight};
  margin: ${({ theme }) => theme.spacing.sm} 0;
`

const IngredientsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  max-height: 160px;
  overflow-y: auto;
`

const IngredientRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 0;
`

const StatusDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ $have, theme }) => $have ? theme.colors.teal : theme.colors.coral};
  flex-shrink: 0;
`

const IngredientName = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textPrimary};
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 10px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 12px;
  font-weight: 500;
  min-height: 36px;
  cursor: pointer;
  transition: all 0.15s ease;
  width: 100%;

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

export default function MealDetailInline({ meal, onClose, onSwap, onAddToGrocery, onRemove }) {
  if (!meal) return null

  const ingredients = meal.ingredients || []
  const haveCount = ingredients.filter(i => i.have).length
  const needCount = ingredients.filter(i => !i.have).length

  return (
    <Panel $type={meal.type}>
      <Header>
        <div>
          <MealName>{meal.name}</MealName>
          <DayLabel>{meal.day} {meal.time && `\u00B7 ${meal.time}`}</DayLabel>
        </div>
        <CloseButton onClick={(e) => { e.stopPropagation(); onClose(); }}>{'\u2715'}</CloseButton>
      </Header>

      {ingredients.length > 0 && (
        <>
          <ChipRow>
            <Chip $variant="total">{ingredients.length} items</Chip>
            <Chip $variant="have">{haveCount} have</Chip>
            {needCount > 0 && <Chip $variant="need">{needCount} need</Chip>}
          </ChipRow>

          <Divider />

          <IngredientsList>
            {ingredients.map((ing) => (
              <IngredientRow key={ing.name}>
                <StatusDot $have={ing.have} />
                <IngredientName>{ing.name}</IngredientName>
              </IngredientRow>
            ))}
          </IngredientsList>

          <Divider />
        </>
      )}

      <Actions>
        <ActionButton $variant="default" onClick={(e) => { e.stopPropagation(); onSwap(); }}>
          {'\u21C4'} Swap
        </ActionButton>
        {needCount > 0 && (
          <ActionButton $variant="primary" onClick={(e) => { e.stopPropagation(); onAddToGrocery(); }}>
            + Add {needCount} to grocery
          </ActionButton>
        )}
        <ActionButton $variant="danger" onClick={(e) => { e.stopPropagation(); onRemove(); }}>
          {'\u2715'} Remove
        </ActionButton>
      </Actions>
    </Panel>
  )
}
