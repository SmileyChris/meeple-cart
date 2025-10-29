import { describe, expect, it } from 'vitest';
import {
  canInitiateTrade,
  canLeaveFeedback,
  canVouchForUser,
  validateTradeInitiation,
  validateFeedback,
  validateVouch,
} from './trade-validation';
import type { TradeRecord } from '$lib/types/pocketbase';

describe('canInitiateTrade', () => {
  const activeListing = {
    id: 'listing123',
    owner: 'seller123',
    status: 'active' as const,
    listing_type: 'trade' as const,
  };

  it('allows trade initiation on active listing by non-owner', () => {
    expect(canInitiateTrade(activeListing, 'buyer123')).toBe(true);
  });

  it('prevents trade initiation by listing owner', () => {
    expect(canInitiateTrade(activeListing, 'seller123')).toBe(false);
  });

  it('prevents trade initiation on pending listing', () => {
    expect(canInitiateTrade({ ...activeListing, status: 'pending' }, 'buyer123')).toBe(false);
  });

  it('prevents trade initiation on completed listing', () => {
    expect(canInitiateTrade({ ...activeListing, status: 'completed' }, 'buyer123')).toBe(false);
  });

  it('prevents trade initiation on cancelled listing', () => {
    expect(canInitiateTrade({ ...activeListing, status: 'cancelled' }, 'buyer123')).toBe(false);
  });

  it('allows trade initiation for unauthenticated user (will be caught at auth layer)', () => {
    // The function checks if userId matches owner, but doesn't validate authentication
    // This is intentional - auth checks happen elsewhere
    expect(canInitiateTrade(activeListing, '')).toBe(true);
  });
});

describe('validateTradeInitiation', () => {
  const activeListing = {
    id: 'listing123',
    owner: 'seller123',
    status: 'active' as const,
    listing_type: 'trade' as const,
  };

  it('returns null for valid trade initiation', () => {
    expect(validateTradeInitiation(activeListing, 'buyer123')).toBeNull();
  });

  it('returns error when user tries to trade with themselves', () => {
    const error = validateTradeInitiation(activeListing, 'seller123');
    expect(error).toBeTruthy();
    expect(error).toContain('cannot trade with yourself');
  });

  it('returns error when listing is not active', () => {
    const error = validateTradeInitiation({ ...activeListing, status: 'pending' }, 'buyer123');
    expect(error).toBeTruthy();
    expect(error).toContain('not available');
  });

  it('returns error for completed listing', () => {
    const error = validateTradeInitiation({ ...activeListing, status: 'completed' }, 'buyer123');
    expect(error).toBeTruthy();
    expect(error).toContain('not available');
  });

  it('returns error for cancelled listing', () => {
    const error = validateTradeInitiation({ ...activeListing, status: 'cancelled' }, 'buyer123');
    expect(error).toBeTruthy();
    expect(error).toContain('not available');
  });
});

describe('canLeaveFeedback', () => {
  const completedTrade: TradeRecord = {
    id: 'trade123',
    listing: 'listing123',
    buyer: 'buyer123',
    seller: 'seller123',
    status: 'completed',
    created: '2024-01-01T12:00:00Z',
    updated: '2024-01-01T12:00:00Z',
    collectionId: 'trades',
    collectionName: 'trades',
  };

  it('allows buyer to leave feedback on completed trade without existing feedback', () => {
    expect(canLeaveFeedback(completedTrade, 'buyer123')).toBe(true);
  });

  it('allows seller to leave feedback on completed trade without existing feedback', () => {
    expect(canLeaveFeedback(completedTrade, 'seller123')).toBe(true);
  });

  it('prevents leaving feedback on incomplete trade', () => {
    expect(canLeaveFeedback({ ...completedTrade, status: 'initiated' }, 'buyer123')).toBe(false);
    expect(canLeaveFeedback({ ...completedTrade, status: 'confirmed' }, 'buyer123')).toBe(false);
  });

  it('prevents leaving feedback on disputed trade', () => {
    expect(canLeaveFeedback({ ...completedTrade, status: 'disputed' }, 'buyer123')).toBe(false);
  });

  it('prevents non-participants from leaving feedback', () => {
    expect(canLeaveFeedback(completedTrade, 'other123')).toBe(false);
  });

  it('prevents leaving feedback twice (when rating already exists)', () => {
    const tradeWithRating = { ...completedTrade, rating: 5 };
    expect(canLeaveFeedback(tradeWithRating, 'buyer123')).toBe(false);
  });

  it('prevents leaving feedback twice (when review already exists)', () => {
    const tradeWithReview = { ...completedTrade, review: 'Great trade!' };
    expect(canLeaveFeedback(tradeWithReview, 'buyer123')).toBe(false);
  });
});

describe('validateFeedback', () => {
  const completedTrade: TradeRecord = {
    id: 'trade123',
    listing: 'listing123',
    buyer: 'buyer123',
    seller: 'seller123',
    status: 'completed',
    created: '2024-01-01T12:00:00Z',
    updated: '2024-01-01T12:00:00Z',
    collectionId: 'trades',
    collectionName: 'trades',
  };

  it('returns null for valid feedback', () => {
    expect(validateFeedback(completedTrade, 'buyer123', 5, 'Great!')).toBeNull();
    expect(validateFeedback(completedTrade, 'buyer123', 5, undefined)).toBeNull(); // Rating only
    expect(validateFeedback(completedTrade, 'buyer123', undefined, 'Great!')).toBeNull(); // Review only
  });

  it('requires at least rating or review', () => {
    const error = validateFeedback(completedTrade, 'buyer123', undefined, undefined);
    expect(error).toBeTruthy();
    expect(error).toContain('rating or review');
  });

  it('validates rating is between 1 and 5', () => {
    expect(validateFeedback(completedTrade, 'buyer123', 0, undefined)).toBeTruthy();
    expect(validateFeedback(completedTrade, 'buyer123', 6, undefined)).toBeTruthy();
    expect(validateFeedback(completedTrade, 'buyer123', -1, undefined)).toBeTruthy();
    expect(validateFeedback(completedTrade, 'buyer123', 1, undefined)).toBeNull();
    expect(validateFeedback(completedTrade, 'buyer123', 5, undefined)).toBeNull();
  });

  it('validates review length', () => {
    const tooLong = 'a'.repeat(1001);
    const error = validateFeedback(completedTrade, 'buyer123', undefined, tooLong);
    expect(error).toBeTruthy();
    expect(error).toContain('1000 characters');
  });

  it('returns error for non-participant', () => {
    const error = validateFeedback(completedTrade, 'other123', 5, 'Great!');
    expect(error).toBeTruthy();
    expect(error).toContain('not a participant');
  });

  it('returns error for incomplete trade', () => {
    const error = validateFeedback({ ...completedTrade, status: 'initiated' }, 'buyer123', 5);
    expect(error).toBeTruthy();
    expect(error).toContain('must be completed');
  });

  it('returns error when feedback already exists', () => {
    const error = validateFeedback({ ...completedTrade, rating: 4 }, 'buyer123', 5);
    expect(error).toBeTruthy();
    expect(error).toContain('already left feedback');
  });
});

describe('canVouchForUser', () => {
  const completedTrades: TradeRecord[] = [
    {
      id: 'trade1',
      listing: 'listing1',
      buyer: 'user1',
      seller: 'user2',
      status: 'completed',
      created: '2024-01-01T12:00:00Z',
      updated: '2024-01-01T12:00:00Z',
      collectionId: 'trades',
      collectionName: 'trades',
    },
    {
      id: 'trade2',
      listing: 'listing2',
      buyer: 'user2',
      seller: 'user1',
      status: 'completed',
      created: '2024-01-02T12:00:00Z',
      updated: '2024-01-02T12:00:00Z',
      collectionId: 'trades',
      collectionName: 'trades',
    },
  ];

  it('allows vouching when users have completed a trade together', () => {
    expect(canVouchForUser('user1', 'user2', completedTrades)).toBe(true);
    expect(canVouchForUser('user2', 'user1', completedTrades)).toBe(true);
  });

  it('prevents vouching for yourself', () => {
    expect(canVouchForUser('user1', 'user1', completedTrades)).toBe(false);
  });

  it('prevents vouching without completed trades', () => {
    expect(canVouchForUser('user1', 'user3', completedTrades)).toBe(false);
  });

  it('prevents vouching with only initiated trades', () => {
    const initiatedTrades = completedTrades.map((t) => ({ ...t, status: 'initiated' as const }));
    expect(canVouchForUser('user1', 'user2', initiatedTrades)).toBe(false);
  });

  it('prevents vouching with only disputed trades', () => {
    const disputedTrades = completedTrades.map((t) => ({ ...t, status: 'disputed' as const }));
    expect(canVouchForUser('user1', 'user2', disputedTrades)).toBe(false);
  });

  it('allows vouching with at least one completed trade among many', () => {
    const mixedTrades: TradeRecord[] = [
      { ...completedTrades[0], status: 'initiated' },
      completedTrades[1], // This one is completed
      { ...completedTrades[0], status: 'disputed' },
    ];
    expect(canVouchForUser('user1', 'user2', mixedTrades)).toBe(true);
  });
});

describe('validateVouch', () => {
  const completedTrades: TradeRecord[] = [
    {
      id: 'trade1',
      listing: 'listing1',
      buyer: 'user1',
      seller: 'user2',
      status: 'completed',
      created: '2024-01-01T12:00:00Z',
      updated: '2024-01-01T12:00:00Z',
      collectionId: 'trades',
      collectionName: 'trades',
    },
  ];

  it('returns null for valid vouch', () => {
    expect(validateVouch('user1', 'user2', 'Great trader!', completedTrades)).toBeNull();
  });

  it('returns error when vouching for yourself', () => {
    const error = validateVouch('user1', 'user1', 'I am great!', completedTrades);
    expect(error).toBeTruthy();
    expect(error).toContain('cannot vouch for yourself');
  });

  it('returns error when no completed trades exist', () => {
    const error = validateVouch('user1', 'user3', 'Great trader!', completedTrades);
    expect(error).toBeTruthy();
    expect(error).toContain('must complete a trade');
  });

  it('validates vouch message length', () => {
    const tooLong = 'a'.repeat(501);
    const error = validateVouch('user1', 'user2', tooLong, completedTrades);
    expect(error).toBeTruthy();
    expect(error).toContain('500 characters');
  });

  it('allows empty vouch message', () => {
    expect(validateVouch('user1', 'user2', '', completedTrades)).toBeNull();
  });
});
