'use client'

import { useState } from 'react'
import styled from 'styled-components'

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`

const Label = styled.label`
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Input = styled.input`
  padding: 10px 12px;
  font-size: 14px;
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};
  min-height: ${({ theme }) => theme.touchTarget};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.teal};
  }
`

const Textarea = styled.textarea`
  padding: 10px 12px;
  font-size: 14px;
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-family: inherit;
  resize: vertical;
  min-height: 100px;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.teal};
  }
`

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.md};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`

const IngredientRow = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr auto;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
`

const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.borderLight};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  font-size: 14px;

  &:hover {
    background: ${({ theme }) => theme.colors.coralLight};
    color: ${({ theme }) => theme.colors.coral};
    border-color: ${({ theme }) => theme.colors.coralMid};
  }
`

const AddRowButton = styled.button`
  padding: 8px 14px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.tealLight};
  border: 0.5px solid ${({ theme }) => theme.colors.tealMid};
  color: ${({ theme }) => theme.colors.tealDark};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  align-self: flex-start;

  &:hover {
    background: ${({ theme }) => theme.colors.tealMid};
  }
`

const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  justify-content: flex-end;
  margin-top: ${({ theme }) => theme.spacing.md};
`

const PrimaryButton = styled.button`
  padding: 10px 20px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.teal};
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  min-height: ${({ theme }) => theme.touchTarget};

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.tealDark};
  }
`

const SecondaryButton = styled.button`
  padding: 10px 20px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: transparent;
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  min-height: ${({ theme }) => theme.touchTarget};

  &:hover {
    background: ${({ theme }) => theme.colors.borderLight};
  }
`

const ErrorText = styled.p`
  color: ${({ theme }) => theme.colors.coral};
  font-size: 13px;
  margin: 0;
`

const ImagePickerLabel = styled.label`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  border: 2px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  cursor: pointer;
  text-align: center;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 13px;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.teal};
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`

const ImagePreviewWrap = styled.div`
  position: relative;
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
  border: 0.5px solid ${({ theme }) => theme.colors.border};
`

const ImagePreview = styled.img`
  width: 100%;
  max-height: 240px;
  object-fit: cover;
  display: block;
`

const ImageRemoveBtn = styled.button`
  position: absolute;
  top: ${({ theme }) => theme.spacing.sm};
  right: ${({ theme }) => theme.spacing.sm};
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: none;

  &:hover {
    background: rgba(0, 0, 0, 0.8);
  }
`

const emptyIngredient = () => ({ name: '', quantity: '' })

export default function RecipeForm({ initial, onSubmit, onCancel, isPending, submitLabel = 'Save' }) {
  const [name, setName] = useState(initial?.name || '')
  const [description, setDescription] = useState(initial?.description || '')
  const [instructions, setInstructions] = useState(initial?.instructions || '')
  const [prepTime, setPrepTime] = useState(initial?.prep_time_minutes ?? '')
  const [cookTime, setCookTime] = useState(initial?.cook_time_minutes ?? '')
  const [servings, setServings] = useState(initial?.servings ?? '')
  const [tagsStr, setTagsStr] = useState((initial?.tags || []).join(', '))
  const [ingredients, setIngredients] = useState(
    initial?.ingredients?.length ? initial.ingredients : [emptyIngredient()]
  )
  const [imageUrl, setImageUrl] = useState(initial?.image_url || null)
  const [error, setError] = useState(null)

  function handleImageChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const img = new Image()
    img.onload = () => {
      const MAX = 1200
      let { width, height } = img
      if (width > MAX || height > MAX) {
        const ratio = Math.min(MAX / width, MAX / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      setImageUrl(canvas.toDataURL('image/jpeg', 0.8))
      URL.revokeObjectURL(img.src)
    }
    img.src = URL.createObjectURL(file)
  }

  function updateIngredient(index, field, value) {
    setIngredients(prev => prev.map((ing, i) => i === index ? { ...ing, [field]: value } : ing))
  }

  function addIngredient() {
    setIngredients(prev => [...prev, emptyIngredient()])
  }

  function removeIngredient(index) {
    setIngredients(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    const payload = {
      name: name.trim(),
      description: description.trim(),
      instructions: instructions.trim(),
      prep_time_minutes: prepTime === '' ? null : Number(prepTime),
      cook_time_minutes: cookTime === '' ? null : Number(cookTime),
      servings: servings === '' ? null : Number(servings),
      tags: tagsStr.split(',').map(t => t.trim()).filter(Boolean),
      ingredients: ingredients.filter(i => i.name.trim()),
      image_url: imageUrl || null,
      ...(initial?.source ? { source: initial.source } : {}),
    }

    if (!payload.name) {
      setError('Recipe name is required')
      return
    }

    const result = await onSubmit(payload)
    if (result && !result.success) {
      setError(result.error || 'Could not save recipe')
    }
  }

  return (
    <Form onSubmit={handleSubmit}>
      <Field>
        <Label htmlFor="recipe-name">Name</Label>
        <Input
          id="recipe-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Grandma's Lasagna"
          maxLength={200}
          required
        />
      </Field>

      <Field>
        <Label>Photo</Label>
        {imageUrl ? (
          <ImagePreviewWrap>
            <ImagePreview src={imageUrl} alt="Recipe photo" />
            <ImageRemoveBtn
              type="button"
              onClick={() => setImageUrl(null)}
              aria-label="Remove photo"
            >
              {'\u2715'}
            </ImageRemoveBtn>
          </ImagePreviewWrap>
        ) : (
          <ImagePickerLabel>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
            {'\uD83D\uDCF7 Add a photo'}
          </ImagePickerLabel>
        )}
      </Field>

      <Field>
        <Label htmlFor="recipe-description">Description</Label>
        <Textarea
          id="recipe-description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="A short description"
          maxLength={1000}
          rows={2}
        />
      </Field>

      <Row>
        <Field>
          <Label htmlFor="recipe-prep">Prep (min)</Label>
          <Input
            id="recipe-prep"
            type="number"
            min={0}
            max={1440}
            value={prepTime}
            onChange={e => setPrepTime(e.target.value)}
          />
        </Field>
        <Field>
          <Label htmlFor="recipe-cook">Cook (min)</Label>
          <Input
            id="recipe-cook"
            type="number"
            min={0}
            max={1440}
            value={cookTime}
            onChange={e => setCookTime(e.target.value)}
          />
        </Field>
        <Field>
          <Label htmlFor="recipe-servings">Servings</Label>
          <Input
            id="recipe-servings"
            type="number"
            min={1}
            max={100}
            value={servings}
            onChange={e => setServings(e.target.value)}
          />
        </Field>
      </Row>

      <Field>
        <Label>Ingredients</Label>
        {ingredients.map((ing, i) => (
          <IngredientRow key={i}>
            <Input
              type="text"
              value={ing.name}
              onChange={e => updateIngredient(i, 'name', e.target.value)}
              placeholder="Ingredient"
              maxLength={200}
            />
            <Input
              type="text"
              value={ing.quantity}
              onChange={e => updateIngredient(i, 'quantity', e.target.value)}
              placeholder="Qty"
              maxLength={50}
            />
            <IconButton
              type="button"
              onClick={() => removeIngredient(i)}
              aria-label="Remove ingredient"
            >
              {'\u2715'}
            </IconButton>
          </IngredientRow>
        ))}
        <AddRowButton type="button" onClick={addIngredient}>
          {'+ Add ingredient'}
        </AddRowButton>
      </Field>

      <Field>
        <Label htmlFor="recipe-instructions">Instructions</Label>
        <Textarea
          id="recipe-instructions"
          value={instructions}
          onChange={e => setInstructions(e.target.value)}
          placeholder="Step-by-step directions"
          maxLength={5000}
          rows={6}
        />
      </Field>

      <Field>
        <Label htmlFor="recipe-tags">Tags (comma-separated)</Label>
        <Input
          id="recipe-tags"
          type="text"
          value={tagsStr}
          onChange={e => setTagsStr(e.target.value)}
          placeholder="e.g. dinner, vegetarian, quick"
        />
      </Field>

      {error && <ErrorText role="alert">{error}</ErrorText>}

      <Actions>
        <SecondaryButton type="button" onClick={onCancel} disabled={isPending}>
          Cancel
        </SecondaryButton>
        <PrimaryButton type="submit" disabled={isPending}>
          {isPending ? 'Saving\u2026' : submitLabel}
        </PrimaryButton>
      </Actions>
    </Form>
  )
}
