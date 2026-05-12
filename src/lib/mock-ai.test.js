import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getMockAIResponse } from './mock-ai';

describe('getMockAIResponse', () => {
  describe('intent-based responses', () => {
    it('returns a meal suggestion card for add_accompaniment intent', () => {
      const result = getMockAIResponse('meals', 'add bread', {
        intent: 'add_accompaniment',
        day: 'Wed',
        mealType: 'dinner',
        itemType: 'bread',
      });
      expect(result.card).toBeDefined();
      expect(result.card.type).toBe('meal_suggestion');
      expect(result.card.day).toBe('Wed');
      expect(result.card.mealType).toBe('dinner');
      expect(result.card.suggestion.item_type).toBe('bread');
      expect(result.card.targetSlotType).toBe('sides');
    });

    it('uses dinner_dessert slot type for dessert suggestions', () => {
      const result = getMockAIResponse('meals', 'add dessert', {
        intent: 'add_accompaniment',
        day: 'Mon',
        mealType: 'dinner',
        itemType: 'dessert',
      });
      expect(result.card.targetSlotType).toBe('dinner_dessert');
    });

    it('falls back to side_dish when itemType unknown', () => {
      const result = getMockAIResponse('meals', 'add something', {
        intent: 'add_accompaniment',
        day: null,
        mealType: null,
        itemType: null,
      });
      expect(result.card.suggestion.item_type).toBe('side_dish');
      expect(result.card.day).toBe('Wed'); // default
      expect(result.card.mealType).toBe('dinner'); // default
    });

    it('returns swap prompt for swap_item intent', () => {
      const result = getMockAIResponse('meals', 'swap lunch', {
        intent: 'swap_item',
        day: 'Tue',
        mealType: 'lunch',
      });
      expect(result.text).toContain("Tue");
      expect(result.text).toContain('lunch');
      expect(result.chips).toContain('Use pantry ingredients');
    });

    it('uses defaults for swap when day/mealType missing', () => {
      const result = getMockAIResponse('meals', 'swap', {
        intent: 'swap_item',
        day: null,
        mealType: null,
      });
      expect(result.text).toContain('Tue');
      expect(result.text).toContain('lunch');
    });

    it('returns surprise me response', () => {
      const result = getMockAIResponse('meals', 'surprise me', {
        intent: 'surprise_me',
      });
      expect(result.chips).toContain('Use what I already have');
      expect(result.chips).toContain('Something new and popular');
    });

    it('returns plan-week response', () => {
      const result = getMockAIResponse('meals', 'plan my week', {
        intent: 'plan_week',
      });
      expect(result.chips).toContain('Use my Recipe Box');
      expect(result.chips).toContain('Fill it all for me');
    });
  });

  describe('keyword-matched responses', () => {
    it('matches "dinner" to kitchen response', () => {
      const result = getMockAIResponse('meals', 'what is for dinner');
      expect(result.text).toContain('chicken breast');
    });

    it('matches "tonight" to kitchen response', () => {
      const result = getMockAIResponse('meals', 'tonight');
      expect(result.text).toContain('chicken breast');
    });

    it('matches "grocery" to grocery response', () => {
      const result = getMockAIResponse('meals', 'grocery list');
      expect(result.text).toContain('17 items');
    });

    it('matches "shop" to grocery response', () => {
      const result = getMockAIResponse('meals', 'shop');
      expect(result.text).toContain('17 items');
    });

    it('matches "pantry" / "expir" to kitchen response', () => {
      expect(getMockAIResponse('meals', 'pantry status').text).toContain(
        'chicken breast',
      );
      expect(
        getMockAIResponse('meals', 'expiring items').text,
      ).toContain('chicken breast');
    });

    it('matches "plan" / "week" to meals response', () => {
      const result = getMockAIResponse('dashboard', 'plan');
      expect(result.text).toContain("tonight’s dinner");
    });
  });

  describe('context-based fallback', () => {
    beforeEach(() => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('returns first dashboard response for empty query', () => {
      const result = getMockAIResponse('dashboard');
      expect(result.text).toContain('Good choice to plan ahead');
    });

    it('returns first grocery response for empty query', () => {
      const result = getMockAIResponse('grocery');
      expect(result.text).toContain('17 items');
    });

    it('falls back to default responses for unknown context', () => {
      const result = getMockAIResponse('nonexistent');
      expect(result.text).toContain('meal planning');
    });
  });

  it('returns a structured object with text and chips fields', () => {
    const result = getMockAIResponse('dashboard');
    expect(result).toHaveProperty('text');
    expect(result).toHaveProperty('chips');
    expect(Array.isArray(result.chips)).toBe(true);
  });
});
