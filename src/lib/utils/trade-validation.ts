import type { TradeRecord } from '$lib/types/pocketbase';

type ListingStatus = 'active' | 'pending' | 'completed' | 'cancelled';

interface Listing {
  id: string;
  owner: string;
  status: ListingStatus;
  listing_type: string;
}

/**
 * Checks if a user can initiate a trade on a listing
 */
export function canInitiateTrade(listing: Listing, userId: string): boolean {
  // Cannot trade with yourself
  if (listing.owner === userId) {
    return false;
  }

  // Listing must be active
  if (listing.status !== 'active') {
    return false;
  }

  return true;
}

/**
 * Validates trade initiation and returns an error message if invalid
 */
export function validateTradeInitiation(listing: Listing, userId: string): string | null {
  if (listing.owner === userId) {
    return 'You cannot trade with yourself';
  }

  if (listing.status !== 'active') {
    return 'This listing is not available for trading';
  }

  return null;
}

/**
 * Checks if a user can leave feedback on a trade
 */
export function canLeaveFeedback(trade: TradeRecord, userId: string): boolean {
  // Must be a participant
  if (trade.buyer !== userId && trade.seller !== userId) {
    return false;
  }

  // Trade must be completed
  if (trade.status !== 'completed') {
    return false;
  }

  // Cannot leave feedback twice (check if rating or review already exists)
  if (trade.rating !== undefined || trade.review !== undefined) {
    return false;
  }

  return true;
}

/**
 * Validates feedback submission and returns an error message if invalid
 */
export function validateFeedback(
  trade: TradeRecord,
  userId: string,
  rating?: number,
  review?: string,
): string | null {
  // Must be a participant
  if (trade.buyer !== userId && trade.seller !== userId) {
    return 'You are not a participant in this trade';
  }

  // Trade must be completed
  if (trade.status !== 'completed') {
    return 'Trade must be completed before leaving feedback';
  }

  // Cannot leave feedback twice
  if (trade.rating !== undefined || trade.review !== undefined) {
    return 'You have already left feedback for this trade';
  }

  // Must provide at least rating or review
  if (rating === undefined && !review) {
    return 'You must provide a rating or review';
  }

  // Validate rating if provided
  if (rating !== undefined && (rating < 1 || rating > 5)) {
    return 'Rating must be between 1 and 5';
  }

  // Validate review length if provided
  if (review && review.length > 1000) {
    return 'Review must be 1000 characters or less';
  }

  return null;
}

/**
 * Checks if a user can vouch for another user
 */
export function canVouchForUser(
  voucherId: string,
  voucheeId: string,
  completedTrades: TradeRecord[],
): boolean {
  // Cannot vouch for yourself
  if (voucherId === voucheeId) {
    return false;
  }

  // Must have completed at least one trade together
  const hasCompletedTrade = completedTrades.some(
    (trade) =>
      trade.status === 'completed' &&
      ((trade.buyer === voucherId && trade.seller === voucheeId) ||
        (trade.buyer === voucheeId && trade.seller === voucherId)),
  );

  return hasCompletedTrade;
}

/**
 * Validates vouch creation and returns an error message if invalid
 */
export function validateVouch(
  voucherId: string,
  voucheeId: string,
  message: string,
  completedTrades: TradeRecord[],
): string | null {
  // Cannot vouch for yourself
  if (voucherId === voucheeId) {
    return 'You cannot vouch for yourself';
  }

  // Must have completed a trade together
  if (!canVouchForUser(voucherId, voucheeId, completedTrades)) {
    return 'You must complete a trade with this user before vouching for them';
  }

  // Validate message length
  if (message && message.length > 500) {
    return 'Vouch message must be 500 characters or less';
  }

  return null;
}
