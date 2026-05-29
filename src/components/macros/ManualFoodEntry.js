'use client'

import { useState, useTransition } from 'react'
import styled from 'styled-components'
import { estimateFoodMacros } from '@/app/(app)/macros/actions'

const COMMON_FOODS = [
  { name: 'Banana (medium)', calories: 105, protein: 1, carbs: 27, fat: 0, serving: '1 medium (118g)' },
  { name: 'Chicken breast (cooked)', calories: 165, protein: 31, carbs: 0, fat: 4, serving: '100g' },
  { name: 'Greek yogurt (plain)', calories: 100, protein: 17, carbs: 6, fat: 0, serving: '170g container' },
  { name: 'Brown rice (cooked)', calories: 215, protein: 5, carbs: 45, fat: 2, serving: '1 cup (195g)' },
  { name: 'Egg (large)', calories: 78, protein: 6, carbs: 1, fat: 5, serving: '1 large egg' },
  { name: 'Avocado (half)', calories: 120, protein: 1, carbs: 6, fat: 11, serving: 'half fruit (68g)' },
  { name: 'Oatmeal (cooked)', calories: 158, protein: 6, carbs: 27, fat: 3, serving: '1 cup (234g)' },
  { name: 'Salmon (cooked)', calories: 208, protein: 20, carbs: 0, fat: 13, serving: '100g' },
  { name: 'Apple (medium)', calories: 95, protein: 0, carbs: 25, fat: 0, serving: '1 medium (182g)' },
  { name: 'Peanut butter', calories: 188, protein: 8, carbs: 6, fat: 16, serving: '2 tbsp (32g)' },
  { name: 'Whole milk', calories: 149, protein: 8, carbs: 12, fat: 8, serving: '1 cup (244ml)' },
  { name: 'Cheddar cheese', calories: 113, protein: 7, carbs: 0, fat: 9, serving: '1 oz (28g)' },
  { name: 'Pasta (cooked)', calories: 220, protein: 8, carbs: 43, fat: 1, serving: '1 cup (140g)' },
  { name: 'Bread (whole wheat)', calories: 69, protein: 4, carbs: 12, fat: 1, serving: '1 slice (28g)' },
  { name: 'Almonds', calories: 164, protein: 6, carbs: 6, fat: 14, serving: '1 oz (28g)' },
]

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
]

function getDefaultMealTime() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 10) return 'breakfast'
  if (hour >= 10 && hour < 14) return 'lunch'
  if (hour >= 14 && hour < 18) return 'snack'
  if (hour >= 18 && hour < 22) return 'dinner'
  return 'snack'
}

const MACRO_COLORS = {
  calories: '#D85A30',
  protein: '#1D9E75',
  carbs: '#185FA5',
  fat: '#534AB7',
}

// ─── Styled Components ────────────────────────────────────────────────────────

const Wrapper = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.xl};
`

const Title = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const SearchRow = styled.div`
  position: relative;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const SearchInput = styled.input`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border: 1.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 15px;
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.grayLight};
  min-height: ${({ theme }) => theme.touchTarget};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.teal};
    background: white;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`

const SuggestionList = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.md};
  box-shadow: ${({ theme }) => theme.shadows.elevated};
  z-index: 10;
  max-height: 200px;
  overflow-y: auto;
`

const SuggestionItem = styled.button`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  font-size: 14px;
  text-align: left;
  border-bottom: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  cursor: pointer;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.grayLight};
  }
`

const SuggestionName = styled.span`
  color: ${({ theme }) => theme.colors.textPrimary};
  font-weight: 500;
`

const SuggestionCal = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
`

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const FieldLabel = styled.label`
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.03em;
`

const FieldInput = styled.input`
  padding: ${({ theme }) => theme.spacing.md};
  border: 1.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.grayLight};
  min-height: ${({ theme }) => theme.touchTarget};
  width: 100%;

  &:focus {
    outline: none;
    border-color: ${({ $color, theme }) => $color || theme.colors.teal};
    background: white;
  }
`

const MacroGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
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

const MealTypeRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  flex-wrap: wrap;
`

const MealTypeChip = styled.button`
  padding: 6px 14px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 13px;
  font-weight: 500;
  border: 1.5px solid ${({ $active }) => $active ? '#1D9E75' : 'transparent'};
  background: ${({ $active, theme }) => $active ? theme.colors.tealLight : theme.colors.grayLight};
  color: ${({ $active, theme }) => $active ? theme.colors.teal : theme.colors.textSecondary};
  cursor: pointer;
  min-height: 36px;
  transition: all 0.15s ease;
`

const ButtonRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.lg};
`

const SaveButton = styled.button`
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

const CancelButton = styled.button`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  min-height: ${({ theme }) => theme.touchTarget};
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textMuted};
`

const EstimateButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  min-height: ${({ theme }) => theme.touchTarget};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 14px;
  font-weight: 500;
  border: 1.5px solid ${({ theme }) => theme.colors.teal};
  color: ${({ theme }) => theme.colors.teal};
  background: transparent;
  cursor: pointer;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  transition: all 0.12s ease;

  &:hover:not(:disabled) { background: ${({ theme }) => theme.colors.tealLight}; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

const EstimateNote = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-style: italic;
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const EstimateError = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.coral};
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

// ─── Component ────────────────────────────────────────────────────────────────

export default function ManualFoodEntry({ onSave, onCancel, saving, initialMealType }) {
  const [search, setSearch] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [foodName, setFoodName] = useState('')
  const [serving, setServing] = useState('')
  const [mealType, setMealType] = useState(() => initialMealType || getDefaultMealTime())
  const [macros, setMacros] = useState({ calories: '', protein: '', carbs: '', fat: '' })
  const [estimating, setEstimating] = useState(false)
  const [estimateNote, setEstimateNote] = useState(null)
  const [estimateError, setEstimateError] = useState(null)
  const [, startTransition] = useTransition()

  const currentFoodName = foodName || search

  function handleEstimate() {
    if (!currentFoodName.trim()) return
    setEstimating(true)
    setEstimateNote(null)
    setEstimateError(null)
    startTransition(async () => {
      const result = await estimateFoodMacros({ food_name: currentFoodName, serving })
      setEstimating(false)
      if (result.success) {
        const d = result.data
        setMacros({ calories: d.calories, protein: d.protein, carbs: d.carbs, fat: d.fat })
        if (d.serving_description && !serving) setServing(d.serving_description)
        setEstimateNote(
          d.confidence === 'low'
            ? `Rough estimate — ${d.notes || 'tap any value to adjust.'}`
            : d.notes || 'Values filled in — adjust if needed.'
        )
      } else {
        setEstimateError(result.error || 'Could not estimate macros.')
      }
    })
  }

  const suggestions = search.length >= 2
    ? COMMON_FOODS.filter(f => f.name.toLowerCase().includes(search.toLowerCase())).slice(0, 6)
    : []

  function handleSuggestionSelect(food) {
    setFoodName(food.name)
    setServing(food.serving)
    setMacros({ calories: food.calories, protein: food.protein, carbs: food.carbs, fat: food.fat })
    setSearch('')
    setShowSuggestions(false)
  }

  function handleMacroChange(key, value) {
    setMacros(prev => ({ ...prev, [key]: value }))
  }

  function handleSave() {
    const parsed = {
      calories: parseInt(macros.calories, 10) || 0,
      protein: parseFloat(macros.protein) || 0,
      carbs: parseFloat(macros.carbs) || 0,
      fat: parseFloat(macros.fat) || 0,
    }
    onSave({
      food_name: foodName || search || 'Unnamed food',
      serving_description: serving,
      meal_type: mealType,
      ...parsed,
    })
  }

  const canSave = (foodName || search).trim().length > 0 && !saving

  return (
    <Wrapper>
      <Title>Add food manually</Title>

      <SearchRow>
        <SearchInput
          type="text"
          placeholder="Search common foods or enter name..."
          value={search}
          onChange={e => { setSearch(e.target.value); setShowSuggestions(true) }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        />
        {showSuggestions && suggestions.length > 0 && (
          <SuggestionList>
            {suggestions.map(food => (
              <SuggestionItem key={food.name} onMouseDown={() => handleSuggestionSelect(food)}>
                <SuggestionName>{food.name}</SuggestionName>
                <SuggestionCal>{food.calories} kcal · {food.serving}</SuggestionCal>
              </SuggestionItem>
            ))}
          </SuggestionList>
        )}
      </SearchRow>

      {foodName && (
        <FieldGroup>
          <FieldLabel>Food name</FieldLabel>
          <FieldInput
            type="text"
            value={foodName}
            onChange={e => setFoodName(e.target.value)}
            placeholder="What did you eat?"
          />
        </FieldGroup>
      )}

      <FieldGroup>
        <FieldLabel>Serving size</FieldLabel>
        <FieldInput
          type="text"
          value={serving}
          onChange={e => setServing(e.target.value)}
          placeholder="e.g. 1 cup, 100g, 1 slice"
        />
      </FieldGroup>

      <EstimateButton
        onClick={handleEstimate}
        disabled={!currentFoodName.trim() || estimating}
      >
        {estimating ? 'Estimating...' : '✦ Estimate macros with Koda'}
      </EstimateButton>

      {estimateNote && <EstimateNote>{estimateNote}</EstimateNote>}
      {estimateError && <EstimateError>{estimateError}</EstimateError>}

      <MacroGrid>
        {[
          { key: 'calories', label: 'Calories', unit: 'kcal', step: '1' },
          { key: 'protein', label: 'Protein', unit: 'g', step: '0.1' },
          { key: 'carbs', label: 'Carbs', unit: 'g', step: '0.1' },
          { key: 'fat', label: 'Fat', unit: 'g', step: '0.1' },
        ].map(({ key, label, unit, step }) => (
          <MacroField key={key}>
            <MacroLabel $color={MACRO_COLORS[key]}>{label}</MacroLabel>
            <MacroInput
              type="number"
              inputMode="decimal"
              min="0"
              step={step}
              value={macros[key]}
              $color={MACRO_COLORS[key]}
              onChange={e => handleMacroChange(key, e.target.value)}
              placeholder="0"
            />
            <MacroUnit>{unit}</MacroUnit>
          </MacroField>
        ))}
      </MacroGrid>

      <FieldLabel style={{ display: 'block', marginBottom: '8px' }}>Meal</FieldLabel>
      <MealTypeRow>
        {MEAL_TYPES.map(mt => (
          <MealTypeChip
            key={mt.value}
            $active={mealType === mt.value}
            onClick={() => setMealType(mt.value)}
          >
            {mt.label}
          </MealTypeChip>
        ))}
      </MealTypeRow>

      <ButtonRow>
        <CancelButton onClick={onCancel}>Cancel</CancelButton>
        <SaveButton onClick={handleSave} disabled={!canSave}>
          {saving ? 'Saving...' : 'Save'}
        </SaveButton>
      </ButtonRow>
    </Wrapper>
  )
}
