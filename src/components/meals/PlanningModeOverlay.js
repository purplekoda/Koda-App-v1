'use client'

import { useState, useEffect } from 'react'
import styled, { keyframes } from 'styled-components'
import RecipePickerModal from '@/components/meals/RecipePickerModal'

// ─── Animations ───────────────────────────────────────────────────────────────

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`

const slideUp = keyframes`
  from { transform: translateY(16px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
`

const pulse = keyframes`
  0%, 100% { opacity: 1;   transform: scale(1);    }
  50%       { opacity: 0.5; transform: scale(0.94); }
`

// ─── Overlay shell (Fix 2: white, content-area only on desktop) ────────────────

const PlanningOverlay = styled.div`
  position: fixed;
  top: 0;
  bottom: 0;
  right: 0;
  left: ${({ theme }) => theme.sidebarWidth};
  background: ${({ theme }) => theme.colors.background};
  display: flex;
  flex-direction: column;
  z-index: 1100;
  animation: ${fadeIn} 0.2s ease;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    left: 0;
  }
`

// ─── Header (Fix 6) ───────────────────────────────────────────────────────────

const PlanningHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 24px 32px 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  flex-shrink: 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 20px 20px 16px;
  }
`

const PlanningHeaderText = styled.div`
  flex: 1;
  min-width: 0;
`

const PlanningTitle = styled.h2`
  font-size: 22px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: 4px;
`

const PlanningSubtitle = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.4;
`

// Matches the CloseButton in the AI fill dialog: 32×32, borderLight bg
const CloseBtn = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.borderLight};
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  flex-shrink: 0;
  margin-left: 16px;
  transition: background 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.border};
  }
`

// ─── Body ──────────────────────────────────────────────────────────────────────

const PlanningBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 20px;
  }
`

// ─── Info badge (Fix 5) ────────────────────────────────────────────────────────

const InfoBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #E1F5EE;
  color: #085041;
  font-size: 12px;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: ${({ theme }) => theme.radii.pill};
  align-self: flex-start;
  line-height: 1.4;
  flex-shrink: 0;
`

// ─── Vertical day cards (Fix 3) ────────────────────────────────────────────────

const DayCardList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const DayCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
  animation: ${slideUp} 0.2s ease;
`

const DayCardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
`

const DayCardHeaderLabel = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const TodayPill = styled.span`
  font-size: 10px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.teal};
  background: ${({ theme }) => theme.colors.tealLight};
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.pill};
`

const DayCardBody = styled.div`
  padding: 12px 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    flex-direction: column;
  }
`

const EmptyDayText = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
  padding: 2px 0;
`

// ─── Meal chip (Fix 3) ─────────────────────────────────────────────────────────

const MealChip = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 10px 12px;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  flex: 1;
  min-width: 160px;

  &:hover {
    border-color: ${({ theme }) => theme.colors.teal};
    box-shadow: ${({ theme }) => theme.shadows.card};
  }
`

const ChipEmoji = styled.span`
  font-size: 22px;
  line-height: 1;
  flex-shrink: 0;
`

const ChipText = styled.div`
  flex: 1;
  min-width: 0;
`

const ChipType = styled.div`
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 2px;
`

const ChipName = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const ChipMeta = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: 2px;
`

const ChipSwapBtn = styled.button`
  font-size: 11px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textMuted};
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: ${({ theme }) => theme.radii.sm};
  flex-shrink: 0;
  transition: background 0.12s ease, color 0.12s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.tealLight};
    color: ${({ theme }) => theme.colors.teal};
  }
`

// ─── Footer (Fix 2: light border for white bg) ────────────────────────────────

const PlanningFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 32px;
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
  flex-shrink: 0;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 16px 20px;
  }
`

const shimmer = keyframes`
  0%   { background-position: -200px 0; }
  100% { background-position:  200px 0; }
`

const StartOverBtn = styled.button`
  padding: 11px 20px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.border};
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.textMuted};
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

const SaveBtn = styled.button`
  padding: 11px 28px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ $loading, theme }) =>
    $loading
      ? `linear-gradient(90deg, ${theme.colors.tealLight} 0%, ${theme.colors.tealMid} 50%, ${theme.colors.tealLight} 100%)`
      : theme.colors.teal};
  background-size: 400px 100%;
  animation: ${({ $loading }) => $loading ? shimmer : 'none'} 1.5s ease infinite;
  border: none;
  font-size: 14px;
  font-weight: 600;
  color: ${({ $loading }) => $loading ? '#1D9E75' : '#ffffff'};
  cursor: ${({ $loading }) => $loading ? 'wait' : 'pointer'};
  transition: opacity 0.15s ease;

  &:hover { opacity: ${({ $loading }) => $loading ? 1 : 0.9}; }
  &:disabled { opacity: 0.6; cursor: wait; }
`

// ─── Loading screen (Fix 4) ───────────────────────────────────────────────────

const LoadingScreen = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 48px 24px;
`

const LoadingLogo = styled.div`
  font-size: 52px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.teal};
  animation: ${pulse} 1.8s ease-in-out infinite;
  line-height: 1;
`

const LoadingTitle = styled.p`
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textMuted};
`

const LoadingProgress = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: center;
  max-width: 400px;
  line-height: 1.7;
`

// ─── Expanded slot view (unchanged) ───────────────────────────────────────────

const ExpandedOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
  padding: 16px;
  animation: ${fadeIn} 0.12s ease;
`

const ExpandedCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.xl};
  width: 100%;
  max-width: 480px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.32);
  overflow: hidden;
  animation: ${slideUp} 0.18s ease;
`

const ExpandedHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px 20px 12px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  flex-shrink: 0;
`

const ExpandedHeaderText = styled.div`
  flex: 1;
  min-width: 0;
`

const ExpandedName = styled.h3`
  font-size: 17px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: 4px;
`

const ExpandedSubLine = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: capitalize;
`

const ExpandedBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`

const ExpandedSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const ExpandedSectionTitle = styled.h4`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`

const ExpandedDescription = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.55;
`

const IngredientCheckRow = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ $checked, theme }) => $checked ? theme.colors.tealLight : theme.colors.background};
  border-left: 3px solid ${({ $checked, $pantry, theme }) =>
    $pantry ? theme.colors.teal : $checked ? theme.colors.tealMid : 'transparent'};
  cursor: pointer;
  transition: background 0.1s ease;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  user-select: none;

  input[type='checkbox'] {
    accent-color: ${({ theme }) => theme.colors.teal};
    width: 15px;
    height: 15px;
    flex-shrink: 0;
    cursor: pointer;
  }
`

const IngredientName = styled.span`
  flex: 1;
  min-width: 0;
`

const PantryBadge = styled.span`
  font-size: 10px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.teal};
  background: ${({ theme }) => theme.colors.tealLight};
  padding: 2px 7px;
  border-radius: ${({ theme }) => theme.radii.pill};
  white-space: nowrap;
`

const InstructionsList = styled.ol`
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const InstructionItem = styled.li`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.55;
`

const MacroRow = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`

const MacroChip = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 14px;
  background: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
`

const MacroValue = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const MacroLabel = styled.div`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`

const ExpandedFooter = styled.div`
  display: flex;
  gap: 10px;
  padding: 12px 20px 16px;
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
  flex-shrink: 0;
`

const CollapseBtn = styled.button`
  flex: 1;
  padding: 10px 16px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.borderLight};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;

  &:hover { background: ${({ theme }) => theme.colors.border}; }
`

// ─── Helpers ───────────────────────────────────────────────────────────────────

const DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_FULL  = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function getTypeLabel(type) {
  const labels = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    sides: 'Side',
    sides2: 'Side 2',
    breakfast_side: 'Side',
    lunch_side: 'Side',
    dinner_dessert: 'Dessert',
  }
  return labels[type] || type
}

function parseInstructions(raw) {
  if (!raw) return []
  if (Array.isArray(raw)) return raw.map(String)
  return String(raw)
    .split(/\n+/)
    .map(s => s.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean)
}

function getWeekDates(offset = 0) {
  const today = new Date()
  const dow = today.getDay() // 0=Sun, 1=Mon
  const daysToMonday = dow === 0 ? 6 : dow - 1
  const monday = new Date(today)
  monday.setDate(today.getDate() - daysToMonday + offset * 7)
  return DAY_ORDER.map((_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function PlanningModeOverlay({
  isOpen,
  isGenerating = false,
  slots,
  weekOffset = 0,
  recipes = [],
  collections = [],
  collectionLinks = [],
  isSaving,
  onSave,
  onStartOver,
  onClose,
}) {
  const [localSlots, setLocalSlots] = useState(slots || [])
  const [expandedSlotKey, setExpandedSlotKey] = useState(null)
  const [checkedMap, setCheckedMap] = useState({})
  const [swapPickerOpen, setSwapPickerOpen] = useState(false)
  const [swapPickerDay, setSwapPickerDay] = useState(null)
  const [swapPickerType, setSwapPickerType] = useState(null)
  const [progressIdx, setProgressIdx] = useState(-1)

  // Sync localSlots when parent passes new slots (e.g. after draft resume or swap)
  useEffect(() => {
    setLocalSlots(slots || [])
  }, [slots])

  // Build initial checkedMap: all checked except inPantry/isStaple
  useEffect(() => {
    if (!slots || slots.length === 0) return
    const map = {}
    for (const slot of slots) {
      const ingredients = slot.recipe?.ingredients || []
      for (const ing of ingredients) {
        const key = `${slot.day}:${slot.type}:${ing.name}`
        map[key] = !(ing.inPantry || ing.isStaple)
      }
    }
    setCheckedMap(map)
  }, [slots])

  // Simulated day-by-day progress while generating (Fix 4)
  useEffect(() => {
    if (!isGenerating) {
      setProgressIdx(-1)
      return
    }
    setProgressIdx(0)
    const interval = setInterval(() => {
      setProgressIdx(prev => (prev < DAY_FULL.length - 1 ? prev + 1 : prev))
    }, 1400)
    return () => clearInterval(interval)
  }, [isGenerating])

  if (!isOpen && !isGenerating) return null

  // Fix 1: use slots prop as fallback when localSlots hasn't synced yet
  const displaySlots = localSlots.length > 0 ? localSlots : (slots || [])

  // Group slots by day
  const weekDates = getWeekDates(weekOffset)
  const today = new Date()
  const dayGroups = DAY_ORDER.map((day, i) => {
    const date = weekDates[i]
    const isToday = date.toDateString() === today.toDateString()
    const dayFull = DAY_FULL[i]
    const dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return {
      day,
      dayFull,
      dateLabel,
      isToday,
      slots: displaySlots.filter(s => s.day === day),
    }
  })

  function toggleIngredient(slotDay, slotType, ingName) {
    const key = `${slotDay}:${slotType}:${ingName}`
    setCheckedMap(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function handleChipClick(slotKey) {
    setExpandedSlotKey(prev => (prev === slotKey ? null : slotKey))
  }

  function handleSwapClick(e, day, type) {
    e.stopPropagation()
    setSwapPickerDay(day)
    setSwapPickerType(type)
    setSwapPickerOpen(true)
  }

  function handleSwapAssigned(assignedData) {
    setLocalSlots(prev => prev.map(s => {
      if (s.day === swapPickerDay && s.type === swapPickerType) {
        const newRecipe = assignedData.recipe || {
          id: null,
          name: assignedData.recipeName || s.recipe?.name,
          description: s.recipe?.description,
          emoji: s.recipe?.emoji,
          ingredients: s.recipe?.ingredients,
          instructions: s.recipe?.instructions,
          cook_time_minutes: s.recipe?.cook_time_minutes,
          prep_time_minutes: s.recipe?.prep_time_minutes,
          servings: s.recipe?.servings,
          estimated_cost: s.recipe?.estimated_cost,
          macros: s.recipe?.macros,
          isFromRecipeBox: !!(assignedData.recipe?.id),
        }
        return { ...s, recipe: newRecipe }
      }
      return s
    }))
    setSwapPickerOpen(false)
  }

  function handleSave() {
    const slotsWithChecked = displaySlots.map(slot => ({
      ...slot,
      checkedIngredients: (slot.recipe?.ingredients || [])
        .filter(ing => checkedMap[`${slot.day}:${slot.type}:${ing.name}`] !== false)
        .map(ing => ing.name),
    }))
    onSave(slotsWithChecked)
  }

  const expandedSlot = expandedSlotKey
    ? displaySlots.find(s => `${s.day}:${s.type}` === expandedSlotKey)
    : null

  const instructions = parseInstructions(expandedSlot?.recipe?.instructions)

  // ─── Loading progress text (Fix 4) ─────────────────────────────────────────
  function buildProgressText() {
    if (progressIdx < 0) return 'Starting…'
    const doneParts = DAY_FULL.slice(0, progressIdx).map(d => `${d} done`)
    const working = DAY_FULL[progressIdx]
    return [...doneParts, `Working on ${working}…`].join(' · ')
  }

  return (
    <>
      <PlanningOverlay>

        {/* ─── Loading state (Fix 4) ─────────────────────────────────────── */}
        {isGenerating && !isOpen && (
          <LoadingScreen>
            <LoadingLogo>K</LoadingLogo>
            <LoadingTitle>Building your week…</LoadingTitle>
            <LoadingProgress>{buildProgressText()}</LoadingProgress>
          </LoadingScreen>
        )}

        {/* ─── Planning view ─────────────────────────────────────────────── */}
        {isOpen && (
          <>
            {/* Fix 6: header with dark title + subtitle */}
            <PlanningHeader>
              <PlanningHeaderText>
                <PlanningTitle>Review your week</PlanningTitle>
                <PlanningSubtitle>
                  Review and adjust before saving — all changes are temporary until you tap Save week.
                </PlanningSubtitle>
              </PlanningHeaderText>
              <CloseBtn onClick={onClose} aria-label="Close">{'✕'}</CloseBtn>
            </PlanningHeader>

            <PlanningBody>
              {/* Fix 5: ingredient note as small green badge */}
              <InfoBadge>
                <span>ℹ️</span>
                All ingredients selected for your grocery list — uncheck any you already have.
              </InfoBadge>

              {/* Fix 3: vertical day cards */}
              <DayCardList>
                {dayGroups.map(({ day, dayFull, dateLabel, isToday, slots: daySlots }) => (
                  <DayCard key={day}>
                    <DayCardHeader>
                      <DayCardHeaderLabel>{dayFull} · {dateLabel}</DayCardHeaderLabel>
                      {isToday && <TodayPill>Today</TodayPill>}
                    </DayCardHeader>
                    <DayCardBody>
                      {daySlots.length === 0 ? (
                        <EmptyDayText>Nothing planned</EmptyDayText>
                      ) : (
                        daySlots.map(slot => {
                          const slotKey = `${slot.day}:${slot.type}`
                          const recipe = slot.recipe || {}
                          const totalTime =
                            (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)
                          const metaParts = []
                          if (totalTime > 0) metaParts.push(`${totalTime} min`)
                          if (recipe.estimated_cost) metaParts.push(`$${recipe.estimated_cost}`)

                          return (
                            <MealChip
                              key={slotKey}
                              onClick={() => handleChipClick(slotKey)}
                            >
                              <ChipEmoji>{recipe.emoji || '🍽️'}</ChipEmoji>
                              <ChipText>
                                <ChipType>{getTypeLabel(slot.type)}</ChipType>
                                <ChipName>{recipe.name || 'Unnamed'}</ChipName>
                                {metaParts.length > 0 && (
                                  <ChipMeta>{metaParts.join(' · ')}</ChipMeta>
                                )}
                              </ChipText>
                              <ChipSwapBtn
                                onClick={(e) => handleSwapClick(e, slot.day, slot.type)}
                              >
                                Swap
                              </ChipSwapBtn>
                            </MealChip>
                          )
                        })
                      )}
                    </DayCardBody>
                  </DayCard>
                ))}
              </DayCardList>
            </PlanningBody>

            <PlanningFooter>
              <StartOverBtn onClick={onStartOver} disabled={isSaving}>
                Start over
              </StartOverBtn>
              <SaveBtn
                $loading={isSaving}
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving…' : 'Save week'}
              </SaveBtn>
            </PlanningFooter>
          </>
        )}
      </PlanningOverlay>

      {/* ─── Expanded slot detail ───────────────────────────────────────────── */}
      {expandedSlot && (
        <ExpandedOverlay onClick={(e) => e.target === e.currentTarget && setExpandedSlotKey(null)}>
          <ExpandedCard>
            <ExpandedHeader>
              <ExpandedHeaderText>
                <ExpandedName>{expandedSlot.recipe?.name || 'Unnamed'}</ExpandedName>
                <ExpandedSubLine>
                  {expandedSlot.day} {'·'} {getTypeLabel(expandedSlot.type)}
                  {expandedSlot.recipe?.cook_time_minutes
                    ? ` · ${(expandedSlot.recipe.prep_time_minutes || 0) + expandedSlot.recipe.cook_time_minutes} min`
                    : ''}
                </ExpandedSubLine>
              </ExpandedHeaderText>
              <CloseBtn
                onClick={() => setExpandedSlotKey(null)}
                aria-label="Close detail"
              >
                {'✕'}
              </CloseBtn>
            </ExpandedHeader>

            <ExpandedBody>
              {expandedSlot.recipe?.description && (
                <ExpandedSection>
                  <ExpandedDescription>{expandedSlot.recipe.description}</ExpandedDescription>
                </ExpandedSection>
              )}

              {expandedSlot.recipe?.ingredients?.length > 0 && (
                <ExpandedSection>
                  <ExpandedSectionTitle>
                    Ingredients ({expandedSlot.recipe.ingredients.length})
                  </ExpandedSectionTitle>
                  {expandedSlot.recipe.ingredients.map((ing, i) => {
                    const key = `${expandedSlot.day}:${expandedSlot.type}:${ing.name}`
                    const isChecked = checkedMap[key] !== false
                    const isPantry = ing.inPantry || ing.isStaple
                    return (
                      <IngredientCheckRow
                        key={i}
                        $checked={isChecked}
                        $pantry={isPantry}
                        onClick={() => toggleIngredient(expandedSlot.day, expandedSlot.type, ing.name)}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleIngredient(expandedSlot.day, expandedSlot.type, ing.name)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <IngredientName>
                          {ing.quantity ? <strong>{ing.quantity} </strong> : null}
                          {ing.name}
                        </IngredientName>
                        {isPantry && <PantryBadge>in pantry</PantryBadge>}
                      </IngredientCheckRow>
                    )
                  })}
                </ExpandedSection>
              )}

              {instructions.length > 0 && (
                <ExpandedSection>
                  <ExpandedSectionTitle>Instructions</ExpandedSectionTitle>
                  <InstructionsList>
                    {instructions.map((step, i) => (
                      <InstructionItem key={i}>{step}</InstructionItem>
                    ))}
                  </InstructionsList>
                </ExpandedSection>
              )}

              {expandedSlot.recipe?.macros && (
                <ExpandedSection>
                  <ExpandedSectionTitle>Nutrition (per serving)</ExpandedSectionTitle>
                  <MacroRow>
                    {expandedSlot.recipe.macros.calories != null && (
                      <MacroChip>
                        <MacroValue>{expandedSlot.recipe.macros.calories}</MacroValue>
                        <MacroLabel>kcal</MacroLabel>
                      </MacroChip>
                    )}
                    {expandedSlot.recipe.macros.protein != null && (
                      <MacroChip>
                        <MacroValue>{expandedSlot.recipe.macros.protein}g</MacroValue>
                        <MacroLabel>protein</MacroLabel>
                      </MacroChip>
                    )}
                    {expandedSlot.recipe.macros.carbs != null && (
                      <MacroChip>
                        <MacroValue>{expandedSlot.recipe.macros.carbs}g</MacroValue>
                        <MacroLabel>carbs</MacroLabel>
                      </MacroChip>
                    )}
                    {expandedSlot.recipe.macros.fat != null && (
                      <MacroChip>
                        <MacroValue>{expandedSlot.recipe.macros.fat}g</MacroValue>
                        <MacroLabel>fat</MacroLabel>
                      </MacroChip>
                    )}
                  </MacroRow>
                </ExpandedSection>
              )}
            </ExpandedBody>

            <ExpandedFooter>
              <CollapseBtn onClick={() => setExpandedSlotKey(null)}>Collapse</CollapseBtn>
            </ExpandedFooter>
          </ExpandedCard>
        </ExpandedOverlay>
      )}

      <RecipePickerModal
        isOpen={swapPickerOpen}
        onClose={() => setSwapPickerOpen(false)}
        day={swapPickerDay}
        mealType={swapPickerType}
        currentRecipeId={null}
        recipes={recipes}
        onAssigned={handleSwapAssigned}
        initialMode={null}
        sideType={null}
        collections={collections}
        collectionLinks={collectionLinks}
      />
    </>
  )
}
