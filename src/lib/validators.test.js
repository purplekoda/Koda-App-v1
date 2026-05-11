import { describe, it, expect } from 'vitest';
import {
  validateProfileUpdate,
  validateFamilyMember,
  validateMealSlot,
  validateGroceryItem,
  validateRecipe,
  validateCookingPreferences,
  validateAIPrompt,
  validateMealPlanSlot,
  validateHouseholdStep,
  validateHouseholdMember,
  validateCookTimeStep,
  validateMealPlanDaysStep,
  validateAdventurousnessStep,
  validateMealPrepStyleStep,
  validateFrustrationsStep,
  validateBudgetStep,
  validateHealthGoalsStep,
  validateFaithPractices,
  validateDietaryRestriction,
  validateMacroExtra,
  validateDashboardSections,
} from './validators';

describe('validateProfileUpdate', () => {
  it('accepts a valid profile update', () => {
    const result = validateProfileUpdate({
      display_name: 'Alice',
      location: 'Portland',
      preferred_store: 'Fred Meyer',
      onboarding_completed: true,
    });
    expect(result.valid).toBe(true);
    expect(result.data).toEqual({
      display_name: 'Alice',
      location: 'Portland',
      preferred_store: 'Fred Meyer',
      onboarding_completed: true,
    });
  });

  it('rejects empty display_name when provided', () => {
    const result = validateProfileUpdate({ display_name: '' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Display name is required');
  });

  it('rejects non-boolean onboarding_completed', () => {
    const result = validateProfileUpdate({ onboarding_completed: 'yes' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('onboarding_completed must be a boolean');
  });

  it('returns empty data when no fields are passed', () => {
    const result = validateProfileUpdate({});
    expect(result.valid).toBe(true);
    expect(result.data).toEqual({});
  });
});

describe('validateFamilyMember', () => {
  it('accepts a valid member', () => {
    const result = validateFamilyMember({ name: 'Bob', age_group: 'adult' });
    expect(result.valid).toBe(true);
    expect(result.data).toEqual({ name: 'Bob', age_group: 'adult' });
  });

  it('rejects missing name', () => {
    const result = validateFamilyMember({ age_group: 'child' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Name is required');
  });

  it('rejects invalid age group', () => {
    const result = validateFamilyMember({ name: 'Bob', age_group: 'elder' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid age group');
  });
});

describe('validateMealSlot', () => {
  it('accepts a valid recipe slot', () => {
    const result = validateMealSlot({
      day_of_week: 3,
      meal_type: 'dinner',
      recipe_id: 'recipe-uuid',
    });
    expect(result.valid).toBe(true);
    expect(result.data.recipe_id).toBe('recipe-uuid');
  });

  it('accepts a valid custom meal slot', () => {
    const result = validateMealSlot({
      day_of_week: 1,
      meal_type: 'lunch',
      custom_meal_name: 'Leftover pizza',
    });
    expect(result.valid).toBe(true);
    expect(result.data.custom_meal_name).toBe('Leftover pizza');
  });

  it('rejects when neither recipe_id nor custom_meal_name is provided', () => {
    const result = validateMealSlot({ day_of_week: 1, meal_type: 'breakfast' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'Either recipe_id or custom_meal_name is required',
    );
  });

  it('rejects invalid day_of_week', () => {
    const result = validateMealSlot({
      day_of_week: 9,
      meal_type: 'dinner',
      recipe_id: 'r',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('day_of_week must be 1-7');
  });

  it('rejects invalid meal_type', () => {
    const result = validateMealSlot({
      day_of_week: 1,
      meal_type: 'brunch',
      recipe_id: 'r',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid meal type');
  });
});

describe('validateGroceryItem', () => {
  it('accepts a basic valid item', () => {
    const result = validateGroceryItem({ name: 'Apples' });
    expect(result.valid).toBe(true);
    expect(result.data.name).toBe('Apples');
  });

  it('accepts all optional fields', () => {
    const result = validateGroceryItem({
      name: 'Apples',
      quantity: '3 lb',
      category: 'produce',
      in_pantry: true,
    });
    expect(result.valid).toBe(true);
    expect(result.data).toEqual({
      name: 'Apples',
      quantity: '3 lb',
      category: 'produce',
      in_pantry: true,
    });
  });

  it('rejects missing name', () => {
    const result = validateGroceryItem({ name: '' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Item name is required');
  });

  it('coerces in_pantry to boolean', () => {
    const result = validateGroceryItem({ name: 'X', in_pantry: 1 });
    expect(result.data.in_pantry).toBe(true);
  });
});

describe('validateRecipe', () => {
  it('accepts a minimal valid recipe', () => {
    const result = validateRecipe({ name: 'Pasta' });
    expect(result.valid).toBe(true);
    expect(result.data.name).toBe('Pasta');
  });

  it('rejects missing name', () => {
    const result = validateRecipe({ description: 'no name' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Recipe name is required');
  });

  it('validates time bounds', () => {
    const result = validateRecipe({
      name: 'Pasta',
      prep_time_minutes: 9999,
      cook_time_minutes: -1,
      servings: 0,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        'Prep time must be 0-1440 minutes',
        'Cook time must be 0-1440 minutes',
        'Servings must be 1-100',
      ]),
    );
  });

  it('sanitizes ingredients array', () => {
    const result = validateRecipe({
      name: 'Pasta',
      ingredients: [
        { name: 'Flour', quantity: '2 cups' },
        { name: '', quantity: 'skip me' },
        { name: 'Salt' },
      ],
    });
    expect(result.valid).toBe(true);
    expect(result.data.ingredients).toEqual([
      { name: 'Flour', quantity: '2 cups' },
      { name: 'Salt', quantity: '' },
    ]);
  });

  it('truncates ingredients to 100', () => {
    const many = new Array(150).fill({ name: 'Salt', quantity: '1 tsp' });
    const result = validateRecipe({ name: 'Pasta', ingredients: many });
    expect(result.data.ingredients).toHaveLength(100);
  });

  it('handles non-array ingredients as empty', () => {
    const result = validateRecipe({ name: 'Pasta', ingredients: 'not array' });
    expect(result.data.ingredients).toEqual([]);
  });

  it('sanitizes tags', () => {
    const result = validateRecipe({
      name: 'Pasta',
      tags: ['italian', '', 'dinner'],
    });
    expect(result.data.tags).toEqual(['italian', 'dinner']);
  });

  it('truncates tags to 20', () => {
    const tags = new Array(30).fill('tag');
    const result = validateRecipe({ name: 'Pasta', tags });
    expect(result.data.tags).toHaveLength(20);
  });

  it('handles non-array tags as empty', () => {
    const result = validateRecipe({ name: 'Pasta', tags: 'invalid' });
    expect(result.data.tags).toEqual([]);
  });

  it('accepts valid nutrition with calories', () => {
    const result = validateRecipe({
      name: 'Pasta',
      nutrition: { calories: 500, protein: 20 },
      nutrition_is_estimated: true,
    });
    expect(result.data.nutrition).toEqual({ calories: 500, protein: 20 });
    expect(result.data.nutrition_is_estimated).toBe(true);
  });

  it('drops nutrition without numeric calories', () => {
    const result = validateRecipe({
      name: 'Pasta',
      nutrition: { protein: 20 },
    });
    expect(result.data.nutrition).toBeUndefined();
  });

  it('rejects oversized image_url', () => {
    const result = validateRecipe({
      name: 'Pasta',
      image_url: 'data:image/png;base64,' + 'a'.repeat(500_000),
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('too large');
  });

  it('accepts valid image_url prefixes', () => {
    const httpsResult = validateRecipe({
      name: 'Pasta',
      image_url: 'https://example.com/img.png',
    });
    expect(httpsResult.data.image_url).toBe('https://example.com/img.png');

    const dataResult = validateRecipe({
      name: 'Pasta',
      image_url: 'data:image/png;base64,abc',
    });
    expect(dataResult.data.image_url).toBe('data:image/png;base64,abc');
  });

  it('drops image_url with disallowed prefix', () => {
    const result = validateRecipe({
      name: 'Pasta',
      image_url: 'javascript:alert(1)',
    });
    expect(result.data.image_url).toBeUndefined();
  });

  it('passes through imported metadata', () => {
    const result = validateRecipe({
      name: 'Pasta',
      imported_from: 'spoonacular',
      imported_at: '2026-01-01',
    });
    expect(result.data.imported_from).toBe('spoonacular');
    expect(result.data.imported_at).toBe('2026-01-01');
  });
});

describe('validateCookingPreferences', () => {
  it('accepts valid full preferences', () => {
    const result = validateCookingPreferences({
      skill_level: 'intermediate',
      time_preference: 'quick',
      cuisine_preferences: ['italian', 'mexican'],
      serving_size: 4,
      notes: 'no cilantro',
      macro_protein: 100,
      macro_carbs: 200,
      macro_fat: 60,
      macro_calories: 2000,
      weekly_budget: 200,
    });
    expect(result.valid).toBe(true);
    expect(result.data.skill_level).toBe('intermediate');
    expect(result.data.cuisine_preferences).toEqual(['italian', 'mexican']);
    expect(result.data.macro_protein).toBe(100);
  });

  it('rejects invalid skill level', () => {
    const result = validateCookingPreferences({ skill_level: 'master' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid skill level');
  });

  it('rejects invalid time preference', () => {
    const result = validateCookingPreferences({ time_preference: 'slow' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid time preference');
  });

  it('rejects out-of-range macros', () => {
    const result = validateCookingPreferences({
      macro_protein: 999,
      macro_carbs: 999,
      macro_fat: 999,
      macro_calories: 99999,
      weekly_budget: 99999,
      serving_size: 99,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(6);
  });

  it('truncates cuisine_preferences to 10', () => {
    const list = new Array(20).fill('italian');
    const result = validateCookingPreferences({ cuisine_preferences: list });
    expect(result.data.cuisine_preferences).toHaveLength(10);
  });
});

describe('validateAIPrompt', () => {
  it('accepts a valid prompt', () => {
    const result = validateAIPrompt({ prompt: 'plan my meals', context: 'meals' });
    expect(result.valid).toBe(true);
    expect(result.data).toEqual({ prompt: 'plan my meals', context: 'meals' });
  });

  it('defaults context to general for invalid context', () => {
    const result = validateAIPrompt({ prompt: 'x', context: 'invalid' });
    expect(result.valid).toBe(true);
    expect(result.data.context).toBe('general');
  });

  it('rejects missing prompt', () => {
    const result = validateAIPrompt({ prompt: '', context: 'meals' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Prompt is required');
  });
});

describe('validateMealPlanSlot', () => {
  it('accepts a valid slot with UUID recipe_id', () => {
    const uuid = '12345678-1234-1234-1234-123456789abc';
    const result = validateMealPlanSlot({
      day_of_week: 2,
      meal_type: 'lunch',
      meal_name: 'Salad',
      recipe_id: uuid,
    });
    expect(result.valid).toBe(true);
    expect(result.data.recipe_id).toBe(uuid);
  });

  it('nullifies non-UUID recipe_id', () => {
    const result = validateMealPlanSlot({
      day_of_week: 2,
      meal_type: 'lunch',
      meal_name: 'Salad',
      recipe_id: 'not-a-uuid',
    });
    expect(result.valid).toBe(true);
    expect(result.data.recipe_id).toBeNull();
  });

  it('defaults recipe_id to null when not provided', () => {
    const result = validateMealPlanSlot({
      day_of_week: 1,
      meal_type: 'breakfast',
      meal_name: 'Toast',
    });
    expect(result.valid).toBe(true);
    expect(result.data.recipe_id).toBeNull();
  });

  it('rejects invalid fields', () => {
    const result = validateMealPlanSlot({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('handles null slot', () => {
    const result = validateMealPlanSlot(null);
    expect(result.valid).toBe(false);
  });
});

describe('validateHouseholdStep', () => {
  it('accepts valid input', () => {
    const result = validateHouseholdStep({
      household_size: 3,
      household_type: 'includes_kids',
    });
    expect(result.valid).toBe(true);
    expect(result.data).toEqual({
      household_size: 3,
      household_type: 'includes_kids',
    });
  });

  it('rejects invalid size and type', () => {
    const result = validateHouseholdStep({
      household_size: 99,
      household_type: 'commune',
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2);
  });
});

describe('validateHouseholdMember', () => {
  it('accepts a minimal valid member', () => {
    const result = validateHouseholdMember({ name: 'Alice' });
    expect(result.valid).toBe(true);
    expect(result.data.name).toBe('Alice');
    expect(result.data.is_picky_eater).toBe(false);
    expect(result.data.picky_issues).toEqual([]);
    expect(result.data.allergies).toEqual([]);
    expect(result.data.dietary_restrictions).toEqual([]);
    expect(result.data.track_macros).toBe(false);
  });

  it('rejects missing name', () => {
    const result = validateHouseholdMember({});
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Name is required');
  });

  it('validates age range', () => {
    const result = validateHouseholdMember({ name: 'A', age: 200 });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Age must be 0-120');
  });

  it('accepts macro fields when tracking is on', () => {
    const result = validateHouseholdMember({
      name: 'A',
      track_macros: true,
      macro_calories: 2000,
      macro_protein_g: 100,
      macro_carbs_g: 200,
      macro_fat_g: 70,
    });
    expect(result.data.macro_calories).toBe(2000);
    expect(result.data.macro_protein_g).toBe(100);
  });

  it('sanitizes list fields', () => {
    const result = validateHouseholdMember({
      name: 'A',
      picky_issues: ['textures', '', 'spicy'],
      allergies: ['peanuts'],
      dietary_restrictions: ['vegan'],
    });
    expect(result.data.picky_issues).toEqual(['textures', 'spicy']);
    expect(result.data.allergies).toEqual(['peanuts']);
    expect(result.data.dietary_restrictions).toEqual(['vegan']);
  });
});

describe('validateCookTimeStep', () => {
  it('accepts valid cook time preference', () => {
    const result = validateCookTimeStep({ cook_time_preference: '20_to_40' });
    expect(result.valid).toBe(true);
    expect(result.data.cook_time_preference).toBe('20_to_40');
  });

  it('rejects invalid value', () => {
    const result = validateCookTimeStep({ cook_time_preference: 'forever' });
    expect(result.valid).toBe(false);
  });
});

describe('validateMealPlanDaysStep', () => {
  it('accepts and filters arrays', () => {
    const result = validateMealPlanDaysStep({
      meal_plan_days: [1, 2, 99, 'x'],
      meal_prep_days: [3, 4],
    });
    expect(result.valid).toBe(true);
    expect(result.data.meal_plan_days).toEqual([1, 2]);
    expect(result.data.meal_prep_days).toEqual([3, 4]);
  });

  it('handles non-array inputs as empty', () => {
    const result = validateMealPlanDaysStep({});
    expect(result.valid).toBe(true);
    expect(result.data.meal_plan_days).toEqual([]);
    expect(result.data.meal_prep_days).toEqual([]);
  });
});

describe('validateAdventurousnessStep', () => {
  it('accepts valid value', () => {
    const result = validateAdventurousnessStep({ adventurousness: 'surprise_me' });
    expect(result.valid).toBe(true);
  });

  it('rejects invalid value', () => {
    const result = validateAdventurousnessStep({ adventurousness: 'extreme' });
    expect(result.valid).toBe(false);
  });
});

describe('validateMealPrepStyleStep', () => {
  it('accepts valid value', () => {
    const result = validateMealPrepStyleStep({ meal_prep_style: 'mix' });
    expect(result.valid).toBe(true);
  });

  it('rejects invalid value', () => {
    const result = validateMealPrepStyleStep({ meal_prep_style: 'lazy' });
    expect(result.valid).toBe(false);
  });
});

describe('validateFrustrationsStep', () => {
  it('accepts valid list', () => {
    const result = validateFrustrationsStep({
      cooking_frustrations: ['food_waste', 'deciding'],
    });
    expect(result.valid).toBe(true);
    expect(result.data.cooking_frustrations).toEqual(['food_waste', 'deciding']);
  });

  it('rejects empty list', () => {
    const result = validateFrustrationsStep({ cooking_frustrations: [] });
    expect(result.valid).toBe(false);
  });

  it('rejects missing field', () => {
    const result = validateFrustrationsStep({});
    expect(result.valid).toBe(false);
  });

  it('rejects when all values invalid', () => {
    const result = validateFrustrationsStep({
      cooking_frustrations: ['nothing', 'else'],
    });
    expect(result.valid).toBe(false);
  });
});

describe('validateBudgetStep', () => {
  it('accepts valid budget', () => {
    const result = validateBudgetStep({
      weekly_budget: 150,
      budget_priorities: ['fewer_trips', 'buy_bulk'],
      shopping_style: 'deal_hunter',
      preferred_delivery_service: 'instacart',
    });
    expect(result.valid).toBe(true);
    expect(result.data.weekly_budget).toBe(150);
    expect(result.data.shopping_style).toBe('deal_hunter');
  });

  it('filters invalid priorities', () => {
    const result = validateBudgetStep({
      budget_priorities: ['fewer_trips', 'invalid_priority'],
    });
    expect(result.data.budget_priorities).toEqual(['fewer_trips']);
  });

  it('rejects out-of-range budget', () => {
    const result = validateBudgetStep({ weekly_budget: 99999 });
    expect(result.valid).toBe(false);
  });

  it('handles non-array budget_priorities', () => {
    const result = validateBudgetStep({ budget_priorities: 'nope' });
    expect(result.data.budget_priorities).toEqual([]);
  });

  it('ignores invalid shopping_style and delivery_service', () => {
    const result = validateBudgetStep({
      shopping_style: 'bad',
      preferred_delivery_service: 'bad',
    });
    expect(result.data.shopping_style).toBeUndefined();
    expect(result.data.preferred_delivery_service).toBeUndefined();
  });
});

describe('validateHealthGoalsStep', () => {
  it('accepts and filters values', () => {
    const result = validateHealthGoalsStep({
      health_goals: ['weight_loss', 'invalid', 'muscle_gain'],
    });
    expect(result.valid).toBe(true);
    expect(result.data.health_goals).toEqual(['weight_loss', 'muscle_gain']);
  });

  it('handles non-array input', () => {
    const result = validateHealthGoalsStep({});
    expect(result.data.health_goals).toEqual([]);
  });
});

describe('validateFaithPractices', () => {
  it('accepts valid practices', () => {
    const result = validateFaithPractices({
      follows_faith_based_diet: true,
      household_faith_practices: ['halal', 'kosher'],
      kosher_level: 'traditional',
      halal_level: 'certified_meat',
      catholic_lenten: true,
      custom_practice: 'No pork on Fridays',
    });
    expect(result.valid).toBe(true);
    expect(result.data.kosher_level).toBe('traditional');
    expect(result.data.catholic_lenten).toBe(true);
    expect(result.data.custom_practice).toBe('No pork on Fridays');
  });

  it('rejects invalid level values', () => {
    const result = validateFaithPractices({ kosher_level: 'extreme' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Invalid kosher_level value');
  });

  it('accepts custom freeform practice strings', () => {
    const result = validateFaithPractices({
      household_faith_practices: ['halal', 'custom religion'],
    });
    expect(result.data.household_faith_practices).toContain('halal');
    expect(result.data.household_faith_practices).toContain('custom religion');
  });

  it('handles non-array practices as empty', () => {
    const result = validateFaithPractices({});
    expect(result.data.household_faith_practices).toEqual([]);
  });
});

describe('validateDietaryRestriction', () => {
  it('accepts predefined restrictions', () => {
    const result = validateDietaryRestriction({ restriction: 'vegan' });
    expect(result.valid).toBe(true);
    expect(result.data.restriction).toBe('vegan');
  });

  it('accepts custom restriction string', () => {
    const result = validateDietaryRestriction({ restriction: 'low-fodmap' });
    expect(result.valid).toBe(true);
    expect(result.data.restriction).toBe('low-fodmap');
  });

  it('rejects missing restriction', () => {
    const result = validateDietaryRestriction({});
    expect(result.valid).toBe(false);
  });

  it('accepts family_member_id', () => {
    const result = validateDietaryRestriction({
      restriction: 'vegan',
      family_member_id: 'abc-123',
    });
    expect(result.data.family_member_id).toBe('abc-123');
  });
});

describe('validateMacroExtra', () => {
  it('accepts a complete valid extra', () => {
    const result = validateMacroExtra({
      food_name: 'Banana',
      meal_time: 'morning_snack',
      member_id: 'm-1',
      calories: 100,
      protein: 1.2,
      carbs: 27,
      fat: 0.3,
      label_found: true,
      confidence: 'high',
      gemini_notes: 'estimated',
      photo_url: 'https://example.com/banana.png',
    });
    expect(result.valid).toBe(true);
    expect(result.data.food_name).toBe('Banana');
    expect(result.data.protein).toBe(1.2);
    expect(result.data.confidence).toBe('high');
  });

  it('rejects missing required fields', () => {
    const result = validateMacroExtra({});
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        'Food name is required',
        'Invalid meal time',
        'Member is required',
      ]),
    );
  });

  it('rejects out-of-range macros', () => {
    const result = validateMacroExtra({
      food_name: 'X',
      meal_time: 'lunch_addition',
      member_id: 'm',
      calories: 100,
      protein: 9999,
      carbs: -5,
      fat: 'abc',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.startsWith('Protein'))).toBe(true);
    expect(result.errors.some((e) => e.startsWith('Carbs'))).toBe(true);
    expect(result.errors.some((e) => e.startsWith('Fat'))).toBe(true);
  });

  it('rounds macros to one decimal', () => {
    const result = validateMacroExtra({
      food_name: 'X',
      meal_time: 'lunch_addition',
      member_id: 'm',
      calories: 100,
      protein: 1.234,
      carbs: 5.67,
      fat: 0.89,
    });
    expect(result.data.protein).toBe(1.2);
    expect(result.data.carbs).toBe(5.7);
    expect(result.data.fat).toBe(0.9);
  });
});

describe('validateDashboardSections', () => {
  it('accepts a valid sections list', () => {
    const result = validateDashboardSections([
      { section_id: 'todays_meals', sort_order: 0, is_visible: true },
      { section_id: 'weekly_snapshot', sort_order: 1, is_visible: true },
    ]);
    expect(result.valid).toBe(true);
    expect(result.data).toHaveLength(2);
  });

  it('rejects non-array input', () => {
    const result = validateDashboardSections('nope');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Sections must be an array');
  });

  it('rejects too many sections', () => {
    const tooMany = new Array(25).fill({
      section_id: 'todays_meals',
      sort_order: 0,
    });
    const result = validateDashboardSections(tooMany);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Too many sections');
  });

  it('rejects unknown section ids', () => {
    const result = validateDashboardSections([
      { section_id: 'unknown', sort_order: 0 },
    ]);
    expect(result.valid).toBe(false);
  });

  it('rejects duplicate section ids', () => {
    const result = validateDashboardSections([
      { section_id: 'weekly_snapshot', sort_order: 0 },
      { section_id: 'weekly_snapshot', sort_order: 1 },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Duplicate section_id: weekly_snapshot');
  });

  it('rejects invalid sort_order', () => {
    const result = validateDashboardSections([
      { section_id: 'weekly_snapshot', sort_order: 999 },
    ]);
    expect(result.valid).toBe(false);
  });

  it('rejects non-object section entries', () => {
    const result = validateDashboardSections([null, 'string']);
    expect(result.valid).toBe(false);
  });

  it('forces todays_meals visibility to true', () => {
    const result = validateDashboardSections([
      { section_id: 'todays_meals', sort_order: 0, is_visible: false },
    ]);
    expect(result.valid).toBe(true);
    expect(result.data[0].is_visible).toBe(true);
  });
});
