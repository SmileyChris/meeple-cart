import { describe, expect, it } from 'vitest';
import { getLowestHistoricalPrice, getMostRecentPrice, formatPrice, formatTradeValue } from './price-history';

/**
 * DEPRECATED: These tests verify that price history functions are properly stubbed.
 * Price functionality has moved to offer_templates collection.
 */
describe('price history utilities (deprecated)', () => {
  it('getLowestHistoricalPrice returns null (stubbed)', () => {
    const result = getLowestHistoricalPrice();
    expect(result).toBeNull();
  });

  it('getMostRecentPrice returns null (stubbed)', () => {
    const result = getMostRecentPrice();
    expect(result).toBeNull();
  });
});

describe('formatPrice', () => {
  it('formats prices in cents to dollars', () => {
    expect(formatPrice(5000)).toBe('$50.00');
    expect(formatPrice(12345)).toBe('$123.45');
    expect(formatPrice(100)).toBe('$1.00');
  });

  it('handles null and undefined values', () => {
    expect(formatPrice(null)).toBe('N/A');
    expect(formatPrice(undefined)).toBe('N/A');
  });

  it('formats zero correctly', () => {
    expect(formatPrice(0)).toBe('$0.00');
  });
});

describe('formatTradeValue', () => {
  it('formats trade values in cents to dollars with tilde', () => {
    expect(formatTradeValue(5000)).toBe('~$50.00');
    expect(formatTradeValue(12345)).toBe('~$123.45');
    expect(formatTradeValue(100)).toBe('~$1.00');
  });

  it('handles null and undefined values', () => {
    expect(formatTradeValue(null)).toBe('N/A');
    expect(formatTradeValue(undefined)).toBe('N/A');
  });

  it('formats zero correctly', () => {
    expect(formatTradeValue(0)).toBe('~$0.00');
  });
});
