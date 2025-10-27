import type PocketBase from 'pocketbase';
import type { GameRecord, PriceHistoryEntry } from '$lib/types/listing';
import type { WatchlistRecord } from '$lib/types/watchlist';
import { createNotification } from './notifications';

// Re-export shared price utility functions
export { getLowestHistoricalPrice, getMostRecentPrice } from '$lib/utils/price-history';

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

