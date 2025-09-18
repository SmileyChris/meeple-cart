import { describe, expect, it } from 'vitest';
import { formatCurrency } from './currency';

describe('formatCurrency', () => {
  it('formats cents as NZD', () => {
    expect(formatCurrency(2599)).toBe('$25.99');
  });

  it('throws when amount is not finite', () => {
    expect(() => formatCurrency(Number.POSITIVE_INFINITY)).toThrow(TypeError);
  });
});
