/**
 * DEPRECATED: Price history functionality is no longer used.
 * Items no longer have individual prices - pricing is now managed through offer_templates.
 *
 * These functions are stubbed out for backwards compatibility.
 * Use offer_templates collection for pricing information instead.
 */

// Deprecated type - kept for backwards compatibility with tests
export type PriceHistoryEntry = {
  price?: number;
  trade_value?: number;
  timestamp: string;
};

/**
 * @deprecated Use offer_templates for pricing information
 */
export function getLowestHistoricalPrice(): number | null {
  return null;
}

/**
 * @deprecated Use offer_templates for pricing information
 */
export function getMostRecentPrice(): { price?: number; tradeValue?: number } | null {
  return null;
}

/**
 * Formats a price for display (handles null/undefined)
 */
export function formatPrice(price?: number | null): string {
  if (price == null) {
    return 'N/A';
  }

  // Convert cents to dollars
  const dollars = price / 100;
  return `$${dollars.toFixed(2)}`;
}

/**
 * Formats a trade value for display (handles null/undefined)
 */
export function formatTradeValue(tradeValue?: number | null): string {
  if (tradeValue == null) {
    return 'N/A';
  }

  // Convert cents to dollars
  const dollars = tradeValue / 100;
  return `~$${dollars.toFixed(2)}`;
}
