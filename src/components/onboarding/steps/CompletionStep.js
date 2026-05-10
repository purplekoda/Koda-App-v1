'use client';

import styled from 'styled-components';
import {
  COOK_TIME_OPTIONS,
  ADVENTUROUSNESS_OPTIONS,
  MEAL_PREP_STYLE_OPTIONS,
  FRUSTRATION_OPTIONS,
  HEALTH_GOAL_OPTIONS,
  DAY_OPTIONS,
  SHOPPING_STYLE_OPTIONS,
} from '@/data/onboarding-options';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  flex: 1;
  padding: ${({ theme }) => theme.spacing.xxl} 0;
`;

const Celebration = styled.div`
  font-size: 56px;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Title = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0 0 ${({ theme }) => theme.spacing.sm};
`;

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.body};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin: 0 0 ${({ theme }) => theme.spacing.xxl};
`;

const SummaryCard = styled.div`
  width: 100%;
  background: ${({ theme }) => theme.colors.surface};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  text-align: left;
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: ${({ theme }) => theme.spacing.sm} 0;

  & + & {
    border-top: 0.5px solid ${({ theme }) => theme.colors.borderLight};
  }
`;

const SummaryLabel = styled.span`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textTertiary};
  flex-shrink: 0;
`;

const SummaryValue = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  text-align: right;
  margin-left: ${({ theme }) => theme.spacing.md};
`;

const BtnStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  width: 100%;
`;

const PrimaryBtn = styled.button`
  width: 100%;
  height: 48px;
  border: none;
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.teal};
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;

  &:hover { opacity: 0.9; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const SecondaryBtn = styled.button`
  width: 100%;
  height: 44px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: 15px;
  cursor: pointer;

  &:hover { background: ${({ theme }) => theme.colors.background}; }
`;

function findLabel(options, value) {
  const opt = options.find((o) => (typeof o === 'string' ? o : o.value) === value);
  return opt ? (typeof opt === 'string' ? opt : opt.label) : value;
}

function dayNames(days) {
  return days.map((d) => DAY_OPTIONS.find((o) => o.value === d)?.label || d).join(', ');
}

export default function CompletionStep({ data, onStartPlanning, onEditPreferences, isPending }) {
  return (
    <Wrapper>
      <Celebration>{'\u{1F389}'}</Celebration>
      <Title>You're all set!</Title>
      <Subtitle>Koda is ready to plan meals your household will love.</Subtitle>

      <SummaryCard>
        {data.household_size && (
          <SummaryRow>
            <SummaryLabel>Cooking for</SummaryLabel>
            <SummaryValue>
              {data.household_size} {data.household_size === 1 ? 'person' : 'people'}
            </SummaryValue>
          </SummaryRow>
        )}
        {data.cook_time_preference && (
          <SummaryRow>
            <SummaryLabel>Weeknight cooking</SummaryLabel>
            <SummaryValue>{findLabel(COOK_TIME_OPTIONS, data.cook_time_preference)}</SummaryValue>
          </SummaryRow>
        )}
        {data.meal_plan_days?.length > 0 && (
          <SummaryRow>
            <SummaryLabel>Meal plan days</SummaryLabel>
            <SummaryValue>{dayNames(data.meal_plan_days)}</SummaryValue>
          </SummaryRow>
        )}
        {data.cuisines?.length > 0 && (
          <SummaryRow>
            <SummaryLabel>Favorite cuisines</SummaryLabel>
            <SummaryValue>
              {data.cuisines.slice(0, 4).join(', ')}
              {data.cuisines.length > 4 ? ` +${data.cuisines.length - 4}` : ''}
            </SummaryValue>
          </SummaryRow>
        )}
        {data.adventurousness && (
          <SummaryRow>
            <SummaryLabel>Recipe style</SummaryLabel>
            <SummaryValue>{findLabel(ADVENTUROUSNESS_OPTIONS, data.adventurousness)}</SummaryValue>
          </SummaryRow>
        )}
        {data.meal_prep_style && (
          <SummaryRow>
            <SummaryLabel>Cooking approach</SummaryLabel>
            <SummaryValue>{findLabel(MEAL_PREP_STYLE_OPTIONS, data.meal_prep_style)}</SummaryValue>
          </SummaryRow>
        )}
        {data.cooking_frustrations?.length > 0 && (
          <SummaryRow>
            <SummaryLabel>Top frustrations</SummaryLabel>
            <SummaryValue>
              {data.cooking_frustrations
                .slice(0, 3)
                .map((f) => findLabel(FRUSTRATION_OPTIONS, f))
                .join(', ')}
            </SummaryValue>
          </SummaryRow>
        )}
        {data.weekly_budget > 0 && (
          <SummaryRow>
            <SummaryLabel>Weekly budget</SummaryLabel>
            <SummaryValue>${data.weekly_budget}/week</SummaryValue>
          </SummaryRow>
        )}
        {data.shopping_style && (
          <SummaryRow>
            <SummaryLabel>Shopping style</SummaryLabel>
            <SummaryValue>{findLabel(SHOPPING_STYLE_OPTIONS, data.shopping_style)}</SummaryValue>
          </SummaryRow>
        )}
        {data.favorite_stores?.length > 0 && (
          <SummaryRow>
            <SummaryLabel>Favorite stores</SummaryLabel>
            <SummaryValue>
              {data.favorite_stores.length} store{data.favorite_stores.length !== 1 ? 's' : ''}
            </SummaryValue>
          </SummaryRow>
        )}
        {data.health_goals?.length > 0 && (
          <SummaryRow>
            <SummaryLabel>Health goals</SummaryLabel>
            <SummaryValue>
              {data.health_goals
                .slice(0, 3)
                .map((g) => findLabel(HEALTH_GOAL_OPTIONS, g))
                .join(', ')}
            </SummaryValue>
          </SummaryRow>
        )}
      </SummaryCard>

      <BtnStack>
        <PrimaryBtn type="button" onClick={onStartPlanning} disabled={isPending}>
          {isPending ? 'Saving...' : 'Start planning meals'}
        </PrimaryBtn>
        <SecondaryBtn type="button" onClick={onEditPreferences}>
          Edit my preferences
        </SecondaryBtn>
      </BtnStack>
    </Wrapper>
  );
}
