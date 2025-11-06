import type { PriceHistoryEntry, ItemRecord } from '$lib/types/listing';

/**
 * Get the lowest historical price from entries that are:
 * 1. At least 3 days after listing creation
 * 2. Not the current price (previous entries only)
 * 3. Have a valid price/trade_value
 *
 * This prevents gaming the system by showing inflated "previous" prices.
 */
export function getLowestHistoricalPrice(
  priceHistory: PriceHistoryEntry[],
  listingCreated: string,
  priceType: 'price' | 'trade_value'
): number | null {
  if (!priceHistory || priceHistory.length < 2) {
    return null; // Need at least 2 entries (initial + current)
  }

  // Calculate 3-day threshold from listing creation
  const thresholdDate = new Date(listingCreated);
  thresholdDate.setDate(thresholdDate.getDate() + 3);

  // Get all entries except the most recent (current price)
  const historicalEntries = priceHistory.slice(0, -1);

  // Filter to entries after 3-day threshold
  const validEntries = historicalEntries.filter(
    (entry) => new Date(entry.timestamp) >= thresholdDate
  );

  if (validEntries.length === 0) {
    return null; // No valid historical prices (all within 3-day window)
  }

  // Get all valid prices of the specified type
  const prices = validEntries
    .map((e) => (priceType === 'price' ? e.price : e.trade_value))
    .filter((p): p is number => typeof p === 'number');

  if (prices.length === 0) {
    return null;
  }

  return Math.min(...prices);
}

/**
 * Get the most recent price from price history
 * @deprecated Use getLowestHistoricalPrice for anti-gaming protection
 */
export function getMostRecentPrice(
  item: ItemRecord
): { price?: number; tradeValue?: number } | null {
  if (!item.price_history || item.price_history.length === 0) {
    return null;
  }

  // Price history is ordered, so last entry is most recent before current
  const history = item.price_history;
  if (history.length < 2) {
    return null; // Need at least 2 entries to show "was" price
  }

  const previousEntry = history[history.length - 2];
  return {
    price: previousEntry.price,
    tradeValue: previousEntry.trade_value,
  };
}
