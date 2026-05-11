import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockIsMockMode = vi.fn(() => true);
vi.mock('@/lib/dal/require-user', () => ({
  isMockMode: () => mockIsMockMode(),
}));

const mockGetInStockStaples = vi.fn();
const mockGetOutOfStockStaples = vi.fn();
vi.mock('@/lib/dal/staples', () => ({
  getInStockStaples: (...a) => mockGetInStockStaples(...a),
  getOutOfStockStaples: (...a) => mockGetOutOfStockStaples(...a),
}));

const mockGetMockManagedPantry = vi.fn();
const mockGetMockOnboardingProfile = vi.fn();
const mockGetMockGroceryPreferences = vi.fn();
vi.mock('@/lib/dal/mock-store', () => ({
  getMockManagedPantry: (...a) => mockGetMockManagedPantry(...a),
  getMockOnboardingProfile: (...a) => mockGetMockOnboardingProfile(...a),
  getMockGroceryPreferences: (...a) => mockGetMockGroceryPreferences(...a),
}));

const mockGetHouseholdMembers = vi.fn();
vi.mock('@/lib/dal/onboarding', () => ({
  getHouseholdMembers: (...a) => mockGetHouseholdMembers(...a),
}));

const mockGetTasteProfile = vi.fn();
const mockBuildTasteProfilePrompt = vi.fn();
const mockGetFrequentWebsites = vi.fn();
vi.mock('@/lib/dal/taste-profile', () => ({
  getTasteProfile: (...a) => mockGetTasteProfile(...a),
  buildTasteProfilePrompt: (...a) => mockBuildTasteProfilePrompt(...a),
  getFrequentWebsites: (...a) => mockGetFrequentWebsites(...a),
}));

const mockGetCookingPreferences = vi.fn();
vi.mock('@/lib/dal/cooking-preferences', () => ({
  getCookingPreferences: (...a) => mockGetCookingPreferences(...a),
}));

const mockGetHouseholdFaithPractices = vi.fn();
const mockGetAllMemberFaithPractices = vi.fn();
vi.mock('@/lib/dal/faith-practices', () => ({
  getHouseholdFaithPractices: (...a) => mockGetHouseholdFaithPractices(...a),
  getAllMemberFaithPractices: (...a) => mockGetAllMemberFaithPractices(...a),
}));

const mockSupabaseFrom = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
  getSupabaseServerClient: async () => ({
    from: (...a) => mockSupabaseFrom(...a),
  }),
}));

import { buildMealPlanPrompt } from './buildMealPlanPrompt';

function setDefaultMocks() {
  mockIsMockMode.mockReturnValue(true);
  mockGetInStockStaples.mockResolvedValue([]);
  mockGetOutOfStockStaples.mockResolvedValue([]);
  mockGetMockManagedPantry.mockResolvedValue([]);
  mockGetMockOnboardingProfile.mockReturnValue({
    display_name: 'Mock User',
    preferred_stores: [],
    store_category_assignments: {},
    shopping_style: null,
    preferred_delivery_service: null,
  });
  mockGetMockGroceryPreferences.mockReturnValue({ stores: [] });
  mockGetHouseholdMembers.mockResolvedValue([]);
  mockGetTasteProfile.mockResolvedValue({});
  mockBuildTasteProfilePrompt.mockReturnValue('');
  mockGetFrequentWebsites.mockReturnValue([]);
  mockGetCookingPreferences.mockResolvedValue({});
  mockGetHouseholdFaithPractices.mockResolvedValue({});
  mockGetAllMemberFaithPractices.mockResolvedValue([]);
}

describe('buildMealPlanPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setDefaultMocks();
  });

  it('returns a prompt with foundation instructions and pantry-empty message when no data', async () => {
    const result = await buildMealPlanPrompt('user-123');

    expect(result.systemPromptPrefix).toContain("You are Koda's meal planning assistant");
    expect(result.systemPromptPrefix).toContain('PANTRY: No pantry items currently tracked');
    expect(result.pantryItems).toEqual([]);
  });

  it('always includes static instruction sections', async () => {
    const { systemPromptPrefix } = await buildMealPlanPrompt('user-123');

    expect(systemPromptPrefix).toContain('THREE MEAL PLANNING OPTIONS');
    expect(systemPromptPrefix).toContain('SURPRISE ME FEATURE');
    expect(systemPromptPrefix).toContain('FILLING BLANK MEAL SLOTS');
    expect(systemPromptPrefix).toContain('NUTRITION ESTIMATION FALLBACK');
    expect(systemPromptPrefix).toContain('SOCIAL MEDIA AND URL RECIPE IMPORT');
    expect(systemPromptPrefix).toContain('CONVERSATIONAL MEAL EDITING');
    expect(systemPromptPrefix).toContain('MACRO TRACKING SMART INSIGHT');
  });

  it('renders pantry items with expiry and category tags', async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const fmt = (d) => d.toISOString().split('T')[0];

    mockGetMockManagedPantry.mockResolvedValue([
      {
        ingredient_name: 'Milk',
        quantity: 1,
        unit: 'gal',
        expiry_date: fmt(yesterday),
        category: 'Dairy',
      },
      {
        ingredient_name: 'Spinach',
        quantity: 1,
        unit: 'bag',
        expiry_date: fmt(tomorrow),
        category: 'Produce',
      },
      {
        ingredient_name: 'Tomato',
        quantity: 2,
        unit: null,
        expiry_date: null,
        category: 'Produce',
      },
      {
        ingredient_name: 'Rice',
        quantity: null,
        unit: null,
        expiry_date: null,
        category: 'Grain',
      },
    ]);

    const { systemPromptPrefix, pantryItems } = await buildMealPlanPrompt('u');

    expect(pantryItems).toHaveLength(4);
    expect(systemPromptPrefix).toContain('PANTRY CONTENTS');
    expect(systemPromptPrefix).toContain('Milk');
    expect(systemPromptPrefix).toContain('[EXPIRED]');
    expect(systemPromptPrefix).toContain('[EXPIRING SOON');
    expect(systemPromptPrefix).toContain('[perishable — prioritize]');
    expect(systemPromptPrefix).toContain('Rice'); // no urgency tag but listed
  });

  it('renders pantry staples grouped by category and out-of-stock list', async () => {
    mockGetInStockStaples.mockResolvedValue([
      { name: 'Salt', category: 'Spices' },
      { name: 'Pepper', category: 'Spices' },
      { name: 'Olive oil', category: 'Oils' },
    ]);
    mockGetOutOfStockStaples.mockResolvedValue([
      { name: 'Sugar', category: 'Baking' },
    ]);

    const { systemPromptPrefix } = await buildMealPlanPrompt('u');

    expect(systemPromptPrefix).toContain('PANTRY STAPLES');
    expect(systemPromptPrefix).toContain('Spices: Salt, Pepper');
    expect(systemPromptPrefix).toContain('Oils: Olive oil');
    expect(systemPromptPrefix).toContain('OUT OF STOCK STAPLES');
    expect(systemPromptPrefix).toContain('Sugar');
  });

  it('renders household member details including allergies and macros', async () => {
    mockGetHouseholdMembers.mockResolvedValue([
      {
        name: 'Alice',
        age: 35,
        allergies: ['peanuts'],
        dietary_restrictions: ['vegan'],
        is_picky_eater: false,
        track_macros: true,
        macro_calories: 2000,
        macro_protein_g: 120,
        macro_carbs_g: 200,
        macro_fat_g: 60,
        health_goals: ['weight_loss'],
      },
      {
        name: 'Bobby',
        age: 8,
        allergies: [],
        dietary_restrictions: [],
        is_picky_eater: true,
        picky_issues: ['textures'],
      },
    ]);

    const { systemPromptPrefix } = await buildMealPlanPrompt('u');

    expect(systemPromptPrefix).toContain('HOUSEHOLD MEMBERS');
    expect(systemPromptPrefix).toContain('Alice');
    expect(systemPromptPrefix).toContain('ALLERGIES: peanuts');
    expect(systemPromptPrefix).toContain('Targets: 2000 calories, 120g protein');
    expect(systemPromptPrefix).toContain('Goals: weight_loss');
    expect(systemPromptPrefix).toContain('Alice has a daily carb limit of 200g');
    expect(systemPromptPrefix).toContain('Bobby is a child aged 8');
    expect(systemPromptPrefix).toContain('Picky: textures');
  });

  it('includes taste profile section when DAL returns one', async () => {
    mockBuildTasteProfilePrompt.mockReturnValue('TASTE PREFERENCES: foo bar');
    mockGetFrequentWebsites.mockReturnValue(['nytcooking.com', 'seriouseats.com']);

    const { systemPromptPrefix } = await buildMealPlanPrompt('u');
    expect(systemPromptPrefix).toContain('TASTE PREFERENCES: foo bar');
    expect(systemPromptPrefix).toContain(
      'nytcooking.com, seriouseats.com',
    );
  });

  it('includes budget section when weekly_budget is set', async () => {
    mockGetCookingPreferences.mockResolvedValue({ weekly_budget: 180 });
    const { systemPromptPrefix } = await buildMealPlanPrompt('u');
    expect(systemPromptPrefix).toContain('BUDGET AWARENESS');
    expect(systemPromptPrefix).toContain('$180');
  });

  it('omits budget section when weekly_budget is missing or 0', async () => {
    mockGetCookingPreferences.mockResolvedValue({ weekly_budget: 0 });
    const result1 = await buildMealPlanPrompt('u');
    expect(result1.systemPromptPrefix).not.toContain('BUDGET AWARENESS');

    mockGetCookingPreferences.mockResolvedValue({});
    const result2 = await buildMealPlanPrompt('u');
    expect(result2.systemPromptPrefix).not.toContain('BUDGET AWARENESS');
  });

  it('renders grocery store preferences with category assignments', async () => {
    mockGetMockOnboardingProfile.mockReturnValue({
      display_name: 'X',
      preferred_stores: ['safeway', 'costco', 'other'],
      store_category_assignments: {
        safeway: ['produce', 'dairy'],
        costco: ['meat'],
      },
      shopping_style: 'deal_hunter',
      preferred_delivery_service: null,
    });

    const { systemPromptPrefix } = await buildMealPlanPrompt('u');
    expect(systemPromptPrefix).toContain('GROCERY STORE PREFERENCES');
    expect(systemPromptPrefix).toContain('safeway, costco');
    expect(systemPromptPrefix).not.toContain('other,'); // filtered out
    expect(systemPromptPrefix).toContain('Category assignments');
    expect(systemPromptPrefix).toContain('safeway: produce, dairy');
    expect(systemPromptPrefix).toContain('multiple stores to find the best prices');
  });

  it('includes convenience shopping style line', async () => {
    mockGetMockOnboardingProfile.mockReturnValue({
      display_name: 'X',
      preferred_stores: ['safeway'],
      store_category_assignments: {},
      shopping_style: 'convenience',
    });
    const { systemPromptPrefix } = await buildMealPlanPrompt('u');
    expect(systemPromptPrefix).toContain('prefers convenience over savings');
  });

  it('includes pickup_only shopping style line', async () => {
    mockGetMockOnboardingProfile.mockReturnValue({
      display_name: 'X',
      preferred_stores: ['safeway'],
      store_category_assignments: {},
      shopping_style: 'pickup_only',
    });
    const { systemPromptPrefix } = await buildMealPlanPrompt('u');
    expect(systemPromptPrefix).toContain('curbside pickup');
  });

  it('includes delivery_preferred shopping style with service', async () => {
    mockGetMockOnboardingProfile.mockReturnValue({
      display_name: 'X',
      preferred_stores: ['safeway'],
      store_category_assignments: {},
      shopping_style: 'delivery_preferred',
      preferred_delivery_service: 'instacart',
    });
    const { systemPromptPrefix } = await buildMealPlanPrompt('u');
    expect(systemPromptPrefix).toContain('grocery delivery');
    expect(systemPromptPrefix).toContain('instacart');
  });

  it('includes flexible shopping style line', async () => {
    mockGetMockOnboardingProfile.mockReturnValue({
      display_name: 'X',
      preferred_stores: ['safeway'],
      store_category_assignments: {},
      shopping_style: 'flexible',
    });
    const { systemPromptPrefix } = await buildMealPlanPrompt('u');
    expect(systemPromptPrefix).toContain('no strong shopping preference');
  });

  it('renders faith practices section with kosher_basic', async () => {
    mockGetHouseholdFaithPractices.mockResolvedValue({
      follows_faith_based_diet: true,
      household_faith_practices: ['kosher'],
      kosher_level: 'basic',
    });
    const { systemPromptPrefix } = await buildMealPlanPrompt('u');
    expect(systemPromptPrefix).toContain('FAITH-BASED AND CULTURAL DIETARY');
    expect(systemPromptPrefix).toContain('pork');
    expect(systemPromptPrefix).toContain('shellfish');
  });

  it('flags hasAlcoholRestriction for LDS households', async () => {
    mockGetHouseholdFaithPractices.mockResolvedValue({
      follows_faith_based_diet: true,
      household_faith_practices: ['lds'],
      lds_no_coffee: true,
      lds_no_alcohol: true,
      lds_no_black_tea: false,
    });
    const { systemPromptPrefix } = await buildMealPlanPrompt('u');
    expect(systemPromptPrefix).toContain('NON-ALCOHOLIC SUBSTITUTION');
    expect(systemPromptPrefix).toContain('coffee');
    expect(systemPromptPrefix).toContain('alcohol');
  });

  it('flags hasAlcoholRestriction for halal households', async () => {
    mockGetHouseholdFaithPractices.mockResolvedValue({
      follows_faith_based_diet: true,
      household_faith_practices: ['halal'],
      halal_level: 'basic',
    });
    const { systemPromptPrefix } = await buildMealPlanPrompt('u');
    expect(systemPromptPrefix).toContain('NON-ALCOHOLIC SUBSTITUTION');
  });

  it('includes orthodox fasting practice', async () => {
    mockGetHouseholdFaithPractices.mockResolvedValue({
      follows_faith_based_diet: true,
      household_faith_practices: ['orthodox'],
      orthodox_fasting: true,
    });
    const { systemPromptPrefix } = await buildMealPlanPrompt('u');
    expect(systemPromptPrefix).toContain('Eastern Orthodox fasting');
  });

  it('includes catholic_lenten practice', async () => {
    mockGetHouseholdFaithPractices.mockResolvedValue({
      follows_faith_based_diet: true,
      household_faith_practices: ['catholic_lenten'],
      catholic_lenten: true,
    });
    const { systemPromptPrefix } = await buildMealPlanPrompt('u');
    expect(systemPromptPrefix).toContain('Catholic Lenten');
  });

  it('renders per-member faith practices', async () => {
    mockGetHouseholdFaithPractices.mockResolvedValue({
      follows_faith_based_diet: true,
      household_faith_practices: ['kosher'],
      kosher_level: 'basic',
    });
    mockGetAllMemberFaithPractices.mockResolvedValue([
      {
        name: 'Sarah',
        faith_practices: {
          follows_individual_faith_diet: true,
          individual_faith_practices: ['halal'],
          halal_level: 'full',
        },
      },
    ]);
    const { systemPromptPrefix } = await buildMealPlanPrompt('u');
    expect(systemPromptPrefix).toContain('Individual practices for Sarah');
    expect(systemPromptPrefix).toContain('NON-ALCOHOLIC SUBSTITUTION');
  });

  it('renders user role as account owner in mock mode', async () => {
    mockGetMockOnboardingProfile.mockReturnValue({
      display_name: 'Captain',
      preferred_stores: [],
      store_category_assignments: {},
    });
    const { systemPromptPrefix } = await buildMealPlanPrompt('u');
    expect(systemPromptPrefix).toContain('ACCOUNT OWNER (Captain)');
  });

  it('gracefully handles DAL errors (best-effort sections)', async () => {
    mockGetInStockStaples.mockRejectedValue(new Error('boom'));
    mockGetOutOfStockStaples.mockRejectedValue(new Error('boom'));
    mockGetHouseholdMembers.mockRejectedValue(new Error('boom'));
    mockGetTasteProfile.mockRejectedValue(new Error('boom'));
    mockGetCookingPreferences.mockRejectedValue(new Error('boom'));
    mockGetHouseholdFaithPractices.mockRejectedValue(new Error('boom'));

    const result = await buildMealPlanPrompt('u');
    // Should still return a valid prompt
    expect(result.systemPromptPrefix).toContain("You are Koda's meal planning assistant");
    expect(result.pantryItems).toEqual([]);
  });

  describe('non-mock mode (Supabase path)', () => {
    beforeEach(() => {
      mockIsMockMode.mockReturnValue(false);
    });

    it('fetches pantry from Supabase', async () => {
      const orderFn = vi
        .fn()
        .mockResolvedValue({ data: [{ ingredient_name: 'Apple', category: 'Produce' }] });
      mockSupabaseFrom.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              order: orderFn,
            }),
          }),
        }),
      }));

      const { pantryItems, systemPromptPrefix } = await buildMealPlanPrompt('u');
      expect(pantryItems).toEqual([{ ingredient_name: 'Apple', category: 'Produce' }]);
      expect(systemPromptPrefix).toContain('Apple');
    });

    it('handles null pantry result', async () => {
      mockSupabaseFrom.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              order: vi.fn().mockResolvedValue({ data: null }),
            }),
          }),
        }),
      }));
      const { pantryItems } = await buildMealPlanPrompt('u');
      expect(pantryItems).toEqual([]);
    });
  });
});
