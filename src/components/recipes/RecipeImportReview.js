'use client'

import { useState, useRef } from 'react'
import styled from 'styled-components'

// ── Layout ──────────────────────────────────────────────────────────────────────

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`

const PhotoSection = styled.div`
  position: relative;
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.borderLight};
  min-height: 180px;
`

const PhotoImage = styled.img`
  width: 100%;
  max-height: 260px;
  object-fit: cover;
  display: block;
`

const PhotoPlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.xxl} ${({ theme }) => theme.spacing.lg};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 13px;
  text-align: center;
`

const PhotoEditBtn = styled.button`
  position: absolute;
  top: ${({ theme }) => theme.spacing.sm};
  right: ${({ theme }) => theme.spacing.sm};
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  color: white;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: none;

  &:hover {
    background: rgba(0, 0, 0, 0.75);
  }
`

const PhotoOptions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
`

const PhotoOptionBtn = styled.button`
  flex: 1;
  min-width: 120px;
  padding: 10px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.tealLight};
  border: 1px solid ${({ theme }) => theme.colors.tealMid};
  color: ${({ theme }) => theme.colors.tealDark};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  text-align: center;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.tealMid};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

// ── Editable fields ─────────────────────────────────────────────────────────────

const NameRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`

const NameText = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
  flex: 1;
`

const NameInput = styled.input`
  font-size: 20px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  border: 1px solid ${({ theme }) => theme.colors.teal};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 4px 8px;
  flex: 1;
  background: ${({ theme }) => theme.colors.surface};

  &:focus {
    outline: none;
  }
`

const EditIcon = styled.button`
  width: 28px;
  height: 28px;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.borderLight};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;

  &:hover {
    background: ${({ theme }) => theme.colors.border};
  }
`

const MetaChips = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
`

const MetaChip = styled.button`
  padding: 6px 12px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.borderLight};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    border-color: ${({ theme }) => theme.colors.teal};
    color: ${({ theme }) => theme.colors.tealDark};
  }
`

const MetaChipInput = styled.input`
  padding: 6px 12px;
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1px solid ${({ theme }) => theme.colors.teal};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 12px;
  width: 80px;

  &:focus {
    outline: none;
  }
`

// ── Sections ────────────────────────────────────────────────────────────────────

const SectionTitle = styled.h3`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0 0 ${({ theme }) => theme.spacing.sm} 0;
`

const IngredientList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`

const IngredientRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 100px 28px;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
`

const IngInput = styled.input`
  padding: 7px 10px;
  font-size: 13px;
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.teal};
  }
`

const RemoveBtn = styled.button`
  width: 28px;
  height: 28px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.borderLight};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.coralLight};
    color: ${({ theme }) => theme.colors.coral};
  }
`

const AddBtn = styled.button`
  padding: 6px 12px;
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

const StepList = styled.ol`
  margin: 0;
  padding: 0 0 0 20px;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`

const StepItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.sm};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textPrimary};
  line-height: 1.5;
`

const StepTextArea = styled.textarea`
  flex: 1;
  padding: 7px 10px;
  font-size: 13px;
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-family: inherit;
  resize: vertical;
  min-height: 40px;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.teal};
  }
`

const SourceRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
`

const PartialBanner = styled.div`
  padding: 10px 14px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.amberLight};
  border: 1px solid ${({ theme }) => theme.colors.amberMid || theme.colors.amber};
  color: ${({ theme }) => theme.colors.amberDark};
  font-size: 13px;
`

const ErrorText = styled.p`
  color: ${({ theme }) => theme.colors.coral};
  font-size: 13px;
  margin: 0;
`

// ── Actions ─────────────────────────────────────────────────────────────────────

const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  justify-content: flex-end;
  padding-top: ${({ theme }) => theme.spacing.md};
  border-top: 0.5px solid ${({ theme }) => theme.colors.border};
`

const PrimaryBtn = styled.button`
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

const SecondaryBtn = styled.button`
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

// ── Helpers ─────────────────────────────────────────────────────────────────────

function parseSteps(instructions) {
  if (!instructions) return []
  if (Array.isArray(instructions)) return instructions

  // Split on "1. " or "1) " numbered patterns
  if (/\d+[.)]\s+/.test(instructions)) {
    const steps = instructions
      .split(/\n?\s*\d+[.)]\s+/)
      .filter(s => s.trim().length > 0)
      .map(s => s.trim())
    if (steps.length > 1) return steps
  }

  // Split on "Step 1:" patterns
  if (/step\s+\d+[:.]\s*/i.test(instructions)) {
    const steps = instructions
      .split(/\n?\s*step\s+\d+[:.]\s*/i)
      .filter(s => s.trim().length > 0)
      .map(s => s.trim())
    if (steps.length > 1) return steps
  }

  // Fallback: split on newlines, strip leading numbering
  return instructions
    .split(/\n/)
    .map(s => s.replace(/^\s*\d+[\.\)\-]\s*/, '').trim())
    .filter(Boolean)
}

function joinSteps(steps) {
  return steps.map((s, i) => `${i + 1}. ${s}`).join('\n')
}

// ── Component ───────────────────────────────────────────────────────────────────

export default function RecipeImportReview({
  recipe,
  onSave,
  onCancel,
  isPending,
  onGenerateImage,
  isGeneratingImage,
}) {
  // Editable state derived from the extracted recipe
  const [name, setName] = useState(recipe.name || '')
  const [editingName, setEditingName] = useState(false)
  const [imageUrl, setImageUrl] = useState(recipe.image_url || null)
  const [photoPath, setPhotoPath] = useState(recipe.photo_path || null)
  const [showPhotoOptions, setShowPhotoOptions] = useState(!recipe.image_url)
  const [prepTime, setPrepTime] = useState(recipe.prep_time_minutes ?? '')
  const [editingPrep, setEditingPrep] = useState(false)
  const [cookTime, setCookTime] = useState(recipe.cook_time_minutes ?? '')
  const [editingCook, setEditingCook] = useState(false)
  const [servings, setServings] = useState(recipe.servings ?? '')
  const [editingServings, setEditingServings] = useState(false)
  const [ingredients, setIngredients] = useState(
    (recipe.ingredients || []).map((ing, i) => ({ ...ing, _key: i }))
  )
  const [steps, setSteps] = useState(parseSteps(recipe.instructions))
  const [error, setError] = useState(null)

  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)
  const nextKey = useRef(ingredients.length)

  const isPartial = recipe._isPartial
  const sourceUrl = recipe.source

  // ── Photo handling ──────────────────────────────────────────────────────────

  function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const img = new Image()
    img.onload = () => {
      const MAX = 800
      const QUALITY = 0.72
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
      const dataUrl = canvas.toDataURL('image/jpeg', QUALITY)
      if (dataUrl.length > 300_000) {
        const c2 = document.createElement('canvas')
        c2.width = Math.round(width * 0.6)
        c2.height = Math.round(height * 0.6)
        c2.getContext('2d').drawImage(img, 0, 0, c2.width, c2.height)
        setImageUrl(c2.toDataURL('image/jpeg', 0.65))
      } else {
        setImageUrl(dataUrl)
      }
      setPhotoPath(null)
      setShowPhotoOptions(false)
      URL.revokeObjectURL(img.src)
    }
    img.src = URL.createObjectURL(file)
  }

  async function handleGenerateAiPhoto() {
    if (!onGenerateImage || !name.trim()) return
    setError(null)
    try {
      const result = await onGenerateImage(name.trim(), recipe.description || '')
      if (result.success && result.data?.image_url) {
        setImageUrl(result.data.image_url)
        setPhotoPath(result.data.photo_path || null)
        setShowPhotoOptions(false)
      } else {
        setError(result.error || 'Could not generate photo.')
      }
    } catch {
      setError('Could not generate photo. Please try again.')
    }
  }

  // ── Ingredient editing ────────────────────────────────────────────────────

  function updateIngredient(key, field, value) {
    setIngredients(prev => prev.map(ing => ing._key === key ? { ...ing, [field]: value } : ing))
  }

  function removeIngredient(key) {
    setIngredients(prev => prev.filter(ing => ing._key !== key))
  }

  function addIngredient() {
    nextKey.current += 1
    setIngredients(prev => [...prev, { name: '', quantity: '', _key: nextKey.current }])
  }

  // ── Step editing ──────────────────────────────────────────────────────────

  function updateStep(idx, value) {
    setSteps(prev => prev.map((s, i) => i === idx ? value : s))
  }

  function removeStep(idx) {
    setSteps(prev => prev.filter((_, i) => i !== idx))
  }

  function addStep() {
    setSteps(prev => [...prev, ''])
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  function handleSave() {
    setError(null)
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Recipe name is required.')
      return
    }

    const payload = {
      name: trimmedName,
      description: recipe.description || '',
      ingredients: ingredients
        .filter(i => i.name.trim())
        .map(({ name: n, quantity: q }) => ({ name: n.trim(), quantity: q?.trim() || '' })),
      instructions: joinSteps(steps.filter(Boolean)),
      prep_time_minutes: prepTime === '' ? null : Number(prepTime),
      cook_time_minutes: cookTime === '' ? null : Number(cookTime),
      servings: servings === '' ? null : Number(servings),
      tags: recipe.tags || [],
      image_url: imageUrl || null,
      photo_path: photoPath || null,
      photo_source: photoPath ? 'supabase' : (imageUrl ? 'external' : null),
      source: recipe.source || null,
      imported_from: recipe.imported_from || null,
      imported_at: recipe.imported_at || null,
    }

    onSave(payload)
  }

  return (
    <Wrapper>
      {/* Photo */}
      <PhotoSection>
        {imageUrl && !showPhotoOptions ? (
          <>
            <PhotoImage src={imageUrl} alt={name} />
            <PhotoEditBtn
              type="button"
              onClick={() => setShowPhotoOptions(true)}
              aria-label="Change photo"
            >
              {'\u270F'}
            </PhotoEditBtn>
          </>
        ) : (
          <PhotoPlaceholder>
            <span style={{ fontSize: 28 }}>{'\uD83D\uDCF7'}</span>
            <span>No photo found</span>
            <PhotoOptions>
              <PhotoOptionBtn type="button" onClick={() => cameraInputRef.current?.click()}>
                Take a photo
              </PhotoOptionBtn>
              <PhotoOptionBtn type="button" onClick={() => fileInputRef.current?.click()}>
                Upload from camera roll
              </PhotoOptionBtn>
              {onGenerateImage && (
                <PhotoOptionBtn
                  type="button"
                  onClick={handleGenerateAiPhoto}
                  disabled={isGeneratingImage || !name.trim()}
                >
                  {isGeneratingImage ? 'Generating\u2026' : 'Generate with Koda'}
                </PhotoOptionBtn>
              )}
              {imageUrl && (
                <PhotoOptionBtn type="button" onClick={() => setShowPhotoOptions(false)}>
                  Keep current
                </PhotoOptionBtn>
              )}
            </PhotoOptions>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </PhotoPlaceholder>
        )}
      </PhotoSection>

      {/* Partial recipe banner */}
      {isPartial && (
        <PartialBanner>
          We found a partial recipe \u2014 please fill in the missing details before saving.
        </PartialBanner>
      )}

      {/* Name */}
      <NameRow>
        {editingName ? (
          <NameInput
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={() => setEditingName(false)}
            onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
            maxLength={200}
            autoFocus
          />
        ) : (
          <>
            <NameText>{name || 'Untitled Recipe'}</NameText>
            <EditIcon type="button" onClick={() => setEditingName(true)} aria-label="Edit name">
              {'\u270F'}
            </EditIcon>
          </>
        )}
      </NameRow>

      {/* Meta chips */}
      <MetaChips>
        {editingPrep ? (
          <MetaChipInput
            type="number"
            min={0}
            max={1440}
            value={prepTime}
            onChange={e => setPrepTime(e.target.value)}
            onBlur={() => setEditingPrep(false)}
            onKeyDown={e => e.key === 'Enter' && setEditingPrep(false)}
            placeholder="min"
            autoFocus
          />
        ) : (
          <MetaChip type="button" onClick={() => setEditingPrep(true)}>
            {prepTime ? `Prep: ${prepTime}m` : 'Prep time'}
          </MetaChip>
        )}

        {editingCook ? (
          <MetaChipInput
            type="number"
            min={0}
            max={1440}
            value={cookTime}
            onChange={e => setCookTime(e.target.value)}
            onBlur={() => setEditingCook(false)}
            onKeyDown={e => e.key === 'Enter' && setEditingCook(false)}
            placeholder="min"
            autoFocus
          />
        ) : (
          <MetaChip type="button" onClick={() => setEditingCook(true)}>
            {cookTime ? `Cook: ${cookTime}m` : 'Cook time'}
          </MetaChip>
        )}

        {editingServings ? (
          <MetaChipInput
            type="number"
            min={1}
            max={100}
            value={servings}
            onChange={e => setServings(e.target.value)}
            onBlur={() => setEditingServings(false)}
            onKeyDown={e => e.key === 'Enter' && setEditingServings(false)}
            placeholder="#"
            autoFocus
          />
        ) : (
          <MetaChip type="button" onClick={() => setEditingServings(true)}>
            {servings ? `Servings: ${servings}` : 'Servings'}
          </MetaChip>
        )}

        {recipe.imported_from && (
          <MetaChip as="span" style={{ cursor: 'default', background: '#EEEDFE', borderColor: '#CECBF6', color: '#3C3489' }}>
            {recipe.imported_from}
          </MetaChip>
        )}
      </MetaChips>

      {/* Ingredients */}
      <div>
        <SectionTitle>Ingredients</SectionTitle>
        <IngredientList>
          {ingredients.map(ing => (
            <IngredientRow key={ing._key}>
              <IngInput
                type="text"
                value={ing.name}
                onChange={e => updateIngredient(ing._key, 'name', e.target.value)}
                placeholder="Ingredient"
                maxLength={200}
              />
              <IngInput
                type="text"
                value={ing.quantity}
                onChange={e => updateIngredient(ing._key, 'quantity', e.target.value)}
                placeholder="Qty"
                maxLength={50}
              />
              <RemoveBtn type="button" onClick={() => removeIngredient(ing._key)} aria-label="Remove ingredient">
                {'\u2715'}
              </RemoveBtn>
            </IngredientRow>
          ))}
          <AddBtn type="button" onClick={addIngredient}>
            + Add ingredient
          </AddBtn>
        </IngredientList>
      </div>

      {/* Steps */}
      <div>
        <SectionTitle>Steps</SectionTitle>
        <StepList>
          {steps.map((step, i) => (
            <StepItem key={i}>
              <StepTextArea
                value={step}
                onChange={e => updateStep(i, e.target.value)}
                rows={2}
                maxLength={2000}
              />
              <RemoveBtn type="button" onClick={() => removeStep(i)} aria-label="Remove step">
                {'\u2715'}
              </RemoveBtn>
            </StepItem>
          ))}
        </StepList>
        <AddBtn type="button" onClick={addStep} style={{ marginTop: 8 }}>
          + Add step
        </AddBtn>
      </div>

      {/* Source URL */}
      {sourceUrl && sourceUrl !== 'gemini' && sourceUrl.startsWith('http') && (
        <SourceRow>
          <span>{'\uD83D\uDD17'}</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {sourceUrl}
          </span>
        </SourceRow>
      )}

      {error && <ErrorText role="alert">{error}</ErrorText>}

      {/* Actions */}
      <Actions>
        <SecondaryBtn type="button" onClick={onCancel} disabled={isPending}>
          Cancel
        </SecondaryBtn>
        <PrimaryBtn type="button" onClick={handleSave} disabled={isPending || !name.trim()}>
          {isPending ? 'Saving\u2026' : 'Save to my Recipe Box'}
        </PrimaryBtn>
      </Actions>
    </Wrapper>
  )
}
