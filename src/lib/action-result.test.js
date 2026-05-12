import { describe, it, expect } from 'vitest';
import { ok, fail } from './action-result';

describe('action-result', () => {
  describe('ok', () => {
    it('returns success result with default null data', () => {
      expect(ok()).toEqual({ success: true, data: null, error: null });
    });

    it('returns success result with provided data', () => {
      const data = { id: 1, name: 'thing' };
      expect(ok(data)).toEqual({ success: true, data, error: null });
    });

    it('accepts falsy values as data', () => {
      expect(ok(0)).toEqual({ success: true, data: 0, error: null });
      expect(ok('')).toEqual({ success: true, data: '', error: null });
      expect(ok(false)).toEqual({ success: true, data: false, error: null });
    });
  });

  describe('fail', () => {
    it('returns failure result with default error message', () => {
      expect(fail()).toEqual({
        success: false,
        data: null,
        error: 'Something went wrong',
      });
    });

    it('returns failure result with provided error message', () => {
      expect(fail('not found')).toEqual({
        success: false,
        data: null,
        error: 'not found',
      });
    });
  });
});
