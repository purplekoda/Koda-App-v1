import { describe, it, expect } from 'vitest';
import {
  sanitizeString,
  sanitizeEmail,
  sanitizeInteger,
  sanitizeJson,
  sanitizeEnum,
} from './sanitize';

describe('sanitizeString', () => {
  it('strips HTML tags', () => {
    expect(sanitizeString('<script>alert(1)</script>hello')).toBe('hello');
    expect(sanitizeString('<b>bold</b> text')).toBe('bold text');
  });

  it('trims whitespace', () => {
    expect(sanitizeString('  hello  ')).toBe('hello');
  });

  it('returns empty string for non-string inputs', () => {
    expect(sanitizeString(null)).toBe('');
    expect(sanitizeString(undefined)).toBe('');
    expect(sanitizeString(123)).toBe('');
    expect(sanitizeString({})).toBe('');
  });

  it('respects maxLength', () => {
    expect(sanitizeString('a'.repeat(600))).toHaveLength(500);
    expect(sanitizeString('hello world', 5)).toBe('hello');
  });
});

describe('sanitizeEmail', () => {
  it('accepts valid email addresses', () => {
    expect(sanitizeEmail('user@example.com')).toBe('user@example.com');
    expect(sanitizeEmail('first.last+tag@sub.example.co')).toBe(
      'first.last+tag@sub.example.co',
    );
  });

  it('lowercases and trims', () => {
    expect(sanitizeEmail('  USER@Example.COM  ')).toBe('user@example.com');
  });

  it('rejects invalid emails', () => {
    expect(sanitizeEmail('not-an-email')).toBeNull();
    expect(sanitizeEmail('missing@tld')).toBeNull();
    expect(sanitizeEmail('@nodomain.com')).toBeNull();
    expect(sanitizeEmail('no@local.')).toBeNull();
  });

  it('rejects non-string inputs', () => {
    expect(sanitizeEmail(null)).toBeNull();
    expect(sanitizeEmail(undefined)).toBeNull();
    expect(sanitizeEmail(123)).toBeNull();
  });

  it('rejects emails with local part longer than 64 chars', () => {
    const longLocal = 'a'.repeat(65) + '@example.com';
    expect(sanitizeEmail(longLocal)).toBeNull();
  });
});

describe('sanitizeInteger', () => {
  it('parses valid integers', () => {
    expect(sanitizeInteger('42')).toBe(42);
    expect(sanitizeInteger(100)).toBe(100);
    expect(sanitizeInteger('0')).toBe(0);
  });

  it('returns null for NaN inputs', () => {
    expect(sanitizeInteger('abc')).toBeNull();
    expect(sanitizeInteger(null)).toBeNull();
    expect(sanitizeInteger(undefined)).toBeNull();
  });

  it('enforces min and max bounds', () => {
    expect(sanitizeInteger(5, 10, 100)).toBeNull();
    expect(sanitizeInteger(200, 10, 100)).toBeNull();
    expect(sanitizeInteger(50, 10, 100)).toBe(50);
  });

  it('respects custom range', () => {
    expect(sanitizeInteger(-5, -10, 10)).toBe(-5);
  });
});

describe('sanitizeJson', () => {
  it('sanitizes strings within objects', () => {
    const input = { name: '<script>x</script>safe' };
    expect(sanitizeJson(input)).toEqual({ name: 'safe' });
  });

  it('preserves finite numbers', () => {
    expect(sanitizeJson(42)).toBe(42);
    expect(sanitizeJson({ count: 5 })).toEqual({ count: 5 });
  });

  it('blocks NaN and Infinity', () => {
    expect(sanitizeJson(NaN)).toBeNull();
    expect(sanitizeJson(Infinity)).toBeNull();
    expect(sanitizeJson(-Infinity)).toBeNull();
  });

  it('preserves booleans', () => {
    expect(sanitizeJson(true)).toBe(true);
    expect(sanitizeJson(false)).toBe(false);
  });

  it('returns null for null/undefined', () => {
    expect(sanitizeJson(null)).toBeNull();
    expect(sanitizeJson(undefined)).toBeNull();
  });

  it('sanitizes arrays recursively', () => {
    expect(sanitizeJson(['<b>a</b>', 1, true])).toEqual(['a', 1, true]);
  });

  it('truncates arrays to 100 items', () => {
    const arr = new Array(200).fill('x');
    expect(sanitizeJson(arr)).toHaveLength(100);
  });

  it('limits keys to 50 per object', () => {
    const obj = {};
    for (let i = 0; i < 60; i++) obj[`k${i}`] = i;
    const result = sanitizeJson(obj);
    expect(Object.keys(result)).toHaveLength(50);
  });

  it('blocks prototype pollution keys', () => {
    const input = { __proto__: { polluted: true }, safe: 'ok' };
    const result = sanitizeJson(input);
    expect(result.polluted).toBeUndefined();
    expect(result.safe).toBe('ok');
  });

  it('blocks deeply nested payloads', () => {
    let deep = { a: 1 };
    for (let i = 0; i < 15; i++) deep = { nested: deep };
    const result = sanitizeJson(deep);
    let cursor = result;
    let depth = 0;
    while (cursor && cursor.nested) {
      cursor = cursor.nested;
      depth++;
    }
    expect(depth).toBeLessThan(15);
  });

  it('rejects functions/symbols/bigints', () => {
    expect(sanitizeJson(() => {})).toBeNull();
    expect(sanitizeJson(Symbol('x'))).toBeNull();
    expect(sanitizeJson(10n)).toBeNull();
  });

  it('skips empty key names', () => {
    const result = sanitizeJson({ '': 'empty', valid: 'ok' });
    expect(result.valid).toBe('ok');
    expect(result['']).toBeUndefined();
  });
});

describe('sanitizeEnum', () => {
  it('returns value when in allowed list', () => {
    expect(sanitizeEnum('a', ['a', 'b'])).toBe('a');
  });

  it('returns null when not in allowed list', () => {
    expect(sanitizeEnum('c', ['a', 'b'])).toBeNull();
  });

  it('returns null for non-string values', () => {
    expect(sanitizeEnum(123, ['a'])).toBeNull();
    expect(sanitizeEnum(null, ['a'])).toBeNull();
  });
});
