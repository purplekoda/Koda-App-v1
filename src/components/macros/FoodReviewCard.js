'use client'

import { useState } from 'react'
import styled from 'styled-components'

const MEAL_TIME_LABELS = {
  breakfast_addition: 'Breakfast addition',
  morning_snack: 'Morning snack',
  lunch_addition: 'Lunch addition',
  afternoon_snack: 'Afternoon snack',
  evening_snack: 'Evening snack',
}

const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.xl};
`

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const Thumbnail = styled.img`
  width: 56px;
  height: 56px;
  border-radius: ${({ theme }) => theme.radii.md};
  object-fit: cover;
  flex-shrink: 0;
`

const PlaceholderThumb = styled.div`
  width: 56px;
  height: 56px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.grayLight};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
`

const FoodName = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  line-height: 1.3;
`

const ServingSize = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const MacroGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const MacroField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const MacroLabel = styled.label`
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: ${({ $color }) => $color};
`

const MacroInput = styled.input`
  padding: ${({ theme }) => theme.spacing.md};
  border: 1.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 20px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.grayLight};
  width: 100%;
  min-height: ${({ theme }) => theme.touchTarget};
  text-align: center;

  &:focus {
    outline: none;
    border-color: ${({ $color }) => $color};
    background: white;
  }
`

const MacroUnit = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: center;
`

const Note = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-style: italic;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  text-align: center;
`

const ConfirmButton = styled.button`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  min-height: ${({ theme }) => theme.touchTarget};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 16px;
  font-weight: 600;
  background: ${({ theme }) => theme.colors.teal};
  color: white;
  cursor: pointer;
  margin-bottom: ${({ theme }) => theme.spacing.sm};

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const CancelButton = styled.button`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.sm};
  min-height: ${({ theme }) => theme.touchTarget};
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textMuted};
`

// ── Confirmation Dialog ──────────────────────────────────

const ConfirmOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 110;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.xl};
`

const ConfirmDialog = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  max-width: 400px;
  width: 100%;
`

const ConfirmTitle = styled.h4`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const ConfirmText = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.5;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const DialogButtons = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
`

const DialogConfirm = styled.button`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.md};
  min-height: ${({ theme }) => theme.touchTarget};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 15px;
  font-weight: 600;
  background: ${({ theme }) => theme.colors.teal};
  color: white;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const DialogCancel = styled.button`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  min-height: ${({ theme }) => theme.touchTarget};
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textMuted};
`

// ── Constants ────────────────────────────────────────────

const MACRO_COLORS = {
  calories: '#D85A30',
  protein: '#1D9E75',
  carbs: '#185FA5',
  fat: '#534AB7',
}

// ── Component ────────────────────────────────────────────

export default function FoodReviewCard({
  analysis,
  mealTime,
  imagePreview,
  memberName,
  onConfirm,
  onCancel,
  saving,
}) {
  const [macros, setMacros] = useState({
    calories: analysis.calories ?? 0,
    protein: analysis.protein ?? 0,
    carbs: analysis.carbs ?? 0,
    fat: analysis.fat ?? 0,
  })
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const edited =
    macros.calories !== analysis.calories ||
    macros.protein !== analysis.protein ||
    macros.carbs !== analysis.carbs ||
    macros.fat !== analysis.fat

  function handleMacroChange(key, value) {
    const parsed = key === 'calories' ? parseInt(value, 10) : parseFloat(value)
    setMacros(prev => ({ ...prev, [key]: isNaN(parsed) ? 0 : parsed }))
  }

  function handleConfirmClick() {
    setShowConfirmDialog(true)
  }

  function handleFinalConfirm() {
    onConfirm({
      ...macros,
      food_name: analysis.food_name,
      edited_by_user: edited,
    })
  }

  return (
    <>
      <Card>
        <Header>
          {imagePreview ? (
            <Thumbnail src={imagePreview} alt={analysis.food_name} />
          ) : (
            <PlaceholderThumb>&#x1F372;</PlaceholderThumb>
          )}
          <div>
            <FoodName>{analysis.food_name}</FoodName>
            <ServingSize>{analysis.serving_size}</ServingSize>
          </div>
        </Header>

        <MacroGrid>
          {[
            { key: 'calories', label: 'Calories', unit: 'kcal' },
            { key: 'protein', label: 'Protein', unit: 'g' },
            { key: 'carbs', label: 'Carbs', unit: 'g' },
            { key: 'fat', label: 'Fat', unit: 'g' },
          ].map(({ key, label, unit }) => (
            <MacroField key={key}>
              <MacroLabel $color={MACRO_COLORS[key]}>{label}</MacroLabel>
              <MacroInput
                type="number"
                inputMode="decimal"
                min="0"
                value={macros[key]}
                $color={MACRO_COLORS[key]}
                onChange={e => handleMacroChange(key, e.target.value)}
              />
              <MacroUnit>{unit}</MacroUnit>
            </MacroField>
          ))}
        </MacroGrid>

        <Note>Gemini estimated these values — tap any number to edit.</Note>

        <ConfirmButton onClick={handleConfirmClick} disabled={saving}>
          {saving ? 'Saving...' : 'Confirm and log'}
        </ConfirmButton>
        <CancelButton onClick={onCancel}>Cancel</CancelButton>
      </Card>

      {showConfirmDialog && (
        <ConfirmOverlay onClick={() => setShowConfirmDialog(false)}>
          <ConfirmDialog onClick={e => e.stopPropagation()}>
            <ConfirmTitle>Confirm</ConfirmTitle>
            <ConfirmText>
              Add {analysis.food_name} — {macros.calories} kcal, {macros.protein}g protein,{' '}
              {macros.carbs}g carbs, {macros.fat}g fat to {memberName}&apos;s{' '}
              {MEAL_TIME_LABELS[mealTime]?.toLowerCase() || mealTime} for today?
              This will update their daily macro totals.
            </ConfirmText>
            <DialogButtons>
              <DialogCancel onClick={() => setShowConfirmDialog(false)}>
                Go back
              </DialogCancel>
              <DialogConfirm onClick={handleFinalConfirm} disabled={saving}>
                {saving ? 'Saving...' : 'Confirm'}
              </DialogConfirm>
            </DialogButtons>
          </ConfirmDialog>
        </ConfirmOverlay>
      )}
    </>
  )
}
