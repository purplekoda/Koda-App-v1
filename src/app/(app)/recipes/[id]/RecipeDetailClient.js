'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styled from 'styled-components';
import RecipeForm from '@/components/recipes/RecipeForm';
import Modal from '@/components/recipes/Modal';
import IngredientStoreAssignment from '@/components/recipes/IngredientStoreAssignment';
import NutritionPanel from '@/components/recipes/NutritionPanel';
import {
  checkFaithConflicts,
  getAlcoholSubstitutions,
  getSubstitutionLabel,
} from '@/lib/faith-conflict-check';
import {
  updateRecipeAction,
  deleteRecipeAction,
  generateRecipeImageAction,
  fetchNutritionAction,
} from '../actions';
'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styled, { keyframes, css } from 'styled-components'
import useWakeLock from '@/hooks/useWakeLock'
import useCookingAssistant, { parseSteps } from '@/hooks/useCookingAssistant'
import RecipeForm from '@/components/recipes/RecipeForm'
import Modal from '@/components/recipes/Modal'
import IngredientStoreAssignment from '@/components/recipes/IngredientStoreAssignment'
import NutritionPanel from '@/components/recipes/NutritionPanel'
import { checkFaithConflicts, getAlcoholSubstitutions, getSubstitutionLabel } from '@/lib/faith-conflict-check'
import { updateRecipeAction, deleteRecipeAction, generateRecipeImageAction, fetchNutritionAction } from '../actions'

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  text-decoration: none;
  margin-bottom: ${({ theme }) => theme.spacing.lg};

  &:hover {
    color: ${({ theme }) => theme.colors.textPrimary};
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  flex-wrap: wrap;
`;

const TitleBlock = styled.div`
  flex: 1;
  min-width: 200px;
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 ${({ theme }) => theme.spacing.xs} 0;
`;

const Description = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0;
  line-height: 1.5;
`;

const Actions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const Button = styled.button`
  padding: 8px 16px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  min-height: 36px;
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};

  &:hover {
    background: ${({ theme }) => theme.colors.borderLight};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DangerButton = styled(Button)`
  color: ${({ theme }) => theme.colors.coral};
  border-color: ${({ theme }) => theme.colors.coralMid};

  &:hover {
    background: ${({ theme }) => theme.colors.coralLight};
  }
`;

const MetaRow = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xl};
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  flex-wrap: wrap;
`;

const MetaItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const MetaLabel = styled.span`
  font-size: 11px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const MetaValue = styled.span`
  font-size: 15px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const Section = styled.section`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const SectionTitle = styled.h2`
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 ${({ theme }) => theme.spacing.md} 0;
`;

const IngredientList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const IngredientItem = styled.li`
  display: flex;
  justify-content: space-between;
  padding: 10px 14px;
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 14px;
`;

const IngredientName = styled.span`
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const IngredientQty = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const Instructions = styled.p`
  white-space: pre-wrap;
  font-size: 14px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.textPrimary};
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.lg};
  margin: 0;
`;

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: ${({ theme }) => theme.spacing.md};
`;

const Tag = styled.span`
  padding: 4px 12px;
  font-size: 12px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.tealLight};
  color: ${({ theme }) => theme.colors.tealDark};
`;

const RecipeImage = styled.img`
  width: 100%;
  max-height: 360px;
  object-fit: cover;
  border-radius: ${({ theme }) => theme.radii.lg};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

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
`;

const FaithConflictBanner = styled.div`
  background: #FEF3C7;
  border: 1px solid #F59E0B;
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const ConflictTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #92400E;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const ConflictItem = styled.div`
  font-size: 13px;
  color: #78350F;
  line-height: 1.5;
`;

const SubstitutionSection = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.spacing.lg};
  margin-top: ${({ theme }) => theme.spacing.lg};
`;

const SubstitutionTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const SubstitutionItem = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.5;
  padding: 4px 0;
`;

const WakeLockRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: 12px ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const WakeLockIcon = styled.span`
  font-size: 18px;
  line-height: 1;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const WakeLockLabel = styled.span`
  flex: 1;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textPrimary};
  display: flex;
  align-items: center;
  gap: 8px;
`

const ActiveDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.amber};
  animation: pulse 2s ease-in-out infinite;

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
`

const ToggleSwitch = styled.button`
  width: 44px;
  height: 24px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  position: relative;
  background: ${({ $active, theme }) => $active ? theme.colors.teal : theme.colors.borderLight};
  border: 0.5px solid ${({ $active, theme }) => $active ? theme.colors.teal : theme.colors.border};
  transition: background 0.2s;

  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: ${({ $active }) => $active ? '22px' : '2px'};
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: white;
    box-shadow: 0 1px 3px rgba(0,0,0,0.15);
    transition: left 0.2s;
  }
`

// ── Cooking Mode Styled Components ───────────────────

const cookingPulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.15); }
`

const CookingModeBar = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: 12px ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.tealLight};
  border: 1px solid ${({ theme }) => theme.colors.teal};
  border-radius: ${({ theme }) => theme.radii.lg};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const CookingDot = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.teal};
  animation: ${cookingPulse} 2s ease-in-out infinite;
  flex-shrink: 0;
`

const CookingLabel = styled.span`
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.tealDark};
`

const CookingStepBadge = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.teal};
  background: white;
  padding: 2px 10px;
  border-radius: ${({ theme }) => theme.radii.pill};
`

const StartCookingButton = styled.button`
  width: 100%;
  padding: 14px 24px;
  border: none;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.teal};
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  transition: opacity 0.15s;

  &:hover { opacity: 0.9; }
  &:active { opacity: 0.8; }
`

const StopCookingButton = styled(StartCookingButton)`
  background: ${({ theme }) => theme.colors.coral};
`

const StepList = styled.ol`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`

const StepItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.md};
  padding: 12px 14px;
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 14px;
  line-height: 1.6;
  transition: border-color 0.2s, opacity 0.2s;

  ${({ $active, theme }) => $active && css`
    border-left: 3px solid ${theme.colors.teal};
    font-weight: 500;
    background: ${theme.colors.tealLight};
  `}

  ${({ $completed }) => $completed && css`
    opacity: 0.6;
  `}
`

const StepNumber = styled.span`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
  background: ${({ $active, $completed, theme }) =>
    $active ? theme.colors.teal
    : $completed ? theme.colors.tealLight
    : theme.colors.borderLight};
  color: ${({ $active, $completed, theme }) =>
    $active ? 'white'
    : $completed ? theme.colors.teal
    : theme.colors.textMuted};
`

const StepText = styled.span`
  flex: 1;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const StepCheck = styled.span`
  color: ${({ theme }) => theme.colors.teal};
  font-size: 16px;
  flex-shrink: 0;
`

// ── Floating Bottom Bar ──────────────────────────────

const FloatingBar = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: ${({ theme }) => theme.colors.surface};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding: 12px ${({ theme }) => theme.spacing.lg};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  z-index: 900;
  box-shadow: 0 -2px 12px rgba(0,0,0,0.08);

  @supports (padding-bottom: env(safe-area-inset-bottom)) {
    padding-bottom: calc(12px + env(safe-area-inset-bottom));
  }
`

const FloatingStepInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
`

const FloatingStepLabel = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const FloatingStatus = styled.span`
  font-size: 12px;
  color: ${({ $listening, theme }) => $listening ? theme.colors.teal : theme.colors.textMuted};
  font-weight: ${({ $listening }) => $listening ? 600 : 400};
  display: flex;
  align-items: center;
  gap: 4px;
`

const FloatingStatusDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.teal};
  animation: ${cookingPulse} 1.5s ease-in-out infinite;
`

const NavButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: ${({ theme }) => theme.radii.md};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover { background: ${({ theme }) => theme.colors.borderLight}; }
  &:disabled { opacity: 0.3; cursor: not-allowed; }
`

// ── Koda Response Bubble ─────────────────────────────

const ResponseBubble = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.teal};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  font-size: 14px;
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.textPrimary};

  @media (min-width: 769px) {
    display: none;
  }
`

const ResponseLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.teal};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
`

const TranscriptBubble = styled.div`
  background: ${({ theme }) => theme.colors.grayLight};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-style: italic;
`

// ── Page bottom padding when floating bar is visible ──

const CookingPadding = styled.div`
  height: 80px;
`

// ── Split-screen layout ──────────────────────────────

const LayoutWrapper = styled.div`
  @media (min-width: 769px) {
    ${({ $split }) => $split && css`
      display: grid;
      grid-template-columns: 60fr 40fr;
      gap: 24px;
      align-items: start;
    `}
  }
`

// Suppress "unknown prop" warning — RecipeColumn has no custom props
const RecipeColumn = styled.div``

const ChatColumn = styled.div`
  display: none;

  @media (min-width: 769px) {
    display: flex;
    flex-direction: column;
    position: sticky;
    top: 20px;
    max-height: calc(100vh - 120px);
  }
`

const ChatPanelBox = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 420px;
  border: 1px solid ${({ theme }) => theme.colors.teal};
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.surface};
`

const ChatPanelHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: 12px ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.teal};
  color: white;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
`

const MessageThread = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`

const MessageBubble = styled.div`
  max-width: 88%;
  padding: 8px 12px;
  border-radius: ${({ theme }) => theme.radii.md};
  font-size: 13px;
  line-height: 1.55;

  ${({ $role, theme }) => $role === 'koda' ? css`
    align-self: flex-start;
    background: ${theme.colors.tealLight};
    border-left: 3px solid ${theme.colors.teal};
    color: ${theme.colors.textPrimary};
  ` : css`
    align-self: flex-end;
    background: ${theme.colors.borderLight};
    color: ${theme.colors.textSecondary};
    font-style: italic;
  `}
`

const ChatStatusBar = styled.div`
  padding: 10px ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.tealLight};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.tealDark};
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
`

// ── Mobile slide-up drawer ───────────────────────────

const MobileDrawer = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: ${({ $height }) => $height}vh;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.15);
  transform: translateY(${({ $open }) => $open ? '0' : '100%'});
  transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
  z-index: 800;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  @media (min-width: 769px) {
    display: none;
  }
`

const DrawerHandleBar = styled.div`
  padding: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  cursor: grab;
  touch-action: none;
`

const DrawerHandle = styled.div`
  width: 40px;
  height: 4px;
  border-radius: 2px;
  background: ${({ theme }) => theme.colors.border};
`

// ── Mobile floating wake-phrase chip ────────────────

const WakeChip = styled.div`
  position: fixed;
  bottom: calc(72px + env(safe-area-inset-bottom, 0px));
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.65);
  color: white;
  padding: 7px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  z-index: 850;
  white-space: nowrap;
  pointer-events: none;

  @media (min-width: 769px) {
    display: none;
  }
`

export default function RecipeDetailClient({ initialRecipe, groceryPreferences, faithPractices }) {
  const router = useRouter();
  const [recipe, setRecipe] = useState(initialRecipe);
  const [editOpen, setEditOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [isPending, startTransition] = useTransition();
  const [nutrition, setNutrition] = useState(initialRecipe.nutrition || null);
  const [nutritionLoading, setNutritionLoading] = useState(false);
  const [nutritionError, setNutritionError] = useState(false);
  const router = useRouter()
  const [recipe, setRecipe] = useState(initialRecipe)
  const [editOpen, setEditOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const [isPending, startTransition] = useTransition()
  const [nutrition, setNutrition] = useState(initialRecipe.nutrition || null)
  const [nutritionLoading, setNutritionLoading] = useState(false)
  const [nutritionError, setNutritionError] = useState(false)
  const { isSupported: wakeLockSupported, isActive: wakeLockActive, toggle: toggleWakeLock } = useWakeLock()
  const cooking = useCookingAssistant(recipe)
  const activeStepRef = useRef(null)

  // Mobile drawer state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerHeight, setDrawerHeight] = useState(50) // percentage of viewport
  const drawerHeightRef = useRef(50)
  const dragStartY = useRef(null)
  const dragStartHeight = useRef(null)

  // Chat panel message thread scroll refs
  const desktopThreadRef = useRef(null)
  const drawerThreadRef = useRef(null)

  // Auto-scroll to the active step when it changes
  useEffect(() => {
    if (cooking.isActive && activeStepRef.current) {
      activeStepRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [cooking.isActive, cooking.currentStep])

  // Lift the floating chat bar above the cooking step bar when cooking mode is active
  useEffect(() => {
    const root = document.documentElement
    if (cooking.isActive) {
      root.style.setProperty('--cooking-bar-offset', '64px')
    } else {
      root.style.removeProperty('--cooking-bar-offset')
    }
    return () => root.style.removeProperty('--cooking-bar-offset')
  }, [cooking.isActive])

  // Open mobile drawer when wake phrase is detected
  useEffect(() => {
    if (cooking.wakeWordStatus === 'listening') {
      setDrawerOpen(true) // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [cooking.wakeWordStatus])

  // Reset drawer when cooking stops
  useEffect(() => {
    if (!cooking.isActive) {
      setDrawerOpen(false) // eslint-disable-line react-hooks/set-state-in-effect
      setDrawerHeight(50) // eslint-disable-line react-hooks/set-state-in-effect
      drawerHeightRef.current = 50
    }
  }, [cooking.isActive])

  // Auto-scroll both message threads to bottom when messages change
  useEffect(() => {
    if (desktopThreadRef.current) {
      desktopThreadRef.current.scrollTop = desktopThreadRef.current.scrollHeight
    }
    if (drawerThreadRef.current) {
      drawerThreadRef.current.scrollTop = drawerThreadRef.current.scrollHeight
    }
  }, [cooking.messages])

  // Drawer drag handlers
  function handleDrawerTouchStart(e) {
    dragStartY.current = e.touches[0].clientY
    dragStartHeight.current = drawerHeightRef.current
  }

  function handleDrawerTouchMove(e) {
    if (dragStartY.current === null) return
    const dy = dragStartY.current - e.touches[0].clientY
    const windowHeight = window.innerHeight
    const deltaPercent = (dy / windowHeight) * 100
    const newHeight = Math.max(20, Math.min(85, dragStartHeight.current + deltaPercent))
    drawerHeightRef.current = newHeight
    setDrawerHeight(newHeight)
  }

  function handleDrawerTouchEnd() {
    const h = drawerHeightRef.current
    if (h < 30) {
      setDrawerOpen(false)
      setDrawerHeight(50)
      drawerHeightRef.current = 50
    } else if (h > 65) {
      setDrawerHeight(80)
      drawerHeightRef.current = 80
    } else {
      setDrawerHeight(50)
      drawerHeightRef.current = 50
    }
    dragStartY.current = null
  }

  // Faith-based conflict detection
  const faithConflict = faithPractices?.follows_faith_based_diet
    ? checkFaithConflicts(recipe.ingredients || [], faithPractices)
    : { hasConflict: false, conflicts: [] };
  const alcoholSubs = faithPractices?.follows_faith_based_diet
    ? getAlcoholSubstitutions(recipe.ingredients || [])
    : { hasAlcohol: false, substitutions: [] };
  const subLabel = getSubstitutionLabel(faithPractices);

  useEffect(() => {
    if (nutrition || nutritionLoading) return;
    setNutritionLoading(true);
    fetchNutritionAction(recipe.id)
      .then((result) => {
        if (result.success && result.data) {
          setNutrition(result.data);
        } else {
          setNutritionError(true);
        }
      })
      .catch(() => setNutritionError(true))
      .finally(() => setNutritionLoading(false));
  }, [nutrition]); // eslint-disable-line react-hooks/exhaustive-deps

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function handleShare() {
    const lines = [recipe.name];

    const meta = [];
    const total = (Number(recipe.prep_time_minutes) || 0) + (Number(recipe.cook_time_minutes) || 0);
    if (total > 0) meta.push(`Total time: ${total} min`);
    if (recipe.servings) meta.push(`Serves: ${recipe.servings}`);
    if (meta.length) lines.push(meta.join(' · '));

    if (recipe.description) lines.push('', recipe.description);

    if (recipe.ingredients?.length) {
      lines.push('', 'Ingredients:');
      recipe.ingredients.forEach((ing) => {
        lines.push(`• ${[ing.quantity, ing.name].filter(Boolean).join(' ')}`);
      });
    }

    if (recipe.instructions) {
      lines.push('', 'Instructions:', recipe.instructions);
    }

    lines.push('', '— Shared from Koda');
    const text = lines.join('\n');

    try {
      if (navigator.share) {
        await navigator.share({ title: recipe.name, text });
      } else {
        await navigator.clipboard.writeText(text);
        showToast('Recipe copied to clipboard');
      }
    } catch (err) {
      if (err?.name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(text);
          showToast('Recipe copied to clipboard');
        } catch {
          showToast('Could not share recipe');
        }
      }
    }
  }

  async function handleUpdate(payload) {
    return new Promise((resolve) => {
      startTransition(async () => {
        const result = await updateRecipeAction(recipe.id, payload);
        if (result.success && result.data) {
          setRecipe(result.data);
          setEditOpen(false);
          showToast('Recipe updated');
          // If ingredients changed, re-fetch nutrition
          if (payload.ingredients) {
            setNutrition(null);
            setNutritionError(false);
          }
        }
        resolve(result);
      });
    });
  }

  function handleDelete() {
    if (!confirm(`Delete "${recipe.name}"? This will permanently remove it from your Recipe Box.`))
      return;
    if (!confirm(`Are you sure you want to delete "${recipe.name}"? This cannot be undone.`))
      return;
    startTransition(async () => {
      const result = await deleteRecipeAction(recipe.id);
      if (result.success) {
        router.push('/recipes');
      } else {
        showToast(result.error || 'Could not delete');
      }
    });
  }

  const prep = recipe.prep_time_minutes;
  const cook = recipe.cook_time_minutes;
  const total = (Number(prep) || 0) + (Number(cook) || 0);

  // Shared chat panel content — rendered in both desktop sidebar and mobile drawer
  const chatContent = (threadRef) => (
    <>
      <ChatPanelHeader>
        <span aria-hidden="true">&#x1F3A4;</span>
        Koda &mdash; Cooking Assistant
      </ChatPanelHeader>
      <MessageThread ref={threadRef}>
        {cooking.messages.map((m, i) => (
          <MessageBubble key={i} $role={m.role}>
            {m.text}
          </MessageBubble>
        ))}
      </MessageThread>
      <ChatStatusBar>
        {cooking.wakeWordStatus === 'listening' ? (
          <>
            <FloatingStatusDot />
            Listening...
          </>
        ) : cooking.wakeWordStatus === 'processing' ? (
          'Processing...'
        ) : (
          'Say \u201CHey Koda\u201D for help'
        )}
      </ChatStatusBar>
    </>
  )

  return (
    <>
      <BackLink href="/recipes">{'\u2190 Recipe Box'}</BackLink>

      {recipe.image_url && (
        <RecipeImage
          src={recipe.image_url}
          alt={recipe.name}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      )}

      <Header>
        <TitleBlock>
          <Title>{recipe.name}</Title>
          {recipe.description && <Description>{recipe.description}</Description>}
          {recipe.tags && recipe.tags.length > 0 && (
            <TagRow>
              {recipe.tags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </TagRow>
          )}
        </TitleBlock>
        <Actions>
          <Button onClick={handleShare}>Share</Button>
          <Button onClick={() => setEditOpen(true)} disabled={isPending}>
            Edit
          </Button>
          <DangerButton onClick={handleDelete} disabled={isPending}>
            Delete
          </DangerButton>
        </Actions>
      </Header>

      {faithConflict.hasConflict && (
        <FaithConflictBanner>
          <ConflictTitle>
            <span role="img" aria-label="warning">
              &#x26A0;&#xFE0F;
            </span>
            Faith-based dietary conflict
          </ConflictTitle>
          {faithConflict.conflicts.map((c, i) => (
            <ConflictItem key={i}>
              <strong>{c.ingredient}</strong> &mdash; {c.reason} ({c.practice})
            </ConflictItem>
          ))}
        </FaithConflictBanner>
      )}
      {/* ── Main layout — splits into two columns on desktop when cooking ── */}
      <LayoutWrapper $split={cooking.isActive}>
        <RecipeColumn>
          <BackLink href="/recipes">{'\u2190 Recipe Box'}</BackLink>

          {recipe.image_url && (
            <RecipeImage
              src={recipe.image_url}
              alt={recipe.name}
              onError={e => { e.currentTarget.style.display = 'none' }}
            />
          )}

          <Header>
            <TitleBlock>
              <Title>{recipe.name}</Title>
              {recipe.description && <Description>{recipe.description}</Description>}
              {recipe.tags && recipe.tags.length > 0 && (
                <TagRow>
                  {recipe.tags.map(tag => <Tag key={tag}>{tag}</Tag>)}
                </TagRow>
              )}
            </TitleBlock>
            <Actions>
              <Button onClick={handleShare}>Share</Button>
              <Button onClick={() => setEditOpen(true)} disabled={isPending}>Edit</Button>
              <DangerButton onClick={handleDelete} disabled={isPending}>Delete</DangerButton>
            </Actions>
          </Header>

          {faithConflict.hasConflict && (
            <FaithConflictBanner>
              <ConflictTitle>
                <span role="img" aria-label="warning">&#x26A0;&#xFE0F;</span>
                Faith-based dietary conflict
              </ConflictTitle>
              {faithConflict.conflicts.map((c, i) => (
                <ConflictItem key={i}>
                  <strong>{c.ingredient}</strong> &mdash; {c.reason} ({c.practice})
                </ConflictItem>
              ))}
            </FaithConflictBanner>
          )}

          {(prep || cook || recipe.servings) && (
            <MetaRow>
              {prep !== null && prep !== undefined && (
                <MetaItem>
                  <MetaLabel>Prep</MetaLabel>
                  <MetaValue>{prep} min</MetaValue>
                </MetaItem>
              )}
              {cook !== null && cook !== undefined && (
                <MetaItem>
                  <MetaLabel>Cook</MetaLabel>
                  <MetaValue>{cook} min</MetaValue>
                </MetaItem>
              )}
              {total > 0 && (
                <MetaItem>
                  <MetaLabel>Total</MetaLabel>
                  <MetaValue>{total} min</MetaValue>
                </MetaItem>
              )}
              {recipe.servings && (
                <MetaItem>
                  <MetaLabel>Servings</MetaLabel>
                  <MetaValue>{recipe.servings}</MetaValue>
                </MetaItem>
              )}
            </MetaRow>
          )}

          {/* Cooking Mode Status Bar */}
          {cooking.isActive && (
            <CookingModeBar>
              <CookingDot />
              <CookingLabel>Cooking mode on</CookingLabel>
              <CookingStepBadge>Step {cooking.currentStep} of {cooking.totalSteps}</CookingStepBadge>
            </CookingModeBar>
          )}

          {/* Start / Stop Cooking Button */}
          {cooking.totalSteps > 0 && (
            cooking.isActive ? (
              <StopCookingButton onClick={cooking.stopCooking}>
                Stop cooking
              </StopCookingButton>
            ) : (
              <StartCookingButton onClick={cooking.startCooking}>
                {'\uD83C\uDF73'} Start cooking
              </StartCookingButton>
            )
          )}

          {/* Wake lock toggle (hidden when cooking mode manages it) */}
          {!cooking.isActive && wakeLockSupported && (
            <WakeLockRow>
              <WakeLockIcon>{'\u2600'}</WakeLockIcon>
              <WakeLockLabel>
                {wakeLockActive ? 'Screen is staying awake' : 'Keep screen awake'}
                {wakeLockActive && <ActiveDot />}
              </WakeLockLabel>
              <ToggleSwitch
                $active={wakeLockActive}
                onClick={async () => {
                  const success = await toggleWakeLock()
                  if (!success && !wakeLockActive) {
                    showToast('Could not keep screen awake — your device may not support this.')
                  }
                }}
                aria-label="Toggle screen wake lock"
              />
            </WakeLockRow>
          )}

          {/* Koda's last response — mobile only, hidden when drawer is open */}
          {cooking.isActive && cooking.lastResponse && !drawerOpen && (
            <ResponseBubble>
              <ResponseLabel>Koda</ResponseLabel>
              {cooking.lastResponse}
            </ResponseBubble>
          )}

          {/* Live transcript while listening — mobile only */}
          {cooking.isActive && cooking.transcript && !drawerOpen && (
            <TranscriptBubble>
              {cooking.wakeWordStatus === 'listening' ? `"${cooking.transcript}"` : cooking.transcript}
            </TranscriptBubble>
          )}

          <NutritionPanel
            nutrition={nutrition}
            isEstimated={recipe.nutrition_is_estimated ?? true}
            loading={nutritionLoading}
            error={nutritionError}
          />

          {recipe.ingredients && recipe.ingredients.length > 0 && (
            <Section>
              <SectionTitle>Ingredients</SectionTitle>
              <IngredientList>
                {recipe.ingredients.map((ing, i) => (
                  <IngredientItem key={i}>
                    <IngredientName>{ing.name}</IngredientName>
                    {ing.quantity && <IngredientQty>{ing.quantity}</IngredientQty>}
                  </IngredientItem>
                ))}
              </IngredientList>
              <IngredientStoreAssignment recipe={recipe} groceryPreferences={groceryPreferences} />
            </Section>
          )}

          {/* Instructions — always show as numbered step list */}
          {recipe.instructions && (
            <Section>
              <SectionTitle>Instructions</SectionTitle>
              {(() => {
                const steps = cooking.isActive && cooking.steps.length > 0
                  ? cooking.steps
                  : parseSteps(recipe.instructions)
                return steps.length > 0 ? (
                  <StepList>
                    {steps.map((step, i) => {
                      const stepNum = i + 1
                      const isActive = cooking.isActive && stepNum === cooking.currentStep
                      const isCompleted = cooking.isActive && cooking.completedSteps.has(stepNum)
                      return (
                        <StepItem
                          key={i}
                          $active={isActive}
                          $completed={isCompleted && !isActive}
                          ref={isActive ? activeStepRef : undefined}
                          onClick={cooking.isActive ? () => cooking.goToStep(stepNum) : undefined}
                          style={cooking.isActive ? { cursor: 'pointer' } : undefined}
                        >
                          <StepNumber $active={isActive} $completed={isCompleted}>
                            {isCompleted && !isActive ? '\u2713' : stepNum}
                          </StepNumber>
                          <StepText>{step}</StepText>
                          {isCompleted && !isActive && <StepCheck>{'\u2713'}</StepCheck>}
                        </StepItem>
                      )
                    })}
                  </StepList>
                ) : (
                  <Instructions>{recipe.instructions}</Instructions>
                )
              })()}
            </Section>
          )}

          {alcoholSubs.hasAlcohol && (
            <SubstitutionSection>
              <SubstitutionTitle>{subLabel}</SubstitutionTitle>
              {alcoholSubs.substitutions.map((s, i) => (
                <SubstitutionItem key={i}>
                  <strong>{s.ingredient}</strong> &rarr; {s.substitute}
                </SubstitutionItem>
              ))}
            </SubstitutionSection>
          )}
        </RecipeColumn>

        {/* ── Desktop / tablet chat panel (≥769px, always visible when cooking) ── */}
        {cooking.isActive && (
          <ChatColumn>
            <ChatPanelBox>
              {chatContent(desktopThreadRef)}
            </ChatPanelBox>
          </ChatColumn>
        )}
      </LayoutWrapper>

      {/* ── Mobile slide-up drawer (<769px) ── */}
      {cooking.isActive && (
        <MobileDrawer $open={drawerOpen} $height={drawerHeight}>
          <DrawerHandleBar
            onTouchStart={handleDrawerTouchStart}
            onTouchMove={handleDrawerTouchMove}
            onTouchEnd={handleDrawerTouchEnd}
          >
            <DrawerHandle />
          </DrawerHandleBar>
          {chatContent(drawerThreadRef)}
        </MobileDrawer>
      )}

      {/* ── Mobile floating wake-phrase reminder (hidden when drawer is open) ── */}
      {cooking.isActive && !drawerOpen && (
        <WakeChip>&#x1F3A4; Say Hey Koda for help</WakeChip>
      )}

      {editOpen && (
        <Modal title="Edit recipe" onClose={() => setEditOpen(false)}>
          <RecipeForm
            initial={recipe}
            onSubmit={handleUpdate}
            onCancel={() => setEditOpen(false)}
            isPending={isPending}
            submitLabel="Save changes"
            onGenerateImage={generateRecipeImageAction}
          />
        </Modal>
      )}

      {toast && <Toast>{toast}</Toast>}

      {/* Floating bottom step-nav bar when cooking */}
      {cooking.isActive && (
        <>
          <CookingPadding />
          <FloatingBar>
            <NavButton
              onClick={cooking.prevStep}
              disabled={cooking.currentStep <= 1}
              aria-label="Previous step"
            >
              {'\u2190'}
            </NavButton>
            <FloatingStepInfo>
              <FloatingStepLabel>
                Step {cooking.currentStep} of {cooking.totalSteps}
              </FloatingStepLabel>
              <FloatingStatus $listening={cooking.wakeWordStatus === 'listening'}>
                {cooking.wakeWordStatus === 'listening' ? (
                  <>
                    <FloatingStatusDot />
                    Listening...
                  </>
                ) : cooking.wakeWordStatus === 'processing' ? (
                  'Got it...'
                ) : (
                  'Say \u201CHey Koda\u201D for help'
                )}
              </FloatingStatus>
            </FloatingStepInfo>
            <NavButton
              onClick={cooking.nextStep}
              disabled={cooking.currentStep >= cooking.totalSteps}
              aria-label="Next step"
            >
              {'\u2192'}
            </NavButton>
          </FloatingBar>
        </>
      )}

      {/* Mic permission modal (rendered by useCookingAssistant) */}
      <cooking.PermissionModal />
    </>
  );
}
