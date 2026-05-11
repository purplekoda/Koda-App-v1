import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { classifyChatIntent } from './chat-intent';

describe('classifyChatIntent', () => {
  it('returns general intent for non-string/empty input', () => {
    expect(classifyChatIntent('').intent).toBe('general');
    expect(classifyChatIntent(null).intent).toBe('general');
    expect(classifyChatIntent(undefined).intent).toBe('general');
    expect(classifyChatIntent(42).intent).toBe('general');
  });

  it('detects plan_week intent', () => {
    expect(classifyChatIntent('plan my week').intent).toBe('plan_week');
    expect(classifyChatIntent('fill my week').intent).toBe('plan_week');
    expect(classifyChatIntent('plan this week').intent).toBe('plan_week');
    expect(classifyChatIntent('fill all empty slots').intent).toBe('plan_week');
    expect(classifyChatIntent('plan meals for the week').intent).toBe('plan_week');
  });

  it('detects surprise_me intent', () => {
    expect(classifyChatIntent('surprise me').intent).toBe('surprise_me');
    expect(classifyChatIntent('something fun').intent).toBe('surprise_me');
    expect(classifyChatIntent('feeling adventurous').intent).toBe('surprise_me');
    expect(classifyChatIntent("what's trending").intent).toBe('surprise_me');
    expect(classifyChatIntent('show me a viral recipe').intent).toBe('surprise_me');
  });

  it('detects add_accompaniment with item type', () => {
    const result = classifyChatIntent('add a side dish to dinner');
    expect(result.intent).toBe('add_accompaniment');
    expect(result.itemType).toBe('side_dish');
    expect(result.mealType).toBe('dinner');
  });

  it('detects dessert / bread / drink / appetizer item types', () => {
    expect(classifyChatIntent('add a dessert').itemType).toBe('dessert');
    expect(classifyChatIntent('suggest some bread').itemType).toBe('bread');
    expect(classifyChatIntent('add a drink').itemType).toBe('drink');
    expect(classifyChatIntent('add an appetizer').itemType).toBe('appetizer');
  });

  it('detects "something sweet" as dessert', () => {
    const result = classifyChatIntent('add something sweet for dinner');
    expect(result.itemType).toBe('dessert');
  });

  it('detects "something to drink" as drink', () => {
    const result = classifyChatIntent('add something to drink');
    expect(result.itemType).toBe('drink');
  });

  it('detects "what goes with X" as add_accompaniment', () => {
    const result = classifyChatIntent('what goes with chicken');
    expect(result.intent).toBe('add_accompaniment');
  });

  it('detects "what would go with X"', () => {
    const result = classifyChatIntent('what would go with the pasta');
    expect(result.intent).toBe('add_accompaniment');
  });

  it('detects remove_item intent', () => {
    const result = classifyChatIntent('remove the dessert');
    expect(result.intent).toBe('remove_item');
    expect(result.itemType).toBe('dessert');
  });

  it('detects various remove phrasings', () => {
    expect(classifyChatIntent('take off the bread').intent).toBe('remove_item');
    expect(classifyChatIntent('delete the dessert').intent).toBe('remove_item');
    expect(classifyChatIntent("i don't want that side dish").intent).toBe(
      'remove_item',
    );
    expect(classifyChatIntent('get rid of the dessert').intent).toBe(
      'remove_item',
    );
  });

  it('detects swap_item intent with meal type', () => {
    const result = classifyChatIntent('swap the dinner');
    expect(result.intent).toBe('swap_item');
    expect(result.mealType).toBe('dinner');
  });

  it('detects various swap phrasings', () => {
    expect(classifyChatIntent('change the lunch').intent).toBe('swap_item');
    expect(classifyChatIntent('replace the dinner').intent).toBe('swap_item');
    expect(classifyChatIntent('different lunch').intent).toBe('swap_item');
    expect(classifyChatIntent('something else for dinner').intent).toBe(
      'swap_item',
    );
  });

  it('extracts day from weekday names', () => {
    expect(classifyChatIntent('change monday lunch').day).toBe('Mon');
    expect(classifyChatIntent("change tuesday's dinner").day).toBe('Tue');
    expect(classifyChatIntent('swap fri dinner').day).toBe('Fri');
  });

  it('returns general intent when nothing matches', () => {
    const result = classifyChatIntent('hello, how are you');
    expect(result.intent).toBe('general');
    expect(result.day).toBeNull();
    expect(result.mealType).toBeNull();
  });

  it('detects supper as dinner', () => {
    const result = classifyChatIntent('add a side for supper');
    expect(result.mealType).toBe('dinner');
  });

  it('extracts meal type from "after X" pattern', () => {
    const result = classifyChatIntent('add something after lunch');
    expect(result.mealType).toBe('lunch');
  });
});

describe('classifyChatIntent — relative dates', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves "tonight" to today and meal type dinner', () => {
    // 2026-05-13 is a Wednesday
    vi.setSystemTime(new Date('2026-05-13T12:00:00Z'));
    const result = classifyChatIntent('add a side dish tonight');
    expect(result.day).toBe('Wed');
    expect(result.mealType).toBe('dinner');
  });

  it('resolves "today"', () => {
    vi.setSystemTime(new Date('2026-05-15T12:00:00Z')); // Friday
    const result = classifyChatIntent('swap today lunch');
    expect(result.day).toBe('Fri');
  });

  it('resolves "tomorrow"', () => {
    vi.setSystemTime(new Date('2026-05-13T12:00:00Z')); // Wednesday
    const result = classifyChatIntent('add a side for tomorrow lunch');
    expect(result.day).toBe('Thu');
  });

  it('wraps "tomorrow" from Sunday to Monday', () => {
    vi.setSystemTime(new Date('2026-05-17T12:00:00Z')); // Sunday
    const result = classifyChatIntent('add a side for tomorrow lunch');
    expect(result.day).toBe('Mon');
  });
});
