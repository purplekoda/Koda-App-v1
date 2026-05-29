'use client'

import { useState, useTransition, useRef, useCallback, useEffect } from 'react'
import styled, { keyframes } from 'styled-components'
import {
  setBudgetAction,
  addReceiptAction,
  updateReceiptAction,
  deleteReceiptAction,
  getReceiptItemsAction,
  getReceiptUploadUrlAction,
} from './actions'
import { parseReceiptAction } from '@/lib/actions/ai'
import AddToPantrySheet from '@/components/budget/AddToPantrySheet'

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

const Page = styled.div`
  max-width: 720px;
`

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

// ─── Budget setup card ────────────────────────────────────────────────────────

const SetupCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.xl};
  padding: ${({ theme }) => theme.spacing.xxl};
  text-align: center;
  animation: ${slideUp} 0.25s ease;
`

const SetupTitle = styled.h2`
  font-size: 20px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const SetupSubtitle = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const InputGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0;
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  overflow: hidden;
  max-width: 220px;
  margin: 0 auto ${({ theme }) => theme.spacing.lg};

  &:focus-within {
    border-color: ${({ theme }) => theme.colors.blue};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.blueLight};
  }
`

const DollarSign = styled.span`
  padding: 10px 12px;
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textSecondary};
  background: ${({ theme }) => theme.colors.borderLight};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
`

const BudgetInput = styled.input`
  flex: 1;
  padding: 10px 12px;
  font-size: 16px;
  font-weight: 500;
  border: none;
  outline: none;
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.surface};
  width: 120px;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
    font-weight: 400;
  }
`

const PresetRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  justify-content: center;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const PresetButton = styled.button`
  padding: 6px 14px;
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1.5px solid ${({ $active, theme }) => $active ? theme.colors.blue : theme.colors.border};
  background: ${({ $active, theme }) => $active ? theme.colors.blueLight : theme.colors.surface};
  color: ${({ $active, theme }) => $active ? theme.colors.blue : theme.colors.textSecondary};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.blue};
    color: ${({ theme }) => theme.colors.blue};
  }
`

const PRESETS = [75, 100, 125, 150, 200, 250]
const MONTHLY_PRESETS = [300, 400, 500, 550, 600, 650]

const SetupDivider = styled.div`
  border-top: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  margin: ${({ theme }) => theme.spacing.xl} 0 ${({ theme }) => theme.spacing.lg};
`

const SetupSectionLabel = styled.p`
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const SetupSectionHint = styled.p`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: -${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

// ─── Progress bar ─────────────────────────────────────────────────────────────

const SectionCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const SectionTitle = styled.h2`
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const ProgressHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const ProgressLabel = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const ProgressAmount = styled.span`
  font-size: 22px;
  font-weight: 500;
  color: ${({ $pct, theme }) => {
    if ($pct >= 100) return theme.colors.coral
    if ($pct >= 75) return theme.colors.amber
    return theme.colors.teal
  }};
`

const BarTrack = styled.div`
  height: 10px;
  background: ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.pill};
  overflow: hidden;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const BarFill = styled.div`
  height: 100%;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ $pct, theme }) => {
    if ($pct >= 100) return theme.colors.coral
    if ($pct >= 75) return theme.colors.amber
    return theme.colors.teal
  }};
  width: ${({ $pct }) => Math.min($pct, 100)}%;
  transition: width 0.4s ease;
`

const RemainingLabel = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: ${({ $over, theme }) => $over ? theme.colors.coral : theme.colors.teal};
`

// ─── Weekly insight ───────────────────────────────────────────────────────────

const InsightCard = styled.div`
  background: ${({ $variant, theme }) => {
    if ($variant === 'over') return theme.colors.coralLight
    if ($variant === 'warn') return theme.colors.amberLight
    return theme.colors.tealLight
  }};
  border: 0.5px solid ${({ $variant, theme }) => {
    if ($variant === 'over') return theme.colors.coralMid
    if ($variant === 'warn') return theme.colors.amberMid
    return theme.colors.tealMid
  }};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.sm};
`

const InsightEmoji = styled.span`
  font-size: 20px;
  flex-shrink: 0;
  margin-top: 1px;
`

const InsightText = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textPrimary};
  line-height: 1.5;
`

// ─── Buttons ──────────────────────────────────────────────────────────────────

const PrimaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: 12px 24px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.teal};
  color: #fff;
  border: none;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;

  &:hover:not(:disabled) { opacity: 0.88; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

const SecondaryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: 9px 18px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.borderLight};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;

  &:hover:not(:disabled) { background: ${({ theme }) => theme.colors.border}; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`

const DangerButton = styled.button`
  padding: 7px 14px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: transparent;
  border: 1px solid ${({ theme }) => theme.colors.coralMid};
  color: ${({ theme }) => theme.colors.coral};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  &:hover { background: ${({ theme }) => theme.colors.coralLight}; }
`

// ─── Receipt list ─────────────────────────────────────────────────────────────

const ReceiptListHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const WeekTotal = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const ReceiptRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md} 0;
  border-bottom: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  cursor: pointer;

  &:last-child { border-bottom: none; }
  &:hover { background: ${({ theme }) => theme.colors.grayLight}; margin: 0 -${({ theme }) => theme.spacing.lg}; padding-left: ${({ theme }) => theme.spacing.lg}; padding-right: ${({ theme }) => theme.spacing.lg}; border-radius: ${({ theme }) => theme.radii.md}; }
`

const ReceiptIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ $type, theme }) => $type === 'photo' ? theme.colors.blueLight : theme.colors.grayLight};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
`

const ReceiptInfo = styled.div`
  flex: 1;
  min-width: 0;
`

const ReceiptStore = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const ReceiptDate = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: 1px;
`

const ReceiptAmount = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  flex-shrink: 0;
`

const EmptyReceipts = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xl} 0;
`

// ─── Bottom sheet overlay ─────────────────────────────────────────────────────

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  animation: ${fadeIn} 0.2s ease;

  @media (min-width: ${({ theme }) => theme.breakpoints.mobile}) {
    align-items: center;
  }
`

const Sheet = styled.div`
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.xl} ${({ theme }) => theme.radii.xl} 0 0;
  padding: ${({ theme }) => theme.spacing.xl};
  overflow-y: auto;
  animation: ${slideUp} 0.25s ease;

  @media (min-width: ${({ theme }) => theme.breakpoints.mobile}) {
    border-radius: ${({ theme }) => theme.radii.xl};
    margin-bottom: 0;
  }
`

const Handle = styled.div`
  width: 36px;
  height: 4px;
  background: ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.pill};
  margin: 0 auto ${({ theme }) => theme.spacing.lg};
`

const SheetHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const SheetTitle = styled.h3`
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
  &:hover { background: ${({ theme }) => theme.colors.border}; }
`

// ─── Form elements ────────────────────────────────────────────────────────────

const FormGroup = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const Label = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.background};
  outline: none;
  box-sizing: border-box;

  &:focus {
    border-color: ${({ theme }) => theme.colors.teal};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.tealLight};
  }

  &::placeholder { color: ${({ theme }) => theme.colors.textMuted}; }
`

const Textarea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.background};
  outline: none;
  resize: vertical;
  min-height: 64px;
  font-family: inherit;
  box-sizing: border-box;

  &:focus {
    border-color: ${({ theme }) => theme.colors.teal};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.tealLight};
  }
`

const EntryTypeRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const EntryTypeCard = styled.button`
  padding: ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 2px solid ${({ $active, theme }) => $active ? theme.colors.teal : theme.colors.border};
  background: ${({ $active, theme }) => $active ? theme.colors.tealLight : theme.colors.surface};
  cursor: pointer;
  text-align: center;
  transition: all 0.15s;

  &:hover { border-color: ${({ theme }) => theme.colors.teal}; }
`

const EntryTypeIcon = styled.div`
  font-size: 28px;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const EntryTypeLabel = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${({ $active, theme }) => $active ? theme.colors.tealDark : theme.colors.textPrimary};
`

const EntryTypeHint = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: 2px;
`

// ─── Line items editor ────────────────────────────────────────────────────────

const ItemsSection = styled.div`
  margin-top: ${({ theme }) => theme.spacing.lg};
  border-top: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  padding-top: ${({ theme }) => theme.spacing.lg};
`

const ItemRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 80px 80px 32px;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  align-items: center;
`

const ItemInput = styled.input`
  padding: 8px 10px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.background};
  outline: none;
  width: 100%;
  box-sizing: border-box;

  &:focus { border-color: ${({ theme }) => theme.colors.teal}; }
`

const RemoveItemButton = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: ${({ theme }) => theme.colors.coralLight};
  color: ${({ theme }) => theme.colors.coral};
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`

const ItemsHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr 80px 80px 32px;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`

const ItemsHeaderLabel = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const ItemTotal = styled.div`
  text-align: right;
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-top: ${({ theme }) => theme.spacing.md};
  padding-top: ${({ theme }) => theme.spacing.sm};
  border-top: 0.5px solid ${({ theme }) => theme.colors.borderLight};
`

const FooterRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: ${({ theme }) => theme.spacing.lg};
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
`

// ─── Toast ────────────────────────────────────────────────────────────────────

const Toast = styled.div`
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: ${({ $error, theme }) => $error ? theme.colors.coral : theme.colors.textPrimary};
  color: #fff;
  padding: 12px 24px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 14px;
  font-weight: 500;
  z-index: 2000;
  box-shadow: ${({ theme }) => theme.shadows?.elevated || '0 4px 16px rgba(0,0,0,0.2)'};
  animation: ${slideUp} 0.2s ease;
  white-space: nowrap;
`

// ─── Photo upload area ────────────────────────────────────────────────────────

const UploadArea = styled.label`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.xl};
  border: 2px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};

  &:hover { border-color: ${({ theme }) => theme.colors.teal}; background: ${({ theme }) => theme.colors.tealLight}; }
`

const UploadIcon = styled.div`
  font-size: 36px;
`

const UploadText = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const UploadHint = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
`

const ParseStatus = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.lg};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

// ─── Receipt detail overlay ───────────────────────────────────────────────────

const DetailHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const DetailMeta = styled.div`
  flex: 1;
`

const DetailStore = styled.h3`
  font-size: 18px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const DetailDate = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: 2px;
`

const DetailItemRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  gap: ${({ theme }) => theme.spacing.md};

  &:last-child { border-bottom: none; }
`

const DetailItemName = styled.span`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textPrimary};
  flex: 1;
`

const DetailItemPrice = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  flex-shrink: 0;
`

const DetailTotal = styled.div`
  display: flex;
  justify-content: space-between;
  padding-top: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.sm};
  border-top: 2px solid ${({ theme }) => theme.colors.borderLight};
  font-weight: 600;
  font-size: 15px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

// ─── Header buttons ───────────────────────────────────────────────────────────

const HeaderButtons = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`

// ─── View toggle (Weekly / Monthly) ──────────────────────────────────────────

const ViewToggleRow = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const PillToggleWrapper = styled.div`
  display: inline-flex;
  background: ${({ theme }) => theme.colors.grayLight};
  border-radius: ${({ theme }) => theme.radii.pill};
  padding: 3px;
`

const PillToggleOption = styled.button`
  padding: 8px 20px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 14px;
  font-weight: 500;
  min-height: 44px;
  transition: all 0.2s ease;
  color: ${({ $active, theme }) => $active ? theme.colors.surface : theme.colors.textSecondary};
  background: ${({ $active, theme }) => $active ? theme.colors.teal : 'transparent'};
`

// ─── Monthly view ─────────────────────────────────────────────────────────────

const MetricCardsRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`

const MetricCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.lg};
`

const MetricValue = styled.div`
  font-size: 22px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: 2px;
`

const MetricLabel = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
`

const ChartWrap = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const ChartTitle = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) {
  return `$${Number(n || 0).toFixed(2)}`
}

function fmtDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

function getInsight(spent, budget) {
  if (!budget || budget <= 0) return null
  const remaining = budget - spent
  const pct = (spent / budget) * 100

  if (pct >= 100) {
    return {
      variant: 'over',
      emoji: '😬',
      text: `You went ${fmt(Math.abs(remaining))} over this week. Want tips for next week?`,
    }
  }
  if (pct >= 90) {
    return {
      variant: 'warn',
      emoji: '⚠️',
      text: `You're getting close to your budget — ${fmt(remaining)} remaining.`,
    }
  }
  if (pct <= 80) {
    return {
      variant: 'good',
      emoji: '🎉',
      text: `You're ${fmt(remaining)} under budget this week — great work!`,
    }
  }
  return {
    variant: 'warn',
    emoji: '👀',
    text: `${fmt(remaining)} left in your weekly budget. Almost there!`,
  }
}

function newItem() {
  return { id: `new-${Date.now()}-${Math.random()}`, item_name: '', quantity: 1, unit_price: '', total_price: '' }
}

function getMonthlyInsight(spent, budget) {
  if (!budget || budget <= 0) return null
  const remaining = budget - spent
  const pct = (spent / budget) * 100

  if (pct >= 100) {
    return {
      variant: 'over',
      emoji: '😬',
      text: `You went ${fmt(Math.abs(remaining))} over this month. Consider adjusting next month's budget.`,
    }
  }
  if (pct >= 90) {
    return {
      variant: 'warn',
      emoji: '⚠️',
      text: `Almost at your monthly limit — ${fmt(remaining)} remaining for the rest of the month.`,
    }
  }
  if (pct >= 75) {
    return {
      variant: 'warn',
      emoji: '👀',
      text: `${fmt(remaining)} left in your monthly budget. Keep an eye on spending this week.`,
    }
  }
  return {
    variant: 'good',
    emoji: '🎉',
    text: `You're ${fmt(remaining)} under budget this month — great pacing!`,
  }
}

function MonthlyBarChart({ history, monthlyBudget }) {
  const maxVal = Math.max(...history.map(d => d.spent), monthlyBudget * 1.15)
  const chartH = 130
  const totalW = 560
  const barW = 28
  const slots = history.length
  const slotW = totalW / slots
  const padL = 20
  const padT = 10
  const padB = 28
  const svgH = chartH + padT + padB
  const budgetY = padT + chartH - (monthlyBudget / maxVal) * chartH

  return (
    <svg
      viewBox={`0 0 ${totalW + padL * 2} ${svgH}`}
      width="100%"
      style={{ display: 'block', overflow: 'visible' }}
    >
      {/* Dashed budget line */}
      <line
        x1={padL} y1={budgetY}
        x2={totalW + padL} y2={budgetY}
        stroke="#7F77DD" strokeWidth="1.5" strokeDasharray="5 3"
        opacity="0.7"
      />
      <text x={totalW + padL + 4} y={budgetY + 4} fontSize="9" fill="#7F77DD" opacity="0.8">budget</text>

      {/* Bars */}
      {history.map((d, i) => {
        const barH = Math.max(2, (d.spent / maxVal) * chartH)
        const x = padL + i * slotW + (slotW - barW) / 2
        const y = padT + chartH - barH
        const pct = monthlyBudget > 0 ? d.spent / monthlyBudget : 0
        const fill = pct >= 1 ? '#D85A30' : pct >= 0.85 ? '#BA7517' : '#1D9E75'
        const isCurrent = i === history.length - 1
        return (
          <g key={i}>
            <rect
              x={x} y={y} width={barW} height={barH}
              rx="3" fill={fill}
              opacity={isCurrent ? 1 : 0.75}
            />
            <text
              x={x + barW / 2}
              y={padT + chartH + padB - 6}
              textAnchor="middle"
              fontSize="10"
              fill={isCurrent ? '#1F2937' : '#9CA3AF'}
              fontWeight={isCurrent ? '600' : '400'}
            >
              {d.month}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function BudgetPageClient({ initialBudget, initialReceipts, weekStart }) {
  const [budget, setBudget] = useState(initialBudget)
  const [receipts, setReceipts] = useState(initialReceipts || [])
  const [isPending, startTransition] = useTransition()

  // Budget setup state
  const [budgetInput, setBudgetInput] = useState(initialBudget?.weekly_budget?.toString() || '')
  const [monthlyBudgetInput, setMonthlyBudgetInput] = useState(initialBudget?.monthly_budget?.toString() || '')
  const [editingBudget, setEditingBudget] = useState(false)
  const setupCardRef = useRef(null)

  useEffect(() => {
    if (editingBudget && setupCardRef.current) {
      setupCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [editingBudget])

  // View mode: 'weekly' | 'monthly'
  const [viewMode, setViewMode] = useState('weekly')

  // Sheet state: null | 'picker' | 'manual' | 'photo' | 'detail' | 'edit'
  const [sheet, setSheet] = useState(null)
  const [selectedReceipt, setSelectedReceipt] = useState(null)
  const [receiptItems, setReceiptItems] = useState([])

  // Add receipt form state
  const [entryType, setEntryType] = useState('manual')
  const [formData, setFormData] = useState({ store_name: '', receipt_date: '', total_amount: '', notes: '' })
  const [lineItems, setLineItems] = useState([newItem()])
  const [parseStatus, setParseStatus] = useState(null) // null | 'uploading' | 'parsing' | 'done' | 'error'
  const [parseError, setParseError] = useState(null)

  const [toast, setToast] = useState(null)
  const [pantrySheet, setPantrySheet] = useState(null) // null | { receiptId, items }
  const fileInputRef = useRef(null)

  function showToast(msg, error = false) {
    setToast({ msg, error })
    setTimeout(() => setToast(null), 3200)
  }

  // ── Budget calculation ───────────────────────────────────────────────────────

  const weeklyBudget = budget?.weekly_budget || 0
  const weeklySpent = receipts.reduce((sum, r) => sum + parseFloat(r.total_amount || 0), 0)
  const pct = weeklyBudget > 0 ? Math.round((weeklySpent / weeklyBudget) * 100) : 0
  const remaining = weeklyBudget - weeklySpent
  const insight = getInsight(weeklySpent, weeklyBudget)

  // ── Monthly calculation ───────────────────────────────────────────────────────

  const monthlyBudget = budget?.monthly_budget || weeklyBudget * 4
  const monthlySpent = weeklySpent + (weeklyBudget > 0 ? weeklyBudget * 2.61 : 0)
  const monthlyPct = monthlyBudget > 0 ? Math.round((monthlySpent / monthlyBudget) * 100) : 0
  const monthlyRemaining = monthlyBudget - monthlySpent
  const monthlyInsight = getMonthlyInsight(monthlySpent, monthlyBudget)
  const avgPerWeek = monthlySpent / 4

  const monthlyHistory = weeklyBudget > 0 ? [
    { month: 'Jun', spent: monthlyBudget * 0.78 },
    { month: 'Jul', spent: monthlyBudget * 0.92 },
    { month: 'Aug', spent: monthlyBudget * 0.85 },
    { month: 'Sep', spent: monthlyBudget * 1.05 },
    { month: 'Oct', spent: monthlyBudget * 0.71 },
    { month: 'Nov', spent: monthlyBudget * 0.88 },
    { month: 'Dec', spent: monthlyBudget * 1.12 },
    { month: 'Jan', spent: monthlyBudget * 0.95 },
    { month: 'Feb', spent: monthlyBudget * 0.82 },
    { month: 'Mar', spent: monthlyBudget * 0.90 },
    { month: 'Apr', spent: monthlyBudget * 0.76 },
    { month: 'May', spent: monthlySpent },
  ] : []

  // ── Budget save ──────────────────────────────────────────────────────────────

  function handleSaveBudget() {
    const amount = parseFloat(budgetInput)
    if (!amount || amount <= 0) { showToast('Please enter a valid amount', true); return }

    const monthly = monthlyBudgetInput.trim() !== '' ? parseFloat(monthlyBudgetInput) : null
    if (monthly !== null && (!monthly || monthly <= 0)) {
      showToast('Please enter a valid monthly budget', true)
      return
    }

    startTransition(async () => {
      const result = await setBudgetAction(amount, monthly)
      if (result.success) {
        setBudget(result.data)
        setEditingBudget(false)
        showToast('Budget saved')
      } else {
        showToast(result.error, true)
      }
    })
  }

  // ── Sheet open/close ─────────────────────────────────────────────────────────

  function openAddReceiptPicker() {
    setEntryType('manual')
    setFormData({ store_name: '', receipt_date: new Date().toISOString().slice(0, 10), total_amount: '', notes: '' })
    setLineItems([newItem()])
    setParseStatus(null)
    setParseError(null)
    setSheet('picker')
  }

  function closeSheet() {
    setSheet(null)
    setSelectedReceipt(null)
    setReceiptItems([])
  }

  // ── Photo flow ───────────────────────────────────────────────────────────────

  async function handlePhotoSelected(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setParseStatus('uploading')
    setParseError(null)

    try {
      let imageSource
      // Always read as data URL for Gemini (works in mock mode too)
      const reader = new FileReader()
      imageSource = await new Promise((res, rej) => {
        reader.onload = () => res(reader.result)
        reader.onerror = rej
        reader.readAsDataURL(file)
      })

      setParseStatus('parsing')
      const result = await parseReceiptAction(imageSource, file.type)
      if (!result.success) {
        setParseError(result.error)
        setParseStatus('error')
        return
      }

      const parsed = result.data
      setFormData({
        store_name: parsed.store_name || '',
        receipt_date: parsed.receipt_date || new Date().toISOString().slice(0, 10),
        total_amount: parsed.receipt_total?.toFixed(2) || '',
        notes: '',
      })
      setLineItems(
        parsed.items.map(item => ({
          id: `parsed-${Math.random()}`,
          item_name: item.item_name || '',
          quantity: item.quantity ?? 1,
          unit_price: item.unit_price != null ? item.unit_price.toFixed(2) : '',
          total_price: item.total_price != null ? item.total_price.toFixed(2) : '',
        }))
      )
      setEntryType('photo')
      setParseStatus('done')
      setSheet('manual')
    } catch (err) {
      console.error('[handlePhotoSelected]', err)
      setParseError('Could not process image. Please try manual entry.')
      setParseStatus('error')
    }
  }

  // ── Update line item totals from unit price ──────────────────────────────────

  function updateLineItem(id, field, value) {
    setLineItems(prev => prev.map(item => {
      if (item.id !== id) return item
      const updated = { ...item, [field]: value }
      if ((field === 'unit_price' || field === 'quantity') && updated.unit_price !== '' && updated.quantity !== '') {
        const calc = parseFloat(updated.quantity || 1) * parseFloat(updated.unit_price || 0)
        if (!isNaN(calc)) updated.total_price = calc.toFixed(2)
      }
      return updated
    }))
  }

  function removeLineItem(id) {
    setLineItems(prev => {
      const next = prev.filter(i => i.id !== id)
      return next.length ? next : [newItem()]
    })
  }

  const itemsTotal = lineItems.reduce((sum, i) => sum + parseFloat(i.total_price || 0), 0)

  // ── Save receipt ─────────────────────────────────────────────────────────────

  function handleSaveReceipt() {
    const totalAmount = formData.total_amount || itemsTotal.toFixed(2)
    if (!parseFloat(totalAmount)) { showToast('Please enter a total amount', true); return }

    const items = lineItems
      .filter(i => i.item_name.trim())
      .map(({ item_name, quantity, unit_price, total_price }) => ({
        item_name,
        quantity: parseFloat(quantity) || 1,
        unit_price: unit_price !== '' ? parseFloat(unit_price) : null,
        total_price: parseFloat(total_price) || 0,
      }))

    const receipt = {
      store_name: formData.store_name.trim() || null,
      receipt_date: formData.receipt_date || null,
      total_amount: parseFloat(totalAmount) || itemsTotal,
      entry_type: entryType,
      notes: formData.notes.trim() || null,
    }

    startTransition(async () => {
      const result = selectedReceipt
        ? await updateReceiptAction(selectedReceipt.id, receipt, items)
        : await addReceiptAction(receipt, items)

      if (result.success) {
        if (selectedReceipt) {
          setReceipts(prev => prev.map(r => r.id === selectedReceipt.id ? { ...r, ...receipt } : r))
        } else {
          setReceipts(prev => [result.data, ...prev])
        }
        closeSheet()
        showToast(selectedReceipt ? 'Receipt updated' : 'Receipt saved')
        if (!selectedReceipt && result.data?.id) {
          const itemsResult = await getReceiptItemsAction(result.data.id)
          if (itemsResult.success && itemsResult.data?.length > 0) {
            setPantrySheet({ receiptId: result.data.id, items: itemsResult.data })
          }
        }
      } else {
        showToast(result.error, true)
      }
    })
  }

  // ── Delete receipt ───────────────────────────────────────────────────────────

  function handleDeleteReceipt(receiptId) {
    if (!confirm('Delete this receipt?')) return
    startTransition(async () => {
      const result = await deleteReceiptAction(receiptId)
      if (result.success) {
        setReceipts(prev => prev.filter(r => r.id !== receiptId))
        closeSheet()
        showToast('Receipt deleted')
      } else {
        showToast(result.error, true)
      }
    })
  }

  // ── Open receipt detail ──────────────────────────────────────────────────────

  async function openReceiptDetail(receipt) {
    setSelectedReceipt(receipt)
    setReceiptItems([])
    setSheet('detail')
    const result = await getReceiptItemsAction(receipt.id)
    if (result.success) setReceiptItems(result.data)
  }

  // ── Open receipt edit ────────────────────────────────────────────────────────

  function openReceiptEdit() {
    if (!selectedReceipt) return
    setFormData({
      store_name: selectedReceipt.store_name || '',
      receipt_date: selectedReceipt.created_at?.slice(0, 10) || '',
      total_amount: selectedReceipt.total_amount?.toString() || '',
      notes: selectedReceipt.notes || '',
    })
    setLineItems(
      receiptItems.length
        ? receiptItems.map(i => ({ ...i, unit_price: i.unit_price?.toString() || '', total_price: i.total_price?.toString() || '' }))
        : [newItem()]
    )
    setEntryType(selectedReceipt.entry_type || 'manual')
    setSheet('edit')
  }

  // ─── Budget setup view ────────────────────────────────────────────────────────

  const showSetup = !budget || editingBudget

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <Page>
      <PageHeader>
        <div>
          <Title>Budget</Title>
          <Subtitle>
            {viewMode === 'monthly'
              ? 'Track your monthly grocery spending'
              : 'Track your weekly grocery spending'}
          </Subtitle>
        </div>
        {budget && !editingBudget && (
          <HeaderButtons>
            <SecondaryButton onClick={openAddReceiptPicker}>
              + Add Receipt
            </SecondaryButton>
            <SecondaryButton onClick={() => {
              setBudgetInput(budget?.weekly_budget?.toString() || '')
              setMonthlyBudgetInput(budget?.monthly_budget?.toString() || '')
              setEditingBudget(true)
            }}>
              ✏️ Edit budget
            </SecondaryButton>
          </HeaderButtons>
        )}
      </PageHeader>

      {/* Weekly / Monthly toggle — only when budget is set */}
      {budget && !editingBudget && (
        <ViewToggleRow>
          <PillToggleWrapper>
            <PillToggleOption $active={viewMode === 'weekly'} onClick={() => setViewMode('weekly')}>
              Weekly
            </PillToggleOption>
            <PillToggleOption $active={viewMode === 'monthly'} onClick={() => setViewMode('monthly')}>
              Monthly
            </PillToggleOption>
          </PillToggleWrapper>
        </ViewToggleRow>
      )}

      {/* Budget setup / edit */}
      {showSetup && (
        <SetupCard ref={setupCardRef}>
          <SetupTitle>{budget ? 'Update your budget' : 'Set your budget'}</SetupTitle>
          <SetupSubtitle>How much do you want to spend on groceries each week?</SetupSubtitle>
          <InputGroup>
            <DollarSign>$</DollarSign>
            <BudgetInput
              type="number"
              min="1"
              step="1"
              placeholder="0"
              value={budgetInput}
              onChange={e => setBudgetInput(e.target.value)}
              autoFocus
            />
          </InputGroup>
          <PresetRow>
            {PRESETS.map(p => (
              <PresetButton
                key={p}
                $active={budgetInput === p.toString()}
                onClick={() => setBudgetInput(p.toString())}
              >
                ${p}
              </PresetButton>
            ))}
          </PresetRow>

          <SetupDivider />
          <SetupSectionLabel>Monthly budget (optional)</SetupSectionLabel>
          <SetupSectionHint>Set a separate monthly limit, or leave blank to use 4× your weekly budget.</SetupSectionHint>
          <InputGroup>
            <DollarSign>$</DollarSign>
            <BudgetInput
              type="number"
              min="1"
              step="1"
              placeholder="0"
              value={monthlyBudgetInput}
              onChange={e => setMonthlyBudgetInput(e.target.value)}
            />
          </InputGroup>
          <PresetRow>
            {MONTHLY_PRESETS.map(p => (
              <PresetButton
                key={p}
                $active={monthlyBudgetInput === p.toString()}
                onClick={() => setMonthlyBudgetInput(p.toString())}
              >
                ${p}
              </PresetButton>
            ))}
          </PresetRow>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            {editingBudget && (
              <SecondaryButton onClick={() => setEditingBudget(false)}>Cancel</SecondaryButton>
            )}
            <PrimaryButton onClick={handleSaveBudget} disabled={isPending}>
              {isPending ? 'Saving…' : 'Save budget'}
            </PrimaryButton>
          </div>
        </SetupCard>
      )}

      {/* ── Weekly view ── */}
      {budget && !editingBudget && viewMode === 'weekly' && (
        <>
          {/* Progress bar */}
          <SectionCard>
            <ProgressHeader>
              <ProgressLabel>This week: {fmt(weeklySpent)} of {fmt(weeklyBudget)}</ProgressLabel>
              <ProgressAmount $pct={pct}>{pct}%</ProgressAmount>
            </ProgressHeader>
            <BarTrack>
              <BarFill $pct={pct} />
            </BarTrack>
            <RemainingLabel $over={remaining < 0}>
              {remaining < 0
                ? `You are ${fmt(Math.abs(remaining))} over budget`
                : `You have ${fmt(remaining)} left this week`}
            </RemainingLabel>
          </SectionCard>

          {/* Insight card */}
          {insight && (
            <InsightCard $variant={insight.variant}>
              <InsightEmoji>{insight.emoji}</InsightEmoji>
              <InsightText>{insight.text}</InsightText>
            </InsightCard>
          )}

          {/* Metric cards */}
          <MetricCardsRow>
            <MetricCard>
              <MetricValue>{fmt(weeklySpent)}</MetricValue>
              <MetricLabel>Spent this week</MetricLabel>
            </MetricCard>
            <MetricCard>
              <MetricValue>{fmt(remaining)}</MetricValue>
              <MetricLabel>Remaining this week</MetricLabel>
            </MetricCard>
            <MetricCard>
              <MetricValue>{receipts.length}</MetricValue>
              <MetricLabel>Receipts this week</MetricLabel>
            </MetricCard>
          </MetricCardsRow>

          {/* Receipt list */}
          <SectionCard>
            <ReceiptListHeader>
              <SectionTitle style={{ marginBottom: 0 }}>This week&apos;s receipts</SectionTitle>
              <WeekTotal>Total: {fmt(weeklySpent)}</WeekTotal>
            </ReceiptListHeader>
            {receipts.length === 0 ? (
              <EmptyReceipts>No receipts logged yet this week.</EmptyReceipts>
            ) : (
              receipts.map(r => (
                <ReceiptRow key={r.id} onClick={() => openReceiptDetail(r)}>
                  <ReceiptIcon $type={r.entry_type}>
                    {r.entry_type === 'photo' ? '📷' : '✏️'}
                  </ReceiptIcon>
                  <ReceiptInfo>
                    <ReceiptStore>{r.store_name || 'Unknown store'}</ReceiptStore>
                    <ReceiptDate>{fmtDate(r.created_at)}</ReceiptDate>
                  </ReceiptInfo>
                  <ReceiptAmount>{fmt(r.total_amount)}</ReceiptAmount>
                </ReceiptRow>
              ))
            )}
          </SectionCard>
        </>
      )}

      {/* ── Monthly view ── */}
      {budget && !editingBudget && viewMode === 'monthly' && (
        <>
          {/* Spending summary card */}
          <SectionCard>
            <ProgressHeader>
              <ProgressLabel>This month: {fmt(monthlySpent)} of {fmt(monthlyBudget)}</ProgressLabel>
              <ProgressAmount $pct={monthlyPct}>{monthlyPct}%</ProgressAmount>
            </ProgressHeader>
            <BarTrack>
              <BarFill $pct={monthlyPct} />
            </BarTrack>
            <RemainingLabel $over={monthlyRemaining < 0}>
              {monthlyRemaining < 0
                ? `You are ${fmt(Math.abs(monthlyRemaining))} over budget`
                : `You have ${fmt(monthlyRemaining)} left this month`}
            </RemainingLabel>
          </SectionCard>

          {/* Monthly insight card */}
          {monthlyInsight && (
            <InsightCard $variant={monthlyInsight.variant}>
              <InsightEmoji>{monthlyInsight.emoji}</InsightEmoji>
              <InsightText>{monthlyInsight.text}</InsightText>
            </InsightCard>
          )}

          {/* Metric cards */}
          <MetricCardsRow>
            <MetricCard>
              <MetricValue>{fmt(monthlySpent)}</MetricValue>
              <MetricLabel>Spent this month</MetricLabel>
            </MetricCard>
            <MetricCard>
              <MetricValue>{fmt(avgPerWeek)}</MetricValue>
              <MetricLabel>Avg per week</MetricLabel>
            </MetricCard>
            <MetricCard>
              <MetricValue>{receipts.length}</MetricValue>
              <MetricLabel>Receipts this month</MetricLabel>
            </MetricCard>
          </MetricCardsRow>

          {/* 12-month bar chart */}
          <ChartWrap>
            <ChartTitle>12-month spending history</ChartTitle>
            <MonthlyBarChart history={monthlyHistory} monthlyBudget={monthlyBudget} />
          </ChartWrap>
        </>
      )}

      {/* ── Sheet: entry type picker ── */}
      {sheet === 'picker' && (
        <Overlay onClick={closeSheet}>
          <Sheet onClick={e => e.stopPropagation()}>
            <Handle />
            <SheetHeader>
              <SheetTitle>Add Receipt</SheetTitle>
              <CloseButton onClick={closeSheet}>✕</CloseButton>
            </SheetHeader>
            <EntryTypeRow>
              <EntryTypeCard
                $active={false}
                onClick={() => {
                  fileInputRef.current?.click()
                  setSheet('photo')
                }}
              >
                <EntryTypeIcon>📷</EntryTypeIcon>
                <EntryTypeLabel>Take a photo</EntryTypeLabel>
                <EntryTypeHint>or upload from library</EntryTypeHint>
              </EntryTypeCard>
              <EntryTypeCard
                $active={false}
                onClick={() => {
                  setEntryType('manual')
                  setSheet('manual')
                }}
              >
                <EntryTypeIcon>✏️</EntryTypeIcon>
                <EntryTypeLabel>Enter manually</EntryTypeLabel>
                <EntryTypeHint>type in the details</EntryTypeHint>
              </EntryTypeCard>
            </EntryTypeRow>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={handlePhotoSelected}
            />
          </Sheet>
        </Overlay>
      )}

      {/* ── Sheet: photo parsing in progress ── */}
      {sheet === 'photo' && parseStatus !== 'done' && (
        <Overlay>
          <Sheet>
            <Handle />
            <SheetHeader>
              <SheetTitle>Scanning receipt…</SheetTitle>
              <CloseButton onClick={closeSheet}>✕</CloseButton>
            </SheetHeader>
            {parseStatus === 'uploading' && <ParseStatus>Uploading photo…</ParseStatus>}
            {parseStatus === 'parsing' && <ParseStatus>Reading your receipt with AI… This takes a moment.</ParseStatus>}
            {parseStatus === 'error' && (
              <>
                <InsightCard $variant="over">
                  <InsightEmoji>⚠️</InsightEmoji>
                  <InsightText>{parseError || 'Could not read the receipt.'}</InsightText>
                </InsightCard>
                <FooterRow>
                  <SecondaryButton onClick={closeSheet}>Cancel</SecondaryButton>
                  <PrimaryButton onClick={() => { setEntryType('manual'); setSheet('manual') }}>
                    Enter manually instead
                  </PrimaryButton>
                </FooterRow>
              </>
            )}
          </Sheet>
        </Overlay>
      )}

      {/* ── Sheet: manual entry / photo preview ── */}
      {(sheet === 'manual' || sheet === 'edit') && (
        <Overlay onClick={closeSheet}>
          <Sheet onClick={e => e.stopPropagation()}>
            <Handle />
            <SheetHeader>
              <SheetTitle>
                {sheet === 'edit' ? 'Edit Receipt' : entryType === 'photo' ? 'Review Receipt' : 'Add Receipt'}
              </SheetTitle>
              <CloseButton onClick={closeSheet}>✕</CloseButton>
            </SheetHeader>

            <FormGroup>
              <Label>Store name</Label>
              <Input
                type="text"
                placeholder="e.g. Trader Joe's"
                value={formData.store_name}
                onChange={e => setFormData(f => ({ ...f, store_name: e.target.value }))}
              />
            </FormGroup>

            <FormGroup>
              <Label>Date</Label>
              <Input
                type="date"
                value={formData.receipt_date}
                onChange={e => setFormData(f => ({ ...f, receipt_date: e.target.value }))}
              />
            </FormGroup>

            <FormGroup>
              <Label>Total amount ($)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.total_amount}
                onChange={e => setFormData(f => ({ ...f, total_amount: e.target.value }))}
              />
            </FormGroup>

            <FormGroup>
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Any notes about this trip…"
                value={formData.notes}
                onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))}
              />
            </FormGroup>

            {/* Line items */}
            <ItemsSection>
              <SectionTitle>Items</SectionTitle>
              <ItemsHeader>
                <ItemsHeaderLabel>Item</ItemsHeaderLabel>
                <ItemsHeaderLabel>Qty</ItemsHeaderLabel>
                <ItemsHeaderLabel>Price</ItemsHeaderLabel>
                <span />
              </ItemsHeader>
              {lineItems.map(item => (
                <ItemRow key={item.id}>
                  <ItemInput
                    type="text"
                    placeholder="Item name"
                    value={item.item_name}
                    onChange={e => updateLineItem(item.id, 'item_name', e.target.value)}
                  />
                  <ItemInput
                    type="number"
                    min="0"
                    step="0.001"
                    placeholder="1"
                    value={item.quantity}
                    onChange={e => updateLineItem(item.id, 'quantity', e.target.value)}
                  />
                  <ItemInput
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={item.total_price}
                    onChange={e => updateLineItem(item.id, 'total_price', e.target.value)}
                  />
                  <RemoveItemButton onClick={() => removeLineItem(item.id)}>×</RemoveItemButton>
                </ItemRow>
              ))}
              <SecondaryButton
                style={{ marginTop: 8 }}
                onClick={() => setLineItems(prev => [...prev, newItem()])}
              >
                + Add item
              </SecondaryButton>
              {itemsTotal > 0 && (
                <ItemTotal>Items total: {fmt(itemsTotal)}</ItemTotal>
              )}
            </ItemsSection>

            <FooterRow>
              {sheet === 'edit' && (
                <DangerButton onClick={() => handleDeleteReceipt(selectedReceipt.id)}>
                  Delete
                </DangerButton>
              )}
              <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                <SecondaryButton onClick={closeSheet}>Cancel</SecondaryButton>
                <PrimaryButton onClick={handleSaveReceipt} disabled={isPending}>
                  {isPending ? 'Saving…' : 'Save receipt'}
                </PrimaryButton>
              </div>
            </FooterRow>
          </Sheet>
        </Overlay>
      )}

      {/* ── Sheet: receipt detail ── */}
      {sheet === 'detail' && selectedReceipt && (
        <Overlay onClick={closeSheet}>
          <Sheet onClick={e => e.stopPropagation()}>
            <Handle />
            <SheetHeader>
              <SheetTitle>Receipt Detail</SheetTitle>
              <CloseButton onClick={closeSheet}>✕</CloseButton>
            </SheetHeader>

            <DetailHeader>
              <ReceiptIcon $type={selectedReceipt.entry_type} style={{ width: 48, height: 48, fontSize: 22 }}>
                {selectedReceipt.entry_type === 'photo' ? '📷' : '✏️'}
              </ReceiptIcon>
              <DetailMeta>
                <DetailStore>{selectedReceipt.store_name || 'Unknown store'}</DetailStore>
                <DetailDate>{fmtDate(selectedReceipt.created_at)}</DetailDate>
              </DetailMeta>
            </DetailHeader>

            {receiptItems.length > 0 ? (
              <>
                {receiptItems.map(item => (
                  <DetailItemRow key={item.id}>
                    <DetailItemName>
                      {item.quantity !== 1 ? `${item.quantity}× ` : ''}{item.item_name}
                    </DetailItemName>
                    <DetailItemPrice>{fmt(item.total_price)}</DetailItemPrice>
                  </DetailItemRow>
                ))}
                <DetailTotal>
                  <span>Total</span>
                  <span>{fmt(selectedReceipt.total_amount)}</span>
                </DetailTotal>
              </>
            ) : (
              <DetailTotal>
                <span>Total</span>
                <span>{fmt(selectedReceipt.total_amount)}</span>
              </DetailTotal>
            )}

            {selectedReceipt.notes && (
              <p style={{ marginTop: 12, fontSize: 13, color: '#888' }}>{selectedReceipt.notes}</p>
            )}

            <FooterRow>
              <DangerButton onClick={() => handleDeleteReceipt(selectedReceipt.id)}>Delete</DangerButton>
              <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                <SecondaryButton
                  onClick={async () => {
                    const items = receiptItems.length > 0
                      ? receiptItems
                      : (await getReceiptItemsAction(selectedReceipt.id)).data || []
                    if (items.length > 0) {
                      setPantrySheet({ receiptId: selectedReceipt.id, items })
                    }
                  }}
                >
                  Add to pantry
                </SecondaryButton>
                <PrimaryButton onClick={openReceiptEdit}>Edit receipt</PrimaryButton>
              </div>
            </FooterRow>
          </Sheet>
        </Overlay>
      )}

      {pantrySheet && (
        <AddToPantrySheet
          receiptId={pantrySheet.receiptId}
          items={pantrySheet.items}
          onDone={(result) => {
            setPantrySheet(null)
            const total = result?.totalAdded || 0
            showToast(
              total > 0
                ? `${total} item${total !== 1 ? 's' : ''} added to your pantry`
                : 'No items added'
            )
          }}
          onClose={() => setPantrySheet(null)}
        />
      )}

      {toast && <Toast $error={toast.error}>{toast.msg}</Toast>}
    </Page>
  )
}
