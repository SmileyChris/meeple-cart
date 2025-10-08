import type PocketBase from 'pocketbase';
import type { GameRecord, PriceHistoryEntry } from '$lib/types/listing';
import type { WatchlistRecord } from '$lib/types/watchlist';
import { createNotification } from './notifications';

/**
 * Track price change and notify watchers if price dropped
 */
export async function handleGamePriceUpdate(
  pb: PocketBase,
  gameId: string,
  oldGame: GameRecord,
  newPrice?: number,
  newTradeValue?: number
): Promise<void> {
  const oldPrice = oldGame.price;
  const oldTradeValue = oldGame.trade_value;

  // Check if price or trade value changed
  const priceChanged = oldPrice !== newPrice;
  const tradeValueChanged = oldTradeValue !== newTradeValue;

  if (!priceChanged && !tradeValueChanged) {
    return; // No price change
  }

  // Add to price history
  const priceHistory = oldGame.price_history || [];
  const newEntry: PriceHistoryEntry = {
    price: newPrice,
    trade_value: newTradeValue,
    timestamp: new Date().toISOString(),
  };
  priceHistory.push(newEntry);

  // Update game with new price history
  await pb.collection('games').update(gameId, {
    price_history: priceHistory,
  });

  // Check if price dropped (for sell listings)
  const priceDropped =
    priceChanged &&
    typeof oldPrice === 'number' &&
    typeof newPrice === 'number' &&
    newPrice < oldPrice;

  // Check if trade value dropped (for trade listings)
  const tradeValueDropped =
    tradeValueChanged &&
    typeof oldTradeValue === 'number' &&
    typeof newTradeValue === 'number' &&
    newTradeValue < oldTradeValue;

  if (!priceDropped && !tradeValueDropped) {
    return; // No drop, don't notify
  }

  // Get the listing to find watchers
  const game = await pb.collection('games').getOne<GameRecord>(gameId);
  const listingId = game.listing;

  // Find all users watching this listing
  const watchers = await pb.collection('watchlist').getFullList<WatchlistRecord>({
    filter: `listing = "${listingId}"`,
    expand: 'user',
  });

  // Notify each watcher
  for (const watch of watchers) {
    const user = watch.user;

    // Skip if user doesn't have price drop notifications enabled
    const userRecord = await pb.collection('users').getOne(user);
    const prefs = userRecord.notification_prefs;
    if (!prefs || !prefs.notify_price_drops) {
      continue;
    }

    let message = '';
    if (priceDropped) {
      message = `Price dropped from $${oldPrice} to $${newPrice}`;
    } else if (tradeValueDropped) {
      message = `Trade value dropped from $${oldTradeValue} to $${newTradeValue}`;
    }

    await createNotification(pb, user, 'price_drop', `Price drop: ${game.title}`, {
      message,
      link: `/listings/${listingId}`,
      listingId,
    });
  }
}

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
  game: GameRecord
): { price?: number; tradeValue?: number } | null {
  if (!game.price_history || game.price_history.length === 0) {
    return null;
  }

  // Price history is ordered, so last entry is most recent before current
  const history = game.price_history;
  if (history.length < 2) {
    return null; // Need at least 2 entries to show "was" price
  }

  const previousEntry = history[history.length - 2];
  return {
    price: previousEntry.price,
    tradeValue: previousEntry.trade_value,
  };
}
