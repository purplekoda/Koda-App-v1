import { describe, it, expect } from 'vitest';
import {
  MANUAL_STEP_COUNT,
  determineManualStep,
  partialDataToFormState,
  formStateToPartialData,
} from './onboarding-step-mapping';

describe('MANUAL_STEP_COUNT', () => {
  it('exports the expected total number of manual steps', () => {
    expect(MANUAL_STEP_COUNT).toBe(12);
  });
});

describe('determineManualStep', () => {
  it('returns 0 when no data given', () => {
    expect(determineManualStep(null)).toBe(0);
    expect(determineManualStep(undefined)).toBe(0);
    expect(determineManualStep({})).toBe(0);
  });

  it('returns 0 when household_size missing', () => {
    expect(determineManualStep({ members: [{ name: 'A' }] })).toBe(0);
  });

  it('returns 0 when members empty', () => {
    expect(determineManualStep({ household_size: 2 })).toBe(0);
  });

  it('progresses through each step in order', () => {
    const base = {
      household_size: 2,
      members: [{ name: 'A' }],
    };

    expect(determineManualStep(base)).toBe(1);

    expect(
      determineManualStep({ ...base, cook_time_preference: 'under_20' }),
    ).toBe(2);

    expect(
      determineManualStep({
        ...base,
        cook_time_preference: 'under_20',
        meal_plan_days: [1, 2],
      }),
    ).toBe(3);

    // Skip dietary restrictions by setting cuisines
    expect(
      determineManualStep({
        ...base,
        cook_time_preference: 'under_20',
        meal_plan_days: [1, 2],
        cuisines: ['italian'],
      }),
    ).toBe(5);

    expect(
      determineManualStep({
        ...base,
        cook_time_preference: 'under_20',
        meal_plan_days: [1, 2],
        cuisines: ['italian'],
        adventurousness: 'mix_it_up',
      }),
    ).toBe(6);

    expect(
      determineManualStep({
        ...base,
        cook_time_preference: 'under_20',
        meal_plan_days: [1, 2],
        cuisines: ['italian'],
        adventurousness: 'mix_it_up',
        meal_prep_style: 'cook_fresh',
      }),
    ).toBe(7);

    expect(
      determineManualStep({
        ...base,
        cook_time_preference: 'under_20',
        meal_plan_days: [1, 2],
        cuisines: ['italian'],
        adventurousness: 'mix_it_up',
        meal_prep_style: 'cook_fresh',
        cooking_frustrations: ['food_waste'],
      }),
    ).toBe(8);

    expect(
      determineManualStep({
        ...base,
        cook_time_preference: 'under_20',
        meal_plan_days: [1, 2],
        cuisines: ['italian'],
        adventurousness: 'mix_it_up',
        meal_prep_style: 'cook_fresh',
        cooking_frustrations: ['food_waste'],
        weekly_budget: 150,
      }),
    ).toBe(9);

    expect(
      determineManualStep({
        ...base,
        cook_time_preference: 'under_20',
        meal_plan_days: [1, 2],
        cuisines: ['italian'],
        adventurousness: 'mix_it_up',
        meal_prep_style: 'cook_fresh',
        cooking_frustrations: ['food_waste'],
        weekly_budget: 150,
        preferred_stores: ['safeway'],
      }),
    ).toBe(10);

    // All fields complete → last step (FaithPractices)
    expect(
      determineManualStep({
        ...base,
        cook_time_preference: 'under_20',
        meal_plan_days: [1, 2],
        cuisines: ['italian'],
        adventurousness: 'mix_it_up',
        meal_prep_style: 'cook_fresh',
        cooking_frustrations: ['food_waste'],
        weekly_budget: 150,
        preferred_stores: ['safeway'],
        health_goals: ['weight_loss'],
      }),
    ).toBe(11);
  });

  it('skips dietary restrictions when answered flag is set', () => {
    const result = determineManualStep({
      household_size: 2,
      members: [{ name: 'A' }],
      cook_time_preference: 'under_20',
      meal_plan_days: [1, 2],
      dietary_restrictions_answered: true,
    });
    expect(result).toBe(4);
  });
});

describe('partialDataToFormState', () => {
  it('returns sensible defaults for empty input', () => {
    const result = partialDataToFormState(null);
    expect(result.numAdults).toBe(2);
    expect(result.numChildren).toBe(0);
    expect(result.members).toEqual([]);
    expect(result.cookTime).toBeNull();
    expect(result.mealPlanDays).toEqual([]);
    expect(result.cuisines).toEqual([]);
    expect(result.healthGoals).toEqual([]);
  });

  it('uses initialData fallbacks when partial is empty', () => {
    const result = partialDataToFormState(null, {
      household_size: 4,
      householdMembers: [{ name: 'X' }],
      cook_time_preference: '20_to_40',
      cuisines: ['mexican'],
    });
    expect(result.numAdults).toBe(4);
    expect(result.members).toEqual([{ name: 'X' }]);
    expect(result.cookTime).toBe('20_to_40');
    expect(result.cuisines).toEqual(['mexican']);
  });

  it('computes numAdults/numChildren from members ages', () => {
    const result = partialDataToFormState({
      household_size: 4,
      members: [
        { name: 'A', age: 35 },
        { name: 'B', age: 32 },
        { name: 'C', age: 8 },
        { name: 'D', age: 4 },
      ],
    });
    expect(result.numChildren).toBe(2);
    expect(result.numAdults).toBe(2);
    expect(result.members).toHaveLength(4);
  });

  it('infers age_group when missing', () => {
    const result = partialDataToFormState({
      household_size: 2,
      members: [
        { name: 'A', age: 30 },
        { name: 'B', age: 10 },
      ],
    });
    expect(result.members[0].age_group).toBe('adult');
    expect(result.members[1].age_group).toBe('child');
  });

  it('honors explicit age_group over inferred', () => {
    const result = partialDataToFormState({
      household_size: 1,
      members: [{ name: 'A', age: 30, age_group: 'teen' }],
    });
    expect(result.members[0].age_group).toBe('teen');
  });

  it('passes through faith practices', () => {
    const result = partialDataToFormState({
      household_size: 1,
      members: [{ name: 'A' }],
      faith_practices: { follows_faith_based_diet: true },
    });
    expect(result.faithPractices).toEqual({ follows_faith_based_diet: true });
  });

  it('handles defaults for nullish initialData', () => {
    const result = partialDataToFormState(undefined, undefined);
    expect(result.numAdults).toBe(2);
    expect(result.members).toEqual([]);
  });
});

describe('formStateToPartialData', () => {
  it('round-trips a complete form state', () => {
    const formState = {
      numAdults: 2,
      numChildren: 1,
      members: [{ name: 'A' }, { name: 'B' }, { name: 'C' }],
      cookTime: 'under_20',
      mealPlanDays: [1, 2, 3],
      mealPrepDays: [7],
      dietaryRestrictions: ['vegan'],
      cuisines: ['italian'],
      adventurousness: 'familiar',
      mealPrepStyle: 'mix',
      frustrations: ['food_waste'],
      budget: 150,
      budgetPriorities: ['fewer_trips'],
      shoppingStyle: 'deal_hunter',
      deliveryService: 'instacart',
      preferredStores: ['safeway'],
      storeCategoryAssignments: { produce: 'safeway' },
      healthGoals: ['weight_loss'],
      dailyCarbLimit: 100,
      faithPractices: { follows_faith_based_diet: false },
    };

    const result = formStateToPartialData(formState);
    expect(result.household_size).toBe(3);
    expect(result.household_type).toBe('includes_kids');
    expect(result.cook_time_preference).toBe('under_20');
    expect(result.meal_plan_days).toEqual([1, 2, 3]);
    expect(result.weekly_budget).toBe(150);
    expect(result.faith_practices).toEqual({ follows_faith_based_diet: false });
  });

  it('uses numAdults+numChildren when members empty', () => {
    const result = formStateToPartialData({
      numAdults: 2,
      numChildren: 1,
      members: [],
    });
    expect(result.household_size).toBe(3);
  });

  it('marks adults_only household when no children', () => {
    const result = formStateToPartialData({
      numAdults: 2,
      numChildren: 0,
      members: [],
    });
    expect(result.household_type).toBe('adults_only');
  });
});
