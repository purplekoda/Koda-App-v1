'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import styled from 'styled-components'
import { generateMacroInsight, analyzeFoodPhoto, logMacroExtra, fetchWeeklyExtras } from './actions'
import FoodPhotoSheet from '@/components/macros/FoodPhotoSheet'
import MealTimePicker from '@/components/macros/MealTimePicker'
import FoodReviewCard from '@/components/macros/FoodReviewCard'
import MacroHistory from '@/components/macros/MacroHistory'
import ManualFoodEntry from '@/components/macros/ManualFoodEntry'

// ─── Constants ────────────────────────────────────────────────────────────────

const MACRO_COLORS = {
  calories: '#D85A30',
  protein: '#1D9E75',
  carbs: '#185FA5',
  fat: '#534AB7',
}

const MACRO_LABELS = {
  calories: 'Calories',
  protein: 'Protein',
  carbs: 'Carbs',
  fat: 'Fat',
}

const MEAL_COLORS = {
  0: '#BA7517', // breakfast - amber
  1: '#1D9E75', // lunch - green
  2: '#7F77DD', // dinner - purple
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMemberStatus(member, extrasTotal) {
  const today = member.weeklyActuals[member.todayIndex] || member.weeklyActuals[0]
  const macros = ['calories', 'protein', 'carbs', 'fat']
  let worstDiff = 0
  macros.forEach(key => {
    const actual = today[key] + (extrasTotal?.[key] || 0)
    const diff = Math.abs(actual - member.targets[key]) / member.targets[key]
    if (diff > worstDiff) worstDiff = diff
  })
  if (worstDiff <= 0.10) return 'green'
  if (worstDiff <= 0.25) return 'amber'
  return 'red'
}

function getStatusLabel(status) {
  if (status === 'green') return 'On track'
  if (status === 'amber') return 'Needs attention'
  return 'Off target'
}

// ─── Layout Styles ────────────────────────────────────────────────────────────

const PageHeader = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const ToggleWrapper = styled.div`
  display: inline-flex;
  background: ${({ theme }) => theme.colors.grayLight};
  border-radius: ${({ theme }) => theme.radii.pill};
  padding: 3px;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const ToggleOption = styled.button`
  padding: 8px 20px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 14px;
  font-weight: 500;
  min-height: ${({ theme }) => theme.touchTarget};
  transition: all 0.2s ease;
  color: ${({ $active, theme }) => $active ? theme.colors.surface : theme.colors.textSecondary};
  background: ${({ $active, theme }) => $active ? theme.colors.teal : 'transparent'};
`

// ─── Household View Styles ────────────────────────────────────────────────────

const SummaryLine = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  font-size: 15px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const StatusIcon = styled.span`
  font-size: 18px;
`

const MemberCard = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg};
  width: 100%;
  text-align: left;
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  cursor: pointer;
  transition: box-shadow 0.15s ease;

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.elevated};
  }

  & + & {
    margin-top: ${({ theme }) => theme.spacing.md};
  }
`

const MemberInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 90px;
`

const AvatarCircle = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${({ $color }) => $color}20;
  color: ${({ $color }) => $color};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
`

const MemberName = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const AgeBadge = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMuted};
  background: ${({ theme }) => theme.colors.grayLight};
  padding: 1px 6px;
  border-radius: ${({ theme }) => theme.radii.sm};
  width: fit-content;
`

const MacroBarsWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const MacroBarRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`

const MacroBarLabel = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMuted};
  min-width: 52px;
`

const MacroBarTrack = styled.div`
  flex: 1;
  height: 6px;
  background: ${({ theme }) => theme.colors.grayLight};
  border-radius: 3px;
  overflow: hidden;
`

const MacroBarFill = styled.div`
  height: 100%;
  width: ${({ $pct }) => Math.min($pct, 100)}%;
  background: ${({ $color, $over }) => $over ? '#D85A30' : $color};
  border-radius: 3px;
  transition: width 0.3s ease;
`

const MacroBarValues = styled.span`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.textMuted};
  min-width: 70px;
  text-align: right;
`

const StatusDot = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${({ $status }) =>
    $status === 'green' ? '#1D9E75' :
    $status === 'amber' ? '#BA7517' : '#D85A30'};
`

// ─── Weekly Trend ─────────────────────────────────────────────────────────────

const WeekSection = styled.div`
  margin-top: ${({ theme }) => theme.spacing.xxl};
`

const SectionTitle = styled.h2`
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const WeekChart = styled.div`
  display: flex;
  align-items: flex-end;
  gap: ${({ theme }) => theme.spacing.md};
  height: 120px;
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
`

const DayColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  height: 100%;
  justify-content: flex-end;
`

const StackedBar = styled.div`
  width: 100%;
  max-width: 32px;
  border-radius: 4px;
  overflow: hidden;
  opacity: ${({ $isToday }) => $isToday ? 1 : 0.7};
  border: ${({ $isToday }) => $isToday ? '1.5px solid #1D9E75' : 'none'};
`

const BarSegment = styled.div`
  width: 100%;
  height: ${({ $height }) => $height}px;
  background: ${({ $color }) => $color};
`

const DayLabel = styled.span`
  font-size: 11px;
  color: ${({ $isToday, theme }) => $isToday ? theme.colors.teal : theme.colors.textMuted};
  font-weight: ${({ $isToday }) => $isToday ? 600 : 400};
`

const AmberDot = styled.span`
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #BA7517;
`

// ─── Individual View Styles ───────────────────────────────────────────────────

const MemberSwitcher = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  flex-wrap: wrap;
`

const MemberChip = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 13px;
  font-weight: 500;
  border: 1.5px solid ${({ $active }) => $active ? '#1D9E75' : 'transparent'};
  background: ${({ $active, theme }) => $active ? theme.colors.tealLight : theme.colors.grayLight};
  color: ${({ $active, theme }) => $active ? theme.colors.teal : theme.colors.textSecondary};
  cursor: pointer;
  transition: all 0.15s ease;
`

const ChipDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
`

const MemberHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  flex-wrap: wrap;
`

const MemberHeaderInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const MemberHeaderName = styled.span`
  font-size: 18px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const GoalsList = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const StatusBadge = styled.span`
  padding: 4px 12px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 12px;
  font-weight: 500;
  background: ${({ $status }) =>
    $status === 'green' ? '#E1F5EE' :
    $status === 'amber' ? '#FAEEDA' : '#FAECE7'};
  color: ${({ $status }) =>
    $status === 'green' ? '#1D9E75' :
    $status === 'amber' ? '#BA7517' : '#D85A30'};
`

// Macro cards grid
const MacroGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.md};

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`

const MacroCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.lg};
`

const MacroCardTitle = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const MacroCardValue = styled.div`
  font-size: 28px;
  font-weight: 600;
  color: ${({ $color, $over }) => $over ? '#D85A30' : $color};
  line-height: 1.1;
`

const MacroCardTarget = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: 2px;
`

const MacroCardBar = styled.div`
  height: 4px;
  background: ${({ theme }) => theme.colors.grayLight};
  border-radius: 2px;
  margin-top: ${({ theme }) => theme.spacing.md};
  overflow: hidden;
`

const MacroCardBarFill = styled.div`
  height: 100%;
  width: ${({ $pct }) => Math.min($pct, 100)}%;
  background: ${({ $color, $over }) => $over ? '#D85A30' : $color};
  border-radius: 2px;
`

const MacroCardPct = styled.div`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: right;
  margin-top: 4px;
`

// Macro source breakdown
const SourceBreakdown = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xl};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.md};
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const SourceLine = styled.span`
  display: flex;
  align-items: center;
  gap: 6px;
`

const SourceDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
`

// Daily breakdown table
const BreakdownTable = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
  margin-bottom: ${({ theme }) => theme.spacing.xxl};

  & > div + div {
    border-top: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  }
`

const BreakdownRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border-left: 3px solid ${({ $isToday }) => $isToday ? '#1D9E75' : 'transparent'};
`

const DayName = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  min-width: 36px;
`

const MealChips = styled.div`
  display: flex;
  gap: 4px;
  flex: 1;
  flex-wrap: wrap;
`

const MealChip = styled.span`
  font-size: 11px;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ $color }) => $color}20;
  color: ${({ $color }) => $color};
  white-space: nowrap;
`

const DayMacroBarGroup = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const DayMacroBarRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`

const DayMacroBarLabel = styled.span`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.textMuted};
  min-width: 48px;
  flex-shrink: 0;
`

const DayMacroBarTrack = styled.div`
  flex: 1;
  height: 5px;
  background: ${({ theme }) => theme.colors.grayLight};
  border-radius: 2px;
  overflow: hidden;
`

const DayMacroBarFill = styled.div`
  height: 100%;
  width: ${({ $pct }) => Math.min($pct, 100)}%;
  background: ${({ $color, $over }) => $over ? '#D85A30' : $color};
  border-radius: 2px;
  transition: width 0.3s ease;
`

const DayMacroBarValue = styled.span`
  font-size: 10px;
  color: ${({ theme }) => theme.colors.textMuted};
  min-width: 44px;
  text-align: right;
  flex-shrink: 0;
`

const FlagIcon = styled.span`
  font-size: 14px;
  min-width: 18px;
  text-align: center;
`

const ClickableBreakdownRow = styled.div`
  cursor: pointer;
  transition: background 0.12s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.grayLight};
  }
`

const DayExpandedSection = styled.div`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  padding-top: 0;
  border-top: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  background: ${({ theme }) => theme.colors.grayLight};
`

const DayExpandedMealGroup = styled.div`
  & + & {
    margin-top: ${({ theme }) => theme.spacing.md};
  }
`

const DayExpandedMealTitle = styled.div`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ $color }) => $color};
  padding: ${({ theme }) => theme.spacing.sm} 0 4px;
`

const DayExpandedEntry = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 3px 0;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const DayExpandedEntryMacros = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMuted};
  white-space: nowrap;
`

const DayExpandedEmpty = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-style: italic;
  padding: ${({ theme }) => theme.spacing.sm} 0;
`

const DayChevron = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-left: auto;
  flex-shrink: 0;
  transition: transform 0.15s ease;
  transform: ${({ $open }) => $open ? 'rotate(180deg)' : 'rotate(0deg)'};
  display: inline-block;
`

// Smart insight card
const InsightCard = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ $status }) =>
    $status === 'green' ? '#E6F1FB' :
    $status === 'amber' ? '#FAEEDA' : '#FAECE7'};
  border: 0.5px solid ${({ $status }) =>
    $status === 'green' ? '#185FA540' :
    $status === 'amber' ? '#BA751740' : '#D85A3040'};
`

const InsightText = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textPrimary};
  line-height: 1.5;
  margin: 0;
`

const InsightLoading = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-style: italic;
`

// Add food button
const AddFoodButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.xl};
  min-height: ${({ theme }) => theme.touchTarget};
  border-radius: ${({ theme }) => theme.radii.lg};
  font-size: 15px;
  font-weight: 600;
  background: ${({ theme }) => theme.colors.tealLight};
  color: ${({ theme }) => theme.colors.teal};
  border: 1.5px dashed ${({ theme }) => theme.colors.teal};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.teal};
    color: white;
  }
`

// Date navigator
const DateNav = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
`

const DateNavArrow = styled.button`
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 18px;
  color: ${({ $disabled, theme }) => $disabled ? theme.colors.textMuted : theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.grayLight};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${({ $disabled }) => $disabled ? 'not-allowed' : 'pointer'};
  opacity: ${({ $disabled }) => $disabled ? 0.4 : 1};
  transition: background 0.12s ease;

  &:hover:not([disabled]) {
    background: ${({ theme }) => theme.colors.borderLight};
  }
`

const DateNavLabel = styled.button`
  flex: 1;
  text-align: center;
  font-size: 15px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  padding: 4px;
  border-radius: ${({ theme }) => theme.radii.sm};

  &:hover {
    background: ${({ theme }) => theme.colors.grayLight};
  }
`

// Food log by meal type
const FoodLogSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
`

const MealSection = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const MealSectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.sm} 0;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  border-bottom: 0.5px solid ${({ theme }) => theme.colors.borderLight};
`

const MealSectionTitle = styled.span`
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${({ $color }) => $color};
`

const MealSectionCal = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textMuted};
`

const FoodEntry = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.sm} 0;
  border-bottom: 0.5px solid ${({ theme }) => theme.colors.borderLight};

  &:last-child {
    border-bottom: none;
  }
`

const FoodEntryName = styled.span`
  flex: 1;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const FoodEntryMacros = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textMuted};
  white-space: nowrap;
`

const EmptyMeal = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textMuted};
  font-style: italic;
  padding: ${({ theme }) => theme.spacing.sm} 0;
`

// Log food button and choice sheet
const LogFoodButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.xl};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  min-height: ${({ theme }) => theme.touchTarget};
  border-radius: ${({ theme }) => theme.radii.lg};
  font-size: 15px;
  font-weight: 600;
  background: ${({ theme }) => theme.colors.teal};
  color: white;
  cursor: pointer;
  transition: opacity 0.15s ease;

  &:hover {
    opacity: 0.9;
  }
`

const LogChoiceSheet = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 100;
  display: flex;
  align-items: flex-end;
  justify-content: center;
`

const LogChoiceCard = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.radii.xl} ${({ theme }) => theme.radii.xl} 0 0;
  width: 100%;
  max-width: 480px;
  padding: ${({ theme }) => theme.spacing.xl};
  padding-bottom: calc(${({ theme }) => theme.spacing.xxl} + env(safe-area-inset-bottom, 0px));
`

const LogChoiceHandle = styled.div`
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: ${({ theme }) => theme.colors.grayMid};
  margin: 0 auto ${({ theme }) => theme.spacing.lg};
`

const LogChoiceTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const LogChoiceOption = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  width: 100%;
  padding: ${({ theme }) => theme.spacing.lg};
  min-height: ${({ theme }) => theme.touchTarget};
  background: ${({ theme }) => theme.colors.grayLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  font-size: 15px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;
  text-align: left;

  & + & {
    margin-top: ${({ theme }) => theme.spacing.md};
  }

  &:hover {
    background: ${({ theme }) => theme.colors.borderLight};
  }
`

const LogChoiceIcon = styled.span`
  font-size: 22px;
  width: 36px;
  text-align: center;
`

const LogChoiceCancel = styled.button`
  width: 100%;
  padding: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.lg};
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textMuted};
  min-height: ${({ theme }) => theme.touchTarget};
`

const InlinePlusButton = styled.button`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.tealLight};
  color: ${({ theme }) => theme.colors.teal};
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  cursor: pointer;
  transition: background 0.12s ease, color 0.12s ease;
  line-height: 1;

  &:hover {
    background: ${({ theme }) => theme.colors.teal};
    color: white;
  }
`

// Analyzing state
const AnalyzingCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.xxl};
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  text-align: center;
`

const AnalyzingIcon = styled.span`
  font-size: 48px;
  animation: pulse 1.5s ease-in-out infinite;

  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.05); opacity: 0.7; }
  }
`

const AnalyzingText = styled.p`
  font-size: 15px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`

// Toast notification
const Toast = styled.div`
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: ${({ theme }) => theme.colors.teal};
  color: white;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 14px;
  font-weight: 500;
  z-index: 200;
  box-shadow: ${({ theme }) => theme.shadows.elevated};
  animation: slideUp 0.3s ease;

  @keyframes slideUp {
    from { transform: translateX(-50%) translateY(20px); opacity: 0; }
    to { transform: translateX(-50%) translateY(0); opacity: 1; }
  }
`

// Individual view sub-tabs
const SubTabWrapper = styled.div`
  display: inline-flex;
  background: ${({ theme }) => theme.colors.grayLight};
  border-radius: ${({ theme }) => theme.radii.pill};
  padding: 2px;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const SubTab = styled.button`
  padding: 6px 16px;
  border-radius: ${({ theme }) => theme.radii.pill};
  font-size: 13px;
  font-weight: 500;
  min-height: 36px;
  transition: all 0.2s ease;
  color: ${({ $active, theme }) => $active ? theme.colors.surface : theme.colors.textSecondary};
  background: ${({ $active, theme }) => $active ? theme.colors.teal : 'transparent'};
`

// ─── Component ────────────────────────────────────────────────────────────────

export default function MacrosPageClient({ members, todayIndex, extrasMap: initialExtrasMap, primaryMemberId }) {
  const [view, setView] = useState(primaryMemberId ? 'individual' : 'household')
  const [activeMemberId, setActiveMemberId] = useState(primaryMemberId ?? members[0]?.id)
  const [insights, setInsights] = useState({})
  const [, startTransition] = useTransition()

  // Extras state (initialized from server, updated after logging)
  const [extrasMap, setExtrasMap] = useState(initialExtrasMap || {})

  // Logging flow state
  const [logStep, setLogStep] = useState(null) // null | 'choose' | 'photo' | 'analyzing' | 'mealTime' | 'review' | 'manual'
  const [selectedImage, setSelectedImage] = useState(null)
  const [foodAnalysis, setFoodAnalysis] = useState(null)
  const [selectedMealTime, setSelectedMealTime] = useState(null)
  const [preselectedMealTime, setPreselectedMealTime] = useState(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  // History tab: expanded day and fetched entries cache keyed by "memberId:dateStr"
  const [expandedDay, setExpandedDay] = useState(null)
  const [weekExtrasCache, setWeekExtrasCache] = useState({})

  // Individual sub-tab: 'today' or 'history'
  const [subTab, setSubTab] = useState('today')

  // Date navigator state (ISO date string, defaults to today)
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10))

  function formatDateDisplay(dateStr) {
    const d = new Date(dateStr + 'T12:00:00')
    const today = new Date().toISOString().slice(0, 10)
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    if (dateStr === today) return 'Today'
    if (dateStr === yesterday) return 'Yesterday'
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
  }

  function navigateDate(delta) {
    setSelectedDate(prev => {
      const d = new Date(prev + 'T12:00:00')
      d.setDate(d.getDate() + delta)
      const next = d.toISOString().slice(0, 10)
      // Don't navigate to future dates
      if (next > new Date().toISOString().slice(0, 10)) return prev
      return next
    })
  }

  // Add todayIndex to each member for calculations
  const membersWithToday = members.map(m => ({ ...m, todayIndex }))

  const activeMember = membersWithToday.find(m => m.id === activeMemberId) || membersWithToday[0]

  // Fetch insight when switching to individual view or member
  const fetchInsight = useCallback((memberId) => {
    if (insights[memberId]) return
    setInsights(prev => ({ ...prev, [memberId]: { loading: true } }))
    startTransition(async () => {
      const result = await generateMacroInsight(memberId)
      if (result.success) {
        setInsights(prev => ({ ...prev, [memberId]: { text: result.data.insight } }))
      } else {
        setInsights(prev => ({ ...prev, [memberId]: { text: 'Unable to generate insight.' } }))
      }
    })
  }, [insights, startTransition])

  useEffect(() => {
    if (view === 'individual' && activeMemberId) {
      fetchInsight(activeMemberId)
    }
  }, [view, activeMemberId, fetchInsight])

  function handleMemberCardClick(memberId) {
    setActiveMemberId(memberId)
    setView('individual')
  }

  // ─── Logging Flow Handlers ────────────────────────────────────────

  function resetLogFlow() {
    setLogStep(null)
    setSelectedImage(null)
    setFoodAnalysis(null)
    setSelectedMealTime(null)
    setPreselectedMealTime(null)
    setSaving(false)
  }

  function handleImageSelected(imageData) {
    setSelectedImage(imageData)
    setLogStep('analyzing')

    startTransition(async () => {
      const result = await analyzeFoodPhoto({
        base64: imageData.base64,
        mimeType: imageData.mimeType,
      })

      if (result.success) {
        setFoodAnalysis(result.data)
        if (preselectedMealTime) {
          setSelectedMealTime(preselectedMealTime)
          setLogStep('review')
        } else {
          setLogStep('mealTime')
        }
      } else {
        setToast(result.error || 'Could not analyze the photo.')
        resetLogFlow()
      }
    })
  }

  function handleMealTimeSelected(mealTime) {
    setSelectedMealTime(mealTime)
    setLogStep('review')
  }

  function handleLogForMealType(mealType) {
    setPreselectedMealTime(mealType)
    setLogStep('choose')
  }

  function getDayDate(dayIndex) {
    const today = new Date()
    const diff = dayIndex - todayIndex
    const d = new Date(today)
    d.setDate(today.getDate() + diff)
    return d.toISOString().slice(0, 10)
  }

  function handleLogForDay(dayIndex) {
    const dateStr = getDayDate(dayIndex)
    setSelectedDate(dateStr)
    setLogStep('choose')
  }

  function getWeekStart() {
    const today = new Date()
    const dow = today.getDay()
    const daysFromMonday = dow === 0 ? 6 : dow - 1
    const monday = new Date(today)
    monday.setDate(today.getDate() - daysFromMonday)
    return monday.toISOString().slice(0, 10)
  }

  function handleDayExpand(dayIndex) {
    const dateStr = getDayDate(dayIndex)
    const cacheKey = `${activeMember.id}:${dateStr}`

    if (expandedDay === dayIndex) {
      setExpandedDay(null)
      return
    }

    setExpandedDay(dayIndex)

    if (dayIndex === todayIndex) return // today's data already in extrasMap
    if (weekExtrasCache[cacheKey] !== undefined) return // already fetched

    // Mark as loading then fetch
    setWeekExtrasCache(prev => ({ ...prev, [cacheKey]: null }))
    startTransition(async () => {
      const result = await fetchWeeklyExtras(activeMember.id, getWeekStart())
      if (result.success) {
        const byDate = {}
        result.data.forEach(entry => {
          const key = `${activeMember.id}:${entry.logged_date}`
          if (!byDate[key]) byDate[key] = []
          byDate[key].push(entry)
        })
        setWeekExtrasCache(prev => ({ ...prev, ...byDate }))
      }
    })
  }

  async function handleConfirmLog(macroData) {
    setSaving(true)
    const result = await logMacroExtra({
      member_id: activeMember.id,
      logged_date: selectedDate,
      meal_time: selectedMealTime,
      food_name: macroData.food_name,
      calories: macroData.calories,
      protein: macroData.protein,
      carbs: macroData.carbs,
      fat: macroData.fat,
      label_found: foodAnalysis?.label_found || false,
      confidence: foodAnalysis?.confidence || 'medium',
      gemini_notes: foodAnalysis?.notes || '',
    })

    if (result.success) {
      // Update local extras state
      const memberId = activeMember.id
      const prev = extrasMap[memberId] || { extras: [], total: { calories: 0, protein: 0, carbs: 0, fat: 0 } }
      const newEntry = result.data || macroData
      setExtrasMap(prevMap => ({
        ...prevMap,
        [memberId]: {
          extras: [...prev.extras, newEntry],
          total: {
            calories: prev.total.calories + macroData.calories,
            protein: prev.total.protein + macroData.protein,
            carbs: prev.total.carbs + macroData.carbs,
            fat: prev.total.fat + macroData.fat,
          },
        },
      }))
      setToast(`${macroData.food_name} logged successfully`)
    } else {
      setToast(result.error || 'Could not save the entry.')
    }
    resetLogFlow()
  }

  async function handleManualSave(entryData) {
    setSaving(true)
    const result = await logMacroExtra({
      member_id: activeMember.id,
      meal_time: entryData.meal_type,
      food_name: entryData.food_name,
      calories: entryData.calories,
      protein: entryData.protein,
      carbs: entryData.carbs,
      fat: entryData.fat,
      label_found: false,
      confidence: 'medium',
      gemini_notes: '',
    })

    if (result.success) {
      const memberId = activeMember.id
      const prev = extrasMap[memberId] || { extras: [], total: { calories: 0, protein: 0, carbs: 0, fat: 0 } }
      setExtrasMap(prevMap => ({
        ...prevMap,
        [memberId]: {
          extras: [...prev.extras, result.data || entryData],
          total: {
            calories: prev.total.calories + (entryData.calories || 0),
            protein: prev.total.protein + (entryData.protein || 0),
            carbs: prev.total.carbs + (entryData.carbs || 0),
            fat: prev.total.fat + (entryData.fat || 0),
          },
        },
      }))
      setToast(`${entryData.food_name} logged successfully`)
    } else {
      setToast(result.error || 'Could not save the entry.')
    }
    resetLogFlow()
  }

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  // ─── Household View ───────────────────────────────────────────────

  function renderHousehold() {
    const onTrackCount = membersWithToday.filter(m =>
      getMemberStatus(m, extrasMap[m.id]?.total) === 'green'
    ).length
    const total = membersWithToday.length
    const allGood = onTrackCount === total

    return (
      <>
        <SummaryLine>
          <StatusIcon>{allGood ? '✓' : '⚠'}</StatusIcon>
          {onTrackCount} of {total} members on track today
        </SummaryLine>

        {membersWithToday.map(member => {
          const memberExtras = extrasMap[member.id]?.total || { calories: 0, protein: 0, carbs: 0, fat: 0 }
          const status = getMemberStatus(member, memberExtras)
          const today = member.weeklyActuals?.[todayIndex] || member.weeklyActuals?.[0] || { calories: 0, protein: 0, carbs: 0, fat: 0, meals: [] }
          return (
            <MemberCard key={member.id} onClick={() => handleMemberCardClick(member.id)}>
              <MemberInfo>
                <AvatarCircle $color={member.color}>{member.initial}</AvatarCircle>
                <MemberName>{member.name}</MemberName>
                <AgeBadge>{member.ageGroup}</AgeBadge>
              </MemberInfo>
              <MacroBarsWrapper>
                {['calories', 'protein', 'carbs', 'fat'].map(key => {
                  const actual = today[key] + (memberExtras[key] || 0)
                  const pct = (actual / member.targets[key]) * 100
                  const unit = key === 'calories' ? '' : 'g'
                  return (
                    <MacroBarRow key={key}>
                      <MacroBarLabel>{MACRO_LABELS[key]}</MacroBarLabel>
                      <MacroBarTrack>
                        <MacroBarFill $pct={pct} $color={MACRO_COLORS[key]} $over={pct > 110} />
                      </MacroBarTrack>
                      <MacroBarValues>{actual}{unit} / {member.targets[key]}{unit}</MacroBarValues>
                    </MacroBarRow>
                  )
                })}
              </MacroBarsWrapper>
              <StatusDot $status={status} />
            </MemberCard>
          )
        })}

        <WeekSection>
          <SectionTitle>This week</SectionTitle>
          <WeekChart>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
              const isToday = i === todayIndex
              let totalCal = 0, totalProt = 0, totalCarbs = 0, totalFat = 0
              let anyOff = false
              membersWithToday.forEach(m => {
                const d = m.weeklyActuals[i]
                if (d) {
                  const extras = isToday ? (extrasMap[m.id]?.total || {}) : {}
                  totalCal += d.calories + (extras.calories || 0)
                  totalProt += d.protein + (extras.protein || 0)
                  totalCarbs += d.carbs + (extras.carbs || 0)
                  totalFat += d.fat + (extras.fat || 0)
                  const actualCal = d.calories + (extras.calories || 0)
                  const calDiff = Math.abs(actualCal - m.targets.calories) / m.targets.calories
                  if (calDiff > 0.25) anyOff = true
                }
              })
              const maxCal = membersWithToday.reduce((sum, m) => sum + m.targets.calories, 0) * 1.2
              const scale = 70 / maxCal
              return (
                <DayColumn key={day}>
                  <StackedBar $isToday={isToday}>
                    <BarSegment $height={Math.max(2, totalFat * scale * 10)} $color={MACRO_COLORS.fat} />
                    <BarSegment $height={Math.max(2, totalCarbs * scale * 3)} $color={MACRO_COLORS.carbs} />
                    <BarSegment $height={Math.max(2, totalProt * scale * 5)} $color={MACRO_COLORS.protein} />
                    <BarSegment $height={Math.max(2, totalCal * scale)} $color={MACRO_COLORS.calories} />
                  </StackedBar>
                  {anyOff && <AmberDot />}
                  <DayLabel $isToday={isToday}>{day}</DayLabel>
                </DayColumn>
              )
            })}
          </WeekChart>
        </WeekSection>
      </>
    )
  }

  // ─── Individual View ──────────────────────────────────────────────

  function renderIndividual() {
    if (!activeMember) return null
    const memberExtras = extrasMap[activeMember.id] || { extras: [], total: { calories: 0, protein: 0, carbs: 0, fat: 0 } }
    const status = getMemberStatus(activeMember, memberExtras.total)
    const today = activeMember.weeklyActuals?.[todayIndex] || activeMember.weeklyActuals?.[0] || { calories: 0, protein: 0, carbs: 0, fat: 0, meals: [] }
    const insight = insights[activeMember.id]

    const showAddButton = activeMember.allowPhotoMacroLogging !== false

    return (
      <>
        <DateNav>
          <DateNavArrow onClick={() => navigateDate(-1)}>&#8592;</DateNavArrow>
          <DateNavLabel>{formatDateDisplay(selectedDate)}</DateNavLabel>
          <DateNavArrow
            onClick={() => navigateDate(1)}
            $disabled={selectedDate >= new Date().toISOString().slice(0, 10)}
            disabled={selectedDate >= new Date().toISOString().slice(0, 10)}
          >&#8594;</DateNavArrow>
        </DateNav>

        <MemberSwitcher>
          {membersWithToday.map(m => (
            <MemberChip
              key={m.id}
              $active={m.id === activeMemberId}
              onClick={() => { setActiveMemberId(m.id); setSubTab('today'); resetLogFlow() }}
            >
              <ChipDot $color={m.color} />
              {m.name}
            </MemberChip>
          ))}
        </MemberSwitcher>

        <MemberHeader>
          <AvatarCircle $color={activeMember.color} style={{ width: 48, height: 48, fontSize: 18 }}>
            {activeMember.initial}
          </AvatarCircle>
          <MemberHeaderInfo>
            <MemberHeaderName>{activeMember.name}</MemberHeaderName>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AgeBadge>{activeMember.ageGroup}</AgeBadge>
              <GoalsList>{activeMember.healthGoals.join(', ')}</GoalsList>
            </div>
          </MemberHeaderInfo>
          <StatusBadge $status={status}>{getStatusLabel(status)}</StatusBadge>
        </MemberHeader>

        <SubTabWrapper>
          <SubTab $active={subTab === 'today'} onClick={() => setSubTab('today')}>Today</SubTab>
          <SubTab $active={subTab === 'history'} onClick={() => setSubTab('history')}>History</SubTab>
        </SubTabWrapper>

        {subTab === 'history' ? (
          <>
            <SectionTitle>This week</SectionTitle>
            <BreakdownTable>
              {activeMember.weeklyActuals.map((day, i) => {
                const isToday = i === todayIndex
                const isPast = i < todayIndex
                const dateStr = getDayDate(i)
                const cacheKey = `${activeMember.id}:${dateStr}`
                const dayExtras = isToday ? memberExtras.total : { calories: 0, protein: 0, carbs: 0, fat: 0 }
                const hasData = day.calories > 0 || (isToday && memberExtras.total.calories > 0)
                const anyOff = hasData && ['calories', 'protein', 'carbs', 'fat'].some(key => {
                  const actual = day[key] + (dayExtras[key] || 0)
                  const diff = Math.abs(actual - activeMember.targets[key]) / activeMember.targets[key]
                  return diff > 0.25
                })
                const isOpen = expandedDay === i
                const canExpand = isToday || isPast

                // Resolve entries for the expanded view
                const expandedEntries = isToday
                  ? memberExtras.extras
                  : (weekExtrasCache[cacheKey] || [])
                const isLoadingEntries = !isToday && weekExtrasCache[cacheKey] === null

                return (
                  <div key={day.day}>
                    <ClickableBreakdownRow
                      onClick={canExpand ? () => handleDayExpand(i) : undefined}
                      style={{ cursor: canExpand ? 'pointer' : 'default' }}
                    >
                      <BreakdownRow $isToday={isToday}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '36px' }}>
                          <DayName>{day.day}</DayName>
                          {showAddButton && canExpand && (
                            <InlinePlusButton
                              aria-label={`Log food for ${day.day}`}
                              onClick={e => { e.stopPropagation(); setSubTab('today'); handleLogForDay(i) }}
                            >
                              +
                            </InlinePlusButton>
                          )}
                        </div>
                        <MealChips>
                          {day.meals.map((meal, mi) => (
                            <MealChip key={mi} $color={MEAL_COLORS[mi] || '#5F5E5A'}>{meal}</MealChip>
                          ))}
                          {isToday && memberExtras.extras.length > 0 && (
                            <MealChip $color="#7F77DD">
                              +{memberExtras.extras.length} extra{memberExtras.extras.length !== 1 ? 's' : ''}
                            </MealChip>
                          )}
                        </MealChips>
                        <DayMacroBarGroup style={{ flex: 2 }}>
                          {['protein', 'calories', 'carbs', 'fat'].map(key => {
                            const actual = day[key] + (isToday ? (dayExtras[key] || 0) : 0)
                            const pct = activeMember.targets[key] > 0
                              ? (actual / activeMember.targets[key]) * 100
                              : 0
                            const unit = key === 'calories' ? ' cal' : 'g'
                            return (
                              <DayMacroBarRow key={key}>
                                <DayMacroBarLabel>{MACRO_LABELS[key]}</DayMacroBarLabel>
                                <DayMacroBarTrack>
                                  <DayMacroBarFill $pct={pct} $color={MACRO_COLORS[key]} $over={pct > 110} />
                                </DayMacroBarTrack>
                                <DayMacroBarValue>{actual}{unit}</DayMacroBarValue>
                              </DayMacroBarRow>
                            )
                          })}
                        </DayMacroBarGroup>
                        <FlagIcon>{anyOff ? '⚠' : ''}</FlagIcon>
                        {canExpand && <DayChevron $open={isOpen}>&#9660;</DayChevron>}
                      </BreakdownRow>
                    </ClickableBreakdownRow>

                    {isOpen && (
                      <DayExpandedSection>
                        {isLoadingEntries ? (
                          <DayExpandedEmpty>Loading...</DayExpandedEmpty>
                        ) : expandedEntries.length === 0 ? (
                          <DayExpandedEmpty>Nothing logged for this day</DayExpandedEmpty>
                        ) : (
                          ['breakfast', 'lunch', 'dinner', 'snack'].map(mealType => {
                            const mealColors = { breakfast: '#BA7517', lunch: '#1D9E75', dinner: '#7F77DD', snack: '#185FA5' }
                            const mealLabels = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' }
                            const entries = expandedEntries.filter(e => e.meal_time === mealType)
                            if (entries.length === 0) return null
                            return (
                              <DayExpandedMealGroup key={mealType}>
                                <DayExpandedMealTitle $color={mealColors[mealType]}>
                                  {mealLabels[mealType]}
                                </DayExpandedMealTitle>
                                {entries.map((entry, idx) => (
                                  <DayExpandedEntry key={entry.id || idx}>
                                    <span>{entry.food_name}</span>
                                    <DayExpandedEntryMacros>
                                      {entry.calories} cal · {entry.protein}g P · {entry.carbs}g C · {entry.fat}g F
                                    </DayExpandedEntryMacros>
                                  </DayExpandedEntry>
                                ))}
                              </DayExpandedMealGroup>
                            )
                          })
                        )}
                      </DayExpandedSection>
                    )}
                  </div>
                )
              })}
            </BreakdownTable>
            <MacroHistory memberId={activeMember.id} memberName={activeMember.name} targets={activeMember.targets} />
          </>
        ) : (
          <>
            {/* Logging flow steps */}
            {logStep === 'choose' && (
              <LogChoiceSheet onClick={resetLogFlow}>
                <LogChoiceCard onClick={e => e.stopPropagation()}>
                  <LogChoiceHandle />
                  <LogChoiceTitle>Log food</LogChoiceTitle>
                  <LogChoiceOption onClick={() => setLogStep('photo')}>
                    <LogChoiceIcon>&#x1F4F7;</LogChoiceIcon>
                    Take a photo
                  </LogChoiceOption>
                  <LogChoiceOption onClick={() => setLogStep('manual')}>
                    <LogChoiceIcon>&#x270F;&#xFE0F;</LogChoiceIcon>
                    Add manually
                  </LogChoiceOption>
                  <LogChoiceCancel onClick={resetLogFlow}>Cancel</LogChoiceCancel>
                </LogChoiceCard>
              </LogChoiceSheet>
            )}

            {logStep === 'manual' && (
              <ManualFoodEntry
                onSave={handleManualSave}
                onCancel={resetLogFlow}
                saving={saving}
                initialMealType={preselectedMealTime}
              />
            )}

            {logStep === 'photo' && (
              <FoodPhotoSheet
                onImageSelected={handleImageSelected}
                onClose={resetLogFlow}
              />
            )}

            {logStep === 'analyzing' && (
              <AnalyzingCard>
                <AnalyzingIcon>&#x1F916;</AnalyzingIcon>
                <AnalyzingText>
                  {foodAnalysis?.label_found
                    ? 'Koda is reading the label...'
                    : 'Koda is estimating the nutrition...'}
                </AnalyzingText>
              </AnalyzingCard>
            )}

            {logStep === 'mealTime' && (
              <MealTimePicker
                onSelect={handleMealTimeSelected}
                onCancel={resetLogFlow}
              />
            )}

            {logStep === 'review' && foodAnalysis && (
              <FoodReviewCard
                analysis={foodAnalysis}
                mealTime={selectedMealTime}
                imagePreview={selectedImage?.preview}
                memberName={activeMember.name}
                onConfirm={handleConfirmLog}
                onCancel={resetLogFlow}
                saving={saving}
              />
            )}

            {/* Normal view when not in logging flow */}
            {!logStep && (
              <>
                <MacroGrid>
                  {['protein', 'calories', 'carbs', 'fat'].map(key => {
                    const mealValue = today[key]
                    const extrasValue = memberExtras.total[key] || 0
                    const totalValue = mealValue + extrasValue
                    const target = activeMember.targets[key]
                    const pct = Math.round((totalValue / target) * 100)
                    const over = pct > 100
                    const unit = key === 'calories' ? ' cal' : 'g'
                    return (
                      <MacroCard key={key}>
                        <MacroCardTitle>{MACRO_LABELS[key]}</MacroCardTitle>
                        <MacroCardValue $color={MACRO_COLORS[key]} $over={over}>
                          {totalValue}{unit}
                        </MacroCardValue>
                        <MacroCardTarget>Target: {target}{unit}</MacroCardTarget>
                        <MacroCardBar>
                          <MacroCardBarFill $pct={pct} $color={MACRO_COLORS[key]} $over={over} />
                        </MacroCardBar>
                        <MacroCardPct>{pct}%</MacroCardPct>
                      </MacroCard>
                    )
                  })}
                </MacroGrid>

                {/* Source breakdown */}
                {memberExtras.total.calories > 0 && (
                  <SourceBreakdown>
                    <SourceLine>
                      <SourceDot $color="#1D9E75" />
                      From meals: {today.calories} kcal
                    </SourceLine>
                    <SourceLine>
                      <SourceDot $color="#7F77DD" />
                      From extras: {memberExtras.total.calories} kcal
                    </SourceLine>
                  </SourceBreakdown>
                )}

                {/* Food log by meal */}
                <SectionTitle>Food log</SectionTitle>
                <FoodLogSection>
                  {['breakfast', 'lunch', 'dinner', 'snack'].map(mealType => {
                    const entries = memberExtras.extras.filter(e => e.meal_time === mealType)
                    const mealColors = { breakfast: '#BA7517', lunch: '#1D9E75', dinner: '#7F77DD', snack: '#185FA5' }
                    const mealLabels = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snacks' }
                    const mealCals = entries.reduce((sum, e) => sum + (e.calories || 0), 0)
                    return (
                      <MealSection key={mealType}>
                        <MealSectionHeader>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <MealSectionTitle $color={mealColors[mealType]}>{mealLabels[mealType]}</MealSectionTitle>
                            {showAddButton && (
                              <InlinePlusButton
                                aria-label={`Log food for ${mealLabels[mealType]}`}
                                onClick={() => handleLogForMealType(mealType)}
                              >
                                +
                              </InlinePlusButton>
                            )}
                          </div>
                          {mealCals > 0 && <MealSectionCal>{mealCals} kcal</MealSectionCal>}
                        </MealSectionHeader>
                        {entries.length === 0 ? (
                          <EmptyMeal>Nothing logged</EmptyMeal>
                        ) : (
                          entries.map((entry, idx) => (
                            <FoodEntry key={entry.id || idx}>
                              <FoodEntryName>{entry.food_name}</FoodEntryName>
                              <FoodEntryMacros>
                                {entry.calories} cal · {entry.protein}g P · {entry.carbs}g C · {entry.fat}g F
                              </FoodEntryMacros>
                            </FoodEntry>
                          ))
                        )}
                      </MealSection>
                    )
                  })}
                </FoodLogSection>

                <InsightCard $status={status}>
                  {insight?.loading ? (
                    <InsightLoading>Generating nutrition insight...</InsightLoading>
                  ) : insight?.text ? (
                    <InsightText>{insight.text}</InsightText>
                  ) : (
                    <InsightLoading>Loading insight...</InsightLoading>
                  )}
                </InsightCard>

                {showAddButton && (
                  <LogFoodButton onClick={() => setLogStep('choose')}>
                    + Log food
                  </LogFoodButton>
                )}
              </>
            )}
          </>
        )}
      </>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <>
      <PageHeader>
        <Title>Macros</Title>
      </PageHeader>

      <ToggleWrapper>
        <ToggleOption $active={view === 'household'} onClick={() => setView('household')}>
          Household
        </ToggleOption>
        <ToggleOption $active={view === 'individual'} onClick={() => setView('individual')}>
          Individual
        </ToggleOption>
      </ToggleWrapper>

      {view === 'household' ? renderHousehold() : renderIndividual()}

      {toast && <Toast>{toast}</Toast>}
    </>
  )
}
