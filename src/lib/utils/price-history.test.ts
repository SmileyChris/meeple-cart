import { describe, expect, it } from 'vitest';
import { getLowestHistoricalPrice, getMostRecentPrice } from './price-history';

describe('price history utilities', () => {
  it('returns lowest eligible historical price after three days', () => {
    const priceHistory = [
      { price: 260, trade_value: undefined, timestamp: '2024-01-01T10:00:00Z' },
      { price: 220, trade_value: undefined, timestamp: '2024-01-04T12:00:00Z' },
      { price: 180, trade_value: undefined, timestamp: '2024-01-06T15:00:00Z' },
      { price: 170, trade_value: undefined, timestamp: '2024-01-08T15:00:00Z' },
    ];

    const result = getLowestHistoricalPrice(priceHistory, '2024-01-01T09:00:00Z', 'price');

    expect(result).toBe(180);
  });

  it('ignores entries within the three-day threshold and missing prices', () => {
    const priceHistory = [
      { price: 220, trade_value: undefined, timestamp: '2024-01-01T10:00:00Z' },
      { price: undefined, trade_value: 210, timestamp: '2024-01-02T12:00:00Z' },
      { price: 205, trade_value: undefined, timestamp: '2024-01-03T12:00:00Z' },
    ];

    const result = getLowestHistoricalPrice(priceHistory, '2024-01-01T09:00:00Z', 'price');

    expect(result).toBeNull();
  });

  it('returns null when not enough history exists', () => {
    expect(getLowestHistoricalPrice([], '2024-01-01T09:00:00Z', 'price')).toBeNull();
    expect(
      getLowestHistoricalPrice(
        [{ price: 200, trade_value: undefined, timestamp: '2024-01-05T10:00:00Z' }],
        '2024-01-01T09:00:00Z',
        'price'
      )
    ).toBeNull();
  });

  it('returns most recent previous entry from price history', () => {
    const result = getMostRecentPrice({
      id: 'game-1',
      listing: 'listing-1',
      price_history: [
        { price: 200, trade_value: 150, timestamp: '2024-01-01T10:00:00Z' },
        { price: 180, trade_value: 140, timestamp: '2024-01-05T10:00:00Z' },
        { price: 170, trade_value: 130, timestamp: '2024-01-10T10:00:00Z' },
      ],
    } as any);

    expect(result).toEqual({
      price: 180,
      tradeValue: 140,
    });
  });

  it('returns null when there are fewer than two entries', () => {
    expect(getMostRecentPrice({ price_history: [] } as any)).toBeNull();
    expect(
      getMostRecentPrice({
        price_history: [{ price: 200, trade_value: undefined, timestamp: '2024-01-01T10:00:00Z' }],
      } as any)
    ).toBeNull();
  });
});
