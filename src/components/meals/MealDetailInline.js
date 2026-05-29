'use client'

import { useState, useTransition } from 'react'
import styled, { keyframes } from 'styled-components'
import { repeatMealAction, swapMeal, getWeekMealsAction, surpriseMeSideKodaAction, surpriseMeDessertKodaAction, surpriseMeSideWebAction, surpriseMeDessertWebAction, saveFeedbackAction } from '@/app/(app)/meals/actions'

const mealColors = {
  breakfast: { bg: 'amberLight', accent: 'amber', text: 'amberDark' },
  lunch: { bg: 'tealLight', accent: 'teal', text: 'tealDark' },
  dinner:         { bg: 'purpleLight', accent: 'purple', text: 'purpleDark' },
  sides:          { bg: 'purpleLight', accent: 'purple', text: 'purpleDark' },
  sides2:         { bg: 'purpleLight', accent: 'purple', text: 'purpleDark' },
  sides3:         { bg: 'purpleLight', accent: 'purple', text: 'purpleDark' },
  sides4:         { bg: 'purpleLight', accent: 'purple', text: 'purpleDark' },
  breakfast_side: { bg: 'amberLight',  accent: 'amber',  text: 'amberDark'  },
  lunch_side:     { bg: 'tealLight',   accent: 'teal',   text: 'tealDark'   },
  dinner_dessert: { bg: 'purpleLight', accent: 'purple', text: 'purpleDark' },
}

const slideDown = keyframes`
  from {
    opacity: 0;
    max-height: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    max-height: 1000px;
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
  margin-top: ${({ theme }) => theme.spacing.xs};
  animation: ${slideDown} 0.2s ease-out;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.md};
  padding-bottom: ${({ theme }) => theme.spacing.sm};
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

const RecipeImage = styled.img`
  width: 100%;
  height: 140px;
  object-fit: cover;
  display: block;
`

const Body = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`

const Description = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.5;
  margin: 0;
`

const ChipRow = styled.div`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
`

const Chip = styled.span`
  font-size: 10px;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-weight: 500;
  background: ${({ $variant, theme }) => {
    if ($variant === 'time') return theme.colors.borderLight
    return theme.colors.borderLight
  }};
  color: ${({ theme }) => theme.colors.textSecondary};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
`

const TagChip = styled.span`
  font-size: 10px;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-weight: 500;
  background: ${({ $type, theme }) => {
    const c = mealColors[$type] || mealColors.lunch
    return theme.colors[c.bg]
  }};
  color: ${({ $type, theme }) => {
    const c = mealColors[$type] || mealColors.lunch
    return theme.colors[c.text]
  }};
`

const Divider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.borderLight};
`

const SectionTitle = styled.div`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 6px;
`

const IngredientList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const IngredientItem = styled.li`
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textPrimary};

  &::before {
    content: '·';
    color: ${({ theme }) => theme.colors.textMuted};
    flex-shrink: 0;
  }
`

const Instructions = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textPrimary};
  line-height: 1.7;
  margin: 0;
  white-space: pre-wrap;
`

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

// ── Repeat sub-panel ──────────────────────────────────────────────────────────

const RepeatPanel = styled.div`
  background: ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`

const RepeatTitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const RepeatTitle = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const RepeatCancelLink = styled.button`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMuted};
  background: none;
  padding: 0;
  cursor: pointer;
  line-height: 1;

  &:hover {
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`

const ModeToggleRow = styled.div`
  display: flex;
  gap: 4px;
`

const ModeToggleButton = styled.button`
  flex: 1;
  padding: 5px 8px;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  background: ${({ $active, theme }) => $active ? theme.colors.surface : 'transparent'};
  color: ${({ $active, theme }) => $active ? theme.colors.textPrimary : theme.colors.textMuted};
  border: ${({ $active, theme }) => $active ? `1px solid ${theme.colors.border}` : '1px solid transparent'};
  box-shadow: ${({ $active, theme }) => $active ? theme.shadows.card : 'none'};
`

const DaysRow = styled.div`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
`

const DayPill = styled.button`
  padding: 4px 10px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 11px;
  font-weight: 500;
  cursor: ${({ $isSource }) => $isSource ? 'default' : 'pointer'};
  transition: all 0.15s ease;
  opacity: ${({ $isSource }) => $isSource ? 0.4 : 1};

  background: ${({ $active, $type, $isSource, theme }) => {
    if ($isSource) return theme.colors.borderLight
    if ($active) {
      const c = mealColors[$type] || mealColors.lunch
      return theme.colors[c.bg]
    }
    return theme.colors.surface
  }};
  color: ${({ $active, $type, $isSource, theme }) => {
    if ($isSource) return theme.colors.textMuted
    if ($active) {
      const c = mealColors[$type] || mealColors.lunch
      return theme.colors[c.text]
    }
    return theme.colors.textSecondary
  }};
  border: ${({ $active, $type, $isSource, theme }) => {
    if ($isSource) return `1px solid ${theme.colors.borderLight}`
    if ($active) {
      const c = mealColors[$type] || mealColors.lunch
      return `1px solid ${theme.colors[c.accent]}`
    }
    return `1px solid ${theme.colors.border}`
  }};
`

const NextXRow = styled.div`
  display: flex;
  gap: 4px;
`

const NextXButton = styled.button`
  width: 36px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  background: ${({ $active, $type, theme }) => {
    if ($active) {
      const c = mealColors[$type] || mealColors.lunch
      return theme.colors[c.bg]
    }
    return theme.colors.surface
  }};
  color: ${({ $active, $type, theme }) => {
    if ($active) {
      const c = mealColors[$type] || mealColors.lunch
      return theme.colors[c.text]
    }
    return theme.colors.textSecondary
  }};
  border: ${({ $active, $type, theme }) => {
    if ($active) {
      const c = mealColors[$type] || mealColors.lunch
      return `1px solid ${theme.colors[c.accent]}`
    }
    return `1px solid ${theme.colors.border}`
  }};
`

const RepeatConfirmButton = styled.button`
  padding: 7px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 12px;
  font-weight: 500;
  cursor: ${({ disabled }) => disabled ? 'default' : 'pointer'};
  transition: all 0.15s ease;
  width: 100%;
  min-height: 32px;

  background: ${({ $type, disabled, theme }) => {
    if (disabled) return theme.colors.borderLight
    const c = mealColors[$type] || mealColors.lunch
    return theme.colors[c.bg]
  }};
  color: ${({ $type, disabled, theme }) => {
    if (disabled) return theme.colors.textMuted
    const c = mealColors[$type] || mealColors.lunch
    return theme.colors[c.text]
  }};
  border: ${({ $type, disabled, theme }) => {
    if (disabled) return `0.5px solid ${theme.colors.border}`
    const c = mealColors[$type] || mealColors.lunch
    return `1px solid ${theme.colors[c.accent]}`
  }};
  opacity: ${({ disabled }) => disabled ? 0.6 : 1};
`

const SideOptionsRow = styled.div`
  display: flex;
  gap: 4px;
`

const SideOptionButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 5px 6px;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: 11px;
  font-weight: 500;
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  transition: all 0.12s ease;
  white-space: nowrap;

  &:hover {
    border-color: ${({ theme }) => theme.colors.teal};
    color: ${({ theme }) => theme.colors.teal};
    background: ${({ theme }) => theme.colors.tealLight};
  }
`

const SideInput = styled.input`
  width: 100%;
  padding: 8px 10px;
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.surface};
  outline: none;
  box-sizing: border-box;
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

const SurpriseMePill = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 5px 6px;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.12s ease;
  white-space: nowrap;
  background: ${({ $active }) => $active ? '#FFF7F5' : 'transparent'};
  color: ${({ $active }) => $active ? '#D85A30' : 'inherit'};
  border: 1px solid ${({ $active }) => $active ? '#D85A30' : 'transparent'};

  &:hover {
    background: #FFF7F5;
    color: #D85A30;
    border-color: #D85A30;
  }
`

const SurpriseExpandArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  padding-top: ${({ theme }) => theme.spacing.xs};
`

const SurpriseOptionRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`

const SurpriseOptionCard = styled.button`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  padding: 10px 10px;
  border-radius: ${({ theme }) => theme.radii.md};
  cursor: pointer;
  transition: all 0.12s ease;
  text-align: left;
  background: ${({ $active }) => $active ? '#FFF7F5' : ({ theme }) => theme.colors.borderLight};
  border: 1.5px solid ${({ $active }) => $active ? '#D85A30' : ({ theme }) => theme.colors.border};
`

const SurpriseOptionTitle = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: ${({ $active }) => $active ? '#D85A30' : ({ theme }) => theme.colors.textPrimary};
`

const SurpriseOptionDesc = styled.span`
  font-size: 10px;
  line-height: 1.4;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const SurpriseResultsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`

const SurpriseResultCard = styled.button`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
  padding: 10px;
  border-radius: ${({ theme }) => theme.radii.md};
  cursor: pointer;
  transition: all 0.12s ease;
  text-align: left;
  background: ${({ $active }) => $active ? '#FFF7F5' : ({ theme }) => theme.colors.surface};
  border: 1.5px solid ${({ $active }) => $active ? '#D85A30' : ({ theme }) => theme.colors.border};
`

const SurpriseResultName = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: ${({ $active }) => $active ? '#D85A30' : ({ theme }) => theme.colors.textPrimary};
`

const SurpriseResultDesc = styled.span`
  font-size: 11px;
  line-height: 1.4;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const SurpriseResultMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`

const SurpriseResultMetaChip = styled.span`
  font-size: 10px;
  padding: 1px 7px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.borderLight};
  color: ${({ theme }) => theme.colors.textSecondary};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
`

const SurpriseIngredientChips = styled.div`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
`

const SurpriseIngredientChip = styled.span`
  font-size: 10px;
  padding: 1px 7px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.borderLight};
  color: ${({ theme }) => theme.colors.textMuted};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
`

const SurpriseWebImage = styled.img`
  width: 100%;
  height: 80px;
  object-fit: cover;
  border-radius: ${({ theme }) => theme.radii.sm};
  display: block;
`

const SurpriseSourceLink = styled.a`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.textMuted};
  text-decoration: none;
  &:hover { text-decoration: underline; }
`

const SurpriseErrorText = styled.p`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.coral};
  margin: 0;
  text-align: center;
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
    if ($variant === 'danger') return theme.colors.coralLight
    return theme.colors.borderLight
  }};
  color: ${({ $variant, theme }) => {
    if ($variant === 'danger') return theme.colors.coral
    return theme.colors.textPrimary
  }};
  border: ${({ $variant, theme }) => {
    if ($variant === 'danger') return 'none'
    return `0.5px solid ${theme.colors.border}`
  }};

  &:hover {
    opacity: 0.9;
  }
`

const ReasonPanel = styled(RepeatPanel)``

const ReasonChipsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`

const ReasonChip = styled.button`
  padding: 5px 12px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.12s ease;
  background: ${({ $active, theme }) => $active ? theme.colors.purple : theme.colors.surface};
  color: ${({ $active, theme }) => $active ? 'white' : theme.colors.textSecondary};
  border: 1px solid ${({ $active, theme }) => $active ? theme.colors.purple : theme.colors.border};

  &:hover {
    border-color: ${({ theme }) => theme.colors.purple};
    color: ${({ theme }) => theme.colors.purple};
  }
`

const SkipChip = styled(ReasonChip)`
  background: transparent;
  color: ${({ theme }) => theme.colors.textMuted};
  border-style: dashed;
`

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

const SWAP_REASONS = [
  'Not my taste',
  'Has an ingredient I don\'t like',
  'Too complex',
  'Takes too long',
  'Already had this recently',
  'No reason',
]

export default function MealDetailInline({ meal, onClose, onSwap, onAddToGrocery, onRemove, onRepeat, weekOffset = 0, onSidePickerOpen, onDessertPickerOpen, sideType: propSideType, dessertType }) {
  const [repeatOpen, setRepeatOpen] = useState(false)
  const [swapStep, setSwapStep] = useState(null) // null | 'reason' | 'ingredient'
  const [selectedSwapReason, setSelectedSwapReason] = useState(null)
  const [repeatMode, setRepeatMode] = useState('pick') // 'pick' | 'next'
  const [selectedDays, setSelectedDays] = useState([])
  const [nextX, setNextX] = useState(null)
  const [isRepeating, startRepeatTransition] = useTransition()

  // 'side' | 'dessert' | null
  const [extraOpen, setExtraOpen] = useState(null)
  const [sideName, setSideName] = useState('')
  const [isSavingSide, startSideTransition] = useTransition()

  // Surprise Me state
  const [surpriseOpen, setSurpriseOpen] = useState(false)
  const [surpriseOptionMode, setSurpriseOptionMode] = useState(null) // 'koda' | 'web'
  const [surprisePreference, setSurprisePreference] = useState('')
  const [surpriseResults, setSurpriseResults] = useState(null)
  const [surpriseError, setSurpriseError] = useState(null)
  const [selectedSurpriseIdx, setSelectedSurpriseIdx] = useState(null)
  const [isSurprising, startSurpriseTransition] = useTransition()

  if (!meal) return null

  const recipe = meal.recipe ?? null
  const recipeIngredients = recipe?.ingredients ?? []
  const tags = recipe?.tags ?? []
  const prepTime = recipe?.prep_time_minutes
  const cookTime = recipe?.cook_time_minutes
  const servings = recipe?.servings

  // Fallback for non-recipe meals (manual name, no recipe object)
  const slotIngredients = meal.ingredients || []
  const needCount = slotIngredients.filter(i => !i.have).length

  function openRepeat(e) {
    e.stopPropagation()
    setRepeatOpen(true)
    setRepeatMode('pick')
    setSelectedDays([])
    setNextX(null)
  }

  function closeRepeat(e) {
    e?.stopPropagation()
    setRepeatOpen(false)
  }

  function toggleDay(day) {
    if (day === meal.day) return
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  // Compute target days for "next X days" mode
  function getNextXDays(x) {
    const sourceIdx = ALL_DAYS.indexOf(meal.day)
    const targets = []
    for (let i = 1; i <= x; i++) {
      const idx = sourceIdx + i
      if (idx < ALL_DAYS.length) targets.push(ALL_DAYS[idx])
    }
    return targets
  }

  const confirmTargetDays = repeatMode === 'pick'
    ? selectedDays
    : (nextX != null ? getNextXDays(nextX) : [])

  const canConfirm = confirmTargetDays.length > 0 && !isRepeating

  function handleRepeatConfirm(e) {
    e.stopPropagation()
    if (!canConfirm) return
    startRepeatTransition(async () => {
      const result = await repeatMealAction(meal.day, meal.type, confirmTargetDays, weekOffset)
      if (result.success) {
        setRepeatOpen(false)
        if (onRepeat && result.data?.meals) onRepeat(result.data.meals)
        onClose()
      }
    })
  }

  // Side dish slot — explicitly passed (e.g. dinner's next empty sides slot)
  // or derived from meal type for breakfast / lunch.
  const sideType = propSideType !== undefined ? propSideType : (
    meal.type === 'breakfast' ? 'breakfast_side'
    : meal.type === 'lunch' ? 'lunch_side'
    : null
  )

  function resetSurprise() {
    setSurpriseOpen(false)
    setSurpriseOptionMode(null)
    setSurprisePreference('')
    setSurpriseResults(null)
    setSurpriseError(null)
    setSelectedSurpriseIdx(null)
  }

  function openExtra(which, e) {
    e.stopPropagation()
    setExtraOpen(which)
    setSideName('')
    setRepeatOpen(false)
    resetSurprise()
  }

  function closeExtra(e) {
    e?.stopPropagation()
    setExtraOpen(null)
    setSideName('')
    resetSurprise()
  }

  const activeExtraType = extraOpen === 'side' ? sideType : extraOpen === 'dessert' ? dessertType : null
  const activePickerOpen = extraOpen === 'side' ? onSidePickerOpen : extraOpen === 'dessert' ? onDessertPickerOpen : null

  function handleExtraConfirm(e) {
    e?.stopPropagation()
    const name = sideName.trim()
    if (!name || isSavingSide || !activeExtraType) return
    startSideTransition(async () => {
      const result = await swapMeal(meal.day, activeExtraType, name)
      if (result.success) {
        setExtraOpen(null)
        onClose()
        if (onRepeat) {
          if (result.data?.meals) {
            onRepeat(result.data.meals)
          } else {
            const weekResult = await getWeekMealsAction(weekOffset)
            if (weekResult.success && weekResult.data?.meals) onRepeat(weekResult.data.meals)
          }
        }
      }
    })
  }

  function handleSurpriseSearch(e) {
    e?.stopPropagation()
    if (!surpriseOptionMode || isSurprising) return
    startSurpriseTransition(async () => {
      setSurpriseResults(null)
      setSurpriseError(null)
      setSelectedSurpriseIdx(null)
      try {
        let result
        if (surpriseOptionMode === 'koda') {
          result = extraOpen === 'dessert'
            ? await surpriseMeDessertKodaAction(meal.name, surprisePreference)
            : await surpriseMeSideKodaAction(meal.name, surprisePreference)
        } else {
          result = extraOpen === 'dessert'
            ? await surpriseMeDessertWebAction(meal.name, surprisePreference)
            : await surpriseMeSideWebAction(meal.name, surprisePreference)
        }
        if (result.success) {
          setSurpriseResults(result.data.suggestions ?? result.data.recipes ?? [])
        } else {
          setSurpriseError(result.error || 'Something went wrong. Try again!')
        }
      } catch {
        setSurpriseError('Something went wrong. Try again!')
      }
    })
  }

  function handleSurpriseAdd(e) {
    e?.stopPropagation()
    if (selectedSurpriseIdx == null || !activeExtraType) return
    const selected = surpriseResults[selectedSurpriseIdx]
    startSideTransition(async () => {
      const result = await swapMeal(meal.day, activeExtraType, selected.name)
      if (result.success) {
        setExtraOpen(null)
        onClose()
        if (onRepeat) {
          if (result.data?.meals) {
            onRepeat(result.data.meals)
          } else {
            const weekResult = await getWeekMealsAction(weekOffset)
            if (weekResult.success && weekResult.data?.meals) onRepeat(weekResult.data.meals)
          }
        }
      }
    })
  }

  return (
    <Panel $type={meal.type}>
      <Header>
        <div>
          <MealName>{meal.name}</MealName>
          <DayLabel>{meal.day}{meal.time && ` · ${meal.time}`}</DayLabel>
        </div>
        <CloseButton onClick={(e) => { e.stopPropagation(); onClose() }}>{'\u2715'}</CloseButton>
      </Header>

      {recipe?.image_url && (
        <RecipeImage src={recipe.image_url} alt={meal.name} />
      )}

      <Body>
        {recipe?.description && (
          <Description>{recipe.description}</Description>
        )}

        {(prepTime || cookTime || servings) && (
          <ChipRow>
            {prepTime && <Chip>Prep {prepTime} min</Chip>}
            {cookTime && <Chip>Cook {cookTime} min</Chip>}
            {servings && <Chip>{servings} servings</Chip>}
          </ChipRow>
        )}

        {tags.length > 0 && (
          <ChipRow>
            {tags.map((tag) => (
              <TagChip key={tag} $type={meal.type}>{tag}</TagChip>
            ))}
          </ChipRow>
        )}

        {recipeIngredients.length > 0 && (
          <>
            <Divider />
            <div>
              <SectionTitle>Ingredients</SectionTitle>
              <IngredientList>
                {recipeIngredients.map((ing, i) => (
                  <IngredientItem key={i}>
                    {typeof ing === 'string' ? ing : ing.name}
                    {ing.quantity ? ` — ${ing.quantity}` : ''}
                  </IngredientItem>
                ))}
              </IngredientList>
            </div>
          </>
        )}

        {recipe?.instructions && (
          <>
            <Divider />
            <div>
              <SectionTitle>Instructions</SectionTitle>
              <Instructions>{recipe.instructions}</Instructions>
            </div>
          </>
        )}

        {/* Non-recipe slot: show grocery action if needed */}
        {!recipe && needCount > 0 && (
          <ActionButton $variant="primary" onClick={(e) => { e.stopPropagation(); onAddToGrocery() }}>
            + Add {needCount} to grocery
          </ActionButton>
        )}

        <Divider />

        {extraOpen ? (
          <RepeatPanel onClick={(e) => e.stopPropagation()}>
            <RepeatTitleRow>
              <RepeatTitle>{extraOpen === 'dessert' ? 'Add a dessert' : 'Add a side dish'}</RepeatTitle>
              <RepeatCancelLink onClick={closeExtra}>{'\u2715'}</RepeatCancelLink>
            </RepeatTitleRow>
            <SideInput
              type="text"
              placeholder={extraOpen === 'dessert' ? 'e.g. Ice cream, fruit, cookies...' : 'e.g. Fruit salad, toast, yogurt...'}
              value={sideName}
              onChange={(e) => setSideName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleExtraConfirm(e)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
              disabled={isSavingSide}
            />
            {activePickerOpen && (
              <SideOptionsRow onClick={(e) => e.stopPropagation()}>
                <SideOptionButton onClick={() => activePickerOpen('library')}>
                  📖 Recipes
                </SideOptionButton>
                <SideOptionButton onClick={() => activePickerOpen('url')}>
                  🔗 URL
                </SideOptionButton>
                <SideOptionButton onClick={() => activePickerOpen('ai')}>
                  ✨ Koda
                </SideOptionButton>
                <SurpriseMePill
                  $active={surpriseOpen}
                  onClick={(e) => { e.stopPropagation(); setSurpriseOpen(v => !v); if (surpriseOpen) resetSurprise() }}
                >
                  🎉 Surprise Me
                </SurpriseMePill>
              </SideOptionsRow>
            )}

            {surpriseOpen && (
              <SurpriseExpandArea onClick={(e) => e.stopPropagation()}>
                <SideInput
                  type="text"
                  placeholder="Any preferences? e.g. something light, no nuts, spicy..."
                  value={surprisePreference}
                  onChange={(e) => setSurprisePreference(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  disabled={isSurprising}
                />
                {!surpriseResults && (
                  <SurpriseOptionRow>
                    <SurpriseOptionCard
                      $active={surpriseOptionMode === 'koda'}
                      onClick={(e) => { e.stopPropagation(); setSurpriseOptionMode('koda') }}
                    >
                      <SurpriseOptionTitle $active={surpriseOptionMode === 'koda'}>✨ Koda creates</SurpriseOptionTitle>
                      <SurpriseOptionDesc>Koda generates a suggestion that complements your meal.</SurpriseOptionDesc>
                    </SurpriseOptionCard>
                    <SurpriseOptionCard
                      $active={surpriseOptionMode === 'web'}
                      onClick={(e) => { e.stopPropagation(); setSurpriseOptionMode('web') }}
                    >
                      <SurpriseOptionTitle $active={surpriseOptionMode === 'web'}>🌐 Search the web</SurpriseOptionTitle>
                      <SurpriseOptionDesc>Find highly rated recipes online.</SurpriseOptionDesc>
                    </SurpriseOptionCard>
                  </SurpriseOptionRow>
                )}
                {surpriseError && <SurpriseErrorText>{surpriseError}</SurpriseErrorText>}
                {surpriseResults && surpriseResults.length > 0 && (
                  <SurpriseResultsGrid>
                    {surpriseResults.map((item, i) => {
                      const isActive = selectedSurpriseIdx === i
                      const totalTime = (item.prep_time_minutes || 0) + (item.cook_time_minutes || 0)
                      const isWeb = item.review_count != null
                      return (
                        <SurpriseResultCard
                          key={i}
                          $active={isActive}
                          onClick={(e) => { e.stopPropagation(); setSelectedSurpriseIdx(isActive ? null : i) }}
                        >
                          {isWeb && item.image_url && (
                            <SurpriseWebImage src={item.image_url} alt={item.name} />
                          )}
                          <SurpriseResultName $active={isActive}>{item.name}</SurpriseResultName>
                          {item.description && <SurpriseResultDesc>{item.description}</SurpriseResultDesc>}
                          <SurpriseResultMeta>
                            {totalTime > 0 && <SurpriseResultMetaChip>{totalTime} min</SurpriseResultMetaChip>}
                            {item.rating != null && <SurpriseResultMetaChip>{'★'} {item.rating.toFixed(1)}</SurpriseResultMetaChip>}
                            {item.review_count != null && <SurpriseResultMetaChip>{item.review_count.toLocaleString()} reviews</SurpriseResultMetaChip>}
                            {item.source_url && (
                              <SurpriseSourceLink
                                href={item.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {(() => { try { return new URL(item.source_url).hostname.replace(/^www\./, '') } catch { return item.source_url } })()}
                              </SurpriseSourceLink>
                            )}
                          </SurpriseResultMeta>
                          {Array.isArray(item.key_ingredients) && item.key_ingredients.length > 0 && (
                            <SurpriseIngredientChips>
                              {item.key_ingredients.map((ing, j) => (
                                <SurpriseIngredientChip key={j}>{ing}</SurpriseIngredientChip>
                              ))}
                            </SurpriseIngredientChips>
                          )}
                        </SurpriseResultCard>
                      )
                    })}
                  </SurpriseResultsGrid>
                )}
              </SurpriseExpandArea>
            )}

            <RepeatConfirmButton
              $type={meal.type}
              disabled={
                surpriseOpen
                  ? (surpriseResults != null
                      ? (selectedSurpriseIdx == null || isSavingSide)
                      : (!surpriseOptionMode || isSurprising))
                  : (!sideName.trim() || isSavingSide)
              }
              onClick={
                surpriseOpen
                  ? (surpriseResults != null ? handleSurpriseAdd : handleSurpriseSearch)
                  : handleExtraConfirm
              }
            >
              {surpriseOpen
                ? (isSurprising
                    ? 'Finding...'
                    : isSavingSide
                      ? 'Saving...'
                      : surpriseResults != null
                        ? (extraOpen === 'dessert' ? 'Add this dessert' : 'Add this side')
                        : 'Find me something')
                : (isSavingSide ? 'Saving...' : extraOpen === 'dessert' ? 'Add dessert' : 'Add side')
              }
            </RepeatConfirmButton>
          </RepeatPanel>
        ) : repeatOpen ? (
          <RepeatPanel onClick={(e) => e.stopPropagation()}>
            <RepeatTitleRow>
              <RepeatTitle>Repeat this meal</RepeatTitle>
              <RepeatCancelLink onClick={closeRepeat}>{'\u2715'}</RepeatCancelLink>
            </RepeatTitleRow>

            <ModeToggleRow>
              <ModeToggleButton
                $active={repeatMode === 'pick'}
                onClick={(e) => { e.stopPropagation(); setRepeatMode('pick'); setSelectedDays([]); setNextX(null) }}
              >
                Pick days
              </ModeToggleButton>
              <ModeToggleButton
                $active={repeatMode === 'next'}
                onClick={(e) => { e.stopPropagation(); setRepeatMode('next'); setSelectedDays([]); setNextX(null) }}
              >
                Next X days
              </ModeToggleButton>
            </ModeToggleRow>

            {repeatMode === 'pick' ? (
              <DaysRow>
                {ALL_DAYS.map(day => {
                  const isSource = day === meal.day
                  const isActive = selectedDays.includes(day)
                  return (
                    <DayPill
                      key={day}
                      $active={isActive}
                      $type={meal.type}
                      $isSource={isSource}
                      onClick={(e) => { e.stopPropagation(); toggleDay(day) }}
                      disabled={isSource}
                    >
                      {day}
                    </DayPill>
                  )
                })}
              </DaysRow>
            ) : (
              <NextXRow>
                {[1, 2, 3, 4].map(n => {
                  const sourceIdx = ALL_DAYS.indexOf(meal.day)
                  const available = ALL_DAYS.length - 1 - sourceIdx
                  const isDisabled = n > available
                  return (
                    <NextXButton
                      key={n}
                      $active={nextX === n}
                      $type={meal.type}
                      onClick={(e) => { e.stopPropagation(); if (!isDisabled) setNextX(n) }}
                      disabled={isDisabled}
                      style={{ opacity: isDisabled ? 0.35 : 1, cursor: isDisabled ? 'default' : 'pointer' }}
                    >
                      {n}
                    </NextXButton>
                  )
                })}
              </NextXRow>
            )}

            <RepeatConfirmButton
              $type={meal.type}
              disabled={!canConfirm}
              onClick={handleRepeatConfirm}
            >
              {isRepeating ? 'Repeating...' : 'Repeat'}
            </RepeatConfirmButton>
          </RepeatPanel>
        ) : swapStep === 'reason' ? (
          <ReasonPanel onClick={(e) => e.stopPropagation()}>
            <RepeatTitleRow>
              <RepeatTitle>Why are you swapping?</RepeatTitle>
              <RepeatCancelLink onClick={(e) => { e.stopPropagation(); setSwapStep(null) }}>{'\u2715'}</RepeatCancelLink>
            </RepeatTitleRow>
            <ReasonChipsRow>
              {SWAP_REASONS.map((reason) => (
                <ReasonChip
                  key={reason}
                  $active={selectedSwapReason === reason}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (reason === "Has an ingredient I don't like" && recipeIngredients.length > 0) {
                      setSelectedSwapReason(reason)
                      setSwapStep('ingredient')
                    } else {
                      const weekStart = new Date().toISOString().split('T')[0]
                      saveFeedbackAction({
                        mealName: meal.name,
                        swapReason: reason,
                        ingredients: recipeIngredients.map(i => typeof i === 'string' ? i : i.name),
                        weekStart,
                      }).catch(() => {})
                      onSwap()
                    }
                  }}
                >
                  {reason}
                </ReasonChip>
              ))}
            </ReasonChipsRow>
          </ReasonPanel>
        ) : swapStep === 'ingredient' ? (
          <ReasonPanel onClick={(e) => e.stopPropagation()}>
            <RepeatTitleRow>
              <RepeatTitle>Which ingredient?</RepeatTitle>
              <RepeatCancelLink onClick={(e) => { e.stopPropagation(); setSwapStep('reason') }}>{'\u2715'}</RepeatCancelLink>
            </RepeatTitleRow>
            <ReasonChipsRow>
              {recipeIngredients.map((ing, i) => {
                const ingName = typeof ing === 'string' ? ing : ing.name
                return (
                  <ReasonChip
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation()
                      const weekStart = new Date().toISOString().split('T')[0]
                      saveFeedbackAction({
                        mealName: meal.name,
                        swapReason: selectedSwapReason,
                        ingredients: [ingName],
                        weekStart,
                      }).catch(() => {})
                      onSwap()
                    }}
                  >
                    {ingName}
                  </ReasonChip>
                )
              })}
              <SkipChip
                onClick={(e) => {
                  e.stopPropagation()
                  const weekStart = new Date().toISOString().split('T')[0]
                  saveFeedbackAction({
                    mealName: meal.name,
                    swapReason: selectedSwapReason,
                    ingredients: [],
                    weekStart,
                  }).catch(() => {})
                  onSwap()
                }}
              >
                Skip
              </SkipChip>
            </ReasonChipsRow>
          </ReasonPanel>
        ) : (
          <Actions>
            <ActionButton onClick={(e) => openRepeat(e)}>
              {'\u21BB'} Repeat
            </ActionButton>
            <ActionButton onClick={(e) => {
              e.stopPropagation()
              if (meal.suggestedByKoda) {
                setSwapStep('reason')
                setSelectedSwapReason(null)
              } else {
                onSwap()
              }
            }}>
              {'\u21C4'} Swap
            </ActionButton>
            <ActionButton $variant="danger" onClick={(e) => { e.stopPropagation(); onRemove() }}>
              {'\u2715'} Remove
            </ActionButton>
            {(sideType || dessertType) && <Divider />}
            {sideType && (
              <ActionButton onClick={(e) => openExtra('side', e)}>
                + Add a side
              </ActionButton>
            )}
            {dessertType && (
              <ActionButton onClick={(e) => openExtra('dessert', e)}>
                + Add a dessert
              </ActionButton>
            )}
          </Actions>
        )}
      </Body>
    </Panel>
  )
}
