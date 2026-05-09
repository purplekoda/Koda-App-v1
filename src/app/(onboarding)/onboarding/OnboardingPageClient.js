'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import styled from 'styled-components'

import WelcomeStep from '@/components/onboarding/steps/WelcomeStep'
import ModeSelectionStep from '@/components/onboarding/steps/ModeSelectionStep'
import CompletionStep from '@/components/onboarding/steps/CompletionStep'
import OnboardingConversation from '@/components/onboarding/OnboardingConversation'
import ManualStepsFlow from '@/components/onboarding/ManualStepsFlow'

import { determineManualStep } from '@/lib/onboarding-step-mapping'
import {
  saveOnboardingModeAction,
  skipOnboardingAction,
  completeOnboardingAction,
} from './actions'
import {
  switchToManualAction,
  switchToVoiceAction,
} from './partial-data-actions'

// ── Layout ─────────────────────────────────────────────

const PageWrapper = styled.div`
  max-width: 560px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.xl};
  min-height: 100dvh;
  display: flex;
  flex-direction: column;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: ${({ theme }) => theme.spacing.lg};
  }
`

const ErrorBanner = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radii.md};
  background: #FEE2E2;
  color: #991B1B;
  font-size: 13px;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

// ── Phase enum ─────────────────────────────────────────

const PHASE = {
  WELCOME: 'welcome',
  MODE_SELECT: 'mode_select',
  CONVERSATION: 'conversation',
  MANUAL_STEPS: 'manual_steps',
  COMPLETION: 'completion',
}

export default function OnboardingPageClient({ initialData }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState(null)

  // Determine starting phase
  const getInitialPhase = () => {
    // If we have saved conversation history, jump back into conversation
    if (initialData.onboarding_conversation_history?.length > 0) {
      return PHASE.CONVERSATION
    }
    // If mode is manual and has step progress, go to manual steps
    if (initialData.onboarding_mode === 'manual' && (initialData.onboarding_step || 0) > 0) {
      return PHASE.MANUAL_STEPS
    }
    // If mode is already chosen (voice), go to conversation
    if (initialData.onboarding_mode === 'voice') {
      return PHASE.CONVERSATION
    }
    // If there's any progress, go to conversation
    if ((initialData.onboarding_step || 0) > 0) {
      return PHASE.CONVERSATION
    }
    return PHASE.WELCOME
  }

  const [phase, setPhase] = useState(getInitialPhase)
  const [onboardingMode, setOnboardingMode] = useState(initialData.onboarding_mode || 'manual')
  const [completionData, setCompletionData] = useState(null)
  const [partialData, setPartialData] = useState(initialData.onboarding_partial_data || {})
  const [manualContextMessage, setManualContextMessage] = useState(null)
  const [showSavedBanner, setShowSavedBanner] = useState(false)

  // ── Skip handler ──────────────────────────────────────

  const handleSkip = useCallback(() => {
    startTransition(async () => {
      await skipOnboardingAction()
    })
  }, [])

  // ── Switch: Conversation → Manual Steps ───────────────

  const handleSwitchToManual = useCallback((messages, conversationPartialData) => {
    startTransition(async () => {
      setError(null)
      const result = await switchToManualAction({ messages })
      if (result?.success === false) {
        setError(result.error)
        return
      }

      const merged = result.data.partialData || conversationPartialData || {}
      setPartialData(merged)
      setOnboardingMode('manual')
      setShowSavedBanner(true)
      setPhase(PHASE.MANUAL_STEPS)
    })
  }, [])

  // ── Switch: Manual Steps → Conversation ───────────────

  const handleSwitchToVoice = useCallback((currentPartialData) => {
    startTransition(async () => {
      setError(null)
      const result = await switchToVoiceAction(currentPartialData)
      if (result?.success === false) {
        setError(result.error)
        return
      }

      setOnboardingMode('voice')
      setManualContextMessage(result.data.contextMessage || null)
      setPartialData(currentPartialData || {})
      setPhase(PHASE.CONVERSATION)
    })
  }, [])

  // ── Conversation complete handler ─────────────────────

  const handleConversationComplete = useCallback((data) => {
    setCompletionData(data)
    setPhase(PHASE.COMPLETION)
  }, [])

  // ── Manual steps complete handler ─────────────────────

  const handleManualComplete = useCallback((data) => {
    setCompletionData(data)
    setPhase(PHASE.COMPLETION)
  }, [])

  // ── Render ────────────────────────────────────────────

  switch (phase) {
    case PHASE.WELCOME:
      return (
        <PageWrapper>
          {error && <ErrorBanner>{error}</ErrorBanner>}
          <WelcomeStep
            onStart={() => setPhase(PHASE.MODE_SELECT)}
            onSkip={handleSkip}
          />
        </PageWrapper>
      )

    case PHASE.MODE_SELECT:
      return (
        <PageWrapper>
          {error && <ErrorBanner>{error}</ErrorBanner>}
          <ModeSelectionStep
            onSelectMode={(mode) => {
              setOnboardingMode(mode)
              startTransition(async () => {
                await saveOnboardingModeAction(mode)
                if (mode === 'manual') {
                  setPhase(PHASE.MANUAL_STEPS)
                } else {
                  setPhase(PHASE.CONVERSATION)
                }
              })
            }}
            onSkip={handleSkip}
          />
        </PageWrapper>
      )

    case PHASE.CONVERSATION:
      return (
        <OnboardingConversation
          mode={onboardingMode}
          savedMessages={initialData.onboarding_conversation_history || []}
          onComplete={handleConversationComplete}
          onSwitchToManual={handleSwitchToManual}
          manualContextMessage={manualContextMessage}
        />
      )

    case PHASE.MANUAL_STEPS:
      return (
        <ManualStepsFlow
          initialStep={determineManualStep(partialData)}
          partialData={partialData}
          initialData={initialData}
          showSavedBanner={showSavedBanner}
          onSwitchToVoice={handleSwitchToVoice}
          onComplete={handleManualComplete}
        />
      )

    case PHASE.COMPLETION:
      return (
        <PageWrapper>
          {error && <ErrorBanner>{error}</ErrorBanner>}
          <CompletionStep
            data={completionData ? {
              household_size: completionData.household?.household_size || completionData.household_size || 0,
              cook_time_preference: completionData.schedule?.cook_time_preference || completionData.cook_time_preference || null,
              meal_plan_days: completionData.schedule?.meal_plan_days || completionData.meal_plan_days || [],
              cuisines: completionData.food_preferences?.cuisines || completionData.cuisines || [],
              adventurousness: completionData.food_preferences?.adventurousness || completionData.adventurousness || null,
              meal_prep_style: completionData.food_preferences?.meal_prep_style || completionData.meal_prep_style || null,
              cooking_frustrations: completionData.food_preferences?.cooking_frustrations || completionData.cooking_frustrations || [],
              weekly_budget: completionData.budget?.weekly_budget || completionData.weekly_budget || 0,
              shopping_style: completionData.budget?.shopping_style || completionData.shopping_style || null,
              favorite_stores: completionData.budget?.preferred_stores || completionData.preferred_stores || [],
              health_goals: completionData.health?.health_goals || completionData.health_goals || [],
            } : {}}
            onStartPlanning={() => {
              startTransition(async () => {
                const result = await completeOnboardingAction()
                if (result?.success !== false) {
                  router.push('/meals')
                } else {
                  setError(result.error)
                }
              })
            }}
            onEditPreferences={() => {
              startTransition(async () => {
                const result = await completeOnboardingAction()
                if (result?.success !== false) {
                  router.push('/settings')
                } else {
                  setError(result.error)
                }
              })
            }}
            isPending={isPending}
          />
        </PageWrapper>
      )

    default:
      return null
  }
}
