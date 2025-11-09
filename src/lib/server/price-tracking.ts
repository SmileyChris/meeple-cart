/**
 * DEPRECATED: Price tracking functionality is no longer used.
 * Items no longer have individual prices - pricing is now managed through offer_templates.
 *
 * This module is stubbed out for backwards compatibility.
 * Price drop notifications should be implemented through offer_templates in the future.
 */

import type PocketBase from 'pocketbase';
import type { ItemRecord } from '$lib/types/listing';

// Re-export stubbed price utility functions
export { getLowestHistoricalPrice, getMostRecentPrice } from '$lib/utils/price-history';

/**
 * @deprecated Items no longer have individual prices. Use offer_templates instead.
 */
export async function handleGamePriceUpdate(
  pb: PocketBase,
  gameId: string,
  oldGame: ItemRecord,
  newPrice?: number,
  newTradeValue?: number
): Promise<void> {
  // Stubbed out - functionality moved to offer_templates
  return;
}
