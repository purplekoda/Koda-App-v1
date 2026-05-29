'use client'

import { useState, useTransition, useRef, useEffect, Fragment } from 'react'
import styled, { keyframes } from 'styled-components'
import MealPlannerGrid from '@/components/meals/MealPlannerGrid'
import FillWeekButton from '@/components/meals/FillWeekButton'
import RecipePickerModal from '@/components/meals/RecipePickerModal'
import { swapMeal, removeMeal, fillWeek, addToGrocery, aiFillWeekAction, getWeekMealsAction, webSearchSlotsAction, surpriseMeAction, surpriseMeBatchAction, getFavoriteWebsiteAction, searchRecipeSuggestionsAction, assignRecipeToSlot, generateMealPlanPreviewAction, savePlanningModeAction, saveMealPlanDraftAction, getMealPlanDraftAction, dismissMealPlanDraftAction } from './actions'
import { createRecipeAction } from '../recipes/actions'
import PlanningModeOverlay from '@/components/meals/PlanningModeOverlay'

// ─── Page layout ──────────────────────────────────────────────────────────────

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};
`

const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Subtitle = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 4px;
`

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
`

const WeekNav = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const WeekLabel = styled.span`
  font-size: 15px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  min-width: 160px;
  text-align: center;
`

const NavButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.borderLight};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
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

const StatsRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  flex-wrap: wrap;
`

const StatChip = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const StatDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
`

const Toast = styled.div`
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: ${({ $error, theme }) => $error ? theme.colors.coral : theme.colors.textPrimary};
  color: white;
  padding: 12px 24px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 14px;
  font-weight: 500;
  z-index: 999;
  box-shadow: ${({ theme }) => theme.shadows.elevated};
`

// ─── Koda planner dialog ──────────────────────────────────────────────────────

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`

const slideUp = keyframes`
  from { transform: translateY(12px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
`

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: ${({ theme }) => theme.spacing.lg};
  animation: ${fadeIn} 0.15s ease;
`

const Dialog = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: ${({ theme }) => theme.spacing.xl};
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: ${({ theme }) => theme.shadows.elevated};
  animation: ${slideUp} 0.2s ease;
`

const DialogHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const DialogTitle = styled.h3`
  font-size: 18px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const CloseButton = styled.button`
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

  &:hover {
    background: ${({ theme }) => theme.colors.border};
  }
`

const DialogBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`

const DialogLabel = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const DialogHint = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 4px;
`

const PlannerSkipHint = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  background: ${({ theme }) => theme.colors.surfaceAlt || '#F7F7FA'};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 8px 12px;
  margin-top: 4px;
  line-height: 1.5;
`

const InstructionsArea = styled.textarea`
  width: 100%;
  min-height: 80px;
  padding: 10px 12px;
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.background};
  resize: vertical;
  outline: none;
  font-family: inherit;
  box-sizing: border-box;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.purple};
    box-shadow: 0 2px 8px rgba(127, 119, 221, 0.15);
  }
`

const DialogFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.lg};
`

const CancelButton = styled.button`
  padding: 10px 18px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.borderLight};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.border};
  }
`

const shimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: 200px 0; }
`

const FillButton = styled.button`
  padding: 10px 20px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ $loading, $disabled, theme }) =>
    $loading
      ? `linear-gradient(90deg, ${theme.colors.purpleLight} 0%, ${theme.colors.purpleMid} 50%, ${theme.colors.purpleLight} 100%)`
      : $disabled
        ? theme.colors.border
        : theme.colors.purple};
  background-size: 400px 100%;
  animation: ${({ $loading }) => $loading ? shimmer : 'none'} 1.5s ease infinite;
  color: ${({ $loading, $disabled }) => $loading ? '#7F77DD' : $disabled ? '#9CA3AF' : '#FFFFFF'};
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: ${({ $loading, $disabled }) => $loading ? 'wait' : $disabled ? 'not-allowed' : 'pointer'};

  &:hover {
    opacity: ${({ $loading, $disabled }) => ($loading || $disabled) ? 1 : 0.9};
  }

  &:disabled {
    cursor: ${({ $loading }) => $loading ? 'wait' : 'not-allowed'};
  }
`

// ─── Planning mode option cards ──────────────────────────────────────────────

const OptionCardsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`

const OptionCard = styled.button`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 1.5px solid ${({ $selected, theme }) => $selected ? theme.colors.purple : theme.colors.borderLight};
  background: ${({ $selected, theme }) => $selected ? theme.colors.purpleLight : theme.colors.surface};
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
  width: 100%;

  &:hover {
    border-color: ${({ $selected, theme }) => $selected ? theme.colors.purple : theme.colors.purpleMid};
    background: ${({ $selected, theme }) => $selected ? theme.colors.purpleLight : theme.colors.background};
  }

  &:disabled {
    opacity: 0.5;
    cursor: wait;
  }
`

const OptionIcon = styled.span`
  font-size: 20px;
  line-height: 1;
  flex-shrink: 0;
  margin-top: 1px;
`

const OptionContent = styled.div`
  flex: 1;
  min-width: 0;
`

const OptionName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: 2px;
`

const OptionDesc = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.4;
`

const OptionCheck = styled.span`
  width: 20px;
  height: 20px;
  border-radius: 6px;
  border: 1.5px solid ${({ $selected, theme }) => $selected ? theme.colors.purple : theme.colors.border};
  background: ${({ $selected, theme }) => $selected ? theme.colors.purple : 'transparent'};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
  font-size: 12px;
  color: white;
  transition: all 0.15s ease;
`

// ─── Planner filters ─────────────────────────────────────────────────────────

const FilterSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
`

const FilterSectionTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
`

const FilterChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`

const FilterChip = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1.5px solid ${({ $active, theme }) => $active ? theme.colors.purple : theme.colors.borderLight};
  background: ${({ $active, theme }) => $active ? theme.colors.purpleLight : theme.colors.surface};
  font-size: 13px;
  font-weight: 500;
  color: ${({ $active, theme }) => $active ? theme.colors.purple : theme.colors.textSecondary};
  cursor: pointer;
  transition: all 0.12s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.purpleMid};
  }

  &:disabled {
    opacity: 0.5;
    cursor: wait;
  }
`

const FilterExpandedArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  padding-top: ${({ theme }) => theme.spacing.xs};
`

const FilterRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`

const FilterLabel = styled.label`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  min-width: 60px;
`

const FilterInput = styled.input`
  width: 80px;
  padding: 6px 10px;
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.surface};
  outline: none;
  font-family: inherit;

  &::placeholder { color: ${({ theme }) => theme.colors.textMuted}; }
  &:focus { border-color: ${({ theme }) => theme.colors.purple}; }
`

const FilterUnit = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
`

const FilterDisclaimer = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.4;
  padding: 6px 10px;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.sm};
  border-left: 3px solid ${({ theme }) => theme.colors.purple};
`

const ChangeStoresLink = styled.button`
  background: none;
  border: none;
  padding: 0;
  font-size: 11px;
  color: ${({ theme }) => theme.colors.purple};
  cursor: pointer;
  text-decoration: underline;
  font-family: inherit;
  margin-top: 4px;
  display: inline-block;

  &:hover { opacity: 0.8; }
  &:disabled { opacity: 0.5; cursor: default; }
`

const StorePickerArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 10px;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.sm};
  border: 1.5px solid ${({ theme }) => theme.colors.border};
`

const StoreCheckRow = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textPrimary};
  user-select: none;
`

const StorePickerTitle = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 2px;
`

const TimePerDayGrid = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 6px 10px;
  align-items: center;
`

// ─── Dual-thumb macro range slider ───────────────────────────────────────────

const MacroSliderBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`

const MacroSliderLabelRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
`

const MacroSliderLabel = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const MacroSliderValue = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.purple};
`

const MacroSliderTrackWrap = styled.div`
  position: relative;
  height: 32px;
  display: flex;
  align-items: center;
`

const MacroSliderTrack = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  height: 5px;
  background: ${({ theme }) => theme.colors.borderLight || '#E8E8EE'};
  border-radius: 3px;
  pointer-events: none;
`

const MacroSliderFill = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  background: ${({ $color }) => $color || '#7C5CBF'};
  border-radius: 3px;
`

const MacroRangeInput = styled.input`
  position: absolute;
  left: 0;
  width: 100%;
  height: 5px;
  background: transparent;
  pointer-events: none;
  -webkit-appearance: none;
  appearance: none;
  outline: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    border: 2.5px solid ${({ $color }) => $color || '#7C5CBF'};
    cursor: pointer;
    pointer-events: all;
    box-shadow: 0 1px 5px rgba(0,0,0,0.18);
    transition: transform 0.1s;
  }

  &::-webkit-slider-thumb:hover {
    transform: scale(1.15);
  }

  &::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: white;
    border: 2.5px solid ${({ $color }) => $color || '#7C5CBF'};
    cursor: pointer;
    pointer-events: all;
    box-shadow: 0 1px 5px rgba(0,0,0,0.18);
  }

  &:disabled::-webkit-slider-thumb { opacity: 0.35; cursor: default; }
  &:disabled::-moz-range-thumb { opacity: 0.35; cursor: default; }
`

const MacroSliderHint = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.4;
`

const MacroServingNote = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding-bottom: 4px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  margin-bottom: 2px;
`

const TimeDayLabel = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: 500;
`

const TimeSelect = styled.select`
  padding: 6px 10px;
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.surface};
  outline: none;
  font-family: inherit;
  cursor: pointer;

  &:focus { border-color: ${({ theme }) => theme.colors.purple}; }
`

const CrockpotToggle = styled.button`
  padding: 4px 10px;
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1px solid ${({ $active, theme }) => $active ? theme.colors.teal : theme.colors.borderLight};
  background: ${({ $active, theme }) => $active ? theme.colors.tealLight : 'transparent'};
  font-size: 11px;
  color: ${({ $active, theme }) => $active ? theme.colors.teal : theme.colors.textMuted};
  cursor: pointer;
  white-space: nowrap;

  &:hover { border-color: ${({ theme }) => theme.colors.tealMid}; }
`

const TimeModeTabs = styled.div`
  display: flex;
  gap: 4px;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 3px;
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
`

const TimeModeTab = styled.button`
  flex: 1;
  padding: 5px 10px;
  border-radius: ${({ theme }) => theme.radii.sm};
  border: none;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  background: ${({ $active, theme }) => $active ? theme.colors.purpleLight : 'transparent'};
  color: ${({ $active, theme }) => $active ? theme.colors.purple : theme.colors.textMuted};
  transition: all 0.12s ease;
`

// ─── Web search recipe picker ────────────────────────────────────────────────

const WebSearchSlotList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
  max-height: 420px;
  overflow-y: auto;
  padding-right: 4px;
`

const WebSearchSlotGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`

const WebSearchSlotLabel = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-transform: capitalize;
  margin-bottom: 2px;
`

const WebRecipeOption = styled.button`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1.5px solid ${({ $selected, theme }) => $selected ? theme.colors.purple : theme.colors.borderLight};
  background: ${({ $selected, theme }) => $selected ? theme.colors.purpleLight : theme.colors.surface};
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
  width: 100%;

  &:hover {
    border-color: ${({ $selected, theme }) => $selected ? theme.colors.purple : theme.colors.purpleMid};
  }

  &:disabled {
    opacity: 0.5;
    cursor: wait;
  }
`

const WebRecipeInfo = styled.div`
  flex: 1;
  min-width: 0;
`

const WebRecipeName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: 3px;
`

const WebRecipeMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: 3px;

  span {
    white-space: nowrap;
  }
`

const WebRecipeDesc = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

// ─── Save-to-recipes prompt ──────────────────────────────────────────────────

const SavePromptOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: ${({ theme }) => theme.spacing.lg};
  animation: ${fadeIn} 0.12s ease;
`

const SavePromptCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: ${({ theme }) => theme.spacing.xl};
  width: 100%;
  max-width: 400px;
  box-shadow: ${({ theme }) => theme.shadows.elevated};
  animation: ${slideUp} 0.18s ease;
`

const SavePromptTitle = styled.h4`
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const SavePromptDesc = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.5;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const SavePromptActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  justify-content: flex-end;
`

const SavePromptBtn = styled.button`
  padding: 10px 18px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: ${({ $primary, theme }) => $primary ? 'none' : `1px solid ${theme.colors.border}`};
  background: ${({ $primary, theme }) => $primary ? theme.colors.purple : theme.colors.surface};
  color: ${({ $primary, theme }) => $primary ? 'white' : theme.colors.textPrimary};

  &:hover { opacity: 0.9; }
  &:disabled { opacity: 0.5; cursor: wait; }
`

// ─── Planning box slot header ────────────────────────────────────────────────

const PlanningSlotHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
`

const PlanningSlotIdea = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-style: italic;
  margin-bottom: 6px;
`

const PickedBadge = styled.span`
  font-size: 11px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.teal};
  background: ${({ theme }) => theme.colors.tealLight};
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.pill};
`

// ─── Recipe preview modal ────────────────────────────────────────────────────

const PreviewOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
  padding: ${({ theme }) => theme.spacing.lg};
  animation: ${fadeIn} 0.12s ease;
`

const PreviewCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: 0;
  width: 100%;
  max-width: 540px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: ${({ theme }) => theme.shadows.elevated};
  animation: ${slideUp} 0.18s ease;
  overflow: hidden;
`

const PreviewHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: ${({ theme }) => `${theme.spacing.xl} ${theme.spacing.xl} ${theme.spacing.md}`};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
`

const PreviewTitleBlock = styled.div`
  flex: 1;
  min-width: 0;
`

const PreviewName = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: 6px;
`

const PreviewMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  flex-wrap: wrap;

  span {
    display: flex;
    align-items: center;
    gap: 3px;
    white-space: nowrap;
  }
`

const PreviewBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.xl};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`

const PreviewSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`

const PreviewSectionTitle = styled.h4`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: 2px;
`

const IngredientList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const IngredientItem = styled.li`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  padding: 6px 10px;
  background: ${({ $isPantry, theme }) => $isPantry ? theme.colors.tealLight : theme.colors.background};
  border-radius: ${({ theme }) => theme.radii.sm};
  border-left: 3px solid ${({ $isPantry, theme }) => $isPantry ? theme.colors.teal : 'transparent'};

  strong {
    color: ${({ theme }) => theme.colors.textPrimary};
    font-weight: 500;
  }
`

const PantryTag = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.teal};
  font-weight: 500;
  margin-left: 6px;
`

const InstructionsText = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.65;
  white-space: pre-wrap;
`

const PreviewSourceLink = styled.a`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.purple};
  text-decoration: none;
  &:hover { text-decoration: underline; }
`

const PreviewFooter = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.xl} ${theme.spacing.xl}`};
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
`

const SelectRecipeButton = styled.button`
  flex: 1;
  padding: 12px 20px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.purple};
  border: none;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;

  &:hover { opacity: 0.9; }
`

const PreviewBackButton = styled.button`
  padding: 12px 20px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.borderLight};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;

  &:hover { background: ${({ theme }) => theme.colors.border}; }
`

// ─── Surprise Me result card ─────────────────────────────────────────────────

const SurpriseResultCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1.5px solid ${({ theme }) => theme.colors.coralMid};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`

const SurpriseName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const SurpriseTrending = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.coral};
  font-weight: 500;
  line-height: 1.4;
`

const SurpriseDesc = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.4;
`

const SurpriseMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: 2px;
`

const SurpriseActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.sm};
`

const SurpriseAcceptButton = styled.button`
  flex: 1;
  padding: 10px 16px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.coral};
  border: none;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;

  &:hover { opacity: 0.9; }
  &:disabled { opacity: 0.5; cursor: wait; }
`

const SurpriseAgainButton = styled.button`
  padding: 10px 16px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.coralLight};
  border: 1px solid ${({ theme }) => theme.colors.coralMid};
  color: ${({ theme }) => theme.colors.coral};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;

  &:hover { background: ${({ theme }) => theme.colors.coralMid}; color: white; }
  &:disabled { opacity: 0.5; cursor: wait; }
`

const SurpriseSourceLink = styled.a`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.coral};
  text-decoration: none;
  &:hover { text-decoration: underline; }
`

// ─── Surprise Me config panel ────────────────────────────────────────────────

const SurpriseConfigPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md};
  background: #FFF7F5;
  border: 1px solid #F0997B;
  border-radius: ${({ theme }) => theme.radii.lg};
  margin-top: -4px;
`

const SurpriseConfigLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #D85A30;
`

const SurpriseTypeRow = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`

const SurpriseTypeChip = styled.button`
  padding: 5px 14px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  background: ${({ $active }) => $active ? '#D85A30' : 'white'};
  color: ${({ $active }) => $active ? 'white' : '#D85A30'};
  border: 1.5px solid ${({ $active }) => $active ? '#D85A30' : '#F0997B'};

  &:hover {
    background: ${({ $active }) => $active ? '#C04A20' : '#FFF0EB'};
  }
`

const SurpriseCountRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const SurpriseCountLabel = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const SurpriseCountButton = styled.button`
  width: 30px;
  height: 30px;
  border-radius: ${({ theme }) => theme.radii.sm};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  background: white;
  color: #D85A30;
  border: 1.5px solid #F0997B;
  transition: all 0.12s ease;

  &:hover { background: #FFF0EB; }
  &:disabled { opacity: 0.35; cursor: default; }
`

const SurpriseCountValue = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: #D85A30;
  min-width: 20px;
  text-align: center;
`

// ─── Meal type picker (top of plan-my-week dialog) ───────────────────────────

const MealTypePicker = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  padding-bottom: ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  margin-bottom: 2px;
`

const MealTypePickerLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.06em;
`

const MealTypeBubbleRow = styled.div`
  display: flex;
  gap: 10px;
`

const MEAL_BUBBLE_COLORS = {
  breakfast: { bg: '#FFF8E7', border: '#E8A930', active: '#E8A930', text: '#8A6200' },
  lunch:     { bg: '#E8F7F5', border: '#3BA896', active: '#3BA896', text: '#1A6057' },
  dinner:    { bg: '#F0EBFF', border: '#7C5CBF', active: '#7C5CBF', text: '#3D1F8A' },
}

const MealTypeBubble = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  background: ${({ $type, $active }) => $active ? MEAL_BUBBLE_COLORS[$type].active : MEAL_BUBBLE_COLORS[$type].bg};
  color: ${({ $type, $active }) => $active ? 'white' : MEAL_BUBBLE_COLORS[$type].text};
  border: 2px solid ${({ $type, $active }) => $active ? MEAL_BUBBLE_COLORS[$type].active : MEAL_BUBBLE_COLORS[$type].border};

  &:hover {
    background: ${({ $type, $active }) => $active ? MEAL_BUBBLE_COLORS[$type].active : `${MEAL_BUBBLE_COLORS[$type].border}22`};
  }
`

const MealTypeBubbleDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $type, $active }) => $active ? 'rgba(255,255,255,0.7)' : MEAL_BUBBLE_COLORS[$type].active};
  flex-shrink: 0;
`

const DinnerOptionsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 8px 12px;
  background: #F6F2FF;
  border: 1px solid #C4B0E8;
  border-radius: ${({ theme }) => theme.radii.md};
`

const DinnerOptionLabel = styled.label`
  font-size: 12px;
  font-weight: 600;
  color: #5B3FA6;
  white-space: nowrap;
`

const DinnerOptionSelect = styled.select`
  font-size: 12px;
  font-weight: 500;
  color: #3D1F8A;
  background: white;
  border: 1.5px solid #C4B0E8;
  border-radius: ${({ theme }) => theme.radii.sm};
  padding: 4px 8px;
  cursor: pointer;
  appearance: auto;

  &:focus { outline: none; border-color: #7C5CBF; }
`

const DinnerDessertToggle = styled.button`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 12px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  background: ${({ $active }) => $active ? '#7C5CBF' : 'white'};
  color: ${({ $active }) => $active ? 'white' : '#5B3FA6'};
  border: 1.5px solid ${({ $active }) => $active ? '#7C5CBF' : '#C4B0E8'};

  &:hover {
    background: ${({ $active }) => $active ? '#6A4BAD' : '#EDE8FB'};
  }
`

const SurpriseResultsScroll = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`

const SurpriseResultIndex = styled.div`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 4px;
`

const SurpriseResultAcceptRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
`

const SurpriseResultCheckButton = styled.button`
  width: 28px;
  height: 28px;
  border-radius: ${({ theme }) => theme.radii.sm};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;

  background: ${({ $checked }) => $checked ? '#D85A30' : 'white'};
  color: ${({ $checked }) => $checked ? 'white' : '#D85A30'};
  border: 1.5px solid ${({ $checked }) => $checked ? '#D85A30' : '#F0997B'};

  &:hover {
    background: ${({ $checked }) => $checked ? '#C04A20' : '#FFF0EB'};
  }
`

const SurpriseResultLabel = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

// ─── Favorite website prompt ─────────────────────────────────────────────────

const FavWebsitePrompt = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: 10px 14px;
  background: ${({ theme }) => theme.colors.blueLight};
  border: 1px solid ${({ theme }) => theme.colors.blue};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.blue};
`

const FavWebsiteButtons = styled.div`
  display: flex;
  gap: 6px;
  flex-shrink: 0;
`

const FavWebsiteBtn = styled.button`
  padding: 4px 12px;
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid ${({ theme }) => theme.colors.blue};
  background: ${({ $primary, theme }) => $primary ? theme.colors.blue : 'transparent'};
  color: ${({ $primary, theme }) => $primary ? 'white' : theme.colors.blue};

  &:hover { opacity: 0.85; }
`

// ─── Draft banner ─────────────────────────────────────────────────────────────

const DraftBanner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
  padding: 12px 16px;
  background: ${({ theme }) => theme.colors.purpleLight};
  border: 1px solid ${({ theme }) => theme.colors.purpleMid};
  border-radius: ${({ theme }) => theme.radii.lg};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  flex-wrap: wrap;
`

const DraftBannerText = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.purpleDark};
  font-weight: 500;
`

const DraftBannerActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-shrink: 0;
`

const DraftBannerBtn = styled.button`
  padding: 7px 16px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid ${({ $primary, theme }) => $primary ? theme.colors.purple : theme.colors.purpleMid};
  background: ${({ $primary, theme }) => $primary ? theme.colors.purple : 'transparent'};
  color: ${({ $primary, theme }) => $primary ? 'white' : theme.colors.purple};

  &:hover { opacity: 0.85; }
`

// ─── Koda Plan button ────────────────────────────────────────────────────────

const KodaPlanButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: 10px 18px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.purpleLight};
  border: 1.5px solid ${({ theme }) => theme.colors.purpleMid};
  color: ${({ theme }) => theme.colors.purpleDark};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  min-height: ${({ theme }) => theme.touchTarget};

  &:hover {
    background: ${({ theme }) => theme.colors.purpleMid};
  }

  &:disabled {
    opacity: 0.5;
    cursor: wait;
  }
`

const AIDot = styled.span`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.purple};
`


// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWeekLabel(offset = 0) {
  const now = new Date()
  const dow = now.getDay() || 7
  const monday = new Date(now)
  monday.setDate(now.getDate() - (dow - 1) + offset * 7)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(monday)} \u2013 ${fmt(sunday)}`
}

function countStats(meals) {
  let total = 0
  let filled = 0
  let needItems = 0
  meals.forEach(day => {
    day.meals.forEach(meal => {
      total++
      if (meal.name) filled++
      if (meal.ingredients) {
        needItems += meal.ingredients.filter(i => !i.have).length
      }
    })
  })
  return { total, filled, empty: total - filled, needItems }
}

// ─── Dual-thumb range slider component ───────────────────────────────────────

function MacroRangeSlider({ label, unit, min, max, step, values, onChange, disabled, color, hint }) {
  const pctLeft = ((values[0] - min) / (max - min)) * 100
  const pctRight = ((values[1] - min) / (max - min)) * 100
  const displayLow = values[0] === min ? '0' : String(values[0])
  const displayHigh = values[1] === max ? 'max' : String(values[1])
  const rangeLabel = `${displayLow} – ${displayHigh} ${unit}`

  return (
    <MacroSliderBlock>
      <MacroSliderLabelRow>
        <MacroSliderLabel>{label}</MacroSliderLabel>
        <MacroSliderValue>{rangeLabel}</MacroSliderValue>
      </MacroSliderLabelRow>
      <MacroSliderTrackWrap>
        <MacroSliderTrack>
          <MacroSliderFill $color={color} style={{ left: `${pctLeft}%`, right: `${100 - pctRight}%` }} />
        </MacroSliderTrack>
        <MacroRangeInput
          type="range"
          min={min} max={max} step={step}
          value={values[0]}
          $color={color}
          disabled={disabled}
          onChange={e => {
            const v = Math.min(Number(e.target.value), values[1] - step)
            onChange([v, values[1]])
          }}
        />
        <MacroRangeInput
          type="range"
          min={min} max={max} step={step}
          value={values[1]}
          $color={color}
          disabled={disabled}
          onChange={e => {
            const v = Math.max(Number(e.target.value), values[0] + step)
            onChange([values[0], v])
          }}
        />
      </MacroSliderTrackWrap>
      {hint && <MacroSliderHint>{hint}</MacroSliderHint>}
    </MacroSliderBlock>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MealsPageClient({ initialMeals, swapSuggestions, recipes = [], cookingPreferences, groceryPreferences, collections = [], collectionLinks = [] }) {
  const [meals, setMeals] = useState(initialMeals)
  const [selectedMeal, setSelectedMeal] = useState(null)
  const [toast, setToast] = useState(null)
  const [isPending, startTransition] = useTransition()
  const toastTimeoutRef = useRef(null)

  // Recipe picker modal state
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerDay, setPickerDay] = useState(null)
  const [pickerMealType, setPickerMealType] = useState(null)
  const [pickerCurrentRecipeId, setPickerCurrentRecipeId] = useState(null)
  const [pickerInitialMode, setPickerInitialMode] = useState(null)
  const [pickerSideType, setPickerSideType] = useState(null)

  // Week navigation state
  const [weekOffset, setWeekOffset] = useState(0)
  const [isLoadingWeek, startWeekTransition] = useTransition()

  // Koda planner dialog state
  const [aiFillOpen, setAiFillOpen] = useState(false)
  const [aiInstructions, setAiInstructions] = useState('')
  const [aiFillModes, setAiFillModes] = useState([])
  const [replanAll, setReplanAll] = useState(false)
  const [isAiFilling, startAiTransition] = useTransition()

  // Planner filters
  const hasStores = (groceryPreferences?.store_list?.length > 0) || (groceryPreferences?.stores?.length > 0)
  const allSavedStores = groceryPreferences?.store_list?.length > 0
    ? groceryPreferences.store_list
    : (groceryPreferences?.stores || []).map(s => ({ value: s, label: s }))
  const [weekStores, setWeekStores] = useState(allSavedStores)
  const [storePickerOpen, setStorePickerOpen] = useState(false)
  const [filterBudget, setFilterBudget] = useState(false)
  const [filterMacros, setFilterMacros] = useState(false)
  const [filterTime, setFilterTime] = useState(false)
  const [weeklyBudget, setWeeklyBudget] = useState(cookingPreferences?.weekly_budget || '')
  const [macroCaloriesRange, setMacroCaloriesRange] = useState([0, 800])
  const [macroProteinRange, setMacroProteinRange] = useState([0, 40])
  const [macroCarbsRange, setMacroCarbsRange] = useState([0, 100])
  const [macroFatRange, setMacroFatRange] = useState([0, 50])
  const [timeMode, setTimeMode] = useState('same')  // 'same' | 'per-day'
  const [timeAll, setTimeAll] = useState(cookingPreferences?.time_preference || 'medium')
  const DAY_NAMES_LIST = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const [timePerDay, setTimePerDay] = useState(
    Object.fromEntries(DAY_NAMES_LIST.map(d => [d, 'medium']))
  )
  const [crockpotDays, setCrockpotDays] = useState({})

  // Web search picker state (step 2 of the dialog when web-search is selected)
  const [webSearchResults, setWebSearchResults] = useState(null)  // null = not in picker mode, [] = results loaded
  const [webSearchPicks, setWebSearchPicks] = useState({})        // { "dayOfWeek:mealType": recipeIndex }

  // Recipe suggestions planning box state (for AI-generated ideas that need linking)
  const [recipeSuggestions, setRecipeSuggestions] = useState(null)   // null = not showing, [] = loaded
  const [recipePicks, setRecipePicks] = useState({})                 // { "day:type": recipeIndex }
  const [savePrompt, setSavePrompt] = useState(null)                 // { slotKey, recipe } when asking to save
  const [isSaving, startSaveTransition] = useTransition()
  const [previewRecipe, setPreviewRecipe] = useState(null)           // { recipe, slotKey, recipeIndex } for full preview
  const [pantryItemNames, setPantryItemNames] = useState([])         // cached pantry names for highlighting

  // Surprise Me state
  const [surpriseResult, setSurpriseResult] = useState(null)       // single result (from swap/single)
  const [surpriseResults, setSurpriseResults] = useState(null)     // array of results (from batch)
  const [surpriseAccepted, setSurpriseAccepted] = useState({})     // { index: true } for batch accept toggles
  const [surpriseSlot, setSurpriseSlot] = useState(null)           // { day, mealType } when opened from a slot
  const [surpriseMealTypes, setSurpriseMealTypes] = useState([])   // ['breakfast', 'lunch', 'dinner']
  const [surpriseCount, setSurpriseCount] = useState(3)

  // Meal type picker state (top of plan-my-week dialog)
  const [planMealTypes, setPlanMealTypes] = useState([])           // ['breakfast', 'lunch', 'dinner']
  const [dinnerSides, setDinnerSides] = useState('0')              // '0' | '1' | '2'
  const [dinnerDessert, setDinnerDessert] = useState(false)

  // Favorite website state
  const [favoriteWebsite, setFavoriteWebsite] = useState(null)
  const [favWebsiteDismissed, setFavWebsiteDismissed] = useState(false)

  // Full-week pre-planning check
  const [fullWeekPromptOpen, setFullWeekPromptOpen] = useState(false)

  // Planning mode state
  const [planningModeOpen, setPlanningModeOpen] = useState(false)
  const [planningModeSlots, setPlanningModeSlots] = useState([])
  const [isGeneratingPreview, startPreviewTransition] = useTransition()
  const [isSavingPlan, startSavePlanTransition] = useTransition()
  const [draftBannerVisible, setDraftBannerVisible] = useState(false)
  const [draftBannerData, setDraftBannerData] = useState(null)
  const [planningModeDraftPromptOpen, setPlanningModeDraftPromptOpen] = useState(false)

  useEffect(() => () => clearTimeout(toastTimeoutRef.current), [])

  // Check for a saved draft on mount
  useEffect(() => {
    getMealPlanDraftAction().then(result => {
      if (result.success && result.data?.draft) {
        setDraftBannerData(result.data.draft)
        setDraftBannerVisible(true)
      }
    })
  }, [])

  const stats = countStats(meals)

  function isMainWeekFull() {
    const MAIN_TYPES = ['breakfast', 'lunch', 'dinner']
    return meals.every(day =>
      MAIN_TYPES.every(type => {
        const meal = day.meals.find(m => m.type === type)
        return meal && meal.name
      })
    )
  }

  function showToast(message, isError = false) {
    clearTimeout(toastTimeoutRef.current)
    setToast({ message, isError })
    toastTimeoutRef.current = setTimeout(() => setToast(null), 2500)
  }

  function handleWeekChange(delta) {
    const nextOffset = weekOffset + delta
    setWeekOffset(nextOffset)
    setSelectedMeal(null)
    startWeekTransition(async () => {
      const result = await getWeekMealsAction(nextOffset)
      if (result.success) setMeals(result.data.meals)
    })
  }

  // Opens the recipe picker for a slot
  function handleSlotClick(day, mealType, currentRecipeId) {
    setPickerDay(day)
    setPickerMealType(mealType)
    setPickerCurrentRecipeId(currentRecipeId)
    setPickerInitialMode(null)

    // For dinner: find the next empty sides slot so the picker can offer a side prompt
    if (mealType === 'dinner') {
      const SIDES_TYPES = ['sides', 'sides2', 'sides3', 'sides4']
      const dayMeals = meals.find(d => d.day === day)?.meals ?? []
      const nextSides = SIDES_TYPES.find(t => !dayMeals.find(m => m.type === t && m.name))
      setPickerSideType(nextSides ?? null)
    } else {
      setPickerSideType(null)
    }

    setPickerOpen(true)
  }

  // Opens the recipe picker for an optional side dish with a specific starting screen
  function handleOpenSidePicker(day, sideType, mode) {
    setPickerDay(day)
    setPickerMealType(sideType)
    setPickerCurrentRecipeId(null)
    setPickerInitialMode(mode)
    setPickerSideType(null)
    setPickerOpen(true)
  }

  // Called by RecipePickerModal after a successful assign/unassign/custom-name.
  // sideType is set when the call comes from SideScreen (side dish prompt).
  // meals is the full updated meals list returned by the server (mock mode only).
  function handlePickerAssigned({ recipeId, recipeName, error, sideType: assignedSideType, meals: updatedMeals }) {
    if (error) {
      showToast(error || 'Failed to update meal slot.', true)
      return
    }

    // If the server returned a full meals list (e.g. SideScreen in mock mode),
    // apply it directly — no need for a slot-specific optimistic update.
    if (updatedMeals) {
      setMeals(updatedMeals)
      if (recipeName) showToast(`Added: ${recipeName}`)
      return
    }

    // Determine which slot to update.
    // assignedSideType is provided when SideScreen saved a side dish in Supabase mode
    // (where swapMeal doesn't return the full meals list).
    const targetType = assignedSideType || pickerMealType

    // Optimistic update: update existing slot or insert new one.
    if (pickerDay && targetType) {
      setMeals(prev => prev.map(day => {
        if (day.day !== pickerDay) return day
        const exists = day.meals.some(m => m.type === targetType)
        if (exists) {
          return {
            ...day,
            meals: day.meals.map(m =>
              m.type === targetType
                ? { ...m, name: recipeName !== undefined ? recipeName : m.name, recipeId: recipeId !== undefined ? recipeId : null }
                : m
            ),
          }
        }
        // Slot doesn't exist yet (e.g. breakfast_side / lunch_side added for first time)
        return {
          ...day,
          meals: [
            ...day.meals,
            { type: targetType, name: recipeName, recipeId: recipeId ?? null, slotId: null, recipe: null, ingredients: [] },
          ],
        }
      }))
    }

    if (recipeName) {
      showToast(`Assigned: ${recipeName}`)
    } else {
      showToast('Recipe link removed')
    }
  }

  function handleSwapConfirm(newMeal) {
    if (!swapMealTarget) return

    // Optimistic update
    setMeals(prev => prev.map(day => {
      if (day.day !== swapMealTarget.day) return day
      return {
        ...day,
        meals: day.meals.map(m =>
          m.type === swapMealTarget.type
            ? { ...m, name: newMeal.name, ingredients: [] }
            : m
        ),
      }
    }))
    setSelectedMeal(null)
    setSwapMealTarget(null)
    showToast(`Swapped to ${newMeal.name}`)

    const snapshot = meals
    startTransition(async () => {
      const result = await swapMeal(swapMealTarget.day, swapMealTarget.type, newMeal.name)
      if (result.success && result.data?.meals) {
        setMeals(result.data.meals)
      } else if (!result.success) {
        setMeals(snapshot)
        showToast('Failed to swap meal. Please try again.', true)
      }
    })
  }

  function handleRemove(meal) {
    const target = meal || selectedMeal
    if (!target) return

    if (!confirm(`Remove "${target.name}" from ${target.day}'s ${target.type}?`)) return
    if (!confirm('This cannot be undone. Are you sure?')) return

    // Optimistic update
    setMeals(prev => prev.map(day => {
      if (day.day !== target.day) return day
      return {
        ...day,
        meals: day.meals.map(m =>
          m.type === target.type
            ? { ...m, name: null, ingredients: [] }
            : m
        ),
      }
    }))
    showToast(`Removed ${target.name}`)
    setSelectedMeal(null)

    const snapshot = meals
    startTransition(async () => {
      const result = await removeMeal(target.day, target.type)
      if (result.success && result.data?.meals) {
        setMeals(result.data.meals)
      } else if (!result.success) {
        setMeals(snapshot)
        showToast('Failed to remove meal. Please try again.', true)
      }
    })
  }

  function handleAddToGrocery(meal) {
    const target = meal || selectedMeal
    if (!target || !target.ingredients) return

    startTransition(async () => {
      const result = await addToGrocery(target.day, target.type)
      if (result.success) {
        showToast(`Added ${result.data.addedCount} items to grocery list`)
      } else {
        showToast('Failed to add to grocery list. Please try again.', true)
      }
    })
  }

  function handleFillWeek() {
    startTransition(async () => {
      const result = await fillWeek()
      if (result.success) {
        if (result.data?.meals) setMeals(result.data.meals)
        showToast('Koda filled your week!')
      } else {
        showToast('Failed to fill week. Please try again.', true)
      }
    })
  }

  function toggleAiFillMode(mode) {
    setAiFillModes(prev =>
      prev.includes(mode)
        ? prev.filter(m => m !== mode)
        : [...prev, mode]
    )
  }

  function handleAiFillSubmit(e) {
    e.preventDefault()
    if (aiFillModes.length === 0) return

    // If surprise is the only mode selected, run the batch surprise flow
    const hasSurprise = aiFillModes.includes('surprise')
    const planModes = aiFillModes.filter(m => m !== 'surprise')

    if (hasSurprise && planModes.length === 0) {
      if (surpriseMealTypes.length === 0) {
        showToast('Pick at least one meal type for Surprise Me.', true)
        return
      }
      handleSurpriseBatch()
      return
    }

    // If surprise + other modes, run surprise batch then proceed with other modes
    if (hasSurprise && surpriseMealTypes.length > 0) {
      handleSurpriseBatch()
      // If no other plan modes left, we're done
      if (planModes.length === 0) return
    }

    const instructions = aiInstructions.trim()
    const hasWebSearch = planModes.includes('web-search')
    const nonWebModes = planModes.filter(m => m !== 'web-search')

    // Build filters object from active filter chips
    const filters = {}
    if (filterBudget && weeklyBudget) {
      filters.weeklyBudget = Number(weeklyBudget)
      filters.stores = weekStores
    }
    if (filterMacros) {
      filters.macros = {
        caloriesMin: macroCaloriesRange[0],
        caloriesMax: macroCaloriesRange[1],
        proteinMin: macroProteinRange[0],
        proteinMax: macroProteinRange[1],
        carbsMin: macroCarbsRange[0],
        carbsMax: macroCarbsRange[1],
        fatMin: macroFatRange[0],
        fatMax: macroFatRange[1],
      }
    }
    if (filterTime) {
      if (timeMode === 'per-day') {
        filters.timePerDay = { ...timePerDay }
        filters.crockpotDays = Object.keys(crockpotDays).filter(d => crockpotDays[d])
      } else {
        filters.timeAll = timeAll
      }
    }

    startPreviewTransition(async () => {
      // If web-search is selected, fetch search results first to show picker
      if (hasWebSearch) {
        // Check for favorite website in parallel with the search
        const [searchResult, favResult] = await Promise.all([
          webSearchSlotsAction(weekOffset),
          getFavoriteWebsiteAction(),
        ])
        if (!searchResult.success) {
          showToast(searchResult.error || 'Web search failed.', true)
          return
        }
        const slotResults = searchResult.data?.slotResults || []
        if (slotResults.length === 0) {
          showToast('No empty slots to search for.', true)
          return
        }
        setWebSearchResults(slotResults)
        setWebSearchPicks({})
        if (favResult.success && favResult.data?.favoriteWebsite) {
          setFavoriteWebsite(favResult.data.favoriteWebsite)
        }
        // Also run non-web modes in parallel if any were selected
        if (nonWebModes.length > 0) {
          const fillResult = await aiFillWeekAction(instructions, nonWebModes, weekOffset, filters)
          if (fillResult.success && fillResult.data?.meals) setMeals(fillResult.data.meals)
        }
        return
      }

      // No web search — close dialog immediately so the loading screen shows
      closeAiFillDialog()
      const result = await generateMealPlanPreviewAction(instructions, aiFillModes, weekOffset, { ...filters, replanAll })
      if (result.success) {
        setPlanningModeSlots(result.data?.previewSlots || [])
        setPlanningModeOpen(true)
      } else {
        showToast(result.error || 'Planning failed. Please try again.', true)
      }
    })
  }

  function closeAiFillDialog() {
    setAiFillOpen(false)
    setAiInstructions('')
    setAiFillModes([])
    setReplanAll(false)
    setFilterBudget(false)
    setFilterMacros(false)
    setFilterTime(false)
    setMacroCaloriesRange([0, 800])
    setMacroProteinRange([0, 40])
    setMacroCarbsRange([0, 100])
    setMacroFatRange([0, 50])
    setWebSearchResults(null)
    setWebSearchPicks({})
    setRecipeSuggestions(null)
    setRecipePicks({})
    setSavePrompt(null)
    setPreviewRecipe(null)
    setPantryItemNames([])
    setSurpriseResult(null)
    setSurpriseResults(null)
    setSurpriseAccepted({})
    setSurpriseSlot(null)
    setSurpriseMealTypes([])
    setSurpriseCount(3)
    setPlanMealTypes([])
    setDinnerSides('0')
    setDinnerDessert(false)
    setFavWebsiteDismissed(false)
  }

  // ─── Planning Mode handlers ───────────────────────────────────────────────

  function handleSavePlan(slotsWithChecked) {
    startSavePlanTransition(async () => {
      const result = await savePlanningModeAction(slotsWithChecked, weekOffset)
      if (result.success) {
        const weekResult = await getWeekMealsAction(weekOffset)
        if (weekResult.success) setMeals(weekResult.data.meals)
        setPlanningModeOpen(false)
        setPlanningModeSlots([])
        showToast('Your week is saved — grocery list updated!')
      } else {
        showToast(result.error || 'Failed to save plan. Please try again.', true)
      }
    })
  }

  function handlePlanningModeClose() {
    setPlanningModeDraftPromptOpen(true)
  }

  function handleSaveDraft() {
    startTransition(async () => {
      await saveMealPlanDraftAction(planningModeSlots, weekOffset)
      setPlanningModeDraftPromptOpen(false)
      setPlanningModeOpen(false)
      setPlanningModeSlots([])
      showToast('Draft saved!')
    })
  }

  function handleDiscardPlan() {
    setPlanningModeDraftPromptOpen(false)
    setPlanningModeOpen(false)
    setPlanningModeSlots([])
  }

  function handleResumeDraft() {
    if (draftBannerData?.draft_data?.previewSlots) {
      setPlanningModeSlots(draftBannerData.draft_data.previewSlots)
      setPlanningModeOpen(true)
      setDraftBannerVisible(false)
      dismissMealPlanDraftAction()
    }
  }

  function handleDismissDraft() {
    setDraftBannerVisible(false)
    startTransition(() => dismissMealPlanDraftAction())
  }

  function handleWebSearchPick(slotKey, recipeIndex) {
    setWebSearchPicks(prev => ({ ...prev, [slotKey]: recipeIndex }))
  }

  function handleWebSearchConfirm() {
    startAiTransition(async () => {
      let assignCount = 0
      for (const slotResult of webSearchResults) {
        const key = `${slotResult.dayOfWeek}:${slotResult.type}`
        const pickIdx = webSearchPicks[key]
        if (pickIdx == null) continue
        const recipe = slotResult.recipes[pickIdx]
        if (!recipe) continue

        const result = await swapMeal(slotResult.day, slotResult.type, recipe.name)
        if (result.success) assignCount++
      }
      // Reload the week to get fresh state
      const weekResult = await getWeekMealsAction(weekOffset)
      if (weekResult.success) setMeals(weekResult.data.meals)
      closeAiFillDialog()
      if (assignCount > 0) {
        showToast(`Added ${assignCount} recipe${assignCount !== 1 ? 's' : ''} from web search!`)
      }
    })
  }

  // Single surprise (used from swap / RecipePickerModal)
  function handleSurpriseMe(mealType) {
    startAiTransition(async () => {
      setSurpriseResult(null)
      const result = await surpriseMeAction(mealType || null)
      if (result.success && result.data?.recipe) {
        setSurpriseResult(result.data.recipe)
      } else {
        showToast(result.error || 'Could not find a surprise recipe.', true)
      }
    })
  }

  // Single surprise accept (from swap or single surprise view)
  function handleSurpriseAccept() {
    if (!surpriseResult) return
    const targetDay = surpriseSlot?.day
    const targetType = surpriseSlot?.mealType || 'dinner'

    startAiTransition(async () => {
      if (targetDay) {
        await swapMeal(targetDay, targetType, surpriseResult.name)
      }
      const weekResult = await getWeekMealsAction(weekOffset)
      if (weekResult.success) setMeals(weekResult.data.meals)
      closeAiFillDialog()
      showToast(`Added: ${surpriseResult.name}`)
    })
  }

  // Batch surprise (from plan-my-week dialog)
  function handleSurpriseBatch() {
    if (surpriseMealTypes.length === 0) return
    startAiTransition(async () => {
      setSurpriseResults(null)
      setSurpriseAccepted({})
      const result = await surpriseMeBatchAction(surpriseCount, surpriseMealTypes)
      if (result.success && result.data?.recipes?.length > 0) {
        setSurpriseResults(result.data.recipes)
        // Pre-select all
        const accepted = {}
        result.data.recipes.forEach((_, i) => { accepted[i] = true })
        setSurpriseAccepted(accepted)
      } else {
        showToast(result.error || 'Could not find surprise recipes.', true)
      }
    })
  }

  function toggleSurpriseAccepted(index) {
    setSurpriseAccepted(prev => ({ ...prev, [index]: !prev[index] }))
  }

  function handleSurpriseBatchAccept() {
    if (!surpriseResults) return
    const accepted = surpriseResults.filter((_, i) => surpriseAccepted[i])
    if (accepted.length === 0) return

    startAiTransition(async () => {
      // Find empty slots in the week to assign accepted recipes
      const emptySlots = []
      for (const day of meals) {
        for (const meal of day.meals) {
          if (!meal.name && ['breakfast', 'lunch', 'dinner'].includes(meal.type)) {
            emptySlots.push({ day: day.day, type: meal.type })
          }
        }
      }

      let assignCount = 0
      for (const recipe of accepted) {
        if (emptySlots.length === 0) break
        // Try to match meal type preference first
        let slotIdx = -1
        if (surpriseMealTypes.length > 0) {
          slotIdx = emptySlots.findIndex(s => surpriseMealTypes.includes(s.type))
        }
        if (slotIdx === -1) slotIdx = 0
        const slot = emptySlots.splice(slotIdx, 1)[0]
        const result = await swapMeal(slot.day, slot.type, recipe.name)
        if (result.success) assignCount++
      }

      const weekResult = await getWeekMealsAction(weekOffset)
      if (weekResult.success) setMeals(weekResult.data.meals)
      closeAiFillDialog()
      if (assignCount > 0) {
        showToast(`Added ${assignCount} surprise recipe${assignCount !== 1 ? 's' : ''}!`)
      } else {
        showToast('No empty slots available to add recipes.', true)
      }
    })
  }

  function toggleSurpriseMealType(type) {
    setSurpriseMealTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  // ─── Recipe suggestions planning box handlers ─────────────────────────────

  function handleRecipePreview(slotKey, recipeIndex) {
    const slot = recipeSuggestions.find(s => `${s.day}:${s.type}` === slotKey)
    const recipe = slot?.recipes?.[recipeIndex]
    if (recipe) {
      setPreviewRecipe({ recipe, slotKey, recipeIndex })
    }
  }

  function handleRecipeSelect() {
    if (!previewRecipe) return
    const { slotKey, recipeIndex, recipe } = previewRecipe
    setRecipePicks(prev => ({ ...prev, [slotKey]: recipeIndex }))
    setPreviewRecipe(null)
    // Show save prompt for this pick
    setSavePrompt({ slotKey, recipe })
  }

  function handleSavePromptResponse(shouldSave) {
    if (!savePrompt) return
    const { slotKey, recipe } = savePrompt
    if (shouldSave) {
      // Save recipe in background — don't block the UI
      startSaveTransition(async () => {
        const recipeData = {
          name: recipe.name,
          description: recipe.description || '',
          instructions: recipe.instructions || '',
          prep_time_minutes: recipe.prep_time_minutes || null,
          cook_time_minutes: recipe.cook_time_minutes || null,
          servings: recipe.servings || null,
          source: recipe.source_url || '',
          ingredients: (recipe.ingredients || []).map(i => `${i.quantity} ${i.name}`).join('\n'),
          tags: [],
        }
        const result = await createRecipeAction(recipeData)
        if (result.success && result.data?.id) {
          // Store the saved recipe ID so we can link it during confirm
          setRecipePicks(prev => ({
            ...prev,
            [`${slotKey}:savedId`]: result.data.id,
          }))
          showToast(`Saved "${recipe.name}" to your Recipe Box!`)
        }
      })
    }
    setSavePrompt(null)
  }

  function handleRecipeSuggestionsConfirm() {
    startAiTransition(async () => {
      let assignCount = 0
      for (const slot of recipeSuggestions) {
        const key = `${slot.day}:${slot.type}`
        const pickIdx = recipePicks[key]
        if (pickIdx == null) continue
        const recipe = slot.recipes[pickIdx]
        if (!recipe) continue

        // Check if user saved this recipe — if so, link by ID
        const savedId = recipePicks[`${key}:savedId`]
        if (savedId) {
          const result = await assignRecipeToSlot(slot.day, slot.type, savedId)
          if (result.success) assignCount++
        } else {
          // Just update the meal name (already set by aiFillWeekAction, but update to match the chosen recipe name)
          const result = await swapMeal(slot.day, slot.type, recipe.name)
          if (result.success) assignCount++
        }
      }
      // Reload the week
      const weekResult = await getWeekMealsAction(weekOffset)
      if (weekResult.success) setMeals(weekResult.data.meals)
      closeAiFillDialog()
      if (assignCount > 0) {
        showToast(`Linked ${assignCount} recipe${assignCount !== 1 ? 's' : ''} to your meal plan!`)
      }
    })
  }

  return (
    <>
      <PageHeader>
        <div>
          <Title>Meal planner</Title>
          <Subtitle>{stats.filled} of {stats.total} meals planned this week</Subtitle>
        </div>
        <HeaderActions>
          <KodaPlanButton
            onClick={() => {
              if (isMainWeekFull()) {
                setFullWeekPromptOpen(true)
              } else {
                setAiFillOpen(true)
              }
            }}
            disabled={isAiFilling || isGeneratingPreview}
          >
            <AIDot />
            Koda, plan my week
          </KodaPlanButton>
        </HeaderActions>
      </PageHeader>

      <WeekNav>
        <NavButton onClick={() => handleWeekChange(-1)} disabled={isLoadingWeek}>{'\u2039'}</NavButton>
        <WeekLabel>{getWeekLabel(weekOffset)}</WeekLabel>
        <NavButton onClick={() => handleWeekChange(1)} disabled={isLoadingWeek}>{'\u203A'}</NavButton>
      </WeekNav>

      <StatsRow>
        <StatChip>
          <StatDot $color="#1D9E75" />
          {stats.filled} planned
        </StatChip>
        {stats.empty > 0 && (
          <StatChip>
            <StatDot $color="#9CA3AF" />
            {stats.empty} empty
          </StatChip>
        )}
        {stats.needItems > 0 && (
          <StatChip>
            <StatDot $color="#D85A30" />
            {stats.needItems} items to buy
          </StatChip>
        )}
      </StatsRow>

      {draftBannerVisible && (
        <DraftBanner>
          <DraftBannerText>You have an unsaved draft plan — resume it?</DraftBannerText>
          <DraftBannerActions>
            <DraftBannerBtn $primary onClick={handleResumeDraft}>Resume</DraftBannerBtn>
            <DraftBannerBtn onClick={handleDismissDraft}>Dismiss</DraftBannerBtn>
          </DraftBannerActions>
        </DraftBanner>
      )}

      <MealPlannerGrid
        meals={meals}
        selectedMeal={selectedMeal}
        onSelectMeal={setSelectedMeal}
        onSwap={(meal) => {
          setSelectedMeal(null)
          setPickerDay(meal.day)
          setPickerMealType(meal.type)
          setPickerCurrentRecipeId(meal.recipeId ?? null)
          setPickerInitialMode(null)
          setPickerOpen(true)
        }}
        onAddToGrocery={handleAddToGrocery}
        onRemove={handleRemove}
        onSlotClick={handleSlotClick}
        onSidePickerOpen={handleOpenSidePicker}
        onRepeat={(updatedMeals) => setMeals(updatedMeals)}
        weekOffset={weekOffset}
      />


      <RecipePickerModal
        isOpen={pickerOpen}
        onClose={() => { setPickerOpen(false); setPickerInitialMode(null); setPickerSideType(null) }}
        day={pickerDay}
        mealType={pickerMealType}
        currentRecipeId={pickerCurrentRecipeId}
        recipes={recipes}
        onAssigned={handlePickerAssigned}
        initialMode={pickerInitialMode}
        sideType={pickerSideType}
        collections={collections}
        collectionLinks={collectionLinks}
      />

      {aiFillOpen && (
        <Overlay onClick={(e) => e.target === e.currentTarget && !isAiFilling && closeAiFillDialog()}>
          <Dialog>
            <DialogHeader>
              <DialogTitle>{surpriseResults ? `Surprise recipes!` : surpriseResult ? 'Surprise recipe!' : recipeSuggestions ? 'Pick recipes for your meals' : webSearchResults ? 'Choose recipes for your week' : 'How would you like to plan your week?'}</DialogTitle>
              <CloseButton
                onClick={closeAiFillDialog}
                disabled={isAiFilling}
              >
                {'\u2715'}
              </CloseButton>
            </DialogHeader>

            {surpriseResults ? (
              <DialogBody>
                <DialogHint>Koda found {surpriseResults.length} trending recipe{surpriseResults.length !== 1 ? 's' : ''}. Select the ones you want to add to your meal plan.</DialogHint>
                <SurpriseResultsScroll>
                  {surpriseResults.map((recipe, i) => (
                    <SurpriseResultCard key={i}>
                      <SurpriseResultIndex>Recipe {i + 1}</SurpriseResultIndex>
                      <SurpriseName>{recipe.name}</SurpriseName>
                      <SurpriseTrending>{recipe.trending_reason}</SurpriseTrending>
                      {recipe.description && <SurpriseDesc>{recipe.description}</SurpriseDesc>}
                      <SurpriseMeta>
                        {recipe.cook_time_minutes && <span>{(recipe.prep_time_minutes || 0) + recipe.cook_time_minutes} min</span>}
                        {recipe.servings && <span>{recipe.servings} servings</span>}
                        {recipe.rating && <span>{'\u2605'} {recipe.rating}</span>}
                      </SurpriseMeta>
                      {recipe.source_url && (
                        <SurpriseSourceLink href={recipe.source_url} target="_blank" rel="noopener noreferrer">
                          View original source
                        </SurpriseSourceLink>
                      )}
                      <SurpriseResultAcceptRow>
                        <SurpriseResultCheckButton
                          $checked={!!surpriseAccepted[i]}
                          onClick={() => toggleSurpriseAccepted(i)}
                        >
                          {surpriseAccepted[i] ? '\u2713' : ''}
                        </SurpriseResultCheckButton>
                        <SurpriseResultLabel>
                          {surpriseAccepted[i] ? 'Will be added' : 'Tap to include'}
                        </SurpriseResultLabel>
                      </SurpriseResultAcceptRow>
                    </SurpriseResultCard>
                  ))}
                </SurpriseResultsScroll>
                <DialogFooter>
                  <CancelButton type="button" onClick={closeAiFillDialog} disabled={isAiFilling}>
                    Cancel
                  </CancelButton>
                  <SurpriseAcceptButton
                    onClick={handleSurpriseBatchAccept}
                    disabled={isAiFilling || Object.values(surpriseAccepted).filter(Boolean).length === 0}
                  >
                    {isAiFilling ? 'Adding\u2026' : `Add ${Object.values(surpriseAccepted).filter(Boolean).length} to meal plan`}
                  </SurpriseAcceptButton>
                </DialogFooter>
              </DialogBody>
            ) : surpriseResult ? (
              <DialogBody>
                <SurpriseResultCard>
                  <SurpriseName>{surpriseResult.name}</SurpriseName>
                  <SurpriseTrending>{surpriseResult.trending_reason}</SurpriseTrending>
                  {surpriseResult.description && <SurpriseDesc>{surpriseResult.description}</SurpriseDesc>}
                  <SurpriseMeta>
                    {surpriseResult.cook_time_minutes && <span>{(surpriseResult.prep_time_minutes || 0) + surpriseResult.cook_time_minutes} min</span>}
                    {surpriseResult.servings && <span>{surpriseResult.servings} servings</span>}
                    {surpriseResult.rating && <span>{'\u2605'} {surpriseResult.rating}</span>}
                  </SurpriseMeta>
                  {surpriseResult.source_url && (
                    <SurpriseSourceLink href={surpriseResult.source_url} target="_blank" rel="noopener noreferrer">
                      View original source
                    </SurpriseSourceLink>
                  )}
                  <SurpriseActions>
                    <SurpriseAcceptButton onClick={handleSurpriseAccept} disabled={isAiFilling}>
                      {isAiFilling ? 'Adding\u2026' : 'Add to meal plan'}
                    </SurpriseAcceptButton>
                    <SurpriseAgainButton onClick={() => handleSurpriseMe(surpriseSlot?.mealType)} disabled={isAiFilling}>
                      {isAiFilling ? 'Searching\u2026' : 'Surprise me again'}
                    </SurpriseAgainButton>
                  </SurpriseActions>
                </SurpriseResultCard>
                <DialogFooter>
                  <CancelButton type="button" onClick={closeAiFillDialog} disabled={isAiFilling}>
                    Cancel
                  </CancelButton>
                </DialogFooter>
              </DialogBody>
            ) : recipeSuggestions ? (
              <DialogBody>
                <DialogHint>Koda found recipe matches for your Koda-generated meals. Pick one per slot.</DialogHint>
                <WebSearchSlotList>
                  {recipeSuggestions.map(slot => {
                    const key = `${slot.day}:${slot.type}`
                    const DAY_NAMES = { 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 7: 'Sun' }
                    if (!slot.recipes?.length) return null
                    return (
                      <WebSearchSlotGroup key={key}>
                        <PlanningSlotHeader>
                          <WebSearchSlotLabel>{DAY_NAMES[slot.dayOfWeek] || slot.day} {slot.type}</WebSearchSlotLabel>
                          {recipePicks[key] != null && <PickedBadge>{'\u2713'} Picked</PickedBadge>}
                        </PlanningSlotHeader>
                        <PlanningSlotIdea>Koda idea: {slot.mealName}</PlanningSlotIdea>
                        {slot.recipes.map((recipe, idx) => (
                          <WebRecipeOption
                            key={idx}
                            type="button"
                            $selected={recipePicks[key] === idx}
                            onClick={() => handleRecipePreview(key, idx)}
                            disabled={isAiFilling || isSaving}
                          >
                            <WebRecipeInfo>
                              <WebRecipeName>{recipe.name}</WebRecipeName>
                              <WebRecipeMeta>
                                {recipe.rating != null && <span>{'\u2605'} {recipe.rating}</span>}
                                {recipe.review_count != null && <span>{recipe.review_count} reviews</span>}
                                {(recipe.cook_time_minutes || recipe.prep_time_minutes) && (
                                  <span>{(recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)} min</span>
                                )}
                              </WebRecipeMeta>
                              {recipe.description && <WebRecipeDesc>{recipe.description}</WebRecipeDesc>}
                            </WebRecipeInfo>
                            <OptionCheck $selected={recipePicks[key] === idx}>
                              {recipePicks[key] === idx && '\u2713'}
                            </OptionCheck>
                          </WebRecipeOption>
                        ))}
                      </WebSearchSlotGroup>
                    )
                  })}
                </WebSearchSlotList>
                <DialogFooter>
                  <CancelButton type="button" onClick={closeAiFillDialog} disabled={isAiFilling}>
                    Skip
                  </CancelButton>
                  <FillButton
                    type="button"
                    onClick={handleRecipeSuggestionsConfirm}
                    $loading={isAiFilling}
                    $disabled={Object.keys(recipePicks).filter(k => !k.endsWith(':savedId')).length === 0}
                    disabled={isAiFilling || Object.keys(recipePicks).filter(k => !k.endsWith(':savedId')).length === 0}
                  >
                    {isAiFilling ? 'Linking recipes\u2026' : `Link ${Object.keys(recipePicks).filter(k => !k.endsWith(':savedId')).length} recipe${Object.keys(recipePicks).filter(k => !k.endsWith(':savedId')).length !== 1 ? 's' : ''}`}
                  </FillButton>
                </DialogFooter>
              </DialogBody>
            ) : webSearchResults ? (
              <DialogBody>
                <DialogHint>Pick one recipe per slot. Scroll to see all meals.</DialogHint>
                {favoriteWebsite && !favWebsiteDismissed && (
                  <FavWebsitePrompt>
                    <span>You often cook from <strong>{favoriteWebsite}</strong> — search there first?</span>
                    <FavWebsiteButtons>
                      <FavWebsiteBtn $primary onClick={() => { setFavWebsiteDismissed(true); showToast(`Prioritizing ${favoriteWebsite} results`) }}>Yes</FavWebsiteBtn>
                      <FavWebsiteBtn onClick={() => setFavWebsiteDismissed(true)}>No</FavWebsiteBtn>
                    </FavWebsiteButtons>
                  </FavWebsitePrompt>
                )}
                <WebSearchSlotList>
                  {webSearchResults.map(slotResult => {
                    const key = `${slotResult.dayOfWeek}:${slotResult.type}`
                    const DAY_NAMES = { 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 7: 'Sun' }
                    if (!slotResult.recipes?.length) return null
                    return (
                      <WebSearchSlotGroup key={key}>
                        <WebSearchSlotLabel>{DAY_NAMES[slotResult.dayOfWeek]} {slotResult.type}</WebSearchSlotLabel>
                        {slotResult.recipes.map((recipe, idx) => (
                          <WebRecipeOption
                            key={idx}
                            type="button"
                            $selected={webSearchPicks[key] === idx}
                            onClick={() => handleWebSearchPick(key, idx)}
                            disabled={isAiFilling}
                          >
                            <WebRecipeInfo>
                              <WebRecipeName>{recipe.name}</WebRecipeName>
                              <WebRecipeMeta>
                                {recipe.rating != null && <span>{'\u2605'} {recipe.rating}</span>}
                                {recipe.review_count != null && <span>{recipe.review_count} reviews</span>}
                                {(recipe.cook_time_minutes || recipe.prep_time_minutes) && (
                                  <span>{(recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)} min</span>
                                )}
                              </WebRecipeMeta>
                              {recipe.description && <WebRecipeDesc>{recipe.description}</WebRecipeDesc>}
                            </WebRecipeInfo>
                            <OptionCheck $selected={webSearchPicks[key] === idx}>
                              {webSearchPicks[key] === idx && '\u2713'}
                            </OptionCheck>
                          </WebRecipeOption>
                        ))}
                      </WebSearchSlotGroup>
                    )
                  })}
                </WebSearchSlotList>
                <DialogFooter>
                  <CancelButton type="button" onClick={closeAiFillDialog} disabled={isAiFilling}>
                    Cancel
                  </CancelButton>
                  <FillButton
                    type="button"
                    onClick={handleWebSearchConfirm}
                    $loading={isAiFilling}
                    $disabled={Object.keys(webSearchPicks).length === 0}
                    disabled={isAiFilling || Object.keys(webSearchPicks).length === 0}
                  >
                    {isAiFilling ? 'Adding recipes\u2026' : `Add ${Object.keys(webSearchPicks).length} recipe${Object.keys(webSearchPicks).length !== 1 ? 's' : ''}`}
                  </FillButton>
                </DialogFooter>
              </DialogBody>
            ) : (
              <DialogBody as="form" onSubmit={handleAiFillSubmit}>
                <MealTypePicker>
                  <MealTypePickerLabel>What are you planning?</MealTypePickerLabel>
                  <MealTypeBubbleRow>
                    {[
                      { key: 'breakfast', label: 'Breakfast', icon: '🍳' },
                      { key: 'lunch',     label: 'Lunch',     icon: '🥗' },
                      { key: 'dinner',    label: 'Dinner',    icon: '🍽️' },
                    ].map(({ key, label, icon }) => {
                      const active = planMealTypes.includes(key)
                      return (
                        <MealTypeBubble
                          key={key}
                          type="button"
                          $type={key}
                          $active={active}
                          onClick={() => setPlanMealTypes(prev =>
                            prev.includes(key) ? prev.filter(t => t !== key) : [...prev, key]
                          )}
                          disabled={isAiFilling}
                        >
                          <MealTypeBubbleDot $type={key} $active={active} />
                          {icon} {label}
                        </MealTypeBubble>
                      )
                    })}
                  </MealTypeBubbleRow>

                  {planMealTypes.includes('dinner') && (
                    <DinnerOptionsRow>
                      <DinnerOptionLabel htmlFor="dinner-sides">Sides:</DinnerOptionLabel>
                      <DinnerOptionSelect
                        id="dinner-sides"
                        value={dinnerSides}
                        onChange={(e) => setDinnerSides(e.target.value)}
                        disabled={isAiFilling}
                      >
                        <option value="0">No sides</option>
                        <option value="1">1 side</option>
                        <option value="2">2 sides</option>
                      </DinnerOptionSelect>
                      <DinnerDessertToggle
                        type="button"
                        $active={dinnerDessert}
                        onClick={() => setDinnerDessert(d => !d)}
                        disabled={isAiFilling}
                      >
                        {dinnerDessert ? '✓' : ''} {'🍰'} Dessert
                      </DinnerDessertToggle>
                    </DinnerOptionsRow>
                  )}
                </MealTypePicker>

                <OptionCardsGrid>
                  <OptionCard
                    type="button"
                    $selected={aiFillModes.includes('my-recipes')}
                    onClick={() => toggleAiFillMode('my-recipes')}
                    disabled={isAiFilling}
                  >
                    <OptionIcon>{'\uD83D\uDCD6'}</OptionIcon>
                    <OptionContent>
                      <OptionName>Use My Recipes</OptionName>
                      <OptionDesc>Koda builds your week using recipes already saved in your Recipe Box.</OptionDesc>
                    </OptionContent>
                    <OptionCheck $selected={aiFillModes.includes('my-recipes')}>
                      {aiFillModes.includes('my-recipes') && '\u2713'}
                    </OptionCheck>
                  </OptionCard>

                  <OptionCard
                    type="button"
                    $selected={aiFillModes.includes('web-search')}
                    onClick={() => toggleAiFillMode('web-search')}
                    disabled={isAiFilling}
                  >
                    <OptionIcon>{'\uD83C\uDF10'}</OptionIcon>
                    <OptionContent>
                      <OptionName>Find Recipes Online</OptionName>
                      <OptionDesc>Koda searches the web for highly rated recipes based on what you have.</OptionDesc>
                    </OptionContent>
                    <OptionCheck $selected={aiFillModes.includes('web-search')}>
                      {aiFillModes.includes('web-search') && '\u2713'}
                    </OptionCheck>
                  </OptionCard>

                  <OptionCard
                    type="button"
                    $selected={aiFillModes.includes('fill-for-me')}
                    onClick={() => toggleAiFillMode('fill-for-me')}
                    disabled={isAiFilling}
                  >
                    <OptionIcon>{'\u2728'}</OptionIcon>
                    <OptionContent>
                      <OptionName>Fill My Week for Me</OptionName>
                      <OptionDesc>Koda mixes recipes from your Recipe Box and new ideas to build a full balanced week.</OptionDesc>
                    </OptionContent>
                    <OptionCheck $selected={aiFillModes.includes('fill-for-me')}>
                      {aiFillModes.includes('fill-for-me') && '\u2713'}
                    </OptionCheck>
                  </OptionCard>
                  <OptionCard
                    type="button"
                    $selected={aiFillModes.includes('surprise')}
                    onClick={() => toggleAiFillMode('surprise')}
                    disabled={isAiFilling}
                    style={{
                      borderColor: aiFillModes.includes('surprise') ? '#D85A30' : '#F0997B',
                      background: aiFillModes.includes('surprise') ? '#FFF0EB' : '#FFF7F5',
                    }}
                  >
                    <OptionIcon>{'\uD83C\uDF89'}</OptionIcon>
                    <OptionContent>
                      <OptionName style={{ color: '#D85A30' }}>Surprise Me!</OptionName>
                      <OptionDesc>Find viral TikTok recipes that match your taste and pantry.</OptionDesc>
                    </OptionContent>
                    <OptionCheck
                      $selected={aiFillModes.includes('surprise')}
                      style={aiFillModes.includes('surprise') ? { borderColor: '#D85A30', background: '#D85A30' } : { borderColor: '#F0997B' }}
                    >
                      {aiFillModes.includes('surprise') && '\u2713'}
                    </OptionCheck>
                  </OptionCard>
                </OptionCardsGrid>

                {aiFillModes.includes('surprise') && (
                  <SurpriseConfigPanel>
                    <SurpriseConfigLabel>Which meals? (select all that apply)</SurpriseConfigLabel>
                    <SurpriseTypeRow>
                      {['breakfast', 'lunch', 'dinner'].map(type => (
                        <SurpriseTypeChip
                          key={type}
                          type="button"
                          $active={surpriseMealTypes.includes(type)}
                          onClick={() => toggleSurpriseMealType(type)}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SurpriseTypeChip>
                      ))}
                    </SurpriseTypeRow>
                    <SurpriseConfigLabel>How many surprise meals?</SurpriseConfigLabel>
                    <SurpriseCountRow>
                      <SurpriseCountButton
                        type="button"
                        onClick={() => setSurpriseCount(c => Math.max(1, c - 1))}
                        disabled={surpriseCount <= 1}
                      >
                        -
                      </SurpriseCountButton>
                      <SurpriseCountValue>{surpriseCount}</SurpriseCountValue>
                      <SurpriseCountButton
                        type="button"
                        onClick={() => setSurpriseCount(c => Math.min(7, c + 1))}
                        disabled={surpriseCount >= 7}
                      >
                        +
                      </SurpriseCountButton>
                      <SurpriseCountLabel>meal{surpriseCount !== 1 ? 's' : ''}</SurpriseCountLabel>
                    </SurpriseCountRow>
                  </SurpriseConfigPanel>
                )}

                <FilterSection>
                  <FilterSectionTitle>Filters (choose all that apply)</FilterSectionTitle>
                  <FilterChipRow>
                    <FilterChip type="button" $active={filterBudget} onClick={() => setFilterBudget(b => !b)} disabled={isAiFilling}>
                      {'\uD83D\uDCB0'} Budget
                    </FilterChip>
                    <FilterChip type="button" $active={filterMacros} onClick={() => setFilterMacros(b => !b)} disabled={isAiFilling}>
                      {'\uD83E\uDDEA'} Macros
                    </FilterChip>
                    <FilterChip type="button" $active={filterTime} onClick={() => setFilterTime(b => !b)} disabled={isAiFilling}>
                      {'\u23F1'} Time
                    </FilterChip>
                  </FilterChipRow>

                  {filterBudget && (
                    <FilterExpandedArea>
                      <FilterRow>
                        <FilterLabel>Weekly $</FilterLabel>
                        <FilterInput
                          type="number"
                          placeholder="150"
                          value={weeklyBudget}
                          onChange={(e) => setWeeklyBudget(e.target.value)}
                          disabled={isAiFilling}
                          min={0}
                          max={5000}
                        />
                        <FilterUnit>/week</FilterUnit>
                      </FilterRow>
                      {!hasStores && (
                        <FilterDisclaimer>
                          Set up your favorite grocery stores in Settings to unlock store-specific deals and price matching.
                        </FilterDisclaimer>
                      )}
                      {hasStores && (
                        <>
                          <FilterDisclaimer>
                            Koda will reference deals at your saved stores: {weekStores.length > 0 ? weekStores.map(s => s.label || s.value).join(', ') : 'none selected'}
                          </FilterDisclaimer>
                          <ChangeStoresLink
                            type="button"
                            onClick={() => setStorePickerOpen(o => !o)}
                            disabled={isAiFilling}
                          >
                            {storePickerOpen ? 'Done choosing stores' : 'Change stores for this week'}
                          </ChangeStoresLink>
                          {storePickerOpen && (
                            <StorePickerArea>
                              <StorePickerTitle>Choose which stores Koda should pull from this week</StorePickerTitle>
                              {allSavedStores.map(store => {
                                const isSelected = weekStores.some(s => s.value === store.value)
                                return (
                                  <StoreCheckRow key={store.value}>
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      disabled={isAiFilling}
                                      onChange={() => {
                                        setWeekStores(prev =>
                                          isSelected
                                            ? prev.filter(s => s.value !== store.value)
                                            : [...prev, store]
                                        )
                                      }}
                                    />
                                    {store.label || store.value}
                                  </StoreCheckRow>
                                )
                              })}
                            </StorePickerArea>
                          )}
                        </>
                      )}
                    </FilterExpandedArea>
                  )}

                  {filterMacros && (
                    <FilterExpandedArea>
                      <MacroServingNote>Per serving targets</MacroServingNote>
                      <MacroRangeSlider
                        label="Calories"
                        unit="kcal"
                        min={0} max={1500} step={25}
                        values={macroCaloriesRange}
                        onChange={setMacroCaloriesRange}
                        disabled={isAiFilling}
                        color="#E8A930"
                        hint="Stay under the upper end — ideal for calorie-conscious meals"
                      />
                      <MacroRangeSlider
                        label="Protein"
                        unit="g"
                        min={0} max={150} step={5}
                        values={macroProteinRange}
                        onChange={setMacroProteinRange}
                        disabled={isAiFilling}
                        color="#3BA896"
                        hint="Aim for at least the lower end per serving"
                      />
                      <MacroRangeSlider
                        label="Carbs"
                        unit="g"
                        min={0} max={200} step={5}
                        values={macroCarbsRange}
                        onChange={setMacroCarbsRange}
                        disabled={isAiFilling}
                        color="#7C5CBF"
                        hint="Keep carbs under the upper end per serving"
                      />
                      <MacroRangeSlider
                        label="Fat"
                        unit="g"
                        min={0} max={100} step={2}
                        values={macroFatRange}
                        onChange={setMacroFatRange}
                        disabled={isAiFilling}
                        color="#D85A30"
                        hint="Keep fat under the upper end per serving"
                      />
                    </FilterExpandedArea>
                  )}

                  {filterTime && (
                    <FilterExpandedArea>
                      <TimeModeTabs>
                        <TimeModeTab type="button" $active={timeMode === 'same'} onClick={() => setTimeMode('same')}>
                          Same for all days
                        </TimeModeTab>
                        <TimeModeTab type="button" $active={timeMode === 'per-day'} onClick={() => setTimeMode('per-day')}>
                          Per day
                        </TimeModeTab>
                      </TimeModeTabs>

                      {timeMode === 'same' ? (
                        <FilterRow>
                          <FilterLabel>Cook time</FilterLabel>
                          <TimeSelect
                            value={timeAll}
                            onChange={(e) => setTimeAll(e.target.value)}
                            disabled={isAiFilling}
                          >
                            <option value="quick">Under 30 min</option>
                            <option value="medium">30-60 min</option>
                            <option value="elaborate">60+ min</option>
                          </TimeSelect>
                        </FilterRow>
                      ) : (
                        <TimePerDayGrid>
                          {DAY_NAMES_LIST.map(day => (
                            <Fragment key={day}>
                              <TimeDayLabel>{day}</TimeDayLabel>
                              <TimeSelect
                                value={timePerDay[day]}
                                onChange={(e) => setTimePerDay(prev => ({ ...prev, [day]: e.target.value }))}
                                disabled={isAiFilling}
                              >
                                <option value="quick">Under 30 min</option>
                                <option value="medium">30-60 min</option>
                                <option value="elaborate">60+ min</option>
                              </TimeSelect>
                              <CrockpotToggle
                                type="button"
                                $active={crockpotDays[day]}
                                onClick={() => setCrockpotDays(prev => ({ ...prev, [day]: !prev[day] }))}
                                disabled={isAiFilling}
                              >
                                {crockpotDays[day] ? '\u2705 Slow Cooker' : 'Slow Cooker'}
                              </CrockpotToggle>
                            </Fragment>
                          ))}
                        </TimePerDayGrid>
                      )}
                    </FilterExpandedArea>
                  )}
                </FilterSection>

                <div>
                  <DialogLabel htmlFor="ai-instructions">
                    Instructions (optional)
                  </DialogLabel>
                  <DialogHint>
                    Tell Koda what to focus on this week, e.g. &quot;Italian food, use up the chicken&quot;
                  </DialogHint>
                </div>
                <InstructionsArea
                  id="ai-instructions"
                  placeholder="e.g. focus on quick meals under 30 minutes, vegetarian only this week..."
                  value={aiInstructions}
                  onChange={(e) => setAiInstructions(e.target.value)}
                  disabled={isAiFilling}
                />
                <PlannerSkipHint>
                  💡 Don&apos;t want Koda to fill a specific meal slot? Go back and add something to that day manually — Koda will skip any slots that already have a meal.
                </PlannerSkipHint>
                <DialogFooter>
                  <CancelButton
                    type="button"
                    onClick={closeAiFillDialog}
                    disabled={isAiFilling}
                  >
                    Cancel
                  </CancelButton>
                  <FillButton
                    type="submit"
                    $loading={isAiFilling || isGeneratingPreview}
                    $disabled={aiFillModes.length === 0 || (aiFillModes.includes('surprise') && aiFillModes.length === 1 && surpriseMealTypes.length === 0)}
                    disabled={isAiFilling || isGeneratingPreview || aiFillModes.length === 0 || (aiFillModes.includes('surprise') && aiFillModes.length === 1 && surpriseMealTypes.length === 0)}
                    style={aiFillModes.includes('surprise') && aiFillModes.length === 1 ? { background: '#D85A30', borderColor: '#D85A30' } : undefined}
                  >
                    {(isAiFilling || isGeneratingPreview) ? 'Koda is planning\u2026' : aiFillModes.includes('surprise') && aiFillModes.length === 1 ? `Surprise me with ${surpriseCount}!` : 'Plan my week'}
                  </FillButton>
                </DialogFooter>
              </DialogBody>
            )}
          </Dialog>
        </Overlay>
      )}

      {savePrompt && (
        <SavePromptOverlay onClick={(e) => e.target === e.currentTarget && handleSavePromptResponse(false)}>
          <SavePromptCard>
            <SavePromptTitle>Save to your Recipe Box?</SavePromptTitle>
            <SavePromptDesc>
              Would you like to save <strong>{savePrompt.recipe.name}</strong> to your Recipe Box? You can access it anytime from your Recipe Box.
            </SavePromptDesc>
            <SavePromptActions>
              <SavePromptBtn onClick={() => handleSavePromptResponse(false)} disabled={isSaving}>
                No thanks
              </SavePromptBtn>
              <SavePromptBtn $primary onClick={() => handleSavePromptResponse(true)} disabled={isSaving}>
                {isSaving ? 'Saving\u2026' : 'Save recipe'}
              </SavePromptBtn>
            </SavePromptActions>
          </SavePromptCard>
        </SavePromptOverlay>
      )}

      {previewRecipe && (
        <PreviewOverlay onClick={(e) => e.target === e.currentTarget && setPreviewRecipe(null)}>
          <PreviewCard>
            <PreviewHeader>
              <PreviewTitleBlock>
                <PreviewName>{previewRecipe.recipe.name}</PreviewName>
                <PreviewMeta>
                  {previewRecipe.recipe.rating != null && <span>{'\u2605'} {previewRecipe.recipe.rating}</span>}
                  {previewRecipe.recipe.review_count != null && <span>{previewRecipe.recipe.review_count} reviews</span>}
                  {(previewRecipe.recipe.prep_time_minutes || previewRecipe.recipe.cook_time_minutes) && (
                    <span>{(previewRecipe.recipe.prep_time_minutes || 0) + (previewRecipe.recipe.cook_time_minutes || 0)} min total</span>
                  )}
                  {previewRecipe.recipe.prep_time_minutes > 0 && (
                    <span>{previewRecipe.recipe.prep_time_minutes} min prep</span>
                  )}
                  {previewRecipe.recipe.cook_time_minutes > 0 && (
                    <span>{previewRecipe.recipe.cook_time_minutes} min cook</span>
                  )}
                  {previewRecipe.recipe.servings && <span>{previewRecipe.recipe.servings} servings</span>}
                </PreviewMeta>
              </PreviewTitleBlock>
              <CloseButton onClick={() => setPreviewRecipe(null)}>{'\u2715'}</CloseButton>
            </PreviewHeader>

            <PreviewBody>
              {previewRecipe.recipe.description && (
                <PreviewSection>
                  <InstructionsText>{previewRecipe.recipe.description}</InstructionsText>
                </PreviewSection>
              )}

              {previewRecipe.recipe.ingredients?.length > 0 && (
                <PreviewSection>
                  <PreviewSectionTitle>Ingredients ({previewRecipe.recipe.ingredients.length})</PreviewSectionTitle>
                  <IngredientList>
                    {previewRecipe.recipe.ingredients.map((ing, i) => {
                      const isPantry = pantryItemNames.some(p =>
                        ing.name.toLowerCase().includes(p) || p.includes(ing.name.toLowerCase())
                      )
                      return (
                        <IngredientItem key={i} $isPantry={isPantry}>
                          <strong>{ing.quantity}</strong> {ing.name}
                          {isPantry && <PantryTag>in pantry</PantryTag>}
                        </IngredientItem>
                      )
                    })}
                  </IngredientList>
                </PreviewSection>
              )}

              {previewRecipe.recipe.instructions && (
                <PreviewSection>
                  <PreviewSectionTitle>Instructions</PreviewSectionTitle>
                  <InstructionsText>{previewRecipe.recipe.instructions}</InstructionsText>
                </PreviewSection>
              )}

              {previewRecipe.recipe.source_url && (
                <PreviewSection>
                  <PreviewSourceLink href={previewRecipe.recipe.source_url} target="_blank" rel="noopener noreferrer">
                    View original recipe source
                  </PreviewSourceLink>
                </PreviewSection>
              )}
            </PreviewBody>

            <PreviewFooter>
              <PreviewBackButton onClick={() => setPreviewRecipe(null)}>
                Back
              </PreviewBackButton>
              <SelectRecipeButton onClick={handleRecipeSelect}>
                Select this recipe
              </SelectRecipeButton>
            </PreviewFooter>
          </PreviewCard>
        </PreviewOverlay>
      )}

      <PlanningModeOverlay
        isOpen={planningModeOpen}
        isGenerating={isGeneratingPreview}
        slots={planningModeSlots}
        weekOffset={weekOffset}
        recipes={recipes}
        collections={collections}
        collectionLinks={collectionLinks}
        isSaving={isSavingPlan}
        onSave={handleSavePlan}
        onStartOver={handleDiscardPlan}
        onClose={handlePlanningModeClose}
      />

      {fullWeekPromptOpen && (
        <SavePromptOverlay onClick={(e) => e.target === e.currentTarget && setFullWeekPromptOpen(false)}>
          <SavePromptCard>
            <SavePromptTitle>Your week is already fully planned.</SavePromptTitle>
            <SavePromptDesc>What would you like to do?</SavePromptDesc>
            <SavePromptActions>
              <SavePromptBtn
                onClick={() => {
                  setFullWeekPromptOpen(false)
                  showToast('Tap any meal slot on the planner to swap it out.')
                }}
              >
                Swap just a few days
              </SavePromptBtn>
              <SavePromptBtn
                $primary
                onClick={() => {
                  setFullWeekPromptOpen(false)
                  setReplanAll(true)
                  setAiFillOpen(true)
                }}
              >
                Replan the whole week
              </SavePromptBtn>
            </SavePromptActions>
          </SavePromptCard>
        </SavePromptOverlay>
      )}

      {planningModeDraftPromptOpen && (
        <SavePromptOverlay onClick={(e) => e.target === e.currentTarget && handleDiscardPlan()}>
          <SavePromptCard>
            <SavePromptTitle>Save as a draft?</SavePromptTitle>
            <SavePromptDesc>
              You can come back to this plan later and finish reviewing it before saving to your week.
            </SavePromptDesc>
            <SavePromptActions>
              <SavePromptBtn onClick={handleDiscardPlan}>
                Discard
              </SavePromptBtn>
              <SavePromptBtn $primary onClick={handleSaveDraft}>
                Save draft
              </SavePromptBtn>
            </SavePromptActions>
          </SavePromptCard>
        </SavePromptOverlay>
      )}

      {toast && <Toast $error={toast.isError}>{toast.message}</Toast>}
    </>
  )
}
