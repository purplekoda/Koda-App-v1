'use client'

import { useState, useTransition, useMemo, useRef, useEffect, useCallback } from 'react'
import styled, { keyframes } from 'styled-components'
import { assignRecipeToSlot, swapMeal, surpriseMeAction } from '@/app/(app)/meals/actions'
import {
  importRecipeFromUrlAction,
  generateRecipeAction,
  generateRecipeIdeasAction,
  createRecipeAction,
  searchWebRecipesAction,
} from '@/app/(app)/recipes/actions'

// ─── Animations ───────────────────────────────────────────────────────────────

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`

const slideUp = keyframes`
  from { transform: translateY(16px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
`

// ─── Layout ───────────────────────────────────────────────────────────────────

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1300;
  padding: ${({ theme }) => theme.spacing.lg};
  animation: ${fadeIn} 0.15s ease;
`

const Modal = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.xl};
  width: 100%;
  max-width: 520px;
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: ${({ theme }) => theme.shadows.elevated};
  animation: ${slideUp} 0.2s ease;
`

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.xl};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  flex-shrink: 0;
`

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`

const BackButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.borderLight};
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  flex-shrink: 0;
  line-height: 1;

  &:hover {
    background: ${({ theme }) => theme.colors.border};
  }
`

const HeaderText = styled.div``

const ModalTitle = styled.h3`
  font-size: 18px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const ModalSubtitle = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 2px;
  text-transform: capitalize;
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
  flex-shrink: 0;

  &:hover {
    background: ${({ theme }) => theme.colors.border};
  }
`

// ─── Options Screen ───────────────────────────────────────────────────────────

const OptionsBody = styled.div`
  padding: ${({ theme }) => theme.spacing.xl};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  & > * {
    flex-shrink: 0;
  }
`

const OptionCard = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg};
  padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.xl};
  border: 1.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface};
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
  width: 100%;

  &:hover {
    border-color: ${({ theme }) => theme.colors.teal};
    background: ${({ theme }) => theme.colors.tealLight};
  }

  &:active {
    transform: scale(0.99);
  }
`

const OptionIconWrap = styled.div`
  width: 44px;
  height: 44px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ $bg, theme }) => $bg || theme.colors.borderLight};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
`

const OptionText = styled.div`
  flex: 1;
  min-width: 0;
`

const OptionTitle = styled.div`
  font-size: 15px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const OptionDesc = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 2px;
`

const OptionChevron = styled.div`
  font-size: 16px;
  color: ${({ theme }) => theme.colors.textMuted};
  flex-shrink: 0;
`

// ─── Surprise Me (swap screen) ───────────────────────────────────────────────

const pulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
`

const SurpriseLoadingWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 20px;
`

const SurpriseLoadingDot = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #D85A30;
  animation: ${pulse} 1.2s ease-in-out infinite;
`

const SurpriseLoadingText = styled.div`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const SurpriseCardWrap = styled.div`
  background: #FFF7F5;
  border: 1.5px solid #F0997B;
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const SurpriseCardName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const SurpriseCardTrending = styled.div`
  font-size: 13px;
  color: #D85A30;
  font-weight: 500;
  line-height: 1.4;
`

const SurpriseCardDesc = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.4;
`

const SurpriseCardMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: 2px;
`

const SurpriseCardLink = styled.a`
  font-size: 12px;
  color: #D85A30;
  text-decoration: none;
  &:hover { text-decoration: underline; }
`

const SurpriseCardActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`

const SurpriseCardAccept = styled.button`
  flex: 1;
  padding: 10px 16px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: #D85A30;
  border: none;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  &:hover { opacity: 0.9; }
  &:disabled { opacity: 0.5; cursor: wait; }
`

const SurpriseCardAgain = styled.button`
  padding: 10px 16px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: #FFF7F5;
  border: 1px solid #F0997B;
  color: #D85A30;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  &:hover { background: #F0997B; color: white; }
  &:disabled { opacity: 0.5; cursor: wait; }
`

// ─── Collection Chips (library mode) ─────────────────────────────────────────

const PickerChipRow = styled.div`
  display: flex;
  gap: 6px;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl} 0;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar { display: none; }
  flex-shrink: 0;
`

const PickerChip = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  border: 1.5px solid ${({ theme, $active }) =>
    $active ? theme.colors.teal : theme.colors.border};
  background: ${({ theme, $active }) =>
    $active ? theme.colors.tealLight : 'transparent'};
  color: ${({ theme, $active }) =>
    $active ? theme.colors.teal : theme.colors.textSecondary};
  transition: all 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.teal};
  }
`

// ─── Controls (library mode) ──────────────────────────────────────────────────

const ControlsBar = styled.div`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`

const SearchInput = styled.input`
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.background};
  outline: none;
  box-sizing: border-box;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.teal};
    box-shadow: ${({ theme }) => theme.shadows.input};
  }
`

const UnassignButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: 10px 14px;
  border: 1.5px solid ${({ theme }) => theme.colors.coralMid};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.coralLight};
  color: ${({ theme }) => theme.colors.coral};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.coralMid};
    color: #fff;
  }

  &:disabled {
    opacity: 0.5;
    cursor: wait;
  }
`

// ─── Recipe List ──────────────────────────────────────────────────────────────

const RecipeList = styled.div`
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  & > * {
    flex-shrink: 0;
  }
`

const EmptyState = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xxxl} 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 14px;
`

const RecipeCard = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  border: 1.5px solid ${({ $isCurrent, theme }) =>
    $isCurrent ? theme.colors.teal : theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ $isCurrent, theme }) =>
    $isCurrent ? theme.colors.tealLight : theme.colors.surface};
  transition: all 0.15s ease;

  &:hover {
    border-color: ${({ $isCurrent, theme }) =>
      $isCurrent ? theme.colors.teal : theme.colors.border};
    background: ${({ $isCurrent, theme }) =>
      $isCurrent ? theme.colors.tealLight : theme.colors.borderLight};
  }
`

const RecipeThumbnail = styled.div`
  width: 52px;
  height: 52px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.grayLight};
  flex-shrink: 0;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`

const ThumbnailPlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
`

const RecipeInfo = styled.div`
  flex: 1;
  min-width: 0;
`

const RecipeName = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const RecipeMeta = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: 4px;
  flex-wrap: wrap;
`

const RecipeTime = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
`

const TagList = styled.div`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
`

const Tag = styled.span`
  font-size: 11px;
  padding: 2px 7px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.grayLight};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: 500;
`

const CurrentBadge = styled.span`
  font-size: 11px;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.tealMid};
  color: ${({ theme }) => theme.colors.tealDark};
  font-weight: 600;
  white-space: nowrap;
`

const AssignButton = styled.button`
  padding: 7px 14px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: none;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: all 0.15s ease;

  background: ${({ $isCurrent, theme }) =>
    $isCurrent ? theme.colors.tealMid : theme.colors.teal};
  color: ${({ $isCurrent, theme }) =>
    $isCurrent ? theme.colors.tealDark : '#FFFFFF'};

  &:hover {
    opacity: 0.85;
  }

  &:disabled {
    opacity: 0.5;
    cursor: wait;
  }
`

// ─── Footer ───────────────────────────────────────────────────────────────────

const ModalFooter = styled.div`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
  flex-shrink: 0;
`

const CustomNameToggle = styled.button`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;

  &:hover {
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

const CustomNameForm = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.sm};
`

const CustomNameInput = styled.input`
  flex: 1;
  padding: 9px 12px;
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.background};
  outline: none;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.teal};
  }
`

const CustomNameSubmit = styled.button`
  padding: 9px 16px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.teal};
  color: #fff;
  border: none;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: wait;
  }
`

// ─── URL / AI shared input area ───────────────────────────────────────────────

const InputBody = styled.div`
  padding: ${({ theme }) => theme.spacing.xl};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  /* Children must not shrink — they need to overflow so the scroll activates.
     Without this, flex shrinks children to fit rather than letting them overflow. */
  & > * {
    flex-shrink: 0;
  }
`

const InputLabel = styled.label`
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const UrlInput = styled.input`
  width: 100%;
  padding: 11px 14px;
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.background};
  outline: none;
  box-sizing: border-box;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.teal};
    box-shadow: ${({ theme }) => theme.shadows.input};
  }
`

const PromptTextarea = styled.textarea`
  width: 100%;
  padding: 11px 14px;
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.background};
  outline: none;
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  box-sizing: border-box;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.purple};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.purpleLight};
  }
`

const ActionRow = styled.div`
  display: flex;
  justify-content: flex-end;
`

const PrimaryButton = styled.button`
  padding: 10px 20px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ $purple, theme }) => $purple ? theme.colors.purple : theme.colors.teal};
  color: #fff;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s ease;

  &:hover {
    opacity: 0.88;
  }

  &:disabled {
    opacity: 0.5;
    cursor: wait;
  }
`

const InlineError = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.coral};
  background: ${({ theme }) => theme.colors.coralLight};
  border: 1px solid ${({ theme }) => theme.colors.coralMid};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: 10px 14px;
  margin: 0;
`

// ─── Preview panel ────────────────────────────────────────────────────────────

const PreviewCard = styled.div`
  border: 1.5px solid ${({ theme }) => theme.colors.tealMid};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.tealLight};
  overflow: hidden;
`

const PreviewImage = styled.img`
  width: 100%;
  height: 160px;
  object-fit: cover;
  display: block;
`

const PreviewHeader = styled.button`
  width: 100%;
  display: block;
  text-align: left;
  background: none;
  border: none;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  cursor: pointer;
`

const PreviewName = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const PreviewDesc = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const PreviewMetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg};
  margin-top: 6px;
  flex-wrap: wrap;
`

const PreviewMetaItem = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
`

const ExpandToggle = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  background: none;
  border: none;
  padding: 0;
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.teal};
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }
`

const ExpandChevron = styled.span`
  display: inline-block;
  transition: transform 0.2s ease;
  transform: ${({ $expanded }) => $expanded ? 'rotate(180deg)' : 'rotate(0deg)'};
`

const ExpandedBody = styled.div`
  padding: 0 ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.tealMid};
`

const SectionLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textMuted};
  margin: ${({ theme }) => theme.spacing.md} 0 ${({ theme }) => theme.spacing.sm};
`

const IngredientRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: 4px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.tealMid};

  &:last-child {
    border-bottom: none;
  }
`

const IngredientText = styled.span`
  flex: 1;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const EditIngredientButton = styled.button`
  flex-shrink: 0;
  background: none;
  border: none;
  padding: 2px 4px;
  cursor: pointer;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 12px;
  line-height: 1;
  border-radius: ${({ theme }) => theme.radii.sm};

  &:hover {
    color: ${({ theme }) => theme.colors.teal};
    background: ${({ theme }) => theme.colors.tealMid};
  }
`

const IngredientEditRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  flex-wrap: wrap;
`

const IngredientEditInput = styled.input`
  padding: 4px 7px;
  border: 1.5px solid ${({ theme }) => theme.colors.teal};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.surface};
  outline: none;
  width: ${({ $w }) => $w || '60px'};

  &:focus {
    box-shadow: ${({ theme }) => theme.shadows.input};
  }
`

const IngredientEditConfirm = styled.button`
  background: none;
  border: none;
  padding: 3px 5px;
  cursor: pointer;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.teal};
  line-height: 1;

  &:hover {
    opacity: 0.7;
  }
`

const IngredientEditCancel = styled.button`
  background: none;
  border: none;
  padding: 3px 5px;
  cursor: pointer;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1;

  &:hover {
    color: ${({ theme }) => theme.colors.coral};
  }
`

const InstructionItem = styled.li`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textPrimary};
  line-height: 1.5;
  padding: 4px 0;
`

const TryAgainButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
  align-self: center;

  &:hover {
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

const SaveButton = styled.button`
  width: 100%;
  padding: 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.teal};
  color: #fff;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s ease;
  margin-top: ${({ theme }) => theme.spacing.md};

  &:hover {
    opacity: 0.88;
  }

  &:disabled {
    opacity: 0.5;
    cursor: wait;
  }
`

const SavedRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.md};
  padding: 10px 14px;
  background: ${({ theme }) => theme.colors.tealLight};
  border: 1px solid ${({ theme }) => theme.colors.tealMid};
  border-radius: ${({ theme }) => theme.radii.md};
`

const SavedLabel = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.tealDark};
  font-weight: 500;
`

const ViewRecipeLink = styled.a`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.teal};
  text-decoration: none;
  white-space: nowrap;

  &:hover {
    text-decoration: underline;
  }
`

// ─── Side prompt styles ───────────────────────────────────────────────────────

const MealAddedRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: 10px 14px;
  background: ${({ theme }) => theme.colors.tealLight};
  border: 1px solid ${({ theme }) => theme.colors.tealMid};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.tealDark};
`

const SkipButton = styled.button`
  padding: 10px 16px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.borderLight};
  }

  &:disabled {
    opacity: 0.5;
    cursor: wait;
  }
`

const SideActionRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  justify-content: space-between;
`

// ─── AI wizard styles ─────────────────────────────────────────────────────────

const AiModeGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.md};
`

const AiModeCard = styled.button`
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

const AiModeIcon = styled.div`
  font-size: 24px;
`

const AiModeTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const AiModeMeta = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.4;
`

const AiBackLink = styled.button`
  background: none;
  border: none;
  padding: 0;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;

  &:hover {
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`

const AiLoadingMsg = styled.div`
  padding: ${({ theme }) => theme.spacing.xl};
  text-align: center;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textMuted};
`

const AiIdeasGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`

const AiIdeaCard = styled.button`
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

const AiIdeaName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const AiIdeaDesc = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.4;
`

const AiIdeaIngredients = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 2px;
`

const AiIdeaTag = styled.span`
  padding: 2px 8px;
  font-size: 11px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.tealLight};
  color: ${({ theme }) => theme.colors.tealDark};
`

const AiPromptHint = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0 0 ${({ theme }) => theme.spacing.xs} 0;
`

const AiPrefsAccordion = styled.div`
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;
`

const AiPrefsHeader = styled.button`
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

const AiPrefsChevron = styled.span`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.textMuted};
  transform: ${({ $open }) => $open ? 'rotate(180deg)' : 'rotate(0deg)'};
  transition: transform 0.15s ease;
`

const AiPrefsBody = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  border-top: 0.5px solid ${({ theme }) => theme.colors.border};
`

const AiPrefsLabel = styled.p`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0 0 6px 0;
`

const AiPrefsChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`

const AiPrefChip = styled.button`
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

const AiPrefsServingInput = styled.input`
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

const AiPrefsNotesTextarea = styled.textarea`
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
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.purple};
  }
`

// ─── Web search styles ────────────────────────────────────────────────────────

const SearchHintText = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
  line-height: 1.5;
`

const SearchLoadingMsg = styled.div`
  padding: ${({ theme }) => theme.spacing.xl} 0;
  text-align: center;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textMuted};
`

const SearchResultsHeader = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const SearchResultsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`

const SearchResultCard = styled.button`
  display: flex;
  flex-direction: column;
  text-align: left;
  border: 1.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface};
  overflow: hidden;
  cursor: pointer;
  transition: all 0.15s ease;
  width: 100%;
  padding: 0;

  &:hover {
    border-color: ${({ theme }) => theme.colors.teal};
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  }
`

const ResultThumb = styled.div`
  width: 100%;
  height: 140px;
  background: ${({ theme }) => theme.colors.grayLight};
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44px;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`

const ResultBody = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: 5px;
`

const ResultName = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const ResultRatingRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`

const ResultStars = styled.span`
  font-size: 13px;
  color: #F59E0B;
  font-weight: 600;
  letter-spacing: 0.3px;
`

const ResultReviews = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
`

const ResultCookTime = styled.span`
  font-size: 12px;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.borderLight};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const ResultDesc = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const ResultViewHint = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.teal};
  font-weight: 500;
`

const DetailRecipeName = styled.div`
  font-size: 17px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: 6px;
`

const DetailMetaRow = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const DetailMetaChip = styled.span`
  font-size: 12px;
  padding: 3px 10px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.borderLight};
  color: ${({ theme }) => theme.colors.textSecondary};
`

const SourceLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.teal};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`

const AddToMealButton = styled.button`
  width: 100%;
  padding: 14px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.teal};
  color: white;
  border: none;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s ease;

  &:hover:not(:disabled) {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: wait;
  }
`

const CUISINE_OPTIONS = [
  'Italian', 'Mexican', 'Asian', 'Indian', 'American',
  'Mediterranean', 'French', 'Japanese', 'Thai', 'Middle Eastern',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(prepMins, cookMins) {
  const total = (prepMins || 0) + (cookMins || 0)
  if (!total) return null
  if (total < 60) return `${total} min`
  const h = Math.floor(total / 60)
  const m = total % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

// ─── Expandable preview panel ─────────────────────────────────────────────────

function ExpandablePreview({ preview, setPreview, onSave, onTryAgain, loading, savedRecipeId, tryAgainLabel, onDone, duplicate }) {
  const [expanded, setExpanded] = useState(false)
  const [editingIdx, setEditingIdx] = useState(null)
  const [editDraft, setEditDraft] = useState({ amount: '', unit: '', name: '' })

  const timeLabel = formatTime(preview.prep_time_minutes, preview.cook_time_minutes)

  function startEdit(idx) {
    const ing = preview.ingredients[idx]
    setEditDraft({ amount: ing.amount || '', unit: ing.unit || '', name: ing.name || '' })
    setEditingIdx(idx)
  }

  function cancelEdit() {
    setEditingIdx(null)
  }

  function confirmEdit() {
    if (editingIdx === null) return
    const updated = preview.ingredients.map((ing, i) =>
      i === editingIdx ? { ...ing, ...editDraft } : ing
    )
    setPreview((prev) => ({ ...prev, ingredients: updated }))
    setEditingIdx(null)
  }

  return (
    <>
      {preview._isPartial && (
        <div style={{
          padding: '10px 14px',
          borderRadius: '8px',
          background: '#FAEEDA',
          border: '1px solid #FAC775',
          color: '#633806',
          fontSize: '13px',
          marginBottom: '8px',
        }}>
          We found a partial recipe &mdash; please fill in the missing details before saving.
        </div>
      )}
      <PreviewCard>
        {preview.image_url && (
          <PreviewImage src={preview.image_url} alt={preview.name} />
        )}
        <PreviewHeader onClick={() => setExpanded((v) => !v)}>
          <PreviewName>{preview.name}</PreviewName>
          {preview.description && (
            <PreviewDesc>{preview.description}</PreviewDesc>
          )}
          <PreviewMetaRow>
            {timeLabel && <PreviewMetaItem>&#128336; {timeLabel}</PreviewMetaItem>}
            {preview.servings > 0 && (
              <PreviewMetaItem>&#128101; {preview.servings} serving{preview.servings !== 1 ? 's' : ''}</PreviewMetaItem>
            )}
          </PreviewMetaRow>
          <ExpandToggle as="span">
            {expanded ? 'Hide details' : 'See ingredients & instructions'}
            <ExpandChevron $expanded={expanded}>&#8964;</ExpandChevron>
          </ExpandToggle>
        </PreviewHeader>

        {expanded && (
          <ExpandedBody>
            {Array.isArray(preview.ingredients) && preview.ingredients.length > 0 && (
              <>
                <SectionLabel>Ingredients</SectionLabel>
                {preview.ingredients.map((ing, idx) => (
                  <IngredientRow key={idx}>
                    {editingIdx === idx ? (
                      <>
                        <IngredientEditRow>
                          <IngredientEditInput
                            $w="52px"
                            value={editDraft.amount}
                            onChange={(e) => setEditDraft((d) => ({ ...d, amount: e.target.value }))}
                            placeholder="amt"
                            autoFocus
                          />
                          <IngredientEditInput
                            $w="60px"
                            value={editDraft.unit}
                            onChange={(e) => setEditDraft((d) => ({ ...d, unit: e.target.value }))}
                            placeholder="unit"
                          />
                          <IngredientEditInput
                            $w="120px"
                            value={editDraft.name}
                            onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
                            placeholder="ingredient"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') confirmEdit()
                              if (e.key === 'Escape') cancelEdit()
                            }}
                          />
                        </IngredientEditRow>
                        <IngredientEditConfirm onClick={confirmEdit} title="Confirm">&#10003;</IngredientEditConfirm>
                        <IngredientEditCancel onClick={cancelEdit} title="Cancel">&#215;</IngredientEditCancel>
                      </>
                    ) : (
                      <>
                        <IngredientText>
                          {[ing.amount, ing.unit, ing.name].filter(Boolean).join(' ')}
                        </IngredientText>
                        <EditIngredientButton onClick={() => startEdit(idx)} title="Edit ingredient">
                          &#9998;
                        </EditIngredientButton>
                      </>
                    )}
                  </IngredientRow>
                ))}
              </>
            )}

            {Array.isArray(preview.instructions) && preview.instructions.length > 0 && (
              <>
                <SectionLabel>Instructions</SectionLabel>
                <ol style={{ margin: 0, paddingLeft: '20px' }}>
                  {preview.instructions.map((step, idx) => (
                    <InstructionItem key={idx}>{step}</InstructionItem>
                  ))}
                </ol>
              </>
            )}
          </ExpandedBody>
        )}
      </PreviewCard>

      {savedRecipeId ? (
        <SavedRow>
          <SavedLabel>
            {duplicate ? 'Already in your Recipe Box — assigned to slot!' : 'Added to slot!'}
          </SavedLabel>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <ViewRecipeLink href={`/recipes/${savedRecipeId}`} target="_blank" rel="noopener noreferrer">
              View recipe &#8594;
            </ViewRecipeLink>
            {onDone && (
              <PrimaryButton onClick={onDone} style={{ padding: '6px 14px', fontSize: '13px' }}>
                Done
              </PrimaryButton>
            )}
          </div>
        </SavedRow>
      ) : (
        <>
          <SaveButton onClick={onSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save & Add to this slot'}
          </SaveButton>
          <TryAgainButton onClick={onTryAgain}>
            {tryAgainLabel || 'Not quite right? Try again'}
          </TryAgainButton>
        </>
      )}
    </>
  )
}

// ─── Sub-screens ──────────────────────────────────────────────────────────────

function UrlImportScreen({ day, mealType, onAssigned, onClose, isBusy, setIsBusy, onDone }) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState(null)
  const [preview, setPreview] = useState(null)
  const [savedRecipeId, setSavedRecipeId] = useState(null)
  const [duplicate, setDuplicate] = useState(false)
  const [isPending, startTransition] = useTransition()
  const urlInputRef = useRef(null)

  const loading = isPending || isBusy

  function handleImport() {
    if (!url.trim() || loading) return
    setError(null)
    setPreview(null)
    setSavedRecipeId(null)
    startTransition(async () => {
      const result = await importRecipeFromUrlAction(url.trim())
      if (result.success) {
        setPreview(result.data)
      } else {
        setError(result.error)
      }
    })
  }

  function handleSave() {
    if (!preview || loading) return
    setIsBusy(true)
    startTransition(async () => {
      const createResult = await createRecipeAction(preview)
      if (!createResult.success) {
        setError(createResult.error)
        setIsBusy(false)
        return
      }
      const savedRecipe = createResult.data
      const assignResult = await assignRecipeToSlot(day, mealType, savedRecipe.id)
      setIsBusy(false)
      if (assignResult.success) {
        setSavedRecipeId(savedRecipe.id)
        setDuplicate(savedRecipe.alreadyExists === true)
        onAssigned?.({ recipeId: savedRecipe.id, recipeName: savedRecipe.name })
      } else {
        setError(assignResult.error)
      }
    })
  }

  function handleTryAgain() {
    setPreview(null)
    setSavedRecipeId(null)
    setError(null)
    setDuplicate(false)
    setTimeout(() => urlInputRef.current?.focus(), 0)
  }

  return (
    <InputBody>
      <InputLabel htmlFor="recipe-url">Paste a recipe URL</InputLabel>
      <UrlInput
        ref={urlInputRef}
        id="recipe-url"
        type="url"
        placeholder="https://..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleImport()}
        autoFocus
        disabled={loading}
      />
      <ActionRow>
        <PrimaryButton onClick={handleImport} disabled={loading || !url.trim()}>
          {isPending && !isBusy ? 'Importing...' : 'Import'}
        </PrimaryButton>
      </ActionRow>

      {error && <InlineError>{error}</InlineError>}

      {preview && (
        <ExpandablePreview
          preview={preview}
          setPreview={setPreview}
          onSave={handleSave}
          onTryAgain={handleTryAgain}
          loading={loading}
          savedRecipeId={savedRecipeId}
          tryAgainLabel="Not quite right? Try another URL"
          onDone={onDone}
          duplicate={duplicate}
        />
      )}
    </InputBody>
  )
}

function AiGenerateScreen({ day, mealType, onAssigned, onClose, isBusy, setIsBusy, onDone }) {
  const [aiStep, setAiStep] = useState('choose') // 'choose' | 'ideas' | 'custom'
  const [prompt, setPrompt] = useState('')
  const [ideas, setIdeas] = useState([])
  const [selectedIdeaIdx, setSelectedIdeaIdx] = useState(null)
  const [isLoadingIdeas, setIsLoadingIdeas] = useState(false)
  const [ideasError, setIdeasError] = useState(null)
  const [error, setError] = useState(null)
  const [preview, setPreview] = useState(null)
  const [savedRecipeId, setSavedRecipeId] = useState(null)
  const [duplicate, setDuplicate] = useState(false)
  const [isPending, startTransition] = useTransition()
  const promptRef = useRef(null)

  // Cooking preferences (custom screen)
  const [prefExpanded, setPrefExpanded] = useState(false)
  const [prefSkill, setPrefSkill] = useState(null)
  const [prefTime, setPrefTime] = useState(null)
  const [prefCuisines, setPrefCuisines] = useState([])
  const [prefServings, setPrefServings] = useState('')
  const [prefNotes, setPrefNotes] = useState('')

  function toggleCuisine(c) {
    setPrefCuisines(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])
  }

  function buildPromptWithPrefs(text) {
    const parts = []
    if (prefSkill) parts.push(`Skill level: ${prefSkill}`)
    if (prefTime) {
      const label = prefTime === 'quick' ? 'quick (<30 min)' : prefTime === 'medium' ? 'medium (30–60 min)' : 'elaborate (60+ min)'
      parts.push(`Time preference: ${label}`)
    }
    if (prefCuisines.length) parts.push(`Cuisine: ${prefCuisines.join(', ')}`)
    if (prefServings) parts.push(`Servings: ${prefServings}`)
    if (prefNotes.trim()) parts.push(`Notes: ${prefNotes.trim()}`)
    return parts.length ? `${text.trim()}\n\nPreferences: ${parts.join('. ')}` : text.trim()
  }

  const loading = isPending || isBusy

  function resetPreview() {
    setPreview(null)
    setSavedRecipeId(null)
    setError(null)
  }

  function goToChoose() {
    setAiStep('choose')
    resetPreview()
  }

  async function handlePantryScan() {
    setAiStep('ideas')
    setIdeas([])
    setIdeasError(null)
    setSelectedIdeaIdx(null)
    resetPreview()
    setIsLoadingIdeas(true)
    const result = await generateRecipeIdeasAction('general')
    setIsLoadingIdeas(false)
    if (result.success) {
      setIdeas(result.data)
    } else {
      setIdeasError(result.error)
    }
  }

  function handleGenerateFromIdea() {
    if (selectedIdeaIdx === null || loading) return
    const idea = ideas[selectedIdeaIdx]
    const ideaPrompt = idea.name + (idea.description ? ' — ' + idea.description : '')
    resetPreview()
    startTransition(async () => {
      const result = await generateRecipeAction(ideaPrompt, { includePantry: true })
      if (result.success) {
        setPreview(result.data)
      } else {
        setError(result.error)
      }
    })
  }

  function handleGenerateCustom() {
    if (!prompt.trim() || loading) return
    resetPreview()
    startTransition(async () => {
      const result = await generateRecipeAction(buildPromptWithPrefs(prompt), { includePantry: true })
      if (result.success) {
        setPreview(result.data)
      } else {
        setError(result.error)
      }
    })
  }

  function handleSave() {
    if (!preview || loading) return
    setIsBusy(true)
    startTransition(async () => {
      const createResult = await createRecipeAction(preview)
      if (!createResult.success) {
        setError(createResult.error)
        setIsBusy(false)
        return
      }
      const savedRecipe = createResult.data
      const assignResult = await assignRecipeToSlot(day, mealType, savedRecipe.id)
      setIsBusy(false)
      if (assignResult.success) {
        setSavedRecipeId(savedRecipe.id)
        setDuplicate(savedRecipe.alreadyExists === true)
        onAssigned?.({ recipeId: savedRecipe.id, recipeName: savedRecipe.name })
      } else {
        setError(assignResult.error)
      }
    })
  }

  function handleTryAgain() {
    resetPreview()
    setDuplicate(false)
    if (aiStep === 'custom') setTimeout(() => promptRef.current?.focus(), 0)
  }

  // ── choose screen ─────────────────────────────────────────────────────────
  if (aiStep === 'choose') {
    return (
      <InputBody>
        <AiModeGrid>
          <AiModeCard type="button" onClick={handlePantryScan}>
            <AiModeIcon>&#x1F957;</AiModeIcon>
            <AiModeTitle>Use pantry scan</AiModeTitle>
            <AiModeMeta>Get ideas based on what&apos;s in your kitchen</AiModeMeta>
          </AiModeCard>
          <AiModeCard type="button" onClick={() => setAiStep('custom')}>
            <AiModeIcon>&#x270F;&#xFE0F;</AiModeIcon>
            <AiModeTitle>Describe your own idea</AiModeTitle>
            <AiModeMeta>Tell Koda what you want to cook</AiModeMeta>
          </AiModeCard>
        </AiModeGrid>
      </InputBody>
    )
  }

  // ── ideas screen ──────────────────────────────────────────────────────────
  if (aiStep === 'ideas') {
    return (
      <InputBody>
        <AiBackLink type="button" onClick={goToChoose}>&#8592; Back</AiBackLink>
        {isLoadingIdeas && (
          <AiLoadingMsg>Finding recipe ideas from your pantry&hellip;</AiLoadingMsg>
        )}
        {ideasError && <InlineError>{ideasError}</InlineError>}
        {!isLoadingIdeas && ideas.length > 0 && !preview && (
          <>
            <AiIdeasGrid>
              {ideas.map((idea, idx) => (
                <AiIdeaCard
                  key={idx}
                  type="button"
                  $selected={selectedIdeaIdx === idx}
                  onClick={() => setSelectedIdeaIdx(idx)}
                  disabled={loading}
                >
                  <AiIdeaName>{idea.name}</AiIdeaName>
                  {idea.description && <AiIdeaDesc>{idea.description}</AiIdeaDesc>}
                  {Array.isArray(idea.keyIngredients) && idea.keyIngredients.length > 0 && (
                    <AiIdeaIngredients>
                      {idea.keyIngredients.map((ing, i) => (
                        <AiIdeaTag key={i}>{ing}</AiIdeaTag>
                      ))}
                    </AiIdeaIngredients>
                  )}
                </AiIdeaCard>
              ))}
            </AiIdeasGrid>
            <ActionRow>
              <PrimaryButton
                $purple
                onClick={handleGenerateFromIdea}
                disabled={loading || selectedIdeaIdx === null}
              >
                {isPending ? 'Generating\u2026' : 'Generate this recipe'}
              </PrimaryButton>
            </ActionRow>
          </>
        )}
        {error && <InlineError>{error}</InlineError>}
        {preview && (
          <ExpandablePreview
            preview={preview}
            setPreview={setPreview}
            onSave={handleSave}
            onTryAgain={handleTryAgain}
            loading={loading}
            savedRecipeId={savedRecipeId}
            tryAgainLabel="Not quite right? Generate another"
            onDone={onDone}
            duplicate={duplicate}
          />
        )}
      </InputBody>
    )
  }

  // ── custom screen ─────────────────────────────────────────────────────────
  return (
    <InputBody>
      <AiBackLink type="button" onClick={goToChoose}>&#8592; Back</AiBackLink>
      <AiPromptHint>Describe what you want &mdash; ingredients, cuisine, dietary needs, servings, etc.</AiPromptHint>
      <PromptTextarea
        ref={promptRef}
        id="ai-custom-prompt"
        placeholder="e.g. A quick weeknight dinner using chicken, rice, and broccoli for 4 people"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        autoFocus
        disabled={loading}
      />

      <AiPrefsAccordion>
        <AiPrefsHeader type="button" onClick={() => setPrefExpanded(p => !p)}>
          <span>Cooking preferences</span>
          <AiPrefsChevron $open={prefExpanded}>&#9662;</AiPrefsChevron>
        </AiPrefsHeader>
        {prefExpanded && (
          <AiPrefsBody>
            <div>
              <AiPrefsLabel>Skill level</AiPrefsLabel>
              <AiPrefsChipRow>
                {['beginner', 'intermediate', 'advanced'].map(val => (
                  <AiPrefChip
                    key={val}
                    type="button"
                    $active={prefSkill === val}
                    onClick={() => setPrefSkill(prefSkill === val ? null : val)}
                  >
                    {val.charAt(0).toUpperCase() + val.slice(1)}
                  </AiPrefChip>
                ))}
              </AiPrefsChipRow>
            </div>
            <div>
              <AiPrefsLabel>Time preference</AiPrefsLabel>
              <AiPrefsChipRow>
                {[
                  { value: 'quick', label: 'Quick (<30m)' },
                  { value: 'medium', label: 'Medium (30-60m)' },
                  { value: 'elaborate', label: 'Elaborate (60m+)' },
                ].map(opt => (
                  <AiPrefChip
                    key={opt.value}
                    type="button"
                    $active={prefTime === opt.value}
                    onClick={() => setPrefTime(prefTime === opt.value ? null : opt.value)}
                  >
                    {opt.label}
                  </AiPrefChip>
                ))}
              </AiPrefsChipRow>
            </div>
            <div>
              <AiPrefsLabel>Cuisines</AiPrefsLabel>
              <AiPrefsChipRow>
                {CUISINE_OPTIONS.map(cuisine => (
                  <AiPrefChip
                    key={cuisine}
                    type="button"
                    $active={prefCuisines.includes(cuisine.toLowerCase())}
                    onClick={() => toggleCuisine(cuisine.toLowerCase())}
                  >
                    {cuisine}
                  </AiPrefChip>
                ))}
              </AiPrefsChipRow>
            </div>
            <div>
              <AiPrefsLabel>Servings</AiPrefsLabel>
              <AiPrefsServingInput
                type="number"
                min="1"
                max="20"
                value={prefServings}
                onChange={e => setPrefServings(e.target.value)}
                placeholder="4"
              />
            </div>
            <div>
              <AiPrefsLabel>Additional notes</AiPrefsLabel>
              <AiPrefsNotesTextarea
                value={prefNotes}
                onChange={e => setPrefNotes(e.target.value)}
                placeholder="e.g. No spicy food, kid-friendly, low sodium..."
                maxLength={300}
              />
            </div>
          </AiPrefsBody>
        )}
      </AiPrefsAccordion>

      <ActionRow>
        <PrimaryButton $purple onClick={handleGenerateCustom} disabled={loading || !prompt.trim()}>
          {isPending && !isBusy ? 'Generating\u2026' : 'Generate'}
        </PrimaryButton>
      </ActionRow>
      {error && <InlineError>{error}</InlineError>}
      {preview && (
        <ExpandablePreview
          preview={preview}
          setPreview={setPreview}
          onSave={handleSave}
          onTryAgain={handleTryAgain}
          loading={loading}
          savedRecipeId={savedRecipeId}
          tryAgainLabel="Not quite right? Generate another"
          onDone={onDone}
        />
      )}
    </InputBody>
  )
}

function WebSearchScreen({ day, mealType, onAssigned, isBusy, setIsBusy, onDone }) {
  const [step, setStep] = useState('input') // 'input' | 'results' | 'detail'
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selectedResult, setSelectedResult] = useState(null)
  const [error, setError] = useState(null)
  const [savedRecipeId, setSavedRecipeId] = useState(null)
  const [duplicate, setDuplicate] = useState(false)
  const [isSearching, startSearchTransition] = useTransition()
  const [, startSaveTransition] = useTransition()

  const loading = isSearching || isBusy

  function handleSearch() {
    const q = query.trim()
    if (!q || loading) return
    setError(null)
    startSearchTransition(async () => {
      const result = await searchWebRecipesAction(q)
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        setResults(result.data)
        setStep('results')
      } else {
        setError(result.error || 'No qualifying recipes found. Try a different search.')
      }
    })
  }

  function handleSelectResult(recipe) {
    setSelectedResult(recipe)
    setSavedRecipeId(null)
    setDuplicate(false)
    setError(null)
    setStep('detail')
  }

  function handleSave() {
    if (!selectedResult || loading) return
    setIsBusy(true)
    startSaveTransition(async () => {
      const recipeData = {
        name: selectedResult.name,
        description: selectedResult.description || '',
        ingredients: Array.isArray(selectedResult.ingredients) ? selectedResult.ingredients : [],
        instructions: selectedResult.instructions || '',
        prep_time_minutes: selectedResult.prep_time_minutes ?? null,
        cook_time_minutes: selectedResult.cook_time_minutes ?? null,
        servings: selectedResult.servings ?? null,
        source: selectedResult.source_url || '',
        image_url: selectedResult.image_url || undefined,
        tags: [],
      }
      const createResult = await createRecipeAction(recipeData)
      if (!createResult.success) {
        setError(createResult.error)
        setIsBusy(false)
        return
      }
      const savedRecipe = createResult.data
      const assignResult = await assignRecipeToSlot(day, mealType, savedRecipe.id)
      setIsBusy(false)
      if (assignResult.success) {
        setSavedRecipeId(savedRecipe.id)
        setDuplicate(savedRecipe.alreadyExists === true)
        onAssigned?.({ recipeId: savedRecipe.id, recipeName: savedRecipe.name })
      } else {
        setError(assignResult.error || 'Could not assign recipe to slot.')
      }
    })
  }

  function renderStars(rating) {
    if (!rating) return ''
    const r = Math.min(5, Math.max(0, rating))
    const full = Math.floor(r)
    const hasHalf = r - full >= 0.3
    const empty = Math.max(0, 5 - full - (hasHalf ? 1 : 0))
    return '\u2605'.repeat(full) + (hasHalf ? '\u00bd' : '') + '\u2606'.repeat(empty)
  }

  function formatMinutes(mins) {
    if (!mins) return null
    if (mins < 60) return `${mins} min`
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return m ? `${h}h ${m}m` : `${h}h`
  }

  function formatReviews(n) {
    if (!n) return ''
    return n >= 1000 ? `${(n / 1000).toFixed(1)}k reviews` : `${n} reviews`
  }

  // ── Input step ──────────────────────────────────────────────────────────────
  if (step === 'input') {
    return (
      <InputBody>
        <SearchHintText>
          Koda searches the web for top-rated recipes — only returns results with 4.5+ stars and 100+ reviews.
        </SearchHintText>
        <InputLabel htmlFor="web-recipe-search">What are you in the mood for?</InputLabel>
        <UrlInput
          id="web-recipe-search"
          type="text"
          placeholder="e.g. easy chicken dinner, vegetarian pasta..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          autoFocus
          disabled={isSearching}
        />
        {isSearching
          ? <SearchLoadingMsg>Searching the web for top-rated recipes&hellip;</SearchLoadingMsg>
          : (
            <ActionRow>
              <PrimaryButton onClick={handleSearch} disabled={!query.trim()}>
                Search
              </PrimaryButton>
            </ActionRow>
          )
        }
        {error && <InlineError>{error}</InlineError>}
      </InputBody>
    )
  }

  // ── Results step ────────────────────────────────────────────────────────────
  if (step === 'results') {
    return (
      <InputBody>
        <AiBackLink type="button" onClick={() => { setStep('input'); setError(null) }}>
          &#8592; New search
        </AiBackLink>
        <SearchResultsHeader>Top results for &ldquo;{query}&rdquo;</SearchResultsHeader>
        <SearchResultsList>
          {results.map((recipe, i) => {
            const cookTime = formatMinutes(recipe.cook_time_minutes)
            return (
              <SearchResultCard key={i} type="button" onClick={() => handleSelectResult(recipe)}>
                <ResultThumb>
                  {recipe.image_url
                    ? <img src={recipe.image_url} alt={recipe.name} onError={(e) => { e.currentTarget.style.display = 'none' }} />
                    : '\uD83C\uDF7D'}
                </ResultThumb>
                <ResultBody>
                  <ResultName>{recipe.name}</ResultName>
                  <ResultRatingRow>
                    {recipe.rating && (
                      <ResultStars>{renderStars(recipe.rating)} {recipe.rating.toFixed(1)}</ResultStars>
                    )}
                    {recipe.review_count > 0 && (
                      <ResultReviews>{formatReviews(recipe.review_count)}</ResultReviews>
                    )}
                    {cookTime && <ResultCookTime>{cookTime}</ResultCookTime>}
                  </ResultRatingRow>
                  {recipe.description && <ResultDesc>{recipe.description}</ResultDesc>}
                  <ResultViewHint>Tap to see full recipe \u2192</ResultViewHint>
                </ResultBody>
              </SearchResultCard>
            )
          })}
        </SearchResultsList>
      </InputBody>
    )
  }

  // ── Detail step ─────────────────────────────────────────────────────────────
  const r = selectedResult
  const totalTime = (r.prep_time_minutes || 0) + (r.cook_time_minutes || 0)

  return (
    <InputBody>
      <AiBackLink type="button" onClick={() => { setStep('results'); setError(null) }}>
        &#8592; Back to results
      </AiBackLink>

      <div>
        <DetailRecipeName>{r.name}</DetailRecipeName>
        {(r.rating || r.review_count) && (
          <ResultRatingRow style={{ marginBottom: 8 }}>
            {r.rating && <ResultStars>{renderStars(r.rating)} {r.rating.toFixed(1)}</ResultStars>}
            {r.review_count > 0 && <ResultReviews>{formatReviews(r.review_count)}</ResultReviews>}
          </ResultRatingRow>
        )}
        <DetailMetaRow>
          {r.prep_time_minutes ? <DetailMetaChip>Prep: {formatMinutes(r.prep_time_minutes)}</DetailMetaChip> : null}
          {r.cook_time_minutes ? <DetailMetaChip>Cook: {formatMinutes(r.cook_time_minutes)}</DetailMetaChip> : null}
          {totalTime > 0 ? <DetailMetaChip>Total: {formatMinutes(totalTime)}</DetailMetaChip> : null}
          {r.servings ? <DetailMetaChip>{r.servings} servings</DetailMetaChip> : null}
        </DetailMetaRow>
        {r.source_url && (
          <SourceLink href={r.source_url} target="_blank" rel="noopener noreferrer">
            View original recipe &#8599;
          </SourceLink>
        )}
      </div>

      {Array.isArray(r.ingredients) && r.ingredients.length > 0 && (
        <div>
          <SectionLabel>Ingredients</SectionLabel>
          {r.ingredients.map((ing, idx) => (
            <IngredientRow key={idx}>
              <IngredientText>
                {[ing.quantity, ing.name].filter(Boolean).join(' ')}
              </IngredientText>
            </IngredientRow>
          ))}
        </div>
      )}

      {r.instructions && (
        <div>
          <SectionLabel>Instructions</SectionLabel>
          <div style={{ fontSize: '13px', lineHeight: '1.6', whiteSpace: 'pre-wrap', color: 'inherit' }}>
            {r.instructions}
          </div>
        </div>
      )}

      {error && <InlineError>{error}</InlineError>}

      {savedRecipeId ? (
        <SavedRow>
          <SavedLabel>
            {duplicate ? 'Already in your Recipe Box \u2014 assigned to slot!' : 'Added to your Recipe Box & meal plan!'}
          </SavedLabel>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <ViewRecipeLink href={`/recipes/${savedRecipeId}`} target="_blank" rel="noopener noreferrer">
              View recipe &#8594;
            </ViewRecipeLink>
            {onDone && (
              <PrimaryButton onClick={onDone} style={{ padding: '6px 14px', fontSize: '13px' }}>
                Done
              </PrimaryButton>
            )}
          </div>
        </SavedRow>
      ) : (
        <AddToMealButton onClick={handleSave} disabled={loading}>
          {loading ? 'Saving\u2026' : 'Add to meal planner'}
        </AddToMealButton>
      )}
    </InputBody>
  )
}

function SideScreen({ day, sideType, mainMealName, onAssigned, onClose }) {
  const [sideName, setSideName] = useState('')
  const [error, setError] = useState(null)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    const name = sideName.trim()
    if (!name || isPending) return
    setError(null)
    startTransition(async () => {
      const result = await swapMeal(day, sideType, name)
      if (result.success) {
        // Pass sideType and any full meals data back so the parent can update
        // the correct slot (not the main meal slot).
        onAssigned?.({
          recipeId: null,
          recipeName: name,
          sideType,
          meals: result.data?.meals ?? null,
        })
        onClose()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <InputBody>
      <MealAddedRow>&#10003; {mainMealName} added</MealAddedRow>
      <InputLabel htmlFor="side-name">
        Add a side dish&nbsp;<span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span>
      </InputLabel>
      <UrlInput
        id="side-name"
        type="text"
        placeholder="e.g. Fruit salad, toast, yogurt..."
        value={sideName}
        onChange={(e) => setSideName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        autoFocus
        disabled={isPending}
      />
      <SideActionRow>
        <SkipButton onClick={onClose} disabled={isPending}>Skip</SkipButton>
        <PrimaryButton onClick={handleSave} disabled={isPending || !sideName.trim()}>
          {isPending ? 'Saving...' : 'Add side'}
        </PrimaryButton>
      </SideActionRow>
      {error && <InlineError>{error}</InlineError>}
    </InputBody>
  )
}

function ManualAddScreen({ day, mealType, onAssigned, onClose }) {
  const [mealName, setMealName] = useState('')
  const [error, setError] = useState(null)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    const name = mealName.trim()
    if (!name || isPending) return
    setError(null)
    startTransition(async () => {
      const result = await swapMeal(day, mealType, name)
      if (result.success) {
        onAssigned?.({ recipeId: null, recipeName: name })
        onClose()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <InputBody>
      <InputLabel htmlFor="manual-meal-name">Meal name</InputLabel>
      <UrlInput
        id="manual-meal-name"
        type="text"
        placeholder="e.g. Mum's lasagna"
        value={mealName}
        onChange={(e) => setMealName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        autoFocus
        disabled={isPending}
      />
      <ActionRow>
        <PrimaryButton onClick={handleSave} disabled={isPending || !mealName.trim()}>
          {isPending ? 'Saving...' : 'Save'}
        </PrimaryButton>
      </ActionRow>
      {error && <InlineError>{error}</InlineError>}
    </InputBody>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RecipePickerModal({
  isOpen,
  onClose,
  day,
  mealType,
  currentRecipeId,
  recipes = [],
  onAssigned,
  initialMode,
  sideType: propSideType,
  collections = [],
  collectionLinks = [],
}) {
  const [mode, setMode] = useState('options')
  const [query, setQuery] = useState('')
  const [pickerCollection, setPickerCollection] = useState(null)

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode || 'options')
      savedMealNameRef.current = null
    }
  }, [isOpen, initialMode])
  const [showCustom, setShowCustom] = useState(false)
  const [customName, setCustomName] = useState('')
  const [assigningId, setAssigningId] = useState(null)
  const [saveBusy, setSaveBusy] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Surprise Me state
  const [surpriseResult, setSurpriseResult] = useState(null)
  const [isSurprising, startSurpriseTransition] = useTransition()

  // Determine the side dish slot type for the optional side prompt.
  // Explicit prop takes precedence (e.g. dinner's next empty sides slot);
  // otherwise derive from meal type for breakfast / lunch.
  const sideType = propSideType !== undefined ? propSideType : (
    mealType === 'breakfast' ? 'breakfast_side'
    : mealType === 'lunch' ? 'lunch_side'
    : null
  )
  const savedMealNameRef = useRef(null)

  // After saving any meal for breakfast/lunch, advance to side prompt instead of closing
  const advanceToSideOrClose = useCallback(() => {
    if (sideType && savedMealNameRef.current) {
      setMode('side')
    } else {
      onClose()
    }
  }, [sideType, onClose])

  // Intercept onAssigned from sub-screens so we can capture the meal name
  const handleSubScreenAssigned = useCallback((info) => {
    if (info?.recipeName) savedMealNameRef.current = info.recipeName
    onAssigned?.(info)
  }, [onAssigned])

  const pickerColIds = useMemo(() => {
    if (!pickerCollection) return null
    const ids = new Set()
    for (const l of collectionLinks) {
      if (l.collection_id === pickerCollection) ids.add(String(l.recipe_id))
    }
    return ids
  }, [pickerCollection, collectionLinks])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let base = recipes
    if (pickerColIds) {
      base = base.filter(r => pickerColIds.has(String(r.id)))
    }
    if (!q) return base
    return base.filter(r => {
      const nameMatch = r.name.toLowerCase().includes(q)
      const tagMatch = Array.isArray(r.tags) && r.tags.some(t => t.toLowerCase().includes(q))
      return nameMatch || tagMatch
    })
  }, [query, recipes, pickerColIds])

  function handleAssign(recipeId) {
    setAssigningId(recipeId)
    startTransition(async () => {
      const result = await assignRecipeToSlot(day, mealType, recipeId)
      setAssigningId(null)
      if (result.success) {
        const recipeName = result.data?.recipeName
        if (recipeName) savedMealNameRef.current = recipeName
        onAssigned?.({ recipeId, recipeName, meals: result.data?.meals })
        advanceToSideOrClose()
      } else {
        alert('Assign failed: ' + result.error + '\nday=' + day + ' mealType=' + mealType + ' recipeId=' + recipeId)
        onAssigned?.({ error: result.error })
      }
    })
  }

  function handleUnassign() {
    setAssigningId('unassign')
    startTransition(async () => {
      const result = await assignRecipeToSlot(day, mealType, null)
      setAssigningId(null)
      if (result.success) {
        onAssigned?.({ recipeId: null, recipeName: null })
        onClose()
      } else {
        onAssigned?.({ error: result.error })
      }
    })
  }

  function handleCustomSubmit(e) {
    e.preventDefault()
    const name = customName.trim()
    if (!name) return
    setAssigningId('custom')
    startTransition(async () => {
      const result = await swapMeal(day, mealType, name)
      setAssigningId(null)
      if (result.success) {
        savedMealNameRef.current = name
        onAssigned?.({ recipeName: name, recipeId: null })
        advanceToSideOrClose()
      } else {
        onAssigned?.({ error: result.error })
      }
    })
  }

  function goBack() {
    setMode('options')
    setQuery('')
    setShowCustom(false)
    setCustomName('')
    setSurpriseResult(null)
  }

  function handleSurpriseMe() {
    startSurpriseTransition(async () => {
      setSurpriseResult(null)
      const result = await surpriseMeAction(mealType || null)
      if (result.success && result.data?.recipe) {
        setSurpriseResult(result.data.recipe)
      }
    })
  }

  function handleSurpriseAccept() {
    if (!surpriseResult) return
    startTransition(async () => {
      const result = await swapMeal(day, mealType, surpriseResult.name)
      if (result.success) {
        savedMealNameRef.current = surpriseResult.name
        onAssigned({ recipeName: surpriseResult.name, meals: result.data?.meals })
        setSurpriseResult(null)
        advanceToSideOrClose()
      }
    })
  }

  function handleClose() {
    if (isPending || saveBusy || isSurprising) return
    setSurpriseResult(null)
    onClose()
  }

  if (!isOpen) return null

  const isBusy = isPending || saveBusy || isSurprising

  // ── Title per mode ──────────────────────────────────────────────────────────
  const titles = {
    options: 'Add a meal',
    library: 'Choose from my Recipe Box',
    url: 'Look up a URL',
    ai: 'Koda create a recipe',
    manual: 'Add a meal',
    side: 'Add a side dish',
    'web-search': 'Search for a recipe',
    surprise: 'Surprise Me!',
  }

  return (
    <Overlay onClick={(e) => e.target === e.currentTarget && !isBusy && handleClose()}>
      <Modal>
        <ModalHeader>
          <HeaderLeft>
            {mode !== 'options' && mode !== 'side' && (
              <BackButton onClick={goBack} disabled={isBusy} aria-label="Back">
                &#8592;
              </BackButton>
            )}
            <HeaderText>
              <ModalTitle>{titles[mode]}</ModalTitle>
              <ModalSubtitle>{day} &mdash; {mealType}</ModalSubtitle>
            </HeaderText>
          </HeaderLeft>
          <CloseButton onClick={handleClose} disabled={isBusy}>{'\u2715'}</CloseButton>
        </ModalHeader>

        {/* ── Options screen ─────────────────────────────────────────────── */}
        {mode === 'options' && (
          <OptionsBody>
            <OptionCard onClick={() => setMode('library')}>
              <OptionIconWrap $bg="#E6F7F2">{'📖'}</OptionIconWrap>
              <OptionText>
                <OptionTitle>Choose from my Recipe Box</OptionTitle>
                <OptionDesc>Browse and search recipes you've saved</OptionDesc>
              </OptionText>
              <OptionChevron>›</OptionChevron>
            </OptionCard>

            <OptionCard onClick={() => setMode('web-search')}>
              <OptionIconWrap $bg="#FFF8E6">{'🔍'}</OptionIconWrap>
              <OptionText>
                <OptionTitle>Search for a recipe</OptionTitle>
                <OptionDesc>Koda finds top-rated recipes from the web</OptionDesc>
              </OptionText>
              <OptionChevron>›</OptionChevron>
            </OptionCard>

            <OptionCard onClick={() => setMode('url')}>
              <OptionIconWrap $bg="#EEF2FF">{'🔗'}</OptionIconWrap>
              <OptionText>
                <OptionTitle>Look up a URL</OptionTitle>
                <OptionDesc>Paste a link and Koda will extract the recipe</OptionDesc>
              </OptionText>
              <OptionChevron>›</OptionChevron>
            </OptionCard>

            <OptionCard onClick={() => setMode('ai')}>
              <OptionIconWrap $bg="#F3F0FF">{'✨'}</OptionIconWrap>
              <OptionText>
                <OptionTitle>Koda create a recipe</OptionTitle>
                <OptionDesc>Describe what you want and Koda will generate it</OptionDesc>
              </OptionText>
              <OptionChevron>›</OptionChevron>
            </OptionCard>

            <OptionCard onClick={() => setMode('manual')}>
              <OptionIconWrap $bg="#FFF7ED">{'✏️'}</OptionIconWrap>
              <OptionText>
                <OptionTitle>Manually add</OptionTitle>
                <OptionDesc>Type in a meal name yourself</OptionDesc>
              </OptionText>
              <OptionChevron>›</OptionChevron>
            </OptionCard>

            <OptionCard onClick={() => { setSurpriseResult(null); setMode('surprise'); handleSurpriseMe() }} style={{ borderColor: '#F0997B', background: '#FFF7F5' }}>
              <OptionIconWrap $bg="#FFF0EB">{'\uD83C\uDF89'}</OptionIconWrap>
              <OptionText>
                <OptionTitle style={{ color: '#D85A30' }}>Surprise Me!</OptionTitle>
                <OptionDesc>Find a viral TikTok recipe that matches your taste</OptionDesc>
              </OptionText>
              <OptionChevron>›</OptionChevron>
            </OptionCard>
          </OptionsBody>
        )}

        {/* ── Surprise screen ───────────────────────────────────────────── */}
        {mode === 'surprise' && (
          <OptionsBody>
            {isSurprising ? (
              <SurpriseLoadingWrap>
                <SurpriseLoadingDot />
                <SurpriseLoadingText>Finding a trending recipe...</SurpriseLoadingText>
              </SurpriseLoadingWrap>
            ) : surpriseResult ? (
              <>
                <SurpriseCardWrap>
                  <SurpriseCardName>{surpriseResult.name}</SurpriseCardName>
                  <SurpriseCardTrending>{surpriseResult.trending_reason}</SurpriseCardTrending>
                  {surpriseResult.description && <SurpriseCardDesc>{surpriseResult.description}</SurpriseCardDesc>}
                  <SurpriseCardMeta>
                    {surpriseResult.cook_time_minutes && <span>{(surpriseResult.prep_time_minutes || 0) + surpriseResult.cook_time_minutes} min</span>}
                    {surpriseResult.servings && <span>{surpriseResult.servings} servings</span>}
                    {surpriseResult.rating && <span>{'\u2605'} {surpriseResult.rating}</span>}
                  </SurpriseCardMeta>
                  {surpriseResult.source_url && (
                    <SurpriseCardLink href={surpriseResult.source_url} target="_blank" rel="noopener noreferrer">
                      View original source
                    </SurpriseCardLink>
                  )}
                </SurpriseCardWrap>
                <SurpriseCardActions>
                  <SurpriseCardAccept onClick={handleSurpriseAccept} disabled={isPending}>
                    {isPending ? 'Adding\u2026' : 'Add to meal plan'}
                  </SurpriseCardAccept>
                  <SurpriseCardAgain onClick={handleSurpriseMe} disabled={isSurprising}>
                    Surprise me again
                  </SurpriseCardAgain>
                </SurpriseCardActions>
              </>
            ) : (
              <SurpriseLoadingWrap>
                <SurpriseLoadingText>Could not find a recipe. Try again?</SurpriseLoadingText>
                <SurpriseCardAgain onClick={handleSurpriseMe} disabled={isSurprising}>
                  Try again
                </SurpriseCardAgain>
              </SurpriseLoadingWrap>
            )}
          </OptionsBody>
        )}

        {/* ── Library screen ─────────────────────────────────────────────── */}
        {mode === 'library' && (
          <>
            {collections.length > 0 && (
              <PickerChipRow>
                <PickerChip
                  type="button"
                  $active={pickerCollection === null}
                  onClick={() => setPickerCollection(null)}
                >
                  All
                </PickerChip>
                {collections.map(col => (
                  <PickerChip
                    key={col.id}
                    type="button"
                    $active={pickerCollection === col.id}
                    onClick={() => setPickerCollection(pickerCollection === col.id ? null : col.id)}
                  >
                    {col.emoji && <span>{col.emoji}</span>}
                    {col.name}
                  </PickerChip>
                ))}
              </PickerChipRow>
            )}
            <ControlsBar>
              <SearchInput
                type="text"
                placeholder="Search recipes by name or tag..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
              {currentRecipeId && (
                <UnassignButton onClick={handleUnassign} disabled={isBusy}>
                  Remove recipe link from this slot
                </UnassignButton>
              )}
            </ControlsBar>

            <RecipeList>
              {filtered.length === 0 ? (
                <EmptyState>No recipes match your search.</EmptyState>
              ) : (
                filtered.map((recipe) => {
                  const isCurrent = recipe.id === currentRecipeId
                  const isAssigning = assigningId === recipe.id
                  const timeLabel = formatTime(recipe.prep_time_minutes, recipe.cook_time_minutes)

                  return (
                    <RecipeCard key={recipe.id} $isCurrent={isCurrent}>
                      <RecipeThumbnail>
                        {recipe.image_url ? (
                          <img src={recipe.image_url} alt={recipe.name} />
                        ) : (
                          <ThumbnailPlaceholder>{'🍽'}</ThumbnailPlaceholder>
                        )}
                      </RecipeThumbnail>

                      <RecipeInfo>
                        <RecipeName>{recipe.name}</RecipeName>
                        <RecipeMeta>
                          {timeLabel && <RecipeTime>{timeLabel}</RecipeTime>}
                          {Array.isArray(recipe.tags) && recipe.tags.length > 0 && (
                            <TagList>
                              {recipe.tags.slice(0, 3).map((t) => (
                                <Tag key={t}>{t}</Tag>
                              ))}
                            </TagList>
                          )}
                        </RecipeMeta>
                      </RecipeInfo>

                      {isCurrent && <CurrentBadge>Current</CurrentBadge>}

                      <AssignButton
                        $isCurrent={isCurrent}
                        onClick={() => !isBusy && handleAssign(recipe.id)}
                        disabled={isBusy}
                      >
                        {isAssigning ? '...' : isCurrent ? 'Re-assign' : 'Assign'}
                      </AssignButton>
                    </RecipeCard>
                  )
                })
              )}
            </RecipeList>

            <ModalFooter>
              {!showCustom ? (
                <CustomNameToggle onClick={() => setShowCustom(true)}>
                  Use a custom meal name instead
                </CustomNameToggle>
              ) : (
                <CustomNameForm as="form" onSubmit={handleCustomSubmit}>
                  <CustomNameInput
                    type="text"
                    placeholder="e.g. Mum's lasagna"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    autoFocus
                  />
                  <CustomNameSubmit type="submit" disabled={isBusy || !customName.trim()}>
                    {assigningId === 'custom' ? '...' : 'Save'}
                  </CustomNameSubmit>
                </CustomNameForm>
              )}
            </ModalFooter>
          </>
        )}

        {/* ── URL import screen ──────────────────────────────────────────── */}
        {mode === 'url' && (
          <UrlImportScreen
            day={day}
            mealType={mealType}
            onAssigned={handleSubScreenAssigned}
            onClose={onClose}
            isBusy={saveBusy}
            setIsBusy={setSaveBusy}
            onDone={advanceToSideOrClose}
          />
        )}

        {/* ── AI generate screen ─────────────────────────────────────────── */}
        {mode === 'ai' && (
          <AiGenerateScreen
            day={day}
            mealType={mealType}
            onAssigned={handleSubScreenAssigned}
            onClose={onClose}
            isBusy={saveBusy}
            setIsBusy={setSaveBusy}
            onDone={advanceToSideOrClose}
          />
        )}

        {/* ── Web search screen ──────────────────────────────────────────── */}
        {mode === 'web-search' && (
          <WebSearchScreen
            day={day}
            mealType={mealType}
            onAssigned={handleSubScreenAssigned}
            onClose={onClose}
            isBusy={saveBusy}
            setIsBusy={setSaveBusy}
            onDone={advanceToSideOrClose}
          />
        )}

        {/* ── Manual add screen ──────────────────────────────────────────── */}
        {mode === 'manual' && (
          <ManualAddScreen
            day={day}
            mealType={mealType}
            onAssigned={handleSubScreenAssigned}
            onClose={advanceToSideOrClose}
          />
        )}

        {/* ── Side dish prompt (breakfast & lunch only) ──────────────────── */}
        {mode === 'side' && sideType && (
          <SideScreen
            day={day}
            sideType={sideType}
            mainMealName={savedMealNameRef.current}
            onAssigned={onAssigned}
            onClose={onClose}
          />
        )}
      </Modal>
    </Overlay>
  )
}
