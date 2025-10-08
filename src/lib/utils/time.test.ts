import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import { formatRelativeTime, isVeryRecent, getTimeGroup } from './time';

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('formats timestamps less than 60 seconds as "just now"', () => {
    const now = new Date('2025-01-15T12:00:00Z');
    vi.setSystemTime(now);

    const thirtySecondsAgo = new Date('2025-01-15T11:59:30Z');
    expect(formatRelativeTime(thirtySecondsAgo)).toBe('just now');
  });

  it('formats timestamps as minutes ago', () => {
    const now = new Date('2025-01-15T12:00:00Z');
    vi.setSystemTime(now);

    const oneMinuteAgo = new Date('2025-01-15T11:59:00Z');
    expect(formatRelativeTime(oneMinuteAgo)).toBe('1 minute ago');

    const fiveMinutesAgo = new Date('2025-01-15T11:55:00Z');
    expect(formatRelativeTime(fiveMinutesAgo)).toBe('5 minutes ago');
  });

  it('formats timestamps as hours ago', () => {
    const now = new Date('2025-01-15T12:00:00Z');
    vi.setSystemTime(now);

    const oneHourAgo = new Date('2025-01-15T11:00:00Z');
    expect(formatRelativeTime(oneHourAgo)).toBe('1 hour ago');

    const threeHoursAgo = new Date('2025-01-15T09:00:00Z');
    expect(formatRelativeTime(threeHoursAgo)).toBe('3 hours ago');
  });

  it('formats timestamps as "yesterday" for 1 day ago', () => {
    const now = new Date('2025-01-15T12:00:00Z');
    vi.setSystemTime(now);

    const oneDayAgo = new Date('2025-01-14T12:00:00Z');
    expect(formatRelativeTime(oneDayAgo)).toBe('yesterday');
  });

  it('formats timestamps as days ago (2-6 days)', () => {
    const now = new Date('2025-01-15T12:00:00Z');
    vi.setSystemTime(now);

    const twoDaysAgo = new Date('2025-01-13T12:00:00Z');
    expect(formatRelativeTime(twoDaysAgo)).toBe('2 days ago');

    const sixDaysAgo = new Date('2025-01-09T12:00:00Z');
    expect(formatRelativeTime(sixDaysAgo)).toBe('6 days ago');
  });

  it('formats timestamps as weeks ago', () => {
    const now = new Date('2025-01-15T12:00:00Z');
    vi.setSystemTime(now);

    const oneWeekAgo = new Date('2025-01-08T12:00:00Z');
    expect(formatRelativeTime(oneWeekAgo)).toBe('1 week ago');

    const twoWeeksAgo = new Date('2025-01-01T12:00:00Z');
    expect(formatRelativeTime(twoWeeksAgo)).toBe('2 weeks ago');
  });

  it('formats timestamps as months ago', () => {
    const now = new Date('2025-01-15T12:00:00Z');
    vi.setSystemTime(now);

    const oneMonthAgo = new Date('2024-12-15T12:00:00Z');
    expect(formatRelativeTime(oneMonthAgo)).toBe('1 month ago');

    const threeMonthsAgo = new Date('2024-10-15T12:00:00Z');
    expect(formatRelativeTime(threeMonthsAgo)).toBe('3 months ago');
  });

  it('formats timestamps as years ago', () => {
    const now = new Date('2025-01-15T12:00:00Z');
    vi.setSystemTime(now);

    const oneYearAgo = new Date('2024-01-15T12:00:00Z');
    expect(formatRelativeTime(oneYearAgo)).toBe('1 year ago');

    const twoYearsAgo = new Date('2023-01-15T12:00:00Z');
    expect(formatRelativeTime(twoYearsAgo)).toBe('2 years ago');
  });

  it('accepts ISO string dates', () => {
    const now = new Date('2025-01-15T12:00:00Z');
    vi.setSystemTime(now);

    const fiveMinutesAgo = '2025-01-15T11:55:00Z';
    expect(formatRelativeTime(fiveMinutesAgo)).toBe('5 minutes ago');
  });
});

describe('isVeryRecent', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns true for timestamps less than 60 minutes ago', () => {
    const now = new Date('2025-01-15T12:00:00Z');
    vi.setSystemTime(now);

    const thirtyMinutesAgo = new Date('2025-01-15T11:30:00Z');
    expect(isVeryRecent(thirtyMinutesAgo)).toBe(true);

    const fiveMinutesAgo = new Date('2025-01-15T11:55:00Z');
    expect(isVeryRecent(fiveMinutesAgo)).toBe(true);
  });

  it('returns false for timestamps 60 minutes or more ago', () => {
    const now = new Date('2025-01-15T12:00:00Z');
    vi.setSystemTime(now);

    const sixtyMinutesAgo = new Date('2025-01-15T11:00:00Z');
    expect(isVeryRecent(sixtyMinutesAgo)).toBe(false);

    const twoHoursAgo = new Date('2025-01-15T10:00:00Z');
    expect(isVeryRecent(twoHoursAgo)).toBe(false);
  });

  it('accepts ISO string dates', () => {
    const now = new Date('2025-01-15T12:00:00Z');
    vi.setSystemTime(now);

    const thirtyMinutesAgo = '2025-01-15T11:30:00Z';
    expect(isVeryRecent(thirtyMinutesAgo)).toBe(true);
  });
});

describe('getTimeGroup', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "today" for timestamps less than 24 hours ago', () => {
    const now = new Date('2025-01-15T12:00:00Z');
    vi.setSystemTime(now);

    const fiveHoursAgo = new Date('2025-01-15T07:00:00Z');
    expect(getTimeGroup(fiveHoursAgo)).toBe('today');

    const twentyThreeHoursAgo = new Date('2025-01-14T13:00:00Z');
    expect(getTimeGroup(twentyThreeHoursAgo)).toBe('today');
  });

  it('returns "yesterday" for timestamps approximately 1 day ago', () => {
    const now = new Date('2025-01-15T12:00:00Z');
    vi.setSystemTime(now);

    const oneDayAgo = new Date('2025-01-14T12:00:00Z');
    expect(getTimeGroup(oneDayAgo)).toBe('yesterday');
  });

  it('returns "this-week" for timestamps 2-6 days ago', () => {
    const now = new Date('2025-01-15T12:00:00Z');
    vi.setSystemTime(now);

    const twoDaysAgo = new Date('2025-01-13T12:00:00Z');
    expect(getTimeGroup(twoDaysAgo)).toBe('this-week');

    const sixDaysAgo = new Date('2025-01-09T12:00:00Z');
    expect(getTimeGroup(sixDaysAgo)).toBe('this-week');
  });

  it('returns "older" for timestamps 7 days or more ago', () => {
    const now = new Date('2025-01-15T12:00:00Z');
    vi.setSystemTime(now);

    const sevenDaysAgo = new Date('2025-01-08T12:00:00Z');
    expect(getTimeGroup(sevenDaysAgo)).toBe('older');

    const oneMonthAgo = new Date('2024-12-15T12:00:00Z');
    expect(getTimeGroup(oneMonthAgo)).toBe('older');
  });

  it('accepts ISO string dates', () => {
    const now = new Date('2025-01-15T12:00:00Z');
    vi.setSystemTime(now);

    const fiveHoursAgo = '2025-01-15T07:00:00Z';
    expect(getTimeGroup(fiveHoursAgo)).toBe('today');
  });
});
