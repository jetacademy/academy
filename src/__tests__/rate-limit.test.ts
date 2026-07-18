/**
 * Tests for src/lib/rate-limit.ts — in-memory rate limiter.
 *
 * The module maintains a shared Map<string, Entry> store that persists
 * across imports. We use unique keys per test to avoid collisions and
 * control time via vi.useFakeTimers().
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rateLimit, checkRateLimit } from '@/lib/rate-limit';

describe('rateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows the first request', () => {
    const result = rateLimit('test:first', 5, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
    expect(result.resetInMs).toBeGreaterThan(0);
    expect(result.resetInMs).toBeLessThanOrEqual(60_000);
  });

  it('allows requests within the limit', () => {
    // Use a unique key per run to avoid state leakage
    const key = `test:within:${Date.now()}`;
    for (let i = 0; i < 5; i++) {
      const result = rateLimit(key, 5, 60_000);
      expect(result.allowed).toBe(true);
    }
  });

  it('blocks requests that exceed the limit', () => {
    const key = `test:exceed:${Date.now()}`;
    // Use all 3 allowed requests
    const max = 3;
    for (let i = 0; i < max; i++) {
      const result = rateLimit(key, max, 60_000);
      expect(result.allowed).toBe(true);
    }
    // Next request should be blocked
    const blocked = rateLimit(key, max, 60_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it('reports 0 remaining and non-zero resetInMs when blocked', () => {
    const key = `test:remaining:${Date.now()}`;
    // Exhaust the limit
    for (let i = 0; i < 2; i++) {
      rateLimit(key, 2, 30_000);
    }
    const blocked = rateLimit(key, 2, 30_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.resetInMs).toBeGreaterThan(0);
    // Should be at most the window (30s), minus some ms for test execution
    expect(blocked.resetInMs).toBeLessThanOrEqual(30_000);
  });

  it('resets after the window expires', () => {
    const key = `test:reset:${Date.now()}`;
    // Exhaust limit
    rateLimit(key, 2, 60_000);
    rateLimit(key, 2, 60_000);
    expect(rateLimit(key, 2, 60_000).allowed).toBe(false);

    // Advance time past the window
    vi.advanceTimersByTime(60_001);

    // Should be allowed again (new window)
    const result = rateLimit(key, 2, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
  });

  it('handles different keys independently', () => {
    const keyA = `test:indep:A:${Date.now()}`;
    const keyB = `test:indep:B:${Date.now()}`;

    // Exhaust keyA
    rateLimit(keyA, 1, 60_000);
    expect(rateLimit(keyA, 1, 60_000).allowed).toBe(false);

    // keyB should still be fresh
    expect(rateLimit(keyB, 1, 60_000).allowed).toBe(true);
  });

  it('uses default windowMs of 60 seconds', () => {
    const key = `test:default:${Date.now()}`;
    const result = rateLimit(key, 5);
    expect(result.resetInMs).toBeLessThanOrEqual(60_000);
    expect(result.resetInMs).toBeGreaterThan(0);
  });

  it('decrements remaining correctly', () => {
    const key = `test:decrement:${Date.now()}`;
    const max = 10;

    const r1 = rateLimit(key, max, 60_000);
    expect(r1.remaining).toBe(9);

    const r2 = rateLimit(key, max, 60_000);
    expect(r2.remaining).toBe(8);

    // Exhaust
    for (let i = 2; i < max; i++) {
      rateLimit(key, max, 60_000);
    }
    const rLast = rateLimit(key, max, 60_000);
    expect(rLast.remaining).toBe(0);
    expect(rLast.allowed).toBe(false);
  });
});

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns { ok: true } for first request', () => {
    const result = checkRateLimit(`check:first:${Date.now()}`, 5, 60_000);
    expect(result).toEqual({ ok: true });
  });

  it('returns an error object when limit exceeded', () => {
    const key = `check:exceed:${Date.now()}`;
    // Exhaust the limit (max 1)
    checkRateLimit(key, 1, 60_000);
    const result = checkRateLimit(key, 1, 60_000);
    expect(result).not.toEqual({ ok: true });
    if (!('ok' in result && result.ok === true)) {
      expect(result.ok).toBe(false);
      expect(result.error).toContain('Terlalu banyak permintaan');
      expect(result.status).toBe(429);
    }
  });
});
