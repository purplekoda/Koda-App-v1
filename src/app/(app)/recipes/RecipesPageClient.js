'use client'

import { useState, useMemo, useRef, useEffect, useTransition } from 'react'
import Link from 'next/link'
import styled from 'styled-components'
import RecipeForm from '@/components/recipes/RecipeForm'
import RecipeImportReview from '@/components/recipes/RecipeImportReview'
import Modal from '@/components/recipes/Modal'
import { checkFaithConflicts } from '@/lib/faith-conflict-check'
import {
  createRecipeAction,
  generateRecipeAction,
  generateRecipeIdeasAction,
  generateRecipeImageAction,
  scanRecipeAction,
  importRecipeFromUrlAction,
  importRecipeFromPhotoAction,
  getRecipeGenerationContextAction,
  saveCookingPreferencesAction,
  searchWebRecipesAction,
  createCollectionAction,
  updateCollectionAction,
  deleteCollectionAction,
  addRecipeToCollectionAction,
  removeRecipeFromCollectionAction,
} from './actions'

const SORT_OPTIONS = [
  { value: 'recent', label: 'Recently added' },
  { value: 'first', label: 'First added' },
  { value: 'name_asc', label: 'Name (A\u2013Z)' },
  { value: 'name_desc', label: 'Name (Z\u2013A)' },
  { value: 'quickest', label: 'Quickest first' },
]

const SOURCE_OPTIONS = [
  { value: 'all', label: 'All recipes' },
  { value: 'manual', label: 'Added manually' },
  { value: 'gemini', label: 'Added by Gemini' },
]

/**
 * Resize an image to a max dimension of 1600px and re-encode as JPEG.
 * This dramatically reduces upload size for raw camera photos (typically 25-50x).
 * Falls back to the original file if the browser lacks OffscreenCanvas support.
 */
async function resizeImage(file, maxDim = 1600, quality = 0.8) {
  try {
    if (typeof OffscreenCanvas === 'undefined') return file
    const bitmap = await createImageBitmap(file)
    const { width, height } = bitmap
    if (width <= maxDim && height <= maxDim && file.type === 'image/jpeg') {
      bitmap.close()
      return file
    }
    const scale = Math.min(maxDim / width, maxDim / height, 1)
    const canvas = new OffscreenCanvas(
      Math.round(width * scale),
      Math.round(height * scale),
    )
    const ctx = canvas.getContext('2d')
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality })
    return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), {
      type: 'image/jpeg',
    })
  } catch {
    return file
  }
}

const TIME_OPTIONS = [
  { value: 'all', label: 'Any time' },
  { value: '0-30', label: '0\u201330 min' },
  { value: '30-60', label: '30\u201360 min' },
  { value: '60+', label: '60+ min' },
]

const MEAL_TYPE_OPTIONS = [
  { value: 'all', label: 'Any meal' },
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snacks', label: 'Snacks' },
  { value: 'desserts', label: 'Desserts' },
]

const MEAL_TYPE_ALIASES = {
  snacks: ['snack', 'snacks'],
  desserts: ['dessert', 'desserts'],
}

const MACROS_GOAL_OPTIONS = [
  { value: 'high_protein', label: 'High Protein' },
  { value: 'low_carb', label: 'Low Carb' },
  { value: 'low_calorie', label: 'Low Calorie' },
  { value: 'low_fat', label: 'Low Fat' },
  { value: 'high_fiber', label: 'High Fiber' },
  { value: 'low_sodium', label: 'Low Sodium' },
  { value: 'keto_friendly', label: 'Keto Friendly' },
  { value: 'diabetic_friendly', label: 'Diabetic Friendly' },
]

const MACROS_CALORIE_OPTIONS = [
  { value: 'under_300', label: 'Under 300 cal' },
  { value: '300_500', label: '300\u2013500 cal' },
  { value: '500_700', label: '500\u2013700 cal' },
  { value: '700_plus', label: '700+ cal' },
]

const MACROS_PROTEIN_OPTIONS = [
  { value: '10_plus', label: '10g+ protein' },
  { value: '20_plus', label: '20g+ protein' },
  { value: '30_plus', label: '30g+ protein' },
  { value: '40_plus', label: '40g+ protein' },
]

const CUISINE_OPTIONS = [
  'Italian', 'Mexican', 'American', 'Chinese', 'Japanese', 'Thai',
  'Indian', 'Mediterranean', 'Korean', 'Vietnamese', 'Middle Eastern',
  'Comfort Food', 'Greek', 'French', 'Spanish', 'Caribbean', 'African',
  'British', 'German', 'Brazilian', 'Other',
]

const MACRO_THRESHOLDS = {
  high_protein: n => n.protein_g >= 20,
  low_carb: n => n.carbs_g <= 20,
  low_calorie: n => n.calories <= 400,
  low_fat: n => n.fat_g <= 10,
  high_fiber: n => n.fiber_g >= 5,
  low_sodium: n => n.sodium_mg <= 600,
  keto_friendly: n => n.carbs_g <= 10 && n.fat_g >= 15,
  diabetic_friendly: n => n.carbs_g <= 30 && (n.sugar_g || 0) <= 10,
}

const MACRO_CALORIE_RANGES = {
  under_300: n => n.calories < 300,
  '300_500': n => n.calories >= 300 && n.calories <= 500,
  '500_700': n => n.calories > 500 && n.calories <= 700,
  '700_plus': n => n.calories > 700,
}

const MACRO_PROTEIN_RANGES = {
  '10_plus': n => n.protein_g >= 10,
  '20_plus': n => n.protein_g >= 20,
  '30_plus': n => n.protein_g >= 30,
  '40_plus': n => n.protein_g >= 40,
}

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  gap: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
`

const TitleBlock = styled.div``

const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
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

const SettingsIconLink = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 16px;
  text-decoration: none;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.teal};
    color: ${({ theme }) => theme.colors.teal};
    background: ${({ theme }) => theme.colors.tealLight};
  }
`

const AddButton = styled.button`
  padding: 10px 20px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.teal};
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  min-height: ${({ theme }) => theme.touchTarget};

  &:hover {
    background: ${({ theme }) => theme.colors.tealDark};
  }
`

const PromptTextarea = styled.textarea`
  padding: 10px 12px;
  font-size: 14px;
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
  width: 100%;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.purple};
  }
`

const PromptHint = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0 0 ${({ theme }) => theme.spacing.sm} 0;
`

const PromptActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  justify-content: flex-end;
  margin-top: ${({ theme }) => theme.spacing.md};
`

const PromptPrimary = styled.button`
  padding: 10px 20px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.purple};
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  min-height: ${({ theme }) => theme.touchTarget};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.purpleDark};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const PromptSecondary = styled.button`
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

const PromptError = styled.p`
  color: ${({ theme }) => theme.colors.coral};
  font-size: 13px;
  margin-top: ${({ theme }) => theme.spacing.sm};
`

const ContextSection = styled.div`
  margin-top: ${({ theme }) => theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`

const PantryToggleRow = styled.label`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: 10px 12px;
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.borderLight};
  cursor: pointer;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const ToggleSwitch = styled.div`
  width: 36px;
  height: 20px;
  border-radius: 10px;
  background: ${({ theme, $on }) => $on ? theme.colors.teal : theme.colors.border};
  position: relative;
  flex-shrink: 0;
  transition: background 0.15s ease;

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${({ $on }) => $on ? '18px' : '2px'};
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: white;
    transition: left 0.15s ease;
  }
`

const PantryToggleText = styled.span`
  flex: 1;
`

const PantryToggleMeta = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
`

const PrefsAccordion = styled.div`
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;
`

const PrefsHeader = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 12px;
  background: ${({ theme }) => theme.colors.borderLight};
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const PrefsHeaderLeft = styled.span`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`

const PrefsSavedBadge = styled.span`
  font-size: 11px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.teal};
`

const PrefsChevron = styled.span`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.textMuted};
  transform: ${({ $open }) => $open ? 'rotate(180deg)' : 'rotate(0deg)'};
  transition: transform 0.15s ease;
`

const PrefsBody = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  border-top: 0.5px solid ${({ theme }) => theme.colors.border};
`

const PrefsLabel = styled.p`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;
`

const PrefsChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`

const PrefChip = styled.button`
  padding: 5px 12px;
  font-size: 12px;
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 0.5px solid
    ${({ theme, $active }) => ($active ? theme.colors.purpleDark : theme.colors.border)};
  background: ${({ theme, $active }) =>
    $active ? theme.colors.purpleLight : theme.colors.surface};
  color: ${({ theme, $active }) => ($active ? theme.colors.purpleDark : theme.colors.textSecondary)};
  cursor: pointer;
  font-weight: 500;

  &:hover {
    border-color: ${({ theme }) => theme.colors.purple};
  }
`

const PrefsServingInput = styled.input`
  width: 60px;
  padding: 6px 10px;
  font-size: 13px;
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};
  text-align: center;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.purple};
  }
`

const PrefsNotesTextarea = styled.textarea`
  padding: 8px 10px;
  font-size: 13px;
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-family: inherit;
  resize: vertical;
  min-height: 48px;
  width: 100%;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.purple};
  }
`

const SavePrefsButton = styled.button`
  align-self: flex-start;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 500;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 0.5px solid ${({ theme }) => theme.colors.purple};
  background: transparent;
  color: ${({ theme }) => theme.colors.purple};
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.purpleLight};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const DietaryRow = styled.div`
  padding: 8px 12px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  background: ${({ theme }) => theme.colors.coralLight};
  border-radius: ${({ theme }) => theme.radii.md};
`

const ContextLoading = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  text-align: center;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
`

const WizardModeGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`

const ModeCard = styled.button`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.purple};
    background: ${({ theme }) => theme.colors.purpleLight};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const ModeCardIcon = styled.div`
  font-size: 24px;
`

const ModeCardTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const ModeCardMeta = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.4;
`

const PantryReminder = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: 4px;

  a {
    color: ${({ theme }) => theme.colors.teal};
    text-decoration: underline;
  }
`

const WizardLink = styled.button`
  background: none;
  border: none;
  padding: 0;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
  cursor: pointer;
  text-decoration: underline;
  align-self: center;

  &:hover {
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

const IdeasGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`

const IdeaCard = styled.button`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 1.5px solid
    ${({ theme, $selected }) => ($selected ? theme.colors.purpleDark : theme.colors.border)};
  background: ${({ theme, $selected }) =>
    $selected ? theme.colors.purpleLight : theme.colors.surface};
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.purple};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const IdeaName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const IdeaDescription = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.4;
`

const IdeaIngredients = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 2px;
`

const IdeaIngTag = styled.span`
  padding: 2px 8px;
  font-size: 11px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.tealLight};
  color: ${({ theme }) => theme.colors.tealDark};
`

const IdeasLoadingMsg = styled.div`
  padding: ${({ theme }) => theme.spacing.xl};
  text-align: center;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textMuted};
`

const WizardBackLink = styled.button`
  background: none;
  border: none;
  padding: 0;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: ${({ theme }) => theme.spacing.md};

  &:hover {
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

const CreateMenuWrap = styled.div`
  position: relative;
`

const CreateMenuDropdown = styled.div`
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 220px;
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadows.elevated};
  padding: ${({ theme }) => theme.spacing.xs} 0;
  z-index: 30;
`

const CreateMenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  width: 100%;
  padding: 10px ${({ theme }) => theme.spacing.md};
  background: none;
  border: none;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;
  text-align: left;

  &:hover {
    background: ${({ theme }) => theme.colors.borderLight};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const CreateMenuIcon = styled.span`
  font-size: 16px;
  width: 24px;
  text-align: center;
  flex-shrink: 0;
`

const FilterBar = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const SearchInput = styled.input`
  padding: 10px 14px;
  font-size: 14px;
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};
  width: 100%;
  max-width: 420px;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.teal};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`

const ControlRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
`

const PopoverWrap = styled.div`
  position: relative;
`

const ControlButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 500;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 0.5px solid
    ${({ theme, $active }) => ($active ? theme.colors.tealDark : theme.colors.border)};
  background: ${({ theme, $active }) =>
    $active ? theme.colors.tealLight : theme.colors.surface};
  color: ${({ theme, $active }) =>
    $active ? theme.colors.tealDark : theme.colors.textPrimary};
  cursor: pointer;
  min-height: 36px;

  &:hover {
    border-color: ${({ theme }) => theme.colors.tealDark};
  }
`

const Caret = styled.span`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.textMuted};
`

const Popover = styled.div`
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 240px;
  max-width: 320px;
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadows.elevated};
  padding: ${({ theme }) => theme.spacing.md};
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`

const PopoverSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const PopoverLabel = styled.p`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;
`

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`

const ScrollChipRow = styled(ChipRow)`
  max-height: 140px;
  overflow-y: auto;
  padding-right: 4px;
`

const Chip = styled.button`
  padding: 5px 12px;
  font-size: 12px;
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 0.5px solid
    ${({ theme, $active }) => ($active ? theme.colors.tealDark : theme.colors.border)};
  background: ${({ theme, $active }) =>
    $active ? theme.colors.tealDark : theme.colors.surface};
  color: ${({ theme, $active }) => ($active ? 'white' : theme.colors.textSecondary)};
  cursor: pointer;
  font-weight: 500;

  &:hover {
    border-color: ${({ theme }) => theme.colors.tealDark};
  }
`

const SortOption = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  font-size: 13px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: none;
  background: ${({ theme, $active }) =>
    $active ? theme.colors.tealLight : 'transparent'};
  color: ${({ theme, $active }) =>
    $active ? theme.colors.tealDark : theme.colors.textPrimary};
  font-weight: ${({ $active }) => ($active ? 500 : 400)};
  cursor: pointer;
  text-align: left;
  width: 100%;

  &:hover {
    background: ${({ theme }) => theme.colors.borderLight};
  }
`

const Check = styled.span`
  color: ${({ theme }) => theme.colors.tealDark};
`

const ClearButton = styled.button`
  padding: 8px 12px;
  font-size: 13px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 0.5px solid transparent;
  background: transparent;
  color: ${({ theme }) => theme.colors.textMuted};
  cursor: pointer;
  min-height: 36px;

  &:hover {
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

const ResultCount = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;
`

/* ---- Accordion Filter Panel ---- */

const FilterPanel = styled.div`
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 300px;
  max-width: 380px;
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadows.elevated};
  overflow: hidden;
  z-index: 20;
  max-height: 70vh;
  overflow-y: auto;
`

const ActiveFilterSummary = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  padding: 10px ${({ theme }) => theme.spacing.md};
  border-bottom: 0.5px solid ${({ theme }) => theme.colors.border};
`

const ActiveChip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 500;
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 0.5px solid ${({ theme }) => theme.colors.tealDark};
  background: ${({ theme }) => theme.colors.tealLight};
  color: ${({ theme }) => theme.colors.tealDark};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.tealMid};
  }
`

const ClearAllLink = styled.button`
  margin-left: auto;
  padding: 0;
  border: none;
  background: none;
  font-size: 11px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textMuted};
  cursor: pointer;
  text-decoration: underline;
  white-space: nowrap;

  &:hover {
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

const FilterCategoryRow = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px ${({ theme }) => theme.spacing.md};
  background: ${({ $open, theme }) => $open ? theme.colors.borderLight : 'transparent'};
  border: none;
  border-top: 0.5px solid ${({ theme }) => theme.colors.border};
  cursor: pointer;
  transition: background 0.15s ease;

  &:first-of-type {
    border-top: none;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.borderLight};
  }
`

const CategoryLabel = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.textMuted};
`

const CategoryCount = styled.span`
  font-size: 10px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.tealDark};
`

const CategoryChevron = styled.span`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.textMuted};
  transform: ${({ $open }) => $open ? 'rotate(180deg)' : 'rotate(0deg)'};
  transition: transform 0.15s ease;
`

const CategoryChipPanel = styled.div`
  padding: 8px ${({ theme }) => theme.spacing.md} 12px;
  border-top: 0.5px solid ${({ theme }) => theme.colors.border};
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const MacroSubLabel = styled.p`
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 4px 0 0 0;
  opacity: 0.7;
`

const FilterBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 9px;
  background: ${({ theme }) => theme.colors.tealDark};
  color: white;
`

const NutritionBadge = styled.span`
  display: inline-block;
  padding: 2px 6px;
  font-size: 10px;
  font-weight: 500;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.borderLight};
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: 4px;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: ${({ $layout }) =>
    $layout === 'list' ? '1fr' : 'repeat(auto-fill, minmax(260px, 1fr))'};
  gap: ${({ theme }) => theme.spacing.lg};
`

const CardWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: ${({ $photoTop }) => ($photoTop ? 'column' : 'row')};
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  transition: all 0.15s ease;
  box-shadow: ${({ theme }) => theme.shadows.card};
  overflow: hidden;

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.elevated};
    border-color: ${({ theme }) => theme.colors.tealMid};
  }
`

const Card = styled(Link)`
  display: flex;
  flex-direction: ${({ $photoTop }) => ($photoTop ? 'column' : 'row')};
  flex: 1;
  text-decoration: none;
  color: inherit;
  min-width: 0;
  overflow: hidden;
`

const CardShareButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s ease, background 0.15s ease;
  z-index: 1;

  ${CardWrapper}:hover & {
    opacity: 1;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.borderLight};
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

const CardColButton = styled.button`
  position: absolute;
  top: 10px;
  right: 42px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s ease, background 0.15s ease;
  z-index: 2;

  ${CardWrapper}:hover & {
    opacity: 1;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.borderLight};
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

const CardColMenuWrap = styled.div`
  position: absolute;
  top: 10px;
  right: 42px;
  z-index: 10;
`

const CardBody = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  padding: ${({ theme }) => theme.spacing.lg};
`

const CardThumb = styled.img`
  object-fit: cover;
  flex-shrink: 0;

  ${({ $position }) =>
    $position === 'top'
      ? 'width: 100%; height: 120px;'
      : 'width: 100px; align-self: stretch;'}
`

const CardName = styled.h3`
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 ${({ theme }) => theme.spacing.xs} 0;
`

const CardDescription = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0 0 ${({ theme }) => theme.spacing.md} 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const Meta = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: auto;
`

const Tag = styled.span`
  padding: 3px 10px;
  font-size: 11px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.tealLight};
  color: ${({ theme }) => theme.colors.tealDark};
`

const CardMacroRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
  margin-top: 4px;
`

const CardMacroItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const CardMacroDot = styled.span`
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
`

const CardEstBadge = styled.span`
  font-size: 9px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-style: italic;
`

const CardDifficultyBadge = styled.span`
  font-size: 10px;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.tealLight};
  color: ${({ theme }) => theme.colors.tealDark};
  font-weight: 500;
  text-transform: capitalize;
  align-self: flex-start;
`

const CardSource = styled.span`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-style: italic;
`

const CardRating = styled.span`
  color: ${({ theme }) => theme.colors.amber};
`

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xxxl} ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.surface};
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const EmptyIcon = styled.div`
  font-size: 40px;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const EmptyTitle = styled.h3`
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 ${({ theme }) => theme.spacing.sm} 0;
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

const ScanDropZone = styled.label`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  border: 2px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.xxl} ${({ theme }) => theme.spacing.lg};
  cursor: pointer;
  text-align: center;
  color: ${({ theme }) => theme.colors.textMuted};
  transition: all 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.teal};
    color: ${({ theme }) => theme.colors.textSecondary};
  }
`

const ScanDropIcon = styled.div`
  font-size: 32px;
`

const ScanDropText = styled.p`
  font-size: 14px;
  margin: 0;
`

const ScanDropHint = styled.p`
  font-size: 12px;
  margin: 0;
`

const ScanPreviewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.md};
`

const ScanPreviewItem = styled.div`
  position: relative;
  aspect-ratio: 1;
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;
  border: 0.5px solid ${({ theme }) => theme.colors.border};
`

const ScanPreviewImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`

const ScanRemoveBtn = styled.button`
  position: absolute;
  top: 4px;
  right: 4px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: none;
`

const ScanAddMore = styled.label`
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  border: 2px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  cursor: pointer;
  font-size: 24px;
  color: ${({ theme }) => theme.colors.textMuted};
  transition: all 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.teal};
    color: ${({ theme }) => theme.colors.teal};
  }
`

const WebSearchHint = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0 0 ${({ theme }) => theme.spacing.md} 0;
`

const WebSearchResultsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`

const WebSearchResultCard = styled.button`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.surface};
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.teal};
    background: ${({ theme }) => theme.colors.tealLight};
  }
`

const WebSearchResultThumb = styled.img`
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: ${({ theme }) => theme.radii.md};
  flex-shrink: 0;
  background: ${({ theme }) => theme.colors.borderLight};
`

const WebSearchResultBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
`

const WebSearchResultName = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const WebSearchResultRatingRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`

const WebSearchResultStars = styled.span`
  font-size: 13px;
  color: #f59e0b;
  letter-spacing: 1px;
`

const WebSearchResultMeta = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
`

const WebSearchResultDesc = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const WebSearchDetailMetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: ${({ theme }) => theme.spacing.sm} 0;
`

const WebSearchDetailMetaChip = styled.span`
  padding: 4px 10px;
  font-size: 12px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.tealLight};
  color: ${({ theme }) => theme.colors.tealDark};
`

const WebSearchSourceLink = styled.a`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.teal};
  text-decoration: underline;
  display: inline-block;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  word-break: break-all;
`

const WebSearchIngList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const WebSearchIngItem = styled.li`
  display: flex;
  justify-content: space-between;
  padding: 6px 10px;
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 13px;
`

const WebSearchSaveButton = styled.button`
  padding: 10px 20px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.teal};
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  min-height: ${({ theme }) => theme.touchTarget};
  border: none;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.tealDark};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const WebSearchBackLink = styled.button`
  background: none;
  border: none;
  padding: 0;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: ${({ theme }) => theme.spacing.md};

  &:hover {
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

const WebSearchDetailTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 ${({ theme }) => theme.spacing.xs} 0;
`

const WebSearchDetailInstructions = styled.p`
  white-space: pre-wrap;
  font-size: 13px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing.md};
  margin: 0;
  max-height: 200px;
  overflow-y: auto;
`

const WebSearchDetailImage = styled.img`
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  border-radius: ${({ theme }) => theme.radii.lg};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const WebSearchSectionLabel = styled.p`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: ${({ theme }) => theme.spacing.md} 0 ${({ theme }) => theme.spacing.sm} 0;
`

function renderStars(rating) {
  if (!rating) return null
  const full = Math.floor(rating)
  const half = rating - full >= 0.5
  let stars = '\u2605'.repeat(full)
  if (half) stars += '\u00BD'
  stars += '\u2606'.repeat(Math.max(0, 5 - full - (half ? 1 : 0)))
  return stars
}

function formatMinutes(mins) {
  if (!mins) return null
  const m = Number(mins)
  if (!m) return null
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return rem ? `${h}h ${rem}m` : `${h}h`
}

function formatReviews(n) {
  if (!n) return null
  const num = Number(n)
  if (!num) return null
  if (num >= 1000) return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}k reviews`
  return `${num} reviews`
}

function totalTime(recipe) {
  const p = Number(recipe.prep_time_minutes) || 0
  const c = Number(recipe.cook_time_minutes) || 0
  const total = p + c
  return total > 0 ? `${total} min` : null
}

// ── Collection Chip Row ──────────────────────────────────

const CollectionChipRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  overflow-x: auto;
  padding-bottom: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar { display: none; }
`

const CollectionChip = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.15s ease;
  border: 1.5px solid ${({ theme, $active }) =>
    $active ? theme.colors.teal : theme.colors.border};
  background: ${({ theme, $active }) =>
    $active ? theme.colors.tealLight : theme.colors.surface};
  color: ${({ theme, $active }) =>
    $active ? theme.colors.teal : theme.colors.textPrimary};

  &:hover {
    border-color: ${({ theme }) => theme.colors.teal};
    background: ${({ theme }) => theme.colors.tealLight};
  }
`

const ChipCount = styled.span`
  font-size: 11px;
  font-weight: 600;
  background: ${({ theme, $active }) =>
    $active ? theme.colors.teal : theme.colors.borderLight};
  color: ${({ theme, $active }) =>
    $active ? 'white' : theme.colors.textMuted};
  border-radius: 999px;
  padding: 1px 7px;
  min-width: 20px;
  text-align: center;
`

const AddCollectionChip = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  border: 1.5px dashed ${({ theme }) => theme.colors.border};
  background: transparent;
  color: ${({ theme }) => theme.colors.textMuted};
  transition: all 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.purple};
    color: ${({ theme }) => theme.colors.purple};
  }
`

const NewColForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`

const NewColLabel = styled.label`
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const NewColInput = styled.input`
  padding: 10px 12px;
  font-size: 14px;
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.purple};
  }
`

const EmojiGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`

const EmojiBtn = styled.button`
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1.5px solid ${({ theme, $active }) =>
    $active ? theme.colors.purple : theme.colors.border};
  background: ${({ theme, $active }) =>
    $active ? theme.colors.purpleLight || '#f3eeff' : 'transparent'};
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    border-color: ${({ theme }) => theme.colors.purple};
  }
`

const ColMenuOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 900;
`

const ColMenuPanel = styled.div`
  position: absolute;
  right: 0;
  top: 100%;
  z-index: 901;
  min-width: 200px;
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadows.elevated};
  padding: ${({ theme }) => theme.spacing.sm} 0;
`

const ColMenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  width: 100%;
  padding: 10px ${({ theme }) => theme.spacing.md};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textPrimary};
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;

  &:hover {
    background: ${({ theme }) => theme.colors.borderLight};
  }
`

const ColCheck = styled.span`
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 1.5px solid ${({ theme, $checked }) =>
    $checked ? theme.colors.teal : theme.colors.border};
  background: ${({ theme, $checked }) =>
    $checked ? theme.colors.teal : 'transparent'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: white;
  flex-shrink: 0;
`

const CARD_DEFAULTS = {
  show_photo: true,
  show_description: true,
  show_cook_time: true,
  show_servings: true,
  show_categories: true,
  show_macros: false,
  show_rating: true,
  show_review_count: false,
  show_difficulty: false,
  show_source: false,
  show_calories: true,
  show_protein: true,
  show_carbs: true,
  show_fat: true,
  card_layout: 'grid',
  photo_position: 'right',
}

const MACRO_COLORS = {
  calories: '#EF9F27',
  protein: '#1D9E75',
  carbs: '#185FA5',
  fat: '#D85A30',
}

const COLLECTION_EMOJIS = [
  '\uD83C\uDF19', '\uD83D\uDCE6', '\uD83C\uDF05', '\u2B50', '\u2764\uFE0F', '\uD83C\uDF3F',
  '\uD83C\uDF55', '\uD83C\uDF75', '\uD83E\uDD57', '\uD83C\uDF70', '\uD83C\uDF5C', '\uD83C\uDF54',
  '\uD83E\uDD5A', '\uD83C\uDF4E', '\uD83E\uDD51', '\uD83D\uDD25', '\uD83C\uDFE0', '\uD83C\uDF89',
]

export default function RecipesPageClient({ initialRecipes, faithPractices, cardSettings: initialCardSettings, initialCollections, initialCollectionLinks }) {
  const [recipes, setRecipes] = useState(initialRecipes || [])
  const [modalOpen, setModalOpen] = useState(false)
  const [formInitial, setFormInitial] = useState(null)
  const [promptOpen, setPromptOpen] = useState(false)
  const [promptText, setPromptText] = useState('')
  const [promptError, setPromptError] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [scanOpen, setScanOpen] = useState(false)
  const [scanFiles, setScanFiles] = useState([])
  const [scanPreviews, setScanPreviews] = useState([])
  const [scanError, setScanError] = useState(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scanPhase, setScanPhase] = useState(null)
  const [contextData, setContextData] = useState(null)
  const [includePantry, setIncludePantry] = useState(true)
  const [prefsExpanded, setPrefsExpanded] = useState(false)
  const [prefSkill, setPrefSkill] = useState(null)
  const [prefTime, setPrefTime] = useState(null)
  const [prefCuisines, setPrefCuisines] = useState([])
  const [prefServings, setPrefServings] = useState('')
  const [prefNotes, setPrefNotes] = useState('')
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [urlOpen, setUrlOpen] = useState(false)
  const [urlText, setUrlText] = useState('')
  const [urlError, setUrlError] = useState(null)
  const [isImporting, setIsImporting] = useState(false)
  const [toast, setToast] = useState(null)
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [activeTags, setActiveTags] = useState([])
  const [activeIngredients, setActiveIngredients] = useState([])
  const [timeFilter, setTimeFilter] = useState('all')
  const [mealTypeFilter, setMealTypeFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [macroGoals, setMacroGoals] = useState([])
  const [macroCalorie, setMacroCalorie] = useState(null)
  const [macroProtein, setMacroProtein] = useState(null)
  const [activeCuisines, setActiveCuisines] = useState([])
  const [openFilterCategory, setOpenFilterCategory] = useState(null)
  const [sortBy, setSortBy] = useState('recent')
  const [openPopover, setOpenPopover] = useState(null)
  const [createMenuOpen, setCreateMenuOpen] = useState(false)
  const [wizardStep, setWizardStep] = useState(null) // null | 'choose' | 'ideas' | 'custom'
  const [wizardMode, setWizardMode] = useState(null) // 'expiring' | 'general'
  const [recipeIdeas, setRecipeIdeas] = useState([])
  const [selectedIdeaIdx, setSelectedIdeaIdx] = useState(null)
  const [isLoadingIdeas, setIsLoadingIdeas] = useState(false)
  const [ideasError, setIdeasError] = useState(null)
  const [webSearchOpen, setWebSearchOpen] = useState(false)
  const [webSearchStep, setWebSearchStep] = useState('input') // 'input' | 'results' | 'detail'
  const [webSearchQuery, setWebSearchQuery] = useState('')
  const [webSearchResults, setWebSearchResults] = useState([])
  const [webSearchSelected, setWebSearchSelected] = useState(null)
  const [webSearchError, setWebSearchError] = useState(null)
  const [isWebSearching, setIsWebSearching] = useState(false)
  const [isSavingWebRecipe, setIsSavingWebRecipe] = useState(false)
  const [importReviewOpen, setImportReviewOpen] = useState(false)
  const [importReviewData, setImportReviewData] = useState(null)
  const [isSavingImport, setIsSavingImport] = useState(false)
  const [isGeneratingImportImage, setIsGeneratingImportImage] = useState(false)

  // Collections state
  const [collections, setCollections] = useState(initialCollections || [])
  const [collectionLinks, setCollectionLinks] = useState(initialCollectionLinks || [])
  const [activeCollection, setActiveCollection] = useState(null)
  const [newColOpen, setNewColOpen] = useState(false)
  const [newColName, setNewColName] = useState('')
  const [newColDesc, setNewColDesc] = useState('')
  const [newColEmoji, setNewColEmoji] = useState('\uD83C\uDF19')
  const [isCreatingCol, setIsCreatingCol] = useState(false)
  const [colMenuRecipeId, setColMenuRecipeId] = useState(null)

  const cs = { ...CARD_DEFAULTS, ...initialCardSettings }

  const filtersRef = useRef(null)
  const sortRef = useRef(null)
  const createMenuRef = useRef(null)

  useEffect(() => {
    if (!openPopover) return
    function handleClick(e) {
      const ref = openPopover === 'filters' ? filtersRef : sortRef
      if (ref.current && !ref.current.contains(e.target)) setOpenPopover(null)
    }
    function handleKey(e) {
      if (e.key === 'Escape') setOpenPopover(null)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [openPopover])

  useEffect(() => {
    if (!createMenuOpen) return
    function handleClick(e) {
      if (createMenuRef.current && !createMenuRef.current.contains(e.target)) setCreateMenuOpen(false)
    }
    function handleKey(e) {
      if (e.key === 'Escape') setCreateMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [createMenuOpen])

  useEffect(() => {
    if (!promptOpen && wizardStep !== 'choose' && wizardStep !== 'custom') return
    let cancelled = false
    getRecipeGenerationContextAction().then(result => {
      if (cancelled) return
      if (result.success && result.data) {
        setContextData(result.data)
        const { pantryItems, preferences } = result.data
        setIncludePantry(pantryItems?.length > 0)
        if (preferences) {
          setPrefSkill(preferences.skill_level || null)
          setPrefTime(preferences.time_preference || null)
          setPrefCuisines(preferences.cuisine_preferences || [])
          setPrefServings(preferences.serving_size != null ? String(preferences.serving_size) : '')
          setPrefNotes(preferences.notes || '')
          setPrefsExpanded(false)
        } else {
          setPrefSkill(null)
          setPrefTime(null)
          setPrefCuisines([])
          setPrefServings('')
          setPrefNotes('')
          setPrefsExpanded(true)
        }
      } else {
        setContextData({ pantryItems: [], preferences: null, dietaryRestrictions: [] })
      }
    }).catch(() => {
      if (!cancelled) setContextData({ pantryItems: [], preferences: null, dietaryRestrictions: [] })
    })
    return () => { cancelled = true }
  }, [promptOpen, wizardStep])

  const contextLoading = (promptOpen || wizardStep === 'choose' || wizardStep === 'custom') && contextData === null

  function toggleCuisine(cuisine) {
    setPrefCuisines(prev =>
      prev.includes(cuisine) ? prev.filter(c => c !== cuisine) : [...prev, cuisine]
    )
  }

  async function handleSavePrefs() {
    setSavingPrefs(true)
    const prefs = {}
    if (prefSkill) prefs.skill_level = prefSkill
    if (prefTime) prefs.time_preference = prefTime
    if (prefCuisines.length) prefs.cuisine_preferences = prefCuisines
    if (prefServings) prefs.serving_size = Number(prefServings)
    if (prefNotes) prefs.notes = prefNotes
    await saveCookingPreferencesAction(prefs)
    setSavingPrefs(false)
  }

  async function handleChooseMode(mode) {
    setWizardMode(mode)
    setWizardStep('ideas')
    setIsLoadingIdeas(true)
    setIdeasError(null)
    setSelectedIdeaIdx(null)
    const result = await generateRecipeIdeasAction(mode)
    setIsLoadingIdeas(false)
    if (result.success) {
      setRecipeIdeas(result.data)
    } else {
      setIdeasError(result.error || 'Could not generate ideas.')
    }
  }

  async function handleGenerateFromIdea() {
    const idea = recipeIdeas[selectedIdeaIdx]
    if (!idea) return
    setIsGenerating(true)
    const prompt = `${idea.name}: ${idea.description}`
    const result = await generateRecipeAction(prompt, { includePantry: true })
    setIsGenerating(false)
    if (result.success && result.data) {
      setFormInitial(result.data)
      setWizardStep(null)
      setModalOpen(true)
    } else {
      setIdeasError(result.error || 'Could not generate recipe.')
    }
  }

  const allTags = useMemo(() => {
    const set = new Set()
    for (const r of recipes) {
      if (Array.isArray(r.tags)) r.tags.forEach(t => t && set.add(t))
    }
    return Array.from(set).sort()
  }, [recipes])

  const allIngredients = useMemo(() => {
    const set = new Set()
    for (const r of recipes) {
      if (Array.isArray(r.ingredients)) {
        r.ingredients.forEach(ing => {
          const name = typeof ing === 'string' ? ing : ing?.name
          if (name) set.add(name.trim().toLowerCase())
        })
      }
    }
    return Array.from(set).sort()
  }, [recipes])

  const allCuisines = useMemo(() => {
    const set = new Set(CUISINE_OPTIONS)
    for (const r of recipes) {
      if (r.cuisine_type) set.add(r.cuisine_type)
    }
    // Keep CUISINE_OPTIONS order first, then any extras sorted
    const extras = Array.from(set).filter(c => !CUISINE_OPTIONS.includes(c)).sort()
    return [...CUISINE_OPTIONS, ...extras]
  }, [recipes])

  const hasGeminiRecipe = useMemo(
    () => recipes.some(r => r.source === 'gemini'),
    [recipes]
  )

  // Build a set of recipe IDs per collection for fast lookup
  const collectionRecipeIds = useMemo(() => {
    const map = {}
    for (const link of collectionLinks) {
      if (!map[link.collection_id]) map[link.collection_id] = new Set()
      map[link.collection_id].add(String(link.recipe_id))
    }
    return map
  }, [collectionLinks])

  const filteredRecipes = useMemo(() => {
    const q = search.trim().toLowerCase()
    // Pre-filter by active collection
    const base = activeCollection
      ? recipes.filter(r => collectionRecipeIds[activeCollection]?.has(String(r.id)))
      : recipes
    const list = base.filter(r => {
      if (activeTags.length > 0) {
        const tags = Array.isArray(r.tags) ? r.tags : []
        if (!activeTags.every(t => tags.includes(t))) return false
      }
      if (activeIngredients.length > 0) {
        const names = Array.isArray(r.ingredients)
          ? r.ingredients
              .map(ing => (typeof ing === 'string' ? ing : ing?.name))
              .filter(Boolean)
              .map(n => n.trim().toLowerCase())
          : []
        if (!activeIngredients.every(i => names.includes(i))) return false
      }
      if (timeFilter !== 'all') {
        const t = (Number(r.prep_time_minutes) || 0) + (Number(r.cook_time_minutes) || 0)
        if (timeFilter === '0-30' && !(t >= 0 && t <= 30)) return false
        if (timeFilter === '30-60' && !(t > 30 && t <= 60)) return false
        if (timeFilter === '60+' && !(t > 60)) return false
      }
      if (mealTypeFilter !== 'all') {
        const tags = (Array.isArray(r.tags) ? r.tags : []).map(t =>
          String(t).toLowerCase()
        )
        const aliases = MEAL_TYPE_ALIASES[mealTypeFilter] || [mealTypeFilter]
        if (!aliases.some(a => tags.includes(a))) return false
      }
      if (sourceFilter === 'gemini' && r.source !== 'gemini') return false
      if (sourceFilter === 'manual' && r.source === 'gemini') return false
      if (macroGoals.length > 0 || macroCalorie || macroProtein) {
        const n = r.nutrition
        if (n) {
          for (const goal of macroGoals) {
            if (MACRO_THRESHOLDS[goal] && !MACRO_THRESHOLDS[goal](n)) return false
          }
          if (macroCalorie && MACRO_CALORIE_RANGES[macroCalorie] && !MACRO_CALORIE_RANGES[macroCalorie](n)) return false
          if (macroProtein && MACRO_PROTEIN_RANGES[macroProtein] && !MACRO_PROTEIN_RANGES[macroProtein](n)) return false
        }
        // recipes without nutrition data are kept but flagged in the UI
      }
      if (activeCuisines.length > 0) {
        if (r.cuisine_type && !activeCuisines.includes(r.cuisine_type)) return false
        // recipes without cuisine_type are kept but flagged in the UI
      }
      if (q) {
        const haystack = [r.name, r.description, ...(r.tags || [])]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })

    const sorted = [...list]
    const timeOf = r => (Number(r.prep_time_minutes) || 0) + (Number(r.cook_time_minutes) || 0)
    const dateOf = r => new Date(r.created_at || 0).getTime()
    switch (sortBy) {
      case 'first':
        sorted.sort((a, b) => dateOf(a) - dateOf(b))
        break
      case 'name_asc':
        sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
        break
      case 'name_desc':
        sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''))
        break
      case 'quickest':
        sorted.sort((a, b) => timeOf(a) - timeOf(b))
        break
      case 'recent':
      default:
        sorted.sort((a, b) => dateOf(b) - dateOf(a))
    }
    return sorted
  }, [recipes, search, activeTags, activeIngredients, timeFilter, mealTypeFilter, sourceFilter, macroGoals, macroCalorie, macroProtein, activeCuisines, sortBy, activeCollection, collectionRecipeIds])

  function toggleTag(tag) {
    setActiveTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  function toggleIngredient(ingredient) {
    setActiveIngredients(prev =>
      prev.includes(ingredient)
        ? prev.filter(i => i !== ingredient)
        : [...prev, ingredient]
    )
  }

  function toggleMacroGoal(goal) {
    setMacroGoals(prev =>
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    )
  }

  function toggleCuisineFilter(cuisine) {
    setActiveCuisines(prev =>
      prev.includes(cuisine) ? prev.filter(c => c !== cuisine) : [...prev, cuisine]
    )
  }

  function toggleFilterCategory(cat) {
    setOpenFilterCategory(prev => prev === cat ? null : cat)
  }

  function clearFilters() {
    setSearch('')
    setActiveTags([])
    setActiveIngredients([])
    setTimeFilter('all')
    setMealTypeFilter('all')
    setSourceFilter('all')
    setMacroGoals([])
    setMacroCalorie(null)
    setMacroProtein(null)
    setActiveCuisines([])
    setOpenFilterCategory(null)
  }

  // Build a list of all active filter labels for the summary row
  const activeFilterItems = useMemo(() => {
    const items = []
    if (timeFilter !== 'all') {
      const opt = TIME_OPTIONS.find(o => o.value === timeFilter)
      items.push({ label: opt?.label || timeFilter, remove: () => setTimeFilter('all') })
    }
    if (mealTypeFilter !== 'all') {
      const opt = MEAL_TYPE_OPTIONS.find(o => o.value === mealTypeFilter)
      items.push({ label: opt?.label || mealTypeFilter, remove: () => setMealTypeFilter('all') })
    }
    for (const goal of macroGoals) {
      const opt = MACROS_GOAL_OPTIONS.find(o => o.value === goal)
      items.push({ label: opt?.label || goal, remove: () => setMacroGoals(p => p.filter(g => g !== goal)) })
    }
    if (macroCalorie) {
      const opt = MACROS_CALORIE_OPTIONS.find(o => o.value === macroCalorie)
      items.push({ label: opt?.label || macroCalorie, remove: () => setMacroCalorie(null) })
    }
    if (macroProtein) {
      const opt = MACROS_PROTEIN_OPTIONS.find(o => o.value === macroProtein)
      items.push({ label: opt?.label || macroProtein, remove: () => setMacroProtein(null) })
    }
    for (const c of activeCuisines) {
      items.push({ label: c, remove: () => setActiveCuisines(p => p.filter(x => x !== c)) })
    }
    for (const ing of activeIngredients) {
      items.push({ label: ing, remove: () => setActiveIngredients(p => p.filter(i => i !== ing)) })
    }
    for (const tag of activeTags) {
      items.push({ label: tag, remove: () => setActiveTags(p => p.filter(t => t !== tag)) })
    }
    if (sourceFilter !== 'all') {
      const opt = SOURCE_OPTIONS.find(o => o.value === sourceFilter)
      items.push({ label: opt?.label || sourceFilter, remove: () => setSourceFilter('all') })
    }
    return items
  }, [timeFilter, mealTypeFilter, macroGoals, macroCalorie, macroProtein, activeCuisines, activeIngredients, activeTags, sourceFilter])

  const activeFilterCount = activeFilterItems.length
  const isFiltering = search.trim() !== '' || activeFilterCount > 0

  // Per-category counts for the accordion labels
  const categoryCounts = useMemo(() => ({
    'TIME': timeFilter !== 'all' ? 1 : 0,
    'MEAL TYPE': mealTypeFilter !== 'all' ? 1 : 0,
    'MACROS': macroGoals.length + (macroCalorie ? 1 : 0) + (macroProtein ? 1 : 0),
    'CUISINE TYPE': activeCuisines.length,
    'INGREDIENTS': activeIngredients.length,
    'TAGS': activeTags.length,
  }), [timeFilter, mealTypeFilter, macroGoals, macroCalorie, macroProtein, activeCuisines, activeIngredients, activeTags])
  const sortLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label || 'Sort'

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  async function handleShare(e, recipe) {
    e.preventDefault()
    e.stopPropagation()

    const lines = [recipe.name]

    const meta = []
    const total = (Number(recipe.prep_time_minutes) || 0) + (Number(recipe.cook_time_minutes) || 0)
    if (total > 0) meta.push(`Total time: ${total} min`)
    if (recipe.servings) meta.push(`Serves: ${recipe.servings}`)
    if (meta.length) lines.push(meta.join(' · '))

    if (recipe.description) lines.push('', recipe.description)

    if (recipe.ingredients?.length) {
      lines.push('', 'Ingredients:')
      recipe.ingredients.forEach(ing => {
        lines.push(`• ${[ing.quantity, ing.name].filter(Boolean).join(' ')}`)
      })
    }

    if (recipe.instructions) {
      lines.push('', 'Instructions:', recipe.instructions)
    }

    lines.push('', '— Shared from Koda')
    const text = lines.join('\n')

    try {
      if (navigator.share) {
        await navigator.share({ title: recipe.name, text })
      } else {
        await navigator.clipboard.writeText(text)
        showToast('Recipe copied to clipboard')
      }
    } catch (err) {
      if (err?.name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(text)
          showToast('Recipe copied to clipboard')
        } catch {
          showToast('Could not share recipe')
        }
      }
    }
  }

  function openWebSearch() {
    setWebSearchStep('input')
    setWebSearchQuery('')
    setWebSearchResults([])
    setWebSearchSelected(null)
    setWebSearchError(null)
    setWebSearchOpen(true)
  }

  function closeWebSearch() {
    setWebSearchOpen(false)
  }

  async function handleWebSearch() {
    const q = webSearchQuery.trim()
    if (!q) {
      setWebSearchError('Enter a search query.')
      return
    }
    setWebSearchError(null)
    setIsWebSearching(true)
    const result = await searchWebRecipesAction(q)
    setIsWebSearching(false)
    if (result.success && result.data?.length) {
      setWebSearchResults(result.data)
      setWebSearchStep('results')
    } else {
      setWebSearchError(result.error || 'No recipes found. Try a different search.')
    }
  }

  async function handleSaveWebRecipe() {
    if (!webSearchSelected) return
    setIsSavingWebRecipe(true)
    setWebSearchError(null)
    const payload = {
      name: webSearchSelected.name,
      description: webSearchSelected.description || '',
      ingredients: (webSearchSelected.ingredients || []).map(ing =>
        typeof ing === 'string' ? { name: ing, quantity: '' } : ing
      ),
      instructions: webSearchSelected.instructions || '',
      prep_time_minutes: webSearchSelected.prep_time_minutes ?? null,
      cook_time_minutes: webSearchSelected.cook_time_minutes ?? null,
      servings: webSearchSelected.servings ?? null,
      image_url: webSearchSelected.image_url || null,
      source_url: webSearchSelected.source_url || null,
    }
    const result = await createRecipeAction(payload)
    setIsSavingWebRecipe(false)
    if (result.success && result.data) {
      if (!result.data.alreadyExists) {
        setRecipes(prev => [result.data, ...prev])
      }
      closeWebSearch()
      showToast(result.data.alreadyExists ? 'Recipe already in your collection' : 'Recipe saved')
    } else {
      setWebSearchError(result.error || 'Could not save recipe.')
    }
  }

  function openBlankForm() {
    setFormInitial(null)
    setModalOpen(true)
  }

  function closeForm() {
    setModalOpen(false)
    setFormInitial(null)
  }

  async function handleCreate(payload) {
    return new Promise(resolve => {
      startTransition(async () => {
        const result = await createRecipeAction(payload)
        if (result.success && result.data) {
          if (result.data.alreadyExists) {
            closeForm()
            showToast('A recipe with that name or URL already exists')
          } else {
            setRecipes(prev => [result.data, ...prev])
            closeForm()
            showToast('Recipe added')
          }
        }
        resolve(result)
      })
    })
  }

  function handleScanFiles(e) {
    const incoming = Array.from(e.target.files || [])
    if (!incoming.length) return
    const combined = [...scanFiles, ...incoming].slice(0, 6)
    setScanFiles(combined)
    setScanPreviews(combined.map(f => URL.createObjectURL(f)))
    setScanError(null)
    e.target.value = ''
  }

  function removeScanFile(index) {
    URL.revokeObjectURL(scanPreviews[index])
    const nextFiles = scanFiles.filter((_, i) => i !== index)
    const nextPreviews = scanPreviews.filter((_, i) => i !== index)
    setScanFiles(nextFiles)
    setScanPreviews(nextPreviews)
  }

  function closeScan() {
    scanPreviews.forEach(url => URL.revokeObjectURL(url))
    setScanOpen(false)
    setScanFiles([])
    setScanPreviews([])
    setScanError(null)
  }

  async function handleScan() {
    if (scanFiles.length === 0) {
      setScanError('Add at least one photo.')
      return
    }
    setScanError(null)
    setIsScanning(true)
    setScanPhase('Preparing photos\u2026')
    try {
      const fd = new FormData()
      const resized = await Promise.all(scanFiles.map(resizeImage))
      resized.forEach(f => fd.append('images', f))
      setScanPhase('Scanning\u2026')
      const result = await scanRecipeAction(fd)
      setIsScanning(false)
      setScanPhase(null)
      if (result.success && result.data) {
        setFormInitial(result.data)
        closeScan()
        setModalOpen(true)
      } else {
        setScanError(result.error || 'Could not extract recipe.')
      }
    } catch {
      setIsScanning(false)
      setScanPhase(null)
      setScanError('Could not scan recipe. Please try again.')
    }
  }

  async function handleImportUrl() {
    const trimmed = urlText.trim()
    if (!trimmed) {
      setUrlError('Paste a recipe URL.')
      return
    }
    const existingByUrl = recipes.find(r => r.source === trimmed)
    if (existingByUrl) {
      setUrlError(`Already imported as "${existingByUrl.name}". Open it from your Recipe Box.`)
      return
    }
    setUrlError(null)
    setIsImporting(true)
    const result = await importRecipeFromUrlAction(trimmed)
    setIsImporting(false)
    if (result.success && result.data) {
      setImportReviewData(result.data)
      setUrlOpen(false)
      setUrlText('')
      setImportReviewOpen(true)
    } else {
      setUrlError(result.error || 'Could not import recipe.')
    }
  }

  async function handleSaveImportReview(payload) {
    setIsSavingImport(true)
    startTransition(async () => {
      const result = await createRecipeAction(payload)
      setIsSavingImport(false)
      if (result.success && result.data) {
        if (result.data.alreadyExists) {
          showToast('A recipe with that name or URL already exists')
        } else {
          setRecipes(prev => [result.data, ...prev])
          showToast('Recipe imported')
        }
        setImportReviewOpen(false)
        setImportReviewData(null)
      }
    })
  }

  async function handleImportGenerateImage(recipeName, description) {
    setIsGeneratingImportImage(true)
    try {
      const result = await generateRecipeImageAction(recipeName, description)
      return result
    } finally {
      setIsGeneratingImportImage(false)
    }
  }

  async function handleGenerate() {
    const trimmed = promptText.trim()
    if (!trimmed) {
      setPromptError('Describe the recipe you want.')
      return
    }
    setPromptError(null)
    setIsGenerating(true)
    const result = await generateRecipeAction(trimmed, { includePantry })
    setIsGenerating(false)
    if (result.success && result.data) {
      setFormInitial(result.data)
      setWizardStep(null)
      setPromptOpen(false)
      setPromptText('')
      setModalOpen(true)
    } else {
      setPromptError(result.error || 'Could not generate recipe.')
    }
  }

  // ── Collection Handlers ──────────────────────────────

  async function handleCreateCollection() {
    if (!newColName.trim()) return
    setIsCreatingCol(true)
    const result = await createCollectionAction({
      name: newColName.trim(),
      description: newColDesc.trim(),
      emoji: newColEmoji,
    })
    setIsCreatingCol(false)
    if (result.success) {
      setCollections(prev => [...prev, result.data])
      setNewColOpen(false)
      setNewColName('')
      setNewColDesc('')
      setNewColEmoji('\uD83C\uDF19')
      setToast('Collection created!')
      setTimeout(() => setToast(null), 2500)
    }
  }

  async function handleToggleRecipeCollection(recipeId, collectionId) {
    const isIn = collectionLinks.some(
      l => String(l.recipe_id) === String(recipeId) && l.collection_id === collectionId
    )
    if (isIn) {
      const result = await removeRecipeFromCollectionAction(recipeId, collectionId)
      if (result.success) {
        setCollectionLinks(prev =>
          prev.filter(l => !(String(l.recipe_id) === String(recipeId) && l.collection_id === collectionId))
        )
      }
    } else {
      const result = await addRecipeToCollectionAction(recipeId, collectionId)
      if (result.success) {
        setCollectionLinks(prev => [...prev, { recipe_id: recipeId, collection_id: collectionId }])
      }
    }
  }

  async function handleDeleteCollection(colId) {
    const result = await deleteCollectionAction(colId)
    if (result.success) {
      setCollections(prev => prev.filter(c => c.id !== colId))
      setCollectionLinks(prev => prev.filter(l => l.collection_id !== colId))
      if (activeCollection === colId) setActiveCollection(null)
      setToast('Collection deleted')
      setTimeout(() => setToast(null), 2500)
    }
  }

  return (
    <>
      <PageHeader>
        <TitleBlock>
          <Title>Recipe Box</Title>
          <Subtitle>Save and organize your favorite dishes.</Subtitle>
        </TitleBlock>
        <HeaderActions>
          <SettingsIconLink href="/settings/recipe-card?from=recipes" title="Recipe card settings" aria-label="Recipe card settings">
            {'\u2699\uFE0F'}
          </SettingsIconLink>
          <CreateMenuWrap ref={createMenuRef}>
            <AddButton onClick={() => setCreateMenuOpen(p => !p)}>
              + Create recipe
            </AddButton>
            {createMenuOpen && (
              <CreateMenuDropdown>
                <CreateMenuItem type="button" onClick={() => { setCreateMenuOpen(false); openBlankForm() }}>
                  <CreateMenuIcon>{'\u270F\uFE0F'}</CreateMenuIcon>
                  Create manually
                </CreateMenuItem>
                <CreateMenuItem type="button" onClick={() => { setCreateMenuOpen(false); setContextData(null); setWizardStep('choose'); setWizardMode(null); setRecipeIdeas([]); setSelectedIdeaIdx(null); setIdeasError(null) }} disabled={isGenerating}>
                  <CreateMenuIcon>{'\u2728'}</CreateMenuIcon>
                  Generate with Koda
                </CreateMenuItem>
                <CreateMenuItem type="button" onClick={() => { setCreateMenuOpen(false); setUrlOpen(true) }} disabled={isImporting}>
                  <CreateMenuIcon>{'\uD83D\uDD17'}</CreateMenuIcon>
                  Import recipe
                </CreateMenuItem>
                <CreateMenuItem type="button" onClick={() => { setCreateMenuOpen(false); setScanOpen(true) }} disabled={isScanning}>
                  <CreateMenuIcon>{'\uD83D\uDCF7'}</CreateMenuIcon>
                  Scan a recipe
                </CreateMenuItem>
                <CreateMenuItem type="button" onClick={() => { setCreateMenuOpen(false); openWebSearch() }}>
                  <CreateMenuIcon>{'\uD83D\uDD0D'}</CreateMenuIcon>
                  Search the web
                </CreateMenuItem>
              </CreateMenuDropdown>
            )}
          </CreateMenuWrap>
        </HeaderActions>
      </PageHeader>

      {/* Collection Chip Row — always visible */}
      <CollectionChipRow>
        <CollectionChip
          type="button"
          $active={activeCollection === null}
          onClick={() => setActiveCollection(null)}
        >
          All Recipes
          <ChipCount $active={activeCollection === null}>{recipes.length}</ChipCount>
        </CollectionChip>
        {collections.map(col => {
          const count = collectionRecipeIds[col.id]?.size || 0
          return (
            <CollectionChip
              key={col.id}
              type="button"
              $active={activeCollection === col.id}
              onClick={() => setActiveCollection(activeCollection === col.id ? null : col.id)}
            >
              {col.emoji && <span>{col.emoji}</span>}
              {col.name}
              <ChipCount $active={activeCollection === col.id}>{count}</ChipCount>
            </CollectionChip>
          )
        })}
        <AddCollectionChip type="button" onClick={() => setNewColOpen(true)}>
          + New Collection
        </AddCollectionChip>
      </CollectionChipRow>

      {recipes.length > 0 && (
        <FilterBar>
          <SearchInput
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search recipes by name, description, or tag"
            aria-label="Search recipes"
          />
          <ControlRow>
            <PopoverWrap ref={filtersRef}>
              <ControlButton
                type="button"
                $active={activeFilterCount > 0 || openPopover === 'filters'}
                onClick={() => setOpenPopover(openPopover === 'filters' ? null : 'filters')}
                aria-haspopup="true"
                aria-expanded={openPopover === 'filters'}
              >
                Filters
                {activeFilterCount > 0 && <FilterBadge>{activeFilterCount}</FilterBadge>}
                <Caret>{'\u25BE'}</Caret>
              </ControlButton>

              {openPopover === 'filters' && (
                <FilterPanel role="dialog" aria-label="Filter recipes">
                  {/* Active Filter Summary */}
                  {activeFilterCount > 0 && (
                    <ActiveFilterSummary>
                      {activeFilterItems.map((item, i) => (
                        <ActiveChip key={i} type="button" onClick={item.remove}>
                          {item.label} {'\u00D7'}
                        </ActiveChip>
                      ))}
                      <ClearAllLink type="button" onClick={clearFilters}>
                        Clear all
                      </ClearAllLink>
                    </ActiveFilterSummary>
                  )}

                  {/* TIME */}
                  <FilterCategoryRow
                    type="button"
                    $open={openFilterCategory === 'TIME'}
                    onClick={() => toggleFilterCategory('TIME')}
                  >
                    <CategoryLabel>
                      TIME
                      {categoryCounts['TIME'] > 0 && (
                        <CategoryCount>{'\u00B7'} {categoryCounts['TIME']}</CategoryCount>
                      )}
                    </CategoryLabel>
                    <CategoryChevron $open={openFilterCategory === 'TIME'}>{'\u25BE'}</CategoryChevron>
                  </FilterCategoryRow>
                  {openFilterCategory === 'TIME' && (
                    <CategoryChipPanel>
                      <ChipRow>
                        {TIME_OPTIONS.map(opt => (
                          <Chip
                            key={opt.value}
                            type="button"
                            $active={timeFilter === opt.value}
                            onClick={() => setTimeFilter(opt.value)}
                            aria-pressed={timeFilter === opt.value}
                          >
                            {opt.label}
                          </Chip>
                        ))}
                      </ChipRow>
                    </CategoryChipPanel>
                  )}

                  {/* MEAL TYPE */}
                  <FilterCategoryRow
                    type="button"
                    $open={openFilterCategory === 'MEAL TYPE'}
                    onClick={() => toggleFilterCategory('MEAL TYPE')}
                  >
                    <CategoryLabel>
                      MEAL TYPE
                      {categoryCounts['MEAL TYPE'] > 0 && (
                        <CategoryCount>{'\u00B7'} {categoryCounts['MEAL TYPE']}</CategoryCount>
                      )}
                    </CategoryLabel>
                    <CategoryChevron $open={openFilterCategory === 'MEAL TYPE'}>{'\u25BE'}</CategoryChevron>
                  </FilterCategoryRow>
                  {openFilterCategory === 'MEAL TYPE' && (
                    <CategoryChipPanel>
                      <ChipRow>
                        {MEAL_TYPE_OPTIONS.map(opt => (
                          <Chip
                            key={opt.value}
                            type="button"
                            $active={mealTypeFilter === opt.value}
                            onClick={() => setMealTypeFilter(opt.value)}
                            aria-pressed={mealTypeFilter === opt.value}
                          >
                            {opt.label}
                          </Chip>
                        ))}
                      </ChipRow>
                    </CategoryChipPanel>
                  )}

                  {/* MACROS */}
                  <FilterCategoryRow
                    type="button"
                    $open={openFilterCategory === 'MACROS'}
                    onClick={() => toggleFilterCategory('MACROS')}
                  >
                    <CategoryLabel>
                      MACROS
                      {categoryCounts['MACROS'] > 0 && (
                        <CategoryCount>{'\u00B7'} {categoryCounts['MACROS']}</CategoryCount>
                      )}
                    </CategoryLabel>
                    <CategoryChevron $open={openFilterCategory === 'MACROS'}>{'\u25BE'}</CategoryChevron>
                  </FilterCategoryRow>
                  {openFilterCategory === 'MACROS' && (
                    <CategoryChipPanel>
                      <MacroSubLabel>By goal</MacroSubLabel>
                      <ChipRow>
                        {MACROS_GOAL_OPTIONS.map(opt => (
                          <Chip
                            key={opt.value}
                            type="button"
                            $active={macroGoals.includes(opt.value)}
                            onClick={() => toggleMacroGoal(opt.value)}
                            aria-pressed={macroGoals.includes(opt.value)}
                          >
                            {opt.label}
                          </Chip>
                        ))}
                      </ChipRow>
                      <MacroSubLabel>By calorie range</MacroSubLabel>
                      <ChipRow>
                        {MACROS_CALORIE_OPTIONS.map(opt => (
                          <Chip
                            key={opt.value}
                            type="button"
                            $active={macroCalorie === opt.value}
                            onClick={() => setMacroCalorie(macroCalorie === opt.value ? null : opt.value)}
                            aria-pressed={macroCalorie === opt.value}
                          >
                            {opt.label}
                          </Chip>
                        ))}
                      </ChipRow>
                      <MacroSubLabel>By protein</MacroSubLabel>
                      <ChipRow>
                        {MACROS_PROTEIN_OPTIONS.map(opt => (
                          <Chip
                            key={opt.value}
                            type="button"
                            $active={macroProtein === opt.value}
                            onClick={() => setMacroProtein(macroProtein === opt.value ? null : opt.value)}
                            aria-pressed={macroProtein === opt.value}
                          >
                            {opt.label}
                          </Chip>
                        ))}
                      </ChipRow>
                    </CategoryChipPanel>
                  )}

                  {/* CUISINE TYPE */}
                  <FilterCategoryRow
                    type="button"
                    $open={openFilterCategory === 'CUISINE TYPE'}
                    onClick={() => toggleFilterCategory('CUISINE TYPE')}
                  >
                    <CategoryLabel>
                      CUISINE TYPE
                      {categoryCounts['CUISINE TYPE'] > 0 && (
                        <CategoryCount>{'\u00B7'} {categoryCounts['CUISINE TYPE']}</CategoryCount>
                      )}
                    </CategoryLabel>
                    <CategoryChevron $open={openFilterCategory === 'CUISINE TYPE'}>{'\u25BE'}</CategoryChevron>
                  </FilterCategoryRow>
                  {openFilterCategory === 'CUISINE TYPE' && (
                    <CategoryChipPanel>
                      <ScrollChipRow>
                        {allCuisines.map(c => (
                          <Chip
                            key={c}
                            type="button"
                            $active={activeCuisines.includes(c)}
                            onClick={() => toggleCuisineFilter(c)}
                            aria-pressed={activeCuisines.includes(c)}
                          >
                            {c}
                          </Chip>
                        ))}
                      </ScrollChipRow>
                    </CategoryChipPanel>
                  )}

                  {/* INGREDIENTS */}
                  {allIngredients.length > 0 && (
                    <>
                      <FilterCategoryRow
                        type="button"
                        $open={openFilterCategory === 'INGREDIENTS'}
                        onClick={() => toggleFilterCategory('INGREDIENTS')}
                      >
                        <CategoryLabel>
                          INGREDIENTS
                          {categoryCounts['INGREDIENTS'] > 0 && (
                            <CategoryCount>{'\u00B7'} {categoryCounts['INGREDIENTS']}</CategoryCount>
                          )}
                        </CategoryLabel>
                        <CategoryChevron $open={openFilterCategory === 'INGREDIENTS'}>{'\u25BE'}</CategoryChevron>
                      </FilterCategoryRow>
                      {openFilterCategory === 'INGREDIENTS' && (
                        <CategoryChipPanel>
                          <ScrollChipRow>
                            {allIngredients.map(ing => (
                              <Chip
                                key={ing}
                                type="button"
                                $active={activeIngredients.includes(ing)}
                                onClick={() => toggleIngredient(ing)}
                                aria-pressed={activeIngredients.includes(ing)}
                              >
                                {ing}
                              </Chip>
                            ))}
                          </ScrollChipRow>
                        </CategoryChipPanel>
                      )}
                    </>
                  )}

                  {/* TAGS */}
                  {allTags.length > 0 && (
                    <>
                      <FilterCategoryRow
                        type="button"
                        $open={openFilterCategory === 'TAGS'}
                        onClick={() => toggleFilterCategory('TAGS')}
                      >
                        <CategoryLabel>
                          TAGS
                          {categoryCounts['TAGS'] > 0 && (
                            <CategoryCount>{'\u00B7'} {categoryCounts['TAGS']}</CategoryCount>
                          )}
                        </CategoryLabel>
                        <CategoryChevron $open={openFilterCategory === 'TAGS'}>{'\u25BE'}</CategoryChevron>
                      </FilterCategoryRow>
                      {openFilterCategory === 'TAGS' && (
                        <CategoryChipPanel>
                          <ChipRow>
                            {allTags.map(tag => (
                              <Chip
                                key={tag}
                                type="button"
                                $active={activeTags.includes(tag)}
                                onClick={() => toggleTag(tag)}
                                aria-pressed={activeTags.includes(tag)}
                              >
                                {tag}
                              </Chip>
                            ))}
                          </ChipRow>
                        </CategoryChipPanel>
                      )}
                    </>
                  )}

                  {/* SOURCE (kept if gemini recipes exist) */}
                  {hasGeminiRecipe && (
                    <>
                      <FilterCategoryRow
                        type="button"
                        $open={openFilterCategory === 'SOURCE'}
                        onClick={() => toggleFilterCategory('SOURCE')}
                      >
                        <CategoryLabel>
                          SOURCE
                          {sourceFilter !== 'all' && (
                            <CategoryCount>{'\u00B7'} 1</CategoryCount>
                          )}
                        </CategoryLabel>
                        <CategoryChevron $open={openFilterCategory === 'SOURCE'}>{'\u25BE'}</CategoryChevron>
                      </FilterCategoryRow>
                      {openFilterCategory === 'SOURCE' && (
                        <CategoryChipPanel>
                          <ChipRow>
                            {SOURCE_OPTIONS.map(opt => (
                              <Chip
                                key={opt.value}
                                type="button"
                                $active={sourceFilter === opt.value}
                                onClick={() => setSourceFilter(opt.value)}
                                aria-pressed={sourceFilter === opt.value}
                              >
                                {opt.label}
                              </Chip>
                            ))}
                          </ChipRow>
                        </CategoryChipPanel>
                      )}
                    </>
                  )}
                </FilterPanel>
              )}
            </PopoverWrap>

            <PopoverWrap ref={sortRef}>
              <ControlButton
                type="button"
                $active={openPopover === 'sort'}
                onClick={() => setOpenPopover(openPopover === 'sort' ? null : 'sort')}
                aria-haspopup="true"
                aria-expanded={openPopover === 'sort'}
              >
                {`Sort: ${sortLabel}`}
                <Caret>{'\u25BE'}</Caret>
              </ControlButton>
              {openPopover === 'sort' && (
                <Popover role="menu" aria-label="Sort recipes">
                  {SORT_OPTIONS.map(opt => (
                    <SortOption
                      key={opt.value}
                      type="button"
                      role="menuitemradio"
                      aria-checked={sortBy === opt.value}
                      $active={sortBy === opt.value}
                      onClick={() => {
                        setSortBy(opt.value)
                        setOpenPopover(null)
                      }}
                    >
                      {opt.label}
                      {sortBy === opt.value && <Check>{'\u2713'}</Check>}
                    </SortOption>
                  ))}
                </Popover>
              )}
            </PopoverWrap>

            {isFiltering && (
              <ClearButton type="button" onClick={clearFilters}>
                Clear
              </ClearButton>
            )}
          </ControlRow>
          {isFiltering && (
            <ResultCount>
              {filteredRecipes.length === 1
                ? '1 recipe'
                : `${filteredRecipes.length} recipes`}
            </ResultCount>
          )}
        </FilterBar>
      )}

      {recipes.length === 0 ? (
        <EmptyState>
          <EmptyIcon>{'\uD83D\uDCD6'}</EmptyIcon>
          <EmptyTitle>Your Recipe Box is empty</EmptyTitle>
          <p>Start adding recipes to fill it up!</p>
        </EmptyState>
      ) : filteredRecipes.length === 0 && activeCollection ? (
        <EmptyState>
          <EmptyIcon>{'\uD83D\uDCC2'}</EmptyIcon>
          <EmptyTitle>No recipes in this collection yet</EmptyTitle>
          <p>Add some from your Recipe Box using the {'\u22EE'} menu on each recipe card.</p>
        </EmptyState>
      ) : filteredRecipes.length === 0 ? (
        <EmptyState>
          <EmptyIcon>{'\uD83D\uDD0D'}</EmptyIcon>
          <EmptyTitle>No matches</EmptyTitle>
          <p>Try a different search or clear your filters.</p>
        </EmptyState>
      ) : (
        <Grid $layout={cs.card_layout}>
          {filteredRecipes.map(recipe => {
            const time = totalTime(recipe)
            const hasFaithConflict = faithPractices?.follows_faith_based_diet
              ? checkFaithConflicts(recipe.ingredients || [], faithPractices).hasConflict
              : false
            const photoTop = cs.show_photo && cs.photo_position === 'top'
            const n = recipe.nutrition
            return (
              <CardWrapper key={recipe.id} $photoTop={photoTop}>
                <Card href={`/recipes/${recipe.id}`} $photoTop={photoTop}>
                  {cs.show_photo && photoTop && recipe.image_url && (
                    <CardThumb
                      src={recipe.image_url}
                      alt=""
                      $position="top"
                      onError={e => { e.currentTarget.style.display = 'none' }}
                    />
                  )}
                  <CardBody>
                    <CardName>
                      {hasFaithConflict && <span title="Faith-based dietary conflict" style={{ marginRight: 4 }}>{'\u26A0\uFE0F'}</span>}
                      {recipe.name}
                    </CardName>
                    {cs.show_description && recipe.description && <CardDescription>{recipe.description}</CardDescription>}
                    <Meta>
                      {cs.show_cook_time && time && <span>{'\u23F1 '}{time}</span>}
                      {cs.show_servings && recipe.servings && <span>{'\uD83D\uDC65 '}{recipe.servings}</span>}
                      {cs.show_rating && recipe.rating && (
                        <CardRating>{'\u2605'} {recipe.rating}</CardRating>
                      )}
                      {cs.show_review_count && recipe.review_count && (
                        <span>{recipe.review_count} reviews</span>
                      )}
                    </Meta>
                    {cs.show_difficulty && recipe.difficulty && (
                      <div><CardDifficultyBadge>{recipe.difficulty}</CardDifficultyBadge></div>
                    )}
                    {cs.show_categories && recipe.tags && recipe.tags.length > 0 && (
                      <TagRow>
                        {recipe.tags.slice(0, 3).map(tag => <Tag key={tag}>{tag}</Tag>)}
                      </TagRow>
                    )}
                    {cs.show_source && recipe.source && (
                      <CardSource>Source: {recipe.source}</CardSource>
                    )}
                    {(macroGoals.length > 0 || macroCalorie || macroProtein) && !n && (
                      <NutritionBadge>No nutrition data</NutritionBadge>
                    )}
                    {activeCuisines.length > 0 && !recipe.cuisine_type && (
                      <NutritionBadge>Uncategorized</NutritionBadge>
                    )}
                    {cs.show_macros && n && (
                      <CardMacroRow>
                        {cs.show_calories && n.calories != null && (
                          <CardMacroItem>
                            <CardMacroDot $color={MACRO_COLORS.calories} />
                            {n.calories} cal
                          </CardMacroItem>
                        )}
                        {cs.show_protein && n.protein_g != null && (
                          <CardMacroItem>
                            <CardMacroDot $color={MACRO_COLORS.protein} />
                            {n.protein_g}g Protein
                          </CardMacroItem>
                        )}
                        {cs.show_carbs && n.carbs_g != null && (
                          <CardMacroItem>
                            <CardMacroDot $color={MACRO_COLORS.carbs} />
                            {n.carbs_g}g Carbs
                          </CardMacroItem>
                        )}
                        {cs.show_fat && n.fat_g != null && (
                          <CardMacroItem>
                            <CardMacroDot $color={MACRO_COLORS.fat} />
                            {n.fat_g}g Fat
                          </CardMacroItem>
                        )}
                        {recipe.nutrition_is_estimated && <CardEstBadge>Est.</CardEstBadge>}
                      </CardMacroRow>
                    )}
                  </CardBody>
                  {cs.show_photo && !photoTop && recipe.image_url && (
                    <CardThumb
                      src={recipe.image_url}
                      alt=""
                      $position="right"
                      onError={e => { e.currentTarget.style.display = 'none' }}
                    />
                  )}
                </Card>
                <CardShareButton
                  onClick={e => handleShare(e, recipe)}
                  title="Share recipe"
                  aria-label="Share recipe"
                >
                  {'\uD83D\uDCE4'}
                </CardShareButton>
                {collections.length > 0 && (
                  <CardColMenuWrap>
                    <CardColButton
                      onClick={e => {
                        e.preventDefault()
                        e.stopPropagation()
                        setColMenuRecipeId(colMenuRecipeId === recipe.id ? null : recipe.id)
                      }}
                      title="Manage collections"
                      aria-label="Manage collections"
                    >
                      {'\uD83D\uDCC2'}
                    </CardColButton>
                    {colMenuRecipeId === recipe.id && (
                      <>
                        <ColMenuOverlay onClick={() => setColMenuRecipeId(null)} />
                        <ColMenuPanel>
                          {collections.map(col => {
                            const isIn = collectionLinks.some(
                              l => String(l.recipe_id) === String(recipe.id) && l.collection_id === col.id
                            )
                            return (
                              <ColMenuItem
                                key={col.id}
                                type="button"
                                onClick={e => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleToggleRecipeCollection(recipe.id, col.id)
                                }}
                              >
                                <ColCheck $checked={isIn}>{isIn ? '\u2713' : ''}</ColCheck>
                                {col.emoji && <span>{col.emoji}</span>}
                                {col.name}
                              </ColMenuItem>
                            )
                          })}
                        </ColMenuPanel>
                      </>
                    )}
                  </CardColMenuWrap>
                )}
              </CardWrapper>
            )
          })}
        </Grid>
      )}

      {modalOpen && (
        <Modal title={formInitial ? 'Review & save recipe' : 'New recipe'} onClose={closeForm}>
          <RecipeForm
            initial={formInitial}
            onSubmit={handleCreate}
            onCancel={closeForm}
            isPending={isPending}
            submitLabel="Create recipe"
            onGenerateImage={generateRecipeImageAction}
            existingNames={recipes.map(r => r.name.toLowerCase())}
          />
        </Modal>
      )}

      {wizardStep && (
        <Modal
          title={wizardStep === 'choose' ? 'Generate a recipe with Koda' : wizardStep === 'custom' ? 'Describe your recipe' : 'Pick an idea'}
          onClose={() => setWizardStep(null)}
        >
          {wizardStep === 'choose' && (
            <>
              {contextLoading ? (
                <ContextLoading>Loading your kitchen context…</ContextLoading>
              ) : (
                <>
                  <WizardModeGrid>
                    <ModeCard
                      type="button"
                      onClick={() => handleChooseMode('general')}
                      disabled={isLoadingIdeas}
                    >
                      <ModeCardIcon>{'\uD83E\uDD57'}</ModeCardIcon>
                      <ModeCardTitle>Use pantry scan</ModeCardTitle>
                      <ModeCardMeta>
                        {contextData?.pantryItems?.length > 0
                          ? `${contextData.pantryItems.length} item${contextData.pantryItems.length !== 1 ? 's' : ''} in your pantry`
                          : 'No items scanned yet'}
                      </ModeCardMeta>
                      <PantryReminder>
                        Keep pantry up to date —{' '}
                        <Link href="/kitchen" onClick={() => setWizardStep(null)}>
                          scan a new photo
                        </Link>
                      </PantryReminder>
                    </ModeCard>

                    <ModeCard
                      type="button"
                      onClick={() => setWizardStep('custom')}
                      disabled={isLoadingIdeas}
                    >
                      <ModeCardIcon>{'\u270F\uFE0F'}</ModeCardIcon>
                      <ModeCardTitle>Describe your own idea</ModeCardTitle>
                      <ModeCardMeta>
                        Tell Koda what you want to cook
                      </ModeCardMeta>
                    </ModeCard>
                  </WizardModeGrid>
                </>
              )}
            </>
          )}

          {wizardStep === 'custom' && (
            <>
              <WizardBackLink
                type="button"
                onClick={() => { setWizardStep('choose'); setPromptError(null) }}
              >
                {'\u2190 Back'}
              </WizardBackLink>

              <PromptHint>
                Describe what you want — ingredients, cuisine, dietary needs, servings, etc.
              </PromptHint>
              <PromptTextarea
                value={promptText}
                onChange={e => setPromptText(e.target.value)}
                placeholder="e.g. A quick weeknight dinner using chicken, rice, and broccoli for 4 people"
                maxLength={500}
                disabled={isGenerating}
                autoFocus
              />

              {contextLoading ? (
                <ContextLoading>Loading your kitchen context...</ContextLoading>
              ) : contextData && (
                <ContextSection>
                  {contextData.pantryItems?.length > 0 && (
                    <PantryToggleRow>
                      <ToggleSwitch
                        $on={includePantry}
                        onClick={() => setIncludePantry(p => !p)}
                        role="switch"
                        aria-checked={includePantry}
                      />
                      <PantryToggleText>Use my pantry items</PantryToggleText>
                      <PantryToggleMeta>
                        {contextData.pantryItems.length} item{contextData.pantryItems.length !== 1 ? 's' : ''}
                        {(() => {
                          const exp = contextData.pantryItems.filter(i => i.freshness === 'expiring').length
                          return exp > 0 ? `, ${exp} expiring soon` : ''
                        })()}
                      </PantryToggleMeta>
                    </PantryToggleRow>
                  )}

                  {contextData.dietaryRestrictions?.length > 0 && (
                    <DietaryRow>
                      Dietary: {contextData.dietaryRestrictions.join(', ')}
                    </DietaryRow>
                  )}

                  <PrefsAccordion>
                    <PrefsHeader type="button" onClick={() => setPrefsExpanded(p => !p)}>
                      <PrefsHeaderLeft>
                        Cooking preferences
                        {contextData.preferences && <PrefsSavedBadge>saved</PrefsSavedBadge>}
                      </PrefsHeaderLeft>
                      <PrefsChevron $open={prefsExpanded}>{'\u25BE'}</PrefsChevron>
                    </PrefsHeader>
                    {prefsExpanded && (
                      <PrefsBody>
                        <div>
                          <PrefsLabel>Skill level</PrefsLabel>
                          <PrefsChipRow>
                            {['beginner', 'intermediate', 'advanced'].map(val => (
                              <PrefChip
                                key={val}
                                type="button"
                                $active={prefSkill === val}
                                onClick={() => setPrefSkill(prefSkill === val ? null : val)}
                              >
                                {val.charAt(0).toUpperCase() + val.slice(1)}
                              </PrefChip>
                            ))}
                          </PrefsChipRow>
                        </div>
                        <div>
                          <PrefsLabel>Time preference</PrefsLabel>
                          <PrefsChipRow>
                            {[
                              { value: 'quick', label: 'Quick (<30m)' },
                              { value: 'medium', label: 'Medium (30-60m)' },
                              { value: 'elaborate', label: 'Elaborate (60m+)' },
                            ].map(opt => (
                              <PrefChip
                                key={opt.value}
                                type="button"
                                $active={prefTime === opt.value}
                                onClick={() => setPrefTime(prefTime === opt.value ? null : opt.value)}
                              >
                                {opt.label}
                              </PrefChip>
                            ))}
                          </PrefsChipRow>
                        </div>
                        <div>
                          <PrefsLabel>Cuisines</PrefsLabel>
                          <PrefsChipRow>
                            {CUISINE_OPTIONS.map(cuisine => (
                              <PrefChip
                                key={cuisine}
                                type="button"
                                $active={prefCuisines.includes(cuisine.toLowerCase())}
                                onClick={() => toggleCuisine(cuisine.toLowerCase())}
                              >
                                {cuisine}
                              </PrefChip>
                            ))}
                          </PrefsChipRow>
                        </div>
                        <div>
                          <PrefsLabel>Servings</PrefsLabel>
                          <PrefsServingInput
                            type="number"
                            min="1"
                            max="20"
                            value={prefServings}
                            onChange={e => setPrefServings(e.target.value)}
                            placeholder="4"
                          />
                        </div>
                        <div>
                          <PrefsLabel>Additional notes</PrefsLabel>
                          <PrefsNotesTextarea
                            value={prefNotes}
                            onChange={e => setPrefNotes(e.target.value)}
                            placeholder="e.g. No spicy food, kid-friendly, low sodium..."
                            maxLength={300}
                          />
                        </div>
                        <SavePrefsButton
                          type="button"
                          onClick={handleSavePrefs}
                          disabled={savingPrefs}
                        >
                          {savingPrefs ? 'Saving...' : 'Save preferences'}
                        </SavePrefsButton>
                      </PrefsBody>
                    )}
                  </PrefsAccordion>
                </ContextSection>
              )}

              {promptError && <PromptError role="alert">{promptError}</PromptError>}
              <PromptActions>
                <PromptSecondary onClick={() => setWizardStep('choose')} disabled={isGenerating}>
                  Cancel
                </PromptSecondary>
                <PromptPrimary onClick={handleGenerate} disabled={isGenerating || contextLoading}>
                  {isGenerating ? 'Generating\u2026' : 'Generate'}
                </PromptPrimary>
              </PromptActions>
            </>
          )}

          {wizardStep === 'ideas' && (
            <>
              <WizardBackLink
                type="button"
                onClick={() => { setWizardStep('choose'); setRecipeIdeas([]); setSelectedIdeaIdx(null); setIdeasError(null) }}
              >
                {'← Back'}
              </WizardBackLink>

              {isLoadingIdeas ? (
                <IdeasLoadingMsg>Thinking up ideas…</IdeasLoadingMsg>
              ) : ideasError ? (
                <PromptError role="alert">{ideasError}</PromptError>
              ) : (
                <IdeasGrid>
                  {recipeIdeas.map((idea, idx) => (
                    <IdeaCard
                      key={idx}
                      type="button"
                      $selected={selectedIdeaIdx === idx}
                      onClick={() => setSelectedIdeaIdx(idx)}
                      disabled={isGenerating}
                    >
                      <IdeaName>{idea.name}</IdeaName>
                      <IdeaDescription>{idea.description}</IdeaDescription>
                      {idea.key_ingredients?.length > 0 && (
                        <IdeaIngredients>
                          {idea.key_ingredients.slice(0, 4).map(ing => (
                            <IdeaIngTag key={ing}>{ing}</IdeaIngTag>
                          ))}
                        </IdeaIngredients>
                      )}
                    </IdeaCard>
                  ))}
                </IdeasGrid>
              )}

              {selectedIdeaIdx !== null && !isLoadingIdeas && (
                <PromptActions>
                  <PromptSecondary
                    type="button"
                    onClick={() => setSelectedIdeaIdx(null)}
                    disabled={isGenerating}
                  >
                    Clear
                  </PromptSecondary>
                  <PromptPrimary
                    type="button"
                    onClick={handleGenerateFromIdea}
                    disabled={isGenerating}
                  >
                    {isGenerating ? 'Generating\u2026' : 'Generate this recipe'}
                  </PromptPrimary>
                </PromptActions>
              )}
            </>
          )}
        </Modal>
      )}

      {scanOpen && (
        <Modal title="Scan a recipe" onClose={closeScan}>
          <PromptHint>
            Take photos of a recipe — from a cookbook, handwritten card, or screen. Add up to 6 images.
          </PromptHint>
          {scanFiles.length === 0 ? (
            <ScanDropZone>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleScanFiles}
                style={{ display: 'none' }}
              />
              <ScanDropIcon>{'\uD83D\uDCF7'}</ScanDropIcon>
              <ScanDropText>Tap to take a photo or choose from gallery</ScanDropText>
              <ScanDropHint>JPEG, PNG, WebP, HEIC</ScanDropHint>
            </ScanDropZone>
          ) : (
            <ScanPreviewGrid>
              {scanPreviews.map((url, i) => (
                <ScanPreviewItem key={i}>
                  <ScanPreviewImg src={url} alt={`Recipe photo ${i + 1}`} />
                  <ScanRemoveBtn
                    type="button"
                    onClick={() => removeScanFile(i)}
                    aria-label={`Remove photo ${i + 1}`}
                    disabled={isScanning}
                  >
                    {'\u2715'}
                  </ScanRemoveBtn>
                </ScanPreviewItem>
              ))}
              {scanFiles.length < 6 && (
                <ScanAddMore>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    onChange={handleScanFiles}
                    style={{ display: 'none' }}
                  />
                  +
                </ScanAddMore>
              )}
            </ScanPreviewGrid>
          )}
          {scanError && <PromptError role="alert">{scanError}</PromptError>}
          <PromptActions>
            <PromptSecondary onClick={closeScan} disabled={isScanning}>
              Cancel
            </PromptSecondary>
            <PromptPrimary onClick={handleScan} disabled={isScanning || scanFiles.length === 0}>
              {isScanning ? (scanPhase || 'Scanning\u2026') : `Scan ${scanFiles.length > 0 ? `(${scanFiles.length} photo${scanFiles.length !== 1 ? 's' : ''})` : ''}`}
            </PromptPrimary>
          </PromptActions>
        </Modal>
      )}

      {urlOpen && (
        <Modal title="Import recipe" onClose={() => setUrlOpen(false)}>
          <PromptHint>
            Paste a link from TikTok, Instagram, Pinterest, YouTube, or any recipe website.
          </PromptHint>
          <SearchInput
            type="url"
            value={urlText}
            onChange={e => setUrlText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !isImporting && urlText.trim() && handleImportUrl()}
            placeholder="https://www.tiktok.com/... or any recipe URL"
            disabled={isImporting}
            autoFocus
            style={{ maxWidth: '100%' }}
          />
          {isImporting && (
            <PromptHint style={{ marginTop: 8 }}>
              {'\u2728'} Reading the recipe\u2026
            </PromptHint>
          )}
          {urlError && <PromptError role="alert">{urlError}</PromptError>}
          <PromptActions>
            <PromptSecondary onClick={() => setUrlOpen(false)} disabled={isImporting}>
              Cancel
            </PromptSecondary>
            <PromptPrimary onClick={handleImportUrl} disabled={isImporting || !urlText.trim()}>
              {isImporting ? 'Importing\u2026' : 'Import'}
            </PromptPrimary>
          </PromptActions>
        </Modal>
      )}

      {importReviewOpen && importReviewData && (
        <Modal
          title={importReviewData.imported_from ? `Imported from ${importReviewData.imported_from}` : 'Review imported recipe'}
          onClose={() => { setImportReviewOpen(false); setImportReviewData(null) }}
        >
          <RecipeImportReview
            recipe={importReviewData}
            onSave={handleSaveImportReview}
            onCancel={() => { setImportReviewOpen(false); setImportReviewData(null) }}
            isPending={isSavingImport}
            onGenerateImage={handleImportGenerateImage}
            isGeneratingImage={isGeneratingImportImage}
          />
        </Modal>
      )}

      {webSearchOpen && (
        <Modal
          title={webSearchStep === 'detail' ? (webSearchSelected?.name || 'Recipe detail') : 'Search the web'}
          onClose={closeWebSearch}
        >
          {webSearchStep === 'input' && (
            <>
              <WebSearchHint>
                Koda finds top-rated recipes from the web (4.5+ stars, 100+ reviews).
              </WebSearchHint>
              <SearchInput
                type="search"
                value={webSearchQuery}
                onChange={e => setWebSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !isWebSearching && handleWebSearch()}
                placeholder="e.g. easy chicken dinner, quick pasta, vegan tacos"
                disabled={isWebSearching}
                autoFocus
                style={{ maxWidth: '100%' }}
              />
              {webSearchError && <PromptError role="alert">{webSearchError}</PromptError>}
              {isWebSearching && <WebSearchHint style={{ marginTop: '8px' }}>Searching the web…</WebSearchHint>}
              <PromptActions>
                <PromptSecondary onClick={closeWebSearch} disabled={isWebSearching}>
                  Cancel
                </PromptSecondary>
                <PromptPrimary onClick={handleWebSearch} disabled={isWebSearching || !webSearchQuery.trim()}>
                  {isWebSearching ? 'Searching\u2026' : 'Search'}
                </PromptPrimary>
              </PromptActions>
            </>
          )}

          {webSearchStep === 'results' && (
            <>
              <WebSearchBackLink type="button" onClick={() => setWebSearchStep('input')}>
                {'\u2190 Back'}
              </WebSearchBackLink>
              <WebSearchResultsList>
                {webSearchResults.map((r, i) => {
                  const stars = renderStars(r.rating)
                  const totalMins = (Number(r.prep_time_minutes) || 0) + (Number(r.cook_time_minutes) || 0)
                  return (
                    <WebSearchResultCard
                      key={i}
                      type="button"
                      onClick={() => { setWebSearchSelected(r); setWebSearchStep('detail') }}
                    >
                      {r.image_url && (
                        <WebSearchResultThumb
                          src={r.image_url}
                          alt={r.name}
                          onError={e => { e.currentTarget.style.display = 'none' }}
                        />
                      )}
                      <WebSearchResultBody>
                        <WebSearchResultName>{r.name}</WebSearchResultName>
                        {(stars || r.review_count) && (
                          <WebSearchResultRatingRow>
                            {stars && <WebSearchResultStars>{stars}</WebSearchResultStars>}
                            {r.rating && <WebSearchResultMeta>{r.rating.toFixed(1)}</WebSearchResultMeta>}
                            {r.review_count && <WebSearchResultMeta>{formatReviews(r.review_count)}</WebSearchResultMeta>}
                          </WebSearchResultRatingRow>
                        )}
                        {totalMins > 0 && <WebSearchResultMeta>{'\u23F1 '}{formatMinutes(totalMins)}</WebSearchResultMeta>}
                        {r.description && <WebSearchResultDesc>{r.description}</WebSearchResultDesc>}
                      </WebSearchResultBody>
                    </WebSearchResultCard>
                  )
                })}
              </WebSearchResultsList>
            </>
          )}

          {webSearchStep === 'detail' && webSearchSelected && (
            <>
              <WebSearchBackLink type="button" onClick={() => setWebSearchStep('results')}>
                {'\u2190 Back'}
              </WebSearchBackLink>

              {webSearchSelected.image_url && (
                <WebSearchDetailImage
                  src={webSearchSelected.image_url}
                  alt={webSearchSelected.name}
                  onError={e => { e.currentTarget.style.display = 'none' }}
                />
              )}

              <WebSearchDetailTitle>{webSearchSelected.name}</WebSearchDetailTitle>

              {webSearchSelected.description && (
                <p style={{ fontSize: '14px', color: 'inherit', margin: '4px 0 8px', lineHeight: '1.5' }}>
                  {webSearchSelected.description}
                </p>
              )}

              <WebSearchDetailMetaRow>
                {webSearchSelected.rating && (
                  <WebSearchDetailMetaChip>
                    {'\u2605 '}{webSearchSelected.rating.toFixed(1)}
                    {webSearchSelected.review_count ? ` (${formatReviews(webSearchSelected.review_count)})` : ''}
                  </WebSearchDetailMetaChip>
                )}
                {(Number(webSearchSelected.prep_time_minutes) || 0) + (Number(webSearchSelected.cook_time_minutes) || 0) > 0 && (
                  <WebSearchDetailMetaChip>
                    {'\u23F1 '}{formatMinutes((Number(webSearchSelected.prep_time_minutes) || 0) + (Number(webSearchSelected.cook_time_minutes) || 0))}
                  </WebSearchDetailMetaChip>
                )}
                {webSearchSelected.servings && (
                  <WebSearchDetailMetaChip>{webSearchSelected.servings} servings</WebSearchDetailMetaChip>
                )}
              </WebSearchDetailMetaRow>

              {webSearchSelected.source_url && (
                <WebSearchSourceLink href={webSearchSelected.source_url} target="_blank" rel="noopener noreferrer">
                  {webSearchSelected.source_url}
                </WebSearchSourceLink>
              )}

              {webSearchSelected.ingredients?.length > 0 && (
                <>
                  <WebSearchSectionLabel>Ingredients</WebSearchSectionLabel>
                  <WebSearchIngList>
                    {webSearchSelected.ingredients.map((ing, i) => {
                      const name = typeof ing === 'string' ? ing : ing?.name
                      const qty = typeof ing === 'object' ? ing?.quantity : null
                      return (
                        <WebSearchIngItem key={i}>
                          <span>{name}</span>
                          {qty && <span style={{ color: 'inherit', opacity: 0.6 }}>{qty}</span>}
                        </WebSearchIngItem>
                      )
                    })}
                  </WebSearchIngList>
                </>
              )}

              {webSearchSelected.instructions && (
                <>
                  <WebSearchSectionLabel>Instructions</WebSearchSectionLabel>
                  <WebSearchDetailInstructions>{webSearchSelected.instructions}</WebSearchDetailInstructions>
                </>
              )}

              {webSearchError && <PromptError role="alert" style={{ marginTop: '12px' }}>{webSearchError}</PromptError>}

              <PromptActions>
                <PromptSecondary onClick={() => setWebSearchStep('results')} disabled={isSavingWebRecipe}>
                  Back
                </PromptSecondary>
                <WebSearchSaveButton onClick={handleSaveWebRecipe} disabled={isSavingWebRecipe}>
                  {isSavingWebRecipe ? 'Saving\u2026' : 'Save to Recipe Box'}
                </WebSearchSaveButton>
              </PromptActions>
            </>
          )}
        </Modal>
      )}

      {/* New Collection Modal */}
      {newColOpen && (
        <Modal title="New Collection" onClose={() => setNewColOpen(false)}>
          <NewColForm>
            <NewColLabel>
              Emoji
              <EmojiGrid>
                {COLLECTION_EMOJIS.map(e => (
                  <EmojiBtn
                    key={e}
                    type="button"
                    $active={newColEmoji === e}
                    onClick={() => setNewColEmoji(e)}
                  >
                    {e}
                  </EmojiBtn>
                ))}
              </EmojiGrid>
            </NewColLabel>
            <NewColLabel>
              Name
              <NewColInput
                value={newColName}
                onChange={e => setNewColName(e.target.value)}
                placeholder="e.g. Weeknight Wins"
                autoFocus
                maxLength={100}
              />
            </NewColLabel>
            <NewColLabel>
              Description (optional)
              <NewColInput
                value={newColDesc}
                onChange={e => setNewColDesc(e.target.value)}
                placeholder="What goes in this collection?"
                maxLength={300}
              />
            </NewColLabel>
            <PromptActions>
              <PromptSecondary onClick={() => setNewColOpen(false)} disabled={isCreatingCol}>
                Cancel
              </PromptSecondary>
              <PromptPrimary onClick={handleCreateCollection} disabled={isCreatingCol || !newColName.trim()}>
                {isCreatingCol ? 'Creating\u2026' : 'Create Collection'}
              </PromptPrimary>
            </PromptActions>
          </NewColForm>
        </Modal>
      )}

      {toast && <Toast>{toast}</Toast>}
    </>
  )
}
