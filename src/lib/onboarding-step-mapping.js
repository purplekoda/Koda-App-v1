/**
 * Pure utility for mapping onboarding partial data to manual step indices
 * and converting partial data into the prop shapes step components expect.
 *
 * UI Step indices (HouseholdSize embeds HouseholdMembers):
 *   0  HouseholdSize + Members (combined)
 *   1  CookTime
 *   2  MealPlanDays
 *   3  DietaryRestrictions
 *   4  Cuisines
 *   5  Adventurousness
 *   6  MealPrepStyle
 *   7  Frustrations
 *   8  Budget
 *   9  FavoriteStores
 *  10  HealthGoals
 *  11  FaithPractices
 */

export const MANUAL_STEP_COUNT = 12

/**
 * Inspect partial data and return the first incomplete step index (0–11).
 */
export function determineManualStep(partialData) {
  if (!partialData) return 0
  const d = partialData

  // Step 0: Household + Members
  if (!d.household_size || !d.members?.length) return 0
  // Step 1: CookTime
  if (!d.cook_time_preference) return 1
  // Step 2: MealPlanDays
  if (!d.meal_plan_days?.length) return 2
  // Step 3: DietaryRestrictions (optional — check if cuisines exist to skip)
  if (!d.cuisines?.length && !d.dietary_restrictions_answered) return 3
  // Step 4: Cuisines
  if (!d.cuisines?.length) return 4
  // Step 5: Adventurousness
  if (!d.adventurousness) return 5
  // Step 6: MealPrepStyle
  if (!d.meal_prep_style) return 6
  // Step 7: Frustrations
  if (!d.cooking_frustrations?.length) return 7
  // Step 8: Budget
  if (!d.weekly_budget) return 8
  // Step 9: FavoriteStores
  if (!d.preferred_stores?.length) return 9
  // Step 10: HealthGoals
  if (!d.health_goals?.length) return 10
  // Step 11: FaithPractices — always last
  return 11
}

/**
 * Convert partial data (from Gemini extraction or Supabase) into form state
 * for ManualStepsFlow. Merges with initialData from the server page component.
 */
export function partialDataToFormState(partialData, initialData = {}) {
  const d = partialData || {}
  const init = initialData || {}

  return {
    // Step 0 — HouseholdSize + Members
    numAdults: d.household_size
      ? Math.max(1, (d.household_size || 2) - (d.members?.filter(m => m.age && m.age < 18).length || 0))
      : (init.household_size || 2),
    numChildren: d.members?.filter(m => m.age && m.age < 18).length || 0,
    members: d.members?.length
      ? d.members.map(m => ({
          name: m.name || '',
          age: m.age ?? null,
          age_group: m.age_group || (m.age && m.age < 18 ? 'child' : 'adult'),
          is_picky_eater: m.is_picky_eater || false,
          picky_issues: m.picky_issues || [],
          allergies: m.allergies || [],
          dietary_restrictions: m.dietary_restrictions || [],
          track_macros: m.track_macros || false,
          macro_calories: m.macro_calories ?? null,
          macro_protein_g: m.macro_protein_g ?? null,
          macro_carbs_g: m.macro_carbs_g ?? null,
          macro_fat_g: m.macro_fat_g ?? null,
        }))
      : (init.householdMembers || []),

    // Step 1 — CookTime
    cookTime: d.cook_time_preference || init.cook_time_preference || null,

    // Step 2 — MealPlanDays
    mealPlanDays: d.meal_plan_days || init.meal_plan_days || [],
    mealPrepDays: d.meal_prep_days || init.meal_prep_days || [],

    // Step 3 — DietaryRestrictions
    dietaryRestrictions: d.dietary_restrictions || init.dietaryRestrictions || [],

    // Step 4 — Cuisines
    cuisines: d.cuisines || init.cuisines || [],

    // Step 5 — Adventurousness
    adventurousness: d.adventurousness || init.adventurousness || null,

    // Step 6 — MealPrepStyle
    mealPrepStyle: d.meal_prep_style || init.meal_prep_style || null,

    // Step 7 — Frustrations
    frustrations: d.cooking_frustrations || init.cooking_frustrations || [],

    // Step 8 — Budget
    budget: d.weekly_budget || init.cooking_preferences?.weekly_budget || 0,
    monthlyBudget: d.monthly_budget || init.cooking_preferences?.monthly_budget || 0,
    splitMonthly: d.split_monthly_to_weekly || init.cooking_preferences?.split_monthly_to_weekly || false,
    budgetPriorities: d.budget_priorities || init.budget_priorities || [],
    shoppingStyle: d.shopping_style || init.shopping_style || null,
    deliveryService: d.preferred_delivery_service || init.preferred_delivery_service || null,

    // Step 9 — FavoriteStores
    preferredStores: d.preferred_stores || init.preferred_stores || [],
    storeCategoryAssignments: d.store_category_assignments || init.store_category_assignments || {},
    otherStoreName: '',

    // Step 10 — HealthGoals
    healthGoals: d.health_goals || init.health_goals || [],
    dailyCarbLimit: d.daily_carb_limit ?? null,

    // Step 11 — FaithPractices
    faithPractices: d.faith_practices || null,
  }
}

/**
 * Convert current form state back into the partial data shape for persistence.
 */
export function formStateToPartialData(formState) {
  return {
    household_size: (formState.members?.length || 0) > 0
      ? formState.members.length
      : formState.numAdults + formState.numChildren,
    household_type: formState.numChildren > 0 ? 'includes_kids' : 'adults_only',
    members: formState.members,
    cook_time_preference: formState.cookTime,
    meal_plan_days: formState.mealPlanDays,
    meal_prep_days: formState.mealPrepDays,
    dietary_restrictions: formState.dietaryRestrictions,
    cuisines: formState.cuisines,
    adventurousness: formState.adventurousness,
    meal_prep_style: formState.mealPrepStyle,
    cooking_frustrations: formState.frustrations,
    weekly_budget: formState.budget,
    monthly_budget: formState.monthlyBudget,
    split_monthly_to_weekly: formState.splitMonthly,
    budget_priorities: formState.budgetPriorities,
    shopping_style: formState.shoppingStyle,
    preferred_delivery_service: formState.deliveryService,
    preferred_stores: formState.preferredStores,
    store_category_assignments: formState.storeCategoryAssignments,
    health_goals: formState.healthGoals,
    daily_carb_limit: formState.dailyCarbLimit,
    faith_practices: formState.faithPractices,
  }
}
