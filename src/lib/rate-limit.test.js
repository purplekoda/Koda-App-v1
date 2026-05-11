import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  rateLimit,
  authLimiter,
  apiLimiter,
  aiLimiter,
  uploadLimiter,
} from './rate-limit';

describe('rateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows first request and reports remaining', () => {
    const limiter = rateLimit({ interval: 1000, maxRequests: 3 });
    const result = limiter.check('user-a-1');
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(2);
    expect(result.resetAt).toBeGreaterThan(Date.now());
  });

  it('allows up to maxRequests within window', () => {
    const limiter = rateLimit({ interval: 1000, maxRequests: 3 });
    expect(limiter.check('user-b-1').success).toBe(true);
    expect(limiter.check('user-b-1').success).toBe(true);
    const third = limiter.check('user-b-1');
    expect(third.success).toBe(true);
    expect(third.remaining).toBe(0);
  });

  it('rejects requests beyond maxRequests', () => {
    const limiter = rateLimit({ interval: 1000, maxRequests: 2 });
    limiter.check('user-c-1');
    limiter.check('user-c-1');
    const blocked = limiter.check('user-c-1');
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it('resets window after interval elapses', () => {
    const limiter = rateLimit({ interval: 1000, maxRequests: 2 });
    limiter.check('user-d-1');
    limiter.check('user-d-1');
    expect(limiter.check('user-d-1').success).toBe(false);

    vi.advanceTimersByTime(1001);
    const afterReset = limiter.check('user-d-1');
    expect(afterReset.success).toBe(true);
    expect(afterReset.remaining).toBe(1);
  });

  it('tracks identifiers independently', () => {
    const limiter = rateLimit({ interval: 1000, maxRequests: 1 });
    expect(limiter.check('alpha').success).toBe(true);
    expect(limiter.check('beta').success).toBe(true);
    expect(limiter.check('alpha').success).toBe(false);
    expect(limiter.check('beta').success).toBe(false);
  });

  it('uses default options when called with none', () => {
    const limiter = rateLimit();
    const result = limiter.check('user-default-1');
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(19);
  });

  it('cleans up stale entries after cleanup interval', () => {
    const limiter = rateLimit({ interval: 1000, maxRequests: 1 });
    limiter.check('cleanup-target');
    expect(limiter.check('cleanup-target').success).toBe(false);

    // Advance past 2x interval + cleanup interval (5min)
    vi.advanceTimersByTime(6 * 60 * 1000);
    // Trigger cleanup via any check
    const fresh = limiter.check('cleanup-target');
    expect(fresh.success).toBe(true);
    expect(fresh.remaining).toBe(0);
  });

  it('exports pre-configured limiters', () => {
    expect(authLimiter).toBeDefined();
    expect(apiLimiter).toBeDefined();
    expect(aiLimiter).toBeDefined();
    expect(uploadLimiter).toBeDefined();
    expect(typeof authLimiter.check).toBe('function');
    expect(typeof apiLimiter.check).toBe('function');
    expect(typeof aiLimiter.check).toBe('function');
    expect(typeof uploadLimiter.check).toBe('function');
  });
});
