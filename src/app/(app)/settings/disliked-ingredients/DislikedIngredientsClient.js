'use client'

import { useState, useTransition } from 'react'
import styled from 'styled-components'
import { updateDislikedIngredientsAction } from './actions'

// ── Styled components ─────────────────────────────────────────────────────────

const PageWrapper = styled.div`
  max-width: 640px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xxl} ${({ theme }) => theme.spacing.xl};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.lg};
    padding-bottom: calc(${({ theme }) => theme.bottomNavHeight} + ${({ theme }) => theme.spacing.xl});
  }
`

const PageTitle = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const Description = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.5;
  margin: 0 0 ${({ theme }) => theme.spacing.xl};
`

const ChipsArea = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  min-height: 40px;
`

const EmptyState = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-style: italic;
`

const IngredientChip = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px 5px 12px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.borderLight};
  border: 1px solid ${({ theme }) => theme.colors.border};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const ChipRemove = styled.button`
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.12s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.coral};
    color: white;
  }
`

const AddRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`

const AddInput = styled.input`
  flex: 1;
  padding: 10px 12px;
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.surface};
  outline: none;
  font-family: inherit;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.teal};
  }

  &:disabled {
    opacity: 0.5;
  }
`

const AddButton = styled.button`
  padding: 10px 18px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  background: ${({ theme }) => theme.colors.teal};
  color: white;
  border: none;
  transition: opacity 0.12s ease;
  white-space: nowrap;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    opacity: 0.88;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const Toast = styled.div`
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: ${({ theme }) => theme.colors.textPrimary};
  color: white;
  padding: 10px 20px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 13px;
  font-weight: 500;
  z-index: 1100;
  box-shadow: ${({ theme }) => theme.shadows.elevated};
  white-space: nowrap;
`

// ── Component ─────────────────────────────────────────────────────────────────

export default function DislikedIngredientsClient({ initialIngredients = [] }) {
  const [ingredients, setIngredients] = useState(initialIngredients)
  const [inputValue, setInputValue] = useState('')
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState(null)

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  function handleAdd() {
    const trimmed = inputValue.trim().toLowerCase()
    if (!trimmed) return
    if (ingredients.includes(trimmed)) {
      setInputValue('')
      return
    }
    const next = [...ingredients, trimmed]
    setIngredients(next)
    setInputValue('')
    startTransition(async () => {
      const result = await updateDislikedIngredientsAction(next)
      if (result.success) {
        showToast('Saved')
        if (result.data?.ingredients) setIngredients(result.data.ingredients)
      }
    })
  }

  function handleRemove(ingredient) {
    const next = ingredients.filter(i => i !== ingredient)
    setIngredients(next)
    startTransition(async () => {
      const result = await updateDislikedIngredientsAction(next)
      if (result.success) {
        showToast('Saved')
        if (result.data?.ingredients) setIngredients(result.data.ingredients)
      }
    })
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleAdd()
  }

  return (
    <PageWrapper>
      <PageTitle>Ingredients I don&apos;t like</PageTitle>
      <Description>
        Koda won&apos;t use these as primary ingredients in meal suggestions.
      </Description>

      <ChipsArea>
        {ingredients.length === 0 ? (
          <EmptyState>No ingredients added yet.</EmptyState>
        ) : (
          ingredients.map(ingredient => (
            <IngredientChip key={ingredient}>
              {ingredient}
              <ChipRemove
                onClick={() => handleRemove(ingredient)}
                aria-label={`Remove ${ingredient}`}
                disabled={isPending}
              >
                {'✕'}
              </ChipRemove>
            </IngredientChip>
          ))
        )}
      </ChipsArea>

      <AddRow>
        <AddInput
          type="text"
          placeholder="e.g. cilantro, mushrooms, blue cheese..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isPending}
        />
        <AddButton onClick={handleAdd} disabled={!inputValue.trim() || isPending}>
          {isPending ? 'Saving...' : 'Add'}
        </AddButton>
      </AddRow>

      {toast && <Toast>{toast}</Toast>}
    </PageWrapper>
  )
}
