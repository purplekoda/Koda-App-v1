'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styled from 'styled-components'
import RecipeForm from '@/components/recipes/RecipeForm'
import Modal from '@/components/recipes/Modal'
import { updateRecipeAction, deleteRecipeAction } from '../actions'

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-decoration: none;
  margin-bottom: ${({ theme }) => theme.spacing.lg};

  &:hover {
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  flex-wrap: wrap;
`

const TitleBlock = styled.div`
  flex: 1;
  min-width: 200px;
`

const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 ${({ theme }) => theme.spacing.xs} 0;
`

const Description = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
  line-height: 1.5;
`

const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`

const Button = styled.button`
  padding: 8px 16px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  min-height: 36px;
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};

  &:hover {
    background: ${({ theme }) => theme.colors.borderLight};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const DangerButton = styled(Button)`
  color: ${({ theme }) => theme.colors.coral};
  border-color: ${({ theme }) => theme.colors.coralMid};

  &:hover {
    background: ${({ theme }) => theme.colors.coralLight};
  }
`

const MetaRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xl};
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  flex-wrap: wrap;
`

const MetaItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`

const MetaLabel = styled.span`
  font-size: 11px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`

const MetaValue = styled.span`
  font-size: 15px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Section = styled.section`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const SectionTitle = styled.h2`
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 ${({ theme }) => theme.spacing.md} 0;
`

const IngredientList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`

const IngredientItem = styled.li`
  display: flex;
  justify-content: space-between;
  padding: 10px 14px;
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 14px;
`

const IngredientName = styled.span`
  color: ${({ theme }) => theme.colors.textPrimary};
`

const IngredientQty = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Instructions = styled.p`
  white-space: pre-wrap;
  font-size: 14px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  margin: 0;
`

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: ${({ theme }) => theme.spacing.md};
`

const Tag = styled.span`
  padding: 4px 12px;
  font-size: 12px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.tealLight};
  color: ${({ theme }) => theme.colors.tealDark};
`

const RecipeImage = styled.img`
  width: 100%;
  max-height: 360px;
  object-fit: cover;
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const Toast = styled.div`
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: ${({ theme }) => theme.colors.textPrimary};
  color: white;
  padding: 12px 24px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 14px;
  font-weight: 500;
  z-index: 999;
  box-shadow: ${({ theme }) => theme.shadows.elevated};
`

export default function RecipeDetailClient({ initialRecipe }) {
  const router = useRouter()
  const [recipe, setRecipe] = useState(initialRecipe)
  const [editOpen, setEditOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const [isPending, startTransition] = useTransition()

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  async function handleUpdate(payload) {
    return new Promise(resolve => {
      startTransition(async () => {
        const result = await updateRecipeAction(recipe.id, payload)
        if (result.success && result.data) {
          setRecipe(result.data)
          setEditOpen(false)
          showToast('Recipe updated')
        }
        resolve(result)
      })
    })
  }

  function handleDelete() {
    if (!confirm(`Delete "${recipe.name}"? This cannot be undone.`)) return
    startTransition(async () => {
      const result = await deleteRecipeAction(recipe.id)
      if (result.success) {
        router.push('/recipes')
      } else {
        showToast(result.error || 'Could not delete')
      }
    })
  }

  const prep = recipe.prep_time_minutes
  const cook = recipe.cook_time_minutes
  const total = (Number(prep) || 0) + (Number(cook) || 0)

  return (
    <>
      <BackLink href="/recipes">{'\u2190 All recipes'}</BackLink>

      {recipe.image_url && (
        <RecipeImage src={recipe.image_url} alt={recipe.name} />
      )}

      <Header>
        <TitleBlock>
          <Title>{recipe.name}</Title>
          {recipe.description && <Description>{recipe.description}</Description>}
          {recipe.tags && recipe.tags.length > 0 && (
            <TagRow>
              {recipe.tags.map(tag => <Tag key={tag}>{tag}</Tag>)}
            </TagRow>
          )}
        </TitleBlock>
        <Actions>
          <Button onClick={() => setEditOpen(true)} disabled={isPending}>Edit</Button>
          <DangerButton onClick={handleDelete} disabled={isPending}>Delete</DangerButton>
        </Actions>
      </Header>

      {(prep || cook || recipe.servings) && (
        <MetaRow>
          {prep !== null && prep !== undefined && (
            <MetaItem>
              <MetaLabel>Prep</MetaLabel>
              <MetaValue>{prep} min</MetaValue>
            </MetaItem>
          )}
          {cook !== null && cook !== undefined && (
            <MetaItem>
              <MetaLabel>Cook</MetaLabel>
              <MetaValue>{cook} min</MetaValue>
            </MetaItem>
          )}
          {total > 0 && (
            <MetaItem>
              <MetaLabel>Total</MetaLabel>
              <MetaValue>{total} min</MetaValue>
            </MetaItem>
          )}
          {recipe.servings && (
            <MetaItem>
              <MetaLabel>Servings</MetaLabel>
              <MetaValue>{recipe.servings}</MetaValue>
            </MetaItem>
          )}
        </MetaRow>
      )}

      {recipe.ingredients && recipe.ingredients.length > 0 && (
        <Section>
          <SectionTitle>Ingredients</SectionTitle>
          <IngredientList>
            {recipe.ingredients.map((ing, i) => (
              <IngredientItem key={i}>
                <IngredientName>{ing.name}</IngredientName>
                {ing.quantity && <IngredientQty>{ing.quantity}</IngredientQty>}
              </IngredientItem>
            ))}
          </IngredientList>
        </Section>
      )}

      {recipe.instructions && (
        <Section>
          <SectionTitle>Instructions</SectionTitle>
          <Instructions>{recipe.instructions}</Instructions>
        </Section>
      )}

      {editOpen && (
        <Modal title="Edit recipe" onClose={() => setEditOpen(false)}>
          <RecipeForm
            initial={recipe}
            onSubmit={handleUpdate}
            onCancel={() => setEditOpen(false)}
            isPending={isPending}
            submitLabel="Save changes"
          />
        </Modal>
      )}

      {toast && <Toast>{toast}</Toast>}
    </>
  )
}
