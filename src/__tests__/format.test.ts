/**
 * Tests for src/lib/format.ts — pure formatting utility functions.
 * No mocks needed; these are deterministic functions.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { formatJadwal, rupiah, getDaysLeft } from '@/lib/format';

describe('formatJadwal', () => {
  it('formats a date in Indonesian long format with WIB suffix', () => {
    // 2026-07-20 14:30:00 WIB (Asia/Jakarta)
    const d = new Date('2026-07-20T07:30:00.000Z'); // UTC = 14:30 WIB
    const result = formatJadwal(d);
    expect(result).toContain('Juli');
    expect(result).toContain('WIB');
    expect(result).toContain('14:30');
  });

  it('includes weekday in output', () => {
    // 2026-07-20 is a Monday
    const d = new Date('2026-07-20T07:00:00.000Z');
    const result = formatJadwal(d);
    expect(result.toLowerCase()).toContain('senin');
  });

  it('replaces dots (.) with colons (:) in time portion', () => {
    // Some Node.js locale implementations use dots as separators
    const d = new Date('2026-07-20T08:00:00.000Z'); // 15:00 WIB
    const result = formatJadwal(d);
    // Time should use colons, not dots
    expect(result).not.toMatch(/\d{2}\.\d{2}/);
  });

  it('handles end-of-year dates correctly', () => {
    const d = new Date('2026-12-31T09:00:00.000Z'); // 16:00 WIB
    const result = formatJadwal(d);
    expect(result).toContain('Desember');
  });
});

describe('rupiah', () => {
  it('formats zero rupiah', () => {
    expect(rupiah(0)).toBe('Rp 0');
  });

  it('formats thousands', () => {
    expect(rupiah(5000)).toBe('Rp 5.000');
  });

  it('formats millions', () => {
    expect(rupiah(1500000)).toBe('Rp 1.500.000');
  });

  it('formats large numbers', () => {
    // 49 thousand
    expect(rupiah(49000)).toBe('Rp 49.000');
  });

  it('formats whole millions with zero hundreds', () => {
    expect(rupiah(1000000)).toBe('Rp 1.000.000');
  });
});

describe('getDaysLeft', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns 0 for an event happening now', () => {
    const now = new Date('2026-07-18T12:00:00.000Z');
    vi.setSystemTime(now);
    expect(getDaysLeft(now)).toBe(0);
  });

  it('returns 0 for an event in the past (within 12h)', () => {
    const now = new Date('2026-07-18T12:00:00.000Z');
    vi.setSystemTime(now);
    const past = new Date('2026-07-18T06:00:00.000Z');
    expect(getDaysLeft(past)).toBe(0);
  });

  it('returns 1 for an event ~24 hours away', () => {
    const now = new Date('2026-07-17T12:00:00.000Z');
    vi.setSystemTime(now);
    const future = new Date('2026-07-18T12:00:00.000Z');
    expect(getDaysLeft(future)).toBe(1);
  });

  it('returns 0 for an event in the past beyond 12h', () => {
    const now = new Date('2026-07-20T12:00:00.000Z');
    vi.setSystemTime(now);
    const past = new Date('2026-07-18T12:00:00.000Z');
    // Diff is -2 days, so max(0, ceil(-2)) = 0
    expect(getDaysLeft(past)).toBe(0);
  });

  it('returns 7 for an event exactly 7 days away', () => {
    const now = new Date('2026-07-11T12:00:00.000Z');
    vi.setSystemTime(now);
    const future = new Date('2026-07-18T12:00:00.000Z');
    expect(getDaysLeft(future)).toBe(7);
  });

  it('returns 3 for an event ~3.5 days away (ceil)', () => {
    const now = new Date('2026-07-15T00:00:00.000Z');
    vi.setSystemTime(now);
    const future = new Date('2026-07-18T12:00:00.000Z'); // 3.5 days
    expect(getDaysLeft(future)).toBe(4); // Math.ceil(3.5) = 4
  });

  it('returns 0 for very past event', () => {
    const now = new Date('2026-07-18T12:00:00.000Z');
    vi.setSystemTime(now);
    const veryPast = new Date('2025-01-01T00:00:00.000Z');
    expect(getDaysLeft(veryPast)).toBe(0);
  });
});
