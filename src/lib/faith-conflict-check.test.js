import { describe, it, expect } from 'vitest';
import {
  getAutoAppliedRestrictions,
  checkFaithConflicts,
  getAlcoholSubstitutions,
  getSubstitutionLabel,
} from './faith-conflict-check';

describe('getAutoAppliedRestrictions', () => {
  it('returns empty array when faith diet is not followed', () => {
    expect(getAutoAppliedRestrictions(null)).toEqual([]);
    expect(getAutoAppliedRestrictions({})).toEqual([]);
    expect(getAutoAppliedRestrictions({ follows_faith_based_diet: false })).toEqual(
      [],
    );
  });

  it('applies single-level restrictions (kosher_basic)', () => {
    const result = getAutoAppliedRestrictions({
      follows_faith_based_diet: true,
      household_faith_practices: ['kosher'],
      kosher_level: 'basic',
    });
    expect(result).toEqual(expect.arrayContaining(['no-pork', 'no-shellfish']));
  });

  it('applies single-level restrictions (halal_full)', () => {
    const result = getAutoAppliedRestrictions({
      follows_faith_based_diet: true,
      household_faith_practices: ['halal'],
      halal_level: 'full',
    });
    expect(result).toEqual(expect.arrayContaining(['no-pork', 'no-alcohol']));
  });

  it('applies hindu_strict adds onion and garlic', () => {
    const result = getAutoAppliedRestrictions({
      follows_faith_based_diet: true,
      household_faith_practices: ['hindu'],
      hindu_level: 'strict',
    });
    expect(result).toEqual(
      expect.arrayContaining(['vegetarian', 'no-onion', 'no-garlic']),
    );
  });

  it('applies LDS multi-toggle restrictions independently', () => {
    const result = getAutoAppliedRestrictions({
      follows_faith_based_diet: true,
      household_faith_practices: ['lds'],
      lds_no_coffee: true,
      lds_no_alcohol: false,
      lds_no_black_tea: true,
    });
    expect(result).toEqual(expect.arrayContaining(['no-coffee', 'no-black-tea']));
    expect(result).not.toContain('no-alcohol');
  });

  it('applies boolean practices (catholic_lenten maps to empty)', () => {
    const result = getAutoAppliedRestrictions({
      follows_faith_based_diet: true,
      household_faith_practices: ['catholic_lenten'],
      catholic_lenten: true,
    });
    expect(result).toEqual([]);
  });

  it('applies boolean_with_toggle (orthodox)', () => {
    // orthodox_fasting maps to empty array — verifying it does not crash
    const result = getAutoAppliedRestrictions({
      follows_faith_based_diet: true,
      household_faith_practices: ['orthodox'],
      orthodox_fasting: true,
    });
    expect(result).toEqual([]);
  });

  it('ignores unknown practice ids', () => {
    const result = getAutoAppliedRestrictions({
      follows_faith_based_diet: true,
      household_faith_practices: ['made_up_religion'],
    });
    expect(result).toEqual([]);
  });

  it('deduplicates across multiple practices', () => {
    const result = getAutoAppliedRestrictions({
      follows_faith_based_diet: true,
      household_faith_practices: ['kosher', 'halal'],
      kosher_level: 'basic',
      halal_level: 'basic',
    });
    const porkCount = result.filter((r) => r === 'no-pork').length;
    expect(porkCount).toBe(1);
  });

  it('skips practice when its level field is unset', () => {
    const result = getAutoAppliedRestrictions({
      follows_faith_based_diet: true,
      household_faith_practices: ['kosher'],
      // No kosher_level
    });
    expect(result).toEqual([]);
  });
});

describe('checkFaithConflicts', () => {
  it('returns no conflicts when no restrictions are active', () => {
    const result = checkFaithConflicts(['chicken', 'rice'], null);
    expect(result.hasConflict).toBe(false);
    expect(result.conflicts).toEqual([]);
  });

  it('detects pork conflict with kosher_basic', () => {
    const result = checkFaithConflicts(
      ['bacon', 'eggs'],
      {
        follows_faith_based_diet: true,
        household_faith_practices: ['kosher'],
        kosher_level: 'basic',
      },
    );
    expect(result.hasConflict).toBe(true);
    expect(result.conflicts.length).toBeGreaterThan(0);
    expect(result.conflicts[0].ingredient).toContain('bacon');
  });

  it('detects shellfish conflict', () => {
    const result = checkFaithConflicts(
      ['shrimp tempura'],
      {
        follows_faith_based_diet: true,
        household_faith_practices: ['kosher'],
        kosher_level: 'basic',
      },
    );
    expect(result.hasConflict).toBe(true);
  });

  it('handles ingredient objects with name', () => {
    const result = checkFaithConflicts(
      [{ name: 'pork belly' }],
      {
        follows_faith_based_diet: true,
        household_faith_practices: ['halal'],
        halal_level: 'basic',
      },
    );
    expect(result.hasConflict).toBe(true);
  });

  it('handles ingredient objects with ingredient_name', () => {
    const result = checkFaithConflicts(
      [{ ingredient_name: 'wine reduction' }],
      {
        follows_faith_based_diet: true,
        household_faith_practices: ['halal'],
        halal_level: 'basic',
      },
    );
    expect(result.hasConflict).toBe(true);
  });

  it('checks per-member restrictions in addition to household', () => {
    const result = checkFaithConflicts(
      ['beef'],
      { follows_faith_based_diet: false },
      [
        {
          faith_practices: {
            follows_faith_based_diet: true,
            household_faith_practices: ['hindu'],
            hindu_level: 'beef_free',
          },
        },
      ],
    );
    expect(result.hasConflict).toBe(true);
    expect(result.conflicts[0].ingredient).toContain('beef');
  });

  it('returns no conflict for clean ingredients', () => {
    const result = checkFaithConflicts(
      ['rice', 'broccoli', 'tofu'],
      {
        follows_faith_based_diet: true,
        household_faith_practices: ['kosher'],
        kosher_level: 'basic',
      },
    );
    expect(result.hasConflict).toBe(false);
  });

  it('skips restrictions with empty keyword lists', () => {
    // kosher_traditional adds no-dairy-with-meat which has empty keywords
    const result = checkFaithConflicts(
      ['cheese'],
      {
        follows_faith_based_diet: true,
        household_faith_practices: ['kosher'],
        kosher_level: 'traditional',
      },
    );
    // Cheese isn't in pork/shellfish list, so no conflict from those
    expect(result.hasConflict).toBe(false);
  });
});

describe('getAlcoholSubstitutions', () => {
  it('finds substitutions for alcohol ingredients', () => {
    const result = getAlcoholSubstitutions(['red wine', 'flour']);
    expect(result.hasAlcohol).toBe(true);
    expect(result.substitutions).toHaveLength(1);
    expect(result.substitutions[0].substitute).toContain('broth');
  });

  it('handles ingredient objects', () => {
    const result = getAlcoholSubstitutions([{ name: 'cooking wine' }]);
    expect(result.hasAlcohol).toBe(true);
  });

  it('returns empty when no alcohol present', () => {
    const result = getAlcoholSubstitutions(['rice', 'salt']);
    expect(result.hasAlcohol).toBe(false);
    expect(result.substitutions).toEqual([]);
  });

  it('matches partial substring (e.g., "red wine vinegar")', () => {
    const result = getAlcoholSubstitutions(['red wine vinegar']);
    expect(result.hasAlcohol).toBe(true);
  });
});

describe('getSubstitutionLabel', () => {
  it('returns default label without faith practices', () => {
    expect(getSubstitutionLabel(null)).toBe('Alcohol-free swap');
    expect(getSubstitutionLabel({})).toBe('Alcohol-free swap');
  });

  it('returns LDS-specific label when lds is active', () => {
    expect(
      getSubstitutionLabel({ household_faith_practices: ['lds'] }),
    ).toBe('Word of Wisdom friendly swap');
  });

  it('returns default label when other practices are active', () => {
    expect(
      getSubstitutionLabel({ household_faith_practices: ['kosher'] }),
    ).toBe('Alcohol-free swap');
  });
});
