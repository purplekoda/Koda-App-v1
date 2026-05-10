'use client';

import { useState, useCallback, useTransition } from 'react';
import styled, { keyframes } from 'styled-components';

import HouseholdSizeStep from './steps/HouseholdSizeStep';
import CookTimeStep from './steps/CookTimeStep';
import MealPlanDaysStep from './steps/MealPlanDaysStep';
import DietaryRestrictionsStep from './steps/DietaryRestrictionsStep';
import CuisinesStep from './steps/CuisinesStep';
import AdventurousnessStep from './steps/AdventurousnessStep';
import MealPrepStyleStep from './steps/MealPrepStyleStep';
import FrustrationsStep from './steps/FrustrationsStep';
import BudgetStep from './steps/BudgetStep';
import FavoriteStoresStep from './steps/FavoriteStoresStep';
import HealthGoalsStep from './steps/HealthGoalsStep';
import FaithPracticesStep from './steps/FaithPracticesStep';

import {
  partialDataToFormState,
  formStateToPartialData,
  MANUAL_STEP_COUNT,
} from '@/lib/onboarding-step-mapping';
import { savePartialDataAction } from '@/app/(onboarding)/onboarding/partial-data-actions';
import {
  saveHouseholdStepAction,
  saveHouseholdMembersAction,
  saveCookTimeAction,
  saveMealPlanDaysAction,
  saveDietaryRestrictionsAction,
  saveCuisinesAction,
  saveAdventurousnessAction,
  saveMealPrepStyleAction,
  saveFrustrationsAction,
  saveBudgetAction,
  saveFavoriteStoresAction,
  saveHealthGoalsAction,
  saveFaithPracticesOnboardingAction,
} from '@/app/(onboarding)/onboarding/actions';

// ── Styled ───────────────────────────────────────────

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  flex-shrink: 0;
`;

const SwitchButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 12px;
  font-weight: 500;
  cursor: not-allowed;
  opacity: 0.5;
  pointer-events: none;
  transition: all 0.15s;
  margin-left: auto;
  position: relative;
`;

const SwitchComingSoon = styled.span`
  display: inline-block;
  padding: 1px 6px;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.warningBg || '#FEF3C7'};
  color: ${({ theme }) => theme.colors.warningText || '#92400E'};
  font-size: 10px;
  font-weight: 600;
`;

const ProgressRow = styled.div`
  padding: 0 ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.md};
  flex-shrink: 0;
`;

const ProgressBarOuter = styled.div`
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: ${({ theme }) => theme.colors.borderLight};
  overflow: hidden;
`;

const ProgressBarFill = styled.div`
  height: 100%;
  border-radius: 4px;
  background: ${({ theme }) => theme.colors.teal};
  transition: width 0.5s ease;
  width: ${({ $pct }) => $pct}%;
`;

const ProgressLabel = styled.div`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 4px;
  text-align: right;
`;

const StepContent = styled.div`
  flex: 1;
  max-width: 560px;
  width: 100%;
  margin: 0 auto;
  padding: 0 ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.xl};
  animation: ${fadeIn} 0.25s ease;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 0 ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.lg};
  }
`;

const InfoBanner = styled.div`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radii.md};
  background: #DCFCE7;
  border: 1px solid #BBF7D0;
  color: #166534;
  font-size: 13px;
  margin: 0 ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.md};
  animation: ${fadeIn} 0.3s ease;
`;

const ErrorBanner = styled.div`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radii.md};
  background: #FEE2E2;
  color: #991B1B;
  font-size: 13px;
  margin: 0 ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.md};
`;

// ── Component ────────────────────────────────────────

export default function ManualStepsFlow({
  initialStep = 0,
  partialData = {},
  initialData = {},
  showSavedBanner = false,
  onSwitchToVoice,
  onComplete,
}) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [formState, setFormState] = useState(() =>
    partialDataToFormState(partialData, initialData),
  );
  const [error, setError] = useState(null);
  const [showBanner, setShowBanner] = useState(showSavedBanner);
  const [isPending, startTransition] = useTransition();

  const progressPct = Math.round((currentStep / MANUAL_STEP_COUNT) * 100);

  // ── Form state updaters ────────────────────────────

  const update = useCallback((key, value) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  }, []);

  // ── Step navigation ────────────────────────────────

  const goBack = useCallback(() => {
    setError(null);
    setShowBanner(false);
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  const goNext = useCallback(() => {
    setError(null);
    setShowBanner(false);
    setCurrentStep((prev) => prev + 1);
  }, []);

  // ── Save + advance handlers per step ───────────────

  const handleHouseholdNext = useCallback(() => {
    startTransition(async () => {
      setError(null);
      const members = formState.members;
      const householdSize =
        members.length > 0 ? members.length : formState.numAdults + formState.numChildren;
      const householdType = formState.numChildren > 0 ? 'includes_kids' : 'adults_only';

      const r1 = await saveHouseholdStepAction({
        household_size: householdSize,
        household_type: householdType,
      });
      if (r1?.success === false) {
        setError(r1.error);
        return;
      }

      if (members.length > 0) {
        const r2 = await saveHouseholdMembersAction(members);
        if (r2?.success === false) {
          setError(r2.error);
          return;
        }
      }

      await savePartialDataAction(formStateToPartialData(formState));
      goNext();
    });
  }, [formState, goNext]);

  const handleCookTimeNext = useCallback(() => {
    startTransition(async () => {
      setError(null);
      const r = await saveCookTimeAction({ cook_time_preference: formState.cookTime });
      if (r?.success === false) {
        setError(r.error);
        return;
      }
      await savePartialDataAction(formStateToPartialData(formState));
      goNext();
    });
  }, [formState, goNext]);

  const handleMealPlanDaysNext = useCallback(() => {
    startTransition(async () => {
      setError(null);
      const r = await saveMealPlanDaysAction({
        meal_plan_days: formState.mealPlanDays,
        meal_prep_days: formState.mealPrepDays,
      });
      if (r?.success === false) {
        setError(r.error);
        return;
      }
      await savePartialDataAction(formStateToPartialData(formState));
      goNext();
    });
  }, [formState, goNext]);

  const handleDietaryNext = useCallback(() => {
    startTransition(async () => {
      setError(null);
      const r = await saveDietaryRestrictionsAction(formState.dietaryRestrictions);
      if (r?.success === false) {
        setError(r.error);
        return;
      }
      await savePartialDataAction({
        ...formStateToPartialData(formState),
        dietary_restrictions_answered: true,
      });
      goNext();
    });
  }, [formState, goNext]);

  const handleDietarySkip = useCallback(() => {
    startTransition(async () => {
      setError(null);
      await saveDietaryRestrictionsAction([]);
      await savePartialDataAction({
        ...formStateToPartialData(formState),
        dietary_restrictions_answered: true,
      });
      goNext();
    });
  }, [formState, goNext]);

  const handleCuisinesNext = useCallback(() => {
    startTransition(async () => {
      setError(null);
      const r = await saveCuisinesAction(formState.cuisines);
      if (r?.success === false) {
        setError(r.error);
        return;
      }
      await savePartialDataAction(formStateToPartialData(formState));
      goNext();
    });
  }, [formState, goNext]);

  const handleAdventurousnessNext = useCallback(() => {
    startTransition(async () => {
      setError(null);
      const r = await saveAdventurousnessAction({ adventurousness: formState.adventurousness });
      if (r?.success === false) {
        setError(r.error);
        return;
      }
      await savePartialDataAction(formStateToPartialData(formState));
      goNext();
    });
  }, [formState, goNext]);

  const handleMealPrepStyleNext = useCallback(() => {
    startTransition(async () => {
      setError(null);
      const r = await saveMealPrepStyleAction({ meal_prep_style: formState.mealPrepStyle });
      if (r?.success === false) {
        setError(r.error);
        return;
      }
      await savePartialDataAction(formStateToPartialData(formState));
      goNext();
    });
  }, [formState, goNext]);

  const handleFrustrationsNext = useCallback(() => {
    startTransition(async () => {
      setError(null);
      const r = await saveFrustrationsAction({ cooking_frustrations: formState.frustrations });
      if (r?.success === false) {
        setError(r.error);
        return;
      }
      await savePartialDataAction(formStateToPartialData(formState));
      goNext();
    });
  }, [formState, goNext]);

  const handleBudgetNext = useCallback(() => {
    startTransition(async () => {
      setError(null);
      const r = await saveBudgetAction({
        weekly_budget: formState.budget,
        budget_priorities: formState.budgetPriorities,
        shopping_style: formState.shoppingStyle,
        preferred_delivery_service: formState.deliveryService,
      });
      if (r?.success === false) {
        setError(r.error);
        return;
      }
      await savePartialDataAction(formStateToPartialData(formState));
      goNext();
    });
  }, [formState, goNext]);

  const handleBudgetSkip = useCallback(() => {
    startTransition(async () => {
      setError(null);
      await savePartialDataAction(formStateToPartialData(formState));
      goNext();
    });
  }, [formState, goNext]);

  const handleStoresNext = useCallback(() => {
    startTransition(async () => {
      setError(null);
      const r = await saveFavoriteStoresAction({
        preferred_stores: formState.preferredStores,
        other_store_name: formState.otherStoreName,
        store_category_assignments: formState.storeCategoryAssignments,
      });
      if (r?.success === false) {
        setError(r.error);
        return;
      }
      await savePartialDataAction(formStateToPartialData(formState));
      goNext();
    });
  }, [formState, goNext]);

  const handleStoresSkip = useCallback(() => {
    startTransition(async () => {
      setError(null);
      await savePartialDataAction(formStateToPartialData(formState));
      goNext();
    });
  }, [formState, goNext]);

  const handleHealthGoalsNext = useCallback(() => {
    startTransition(async () => {
      setError(null);
      const r = await saveHealthGoalsAction({
        health_goals: formState.healthGoals,
        daily_carb_limit: formState.dailyCarbLimit,
      });
      if (r?.success === false) {
        setError(r.error);
        return;
      }
      await savePartialDataAction(formStateToPartialData(formState));
      goNext();
    });
  }, [formState, goNext]);

  const handleHealthGoalsSkip = useCallback(() => {
    startTransition(async () => {
      setError(null);
      await savePartialDataAction(formStateToPartialData(formState));
      goNext();
    });
  }, [formState, goNext]);

  const handleFaithNext = useCallback(
    (faithData) => {
      startTransition(async () => {
        setError(null);
        if (faithData?.follows_faith_based_diet) {
          const r = await saveFaithPracticesOnboardingAction(faithData);
          if (r?.success === false) {
            setError(r.error);
            return;
          }
        }
        // Save partial data — completion is handled by the parent's CompletionStep
        const finalFormState = { ...formState, faithPractices: faithData };
        await savePartialDataAction(formStateToPartialData(finalFormState));
        onComplete?.(formStateToPartialData(finalFormState));
      });
    },
    [formState, onComplete],
  );

  const handleFaithSkip = useCallback(() => {
    startTransition(async () => {
      setError(null);
      await savePartialDataAction(formStateToPartialData(formState));
      onComplete?.(formStateToPartialData(formState));
    });
  }, [formState, onComplete]);

  // ── Switch to voice ────────────────────────────────

  const handleSwitchToVoice = useCallback(() => {
    const pd = formStateToPartialData(formState);
    onSwitchToVoice?.(pd);
  }, [formState, onSwitchToVoice]);

  // ── Render step ────────────────────────────────────

  function renderStep() {
    switch (currentStep) {
      case 0:
        return (
          <HouseholdSizeStep
            numAdults={formState.numAdults}
            numChildren={formState.numChildren}
            members={formState.members}
            userName={initialData.userName || ''}
            onChangeAdults={(v) => update('numAdults', v)}
            onChangeChildren={(v) => update('numChildren', v)}
            onChangeMembers={(v) => update('members', v)}
            faithPractices={formState.faithPractices}
            onChangeFaith={(v) => update('faithPractices', v)}
            onNext={handleHouseholdNext}
            isPending={isPending}
          />
        );
      case 1:
        return (
          <CookTimeStep
            value={formState.cookTime}
            onChange={(v) => update('cookTime', v)}
            onNext={handleCookTimeNext}
            onBack={goBack}
            isPending={isPending}
          />
        );
      case 2:
        return (
          <MealPlanDaysStep
            planDays={formState.mealPlanDays}
            prepDays={formState.mealPrepDays}
            onChangePlan={(v) => update('mealPlanDays', v)}
            onChangePrep={(v) => update('mealPrepDays', v)}
            onNext={handleMealPlanDaysNext}
            onBack={goBack}
            isPending={isPending}
          />
        );
      case 3:
        return (
          <DietaryRestrictionsStep
            selected={formState.dietaryRestrictions}
            onChange={(v) => update('dietaryRestrictions', v)}
            onNext={handleDietaryNext}
            onBack={goBack}
            onSkip={handleDietarySkip}
            isPending={isPending}
          />
        );
      case 4:
        return (
          <CuisinesStep
            selected={formState.cuisines}
            onChange={(v) => update('cuisines', v)}
            onNext={handleCuisinesNext}
            onBack={goBack}
            isPending={isPending}
          />
        );
      case 5:
        return (
          <AdventurousnessStep
            value={formState.adventurousness}
            onChange={(v) => update('adventurousness', v)}
            onNext={handleAdventurousnessNext}
            onBack={goBack}
            isPending={isPending}
          />
        );
      case 6:
        return (
          <MealPrepStyleStep
            value={formState.mealPrepStyle}
            onChange={(v) => update('mealPrepStyle', v)}
            onNext={handleMealPrepStyleNext}
            onBack={goBack}
            isPending={isPending}
          />
        );
      case 7:
        return (
          <FrustrationsStep
            selected={formState.frustrations}
            onChange={(v) => update('frustrations', v)}
            onNext={handleFrustrationsNext}
            onBack={goBack}
            isPending={isPending}
          />
        );
      case 8:
        return (
          <BudgetStep
            budget={formState.budget}
            priorities={formState.budgetPriorities}
            shoppingStyle={formState.shoppingStyle}
            deliveryService={formState.deliveryService}
            onChangeBudget={(v) => update('budget', v)}
            onChangePriorities={(v) => update('budgetPriorities', v)}
            onChangeShoppingStyle={(v) => update('shoppingStyle', v)}
            onChangeDeliveryService={(v) => update('deliveryService', v)}
            onNext={handleBudgetNext}
            onBack={goBack}
            onSkip={handleBudgetSkip}
            isPending={isPending}
          />
        );
      case 9:
        return (
          <FavoriteStoresStep
            selectedStores={formState.preferredStores}
            otherStoreName={formState.otherStoreName}
            categoryAssignments={formState.storeCategoryAssignments}
            onChangeStores={(v) => {
              if (typeof v === 'function') {
                setFormState((prev) => ({ ...prev, preferredStores: v(prev.preferredStores) }));
              } else {
                update('preferredStores', v);
              }
            }}
            onChangeOtherName={(v) => update('otherStoreName', v)}
            onChangeCategoryAssignments={(v) => {
              if (typeof v === 'function') {
                setFormState((prev) => ({
                  ...prev,
                  storeCategoryAssignments: v(prev.storeCategoryAssignments),
                }));
              } else {
                update('storeCategoryAssignments', v);
              }
            }}
            onNext={handleStoresNext}
            onBack={goBack}
            onSkip={handleStoresSkip}
            isPending={isPending}
          />
        );
      case 10:
        return (
          <HealthGoalsStep
            goals={formState.healthGoals}
            onChangeGoals={(v) => update('healthGoals', v)}
            carbLimit={formState.dailyCarbLimit}
            onChangeCarbLimit={(v) => update('dailyCarbLimit', v)}
            onNext={handleHealthGoalsNext}
            onBack={goBack}
            onSkip={handleHealthGoalsSkip}
            isPending={isPending}
          />
        );
      case 11:
        return (
          <FaithPracticesStep
            data={formState.faithPractices}
            onChange={(v) => update('faithPractices', v)}
            onNext={handleFaithNext}
            onBack={goBack}
            onSkip={handleFaithSkip}
            isPending={isPending}
          />
        );
      default:
        return null;
    }
  }

  return (
    <Wrapper>
      <TopBar>
        <div />
        {onSwitchToVoice && (
          <SwitchButton
            type="button"
            aria-disabled="true"
            tabIndex={-1}
            title="Voice setup is coming soon — check back for an update!"
          >
            <span style={{ fontSize: 14 }}>{'\uD83C\uDF99\uFE0F'}</span>
            Switch to voice setup
            <SwitchComingSoon>Coming Soon</SwitchComingSoon>
          </SwitchButton>
        )}
      </TopBar>

      <ProgressRow>
        <ProgressBarOuter>
          <ProgressBarFill $pct={progressPct} />
        </ProgressBarOuter>
        <ProgressLabel>
          Step {currentStep + 1} of {MANUAL_STEP_COUNT}
        </ProgressLabel>
      </ProgressRow>

      {showBanner && (
        <InfoBanner>
          We saved your answers from voice setup &mdash; just fill in anything that&apos;s missing.
        </InfoBanner>
      )}

      {error && <ErrorBanner>{error}</ErrorBanner>}

      <StepContent key={currentStep}>{renderStep()}</StepContent>
    </Wrapper>
  );
}
