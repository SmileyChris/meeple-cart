import { describe, expect, it } from 'vitest';
import {
  canTransitionTo,
  getAvailableActions,
  validateStatusTransition,
  type TradeStatus,
  type UserRole,
} from './trade-status';
import type { TradeRecord } from '$lib/types/pocketbase';

describe('canTransitionTo', () => {
  it('allows buyer to transition from initiated to accepted', () => {
    expect(canTransitionTo('initiated', 'accepted', 'buyer')).toBe(true);
  });

  it('allows seller to transition from initiated to accepted', () => {
    expect(canTransitionTo('initiated', 'accepted', 'seller')).toBe(true);
  });

  it('allows either party to transition from received to completed', () => {
    expect(canTransitionTo('received', 'completed', 'buyer')).toBe(true);
    expect(canTransitionTo('received', 'completed', 'seller')).toBe(true);
  });

  it('allows either party to transition to disputed from any non-completed status', () => {
    expect(canTransitionTo('initiated', 'disputed', 'buyer')).toBe(true);
    expect(canTransitionTo('initiated', 'disputed', 'seller')).toBe(true);
    expect(canTransitionTo('accepted', 'disputed', 'buyer')).toBe(true);
    expect(canTransitionTo('accepted', 'disputed', 'seller')).toBe(true);
  });

  it('does not allow transition to disputed from completed', () => {
    expect(canTransitionTo('completed', 'disputed', 'buyer')).toBe(false);
    expect(canTransitionTo('completed', 'disputed', 'seller')).toBe(false);
  });

  it('does not allow backwards transitions', () => {
    expect(canTransitionTo('accepted', 'initiated', 'buyer')).toBe(false);
    expect(canTransitionTo('completed', 'accepted', 'buyer')).toBe(false);
    expect(canTransitionTo('completed', 'initiated', 'seller')).toBe(false);
  });

  it('does not allow transition from completed', () => {
    expect(canTransitionTo('completed', 'initiated', 'buyer')).toBe(false);
    expect(canTransitionTo('completed', 'accepted', 'seller')).toBe(false);
  });

  it('does not allow transition from disputed', () => {
    expect(canTransitionTo('disputed', 'initiated', 'buyer')).toBe(false);
    expect(canTransitionTo('disputed', 'accepted', 'seller')).toBe(false);
    expect(canTransitionTo('disputed', 'completed', 'buyer')).toBe(false);
  });

  it('returns false for non-participant role', () => {
    expect(canTransitionTo('initiated', 'accepted', 'other')).toBe(false);
  });
});

describe('validateStatusTransition', () => {
  it('returns null for valid transitions', () => {
    expect(validateStatusTransition('initiated', 'accepted', 'buyer')).toBeNull();
    expect(validateStatusTransition('received', 'completed', 'seller')).toBeNull();
  });

  it('returns error message for invalid backwards transition', () => {
    const error = validateStatusTransition('accepted', 'initiated', 'buyer');
    expect(error).toBeTruthy();
    expect(error).toContain('cannot go backwards');
  });

  it('returns error message for transition from completed', () => {
    const error = validateStatusTransition('completed', 'initiated', 'buyer');
    expect(error).toBeTruthy();
    expect(error).toContain('already completed');
  });

  it('returns error message for transition from disputed', () => {
    const error = validateStatusTransition('disputed', 'accepted', 'seller');
    expect(error).toBeTruthy();
    expect(error).toContain('disputed');
  });

  it('returns error message for non-participant', () => {
    const error = validateStatusTransition('initiated', 'accepted', 'other');
    expect(error).toBeTruthy();
    expect(error).toContain('not a participant');
  });
});

describe('getAvailableActions', () => {
  const baseTrade: TradeRecord = {
    id: 'trade123',
    listing: 'listing123',
    buyer: 'buyer123',
    seller: 'seller123',
    offer_status: 'accepted',
    status: 'initiated',
    created: '2024-01-01T12:00:00Z',
    updated: '2024-01-01T12:00:00Z',
    collectionId: 'trades',
    collectionName: 'trades',
  };

  describe('initiated status', () => {
    it('allows buyer to confirm or dispute', () => {
      const actions = getAvailableActions({ ...baseTrade, status: 'initiated' }, 'buyer123');
      expect(actions).toContain('accept');
      expect(actions).toContain('dispute');
      expect(actions).not.toContain('complete');
    });

    it('allows seller to confirm or dispute', () => {
      const actions = getAvailableActions({ ...baseTrade, status: 'initiated' }, 'seller123');
      expect(actions).toContain('accept');
      expect(actions).toContain('dispute');
      expect(actions).not.toContain('complete');
    });

    it('returns empty array for non-participants', () => {
      const actions = getAvailableActions({ ...baseTrade, status: 'initiated' }, 'other123');
      expect(actions).toEqual([]);
    });
  });

  describe('accepted status', () => {
    it('allows seller to ship or dispute', () => {
      const actions = getAvailableActions({ ...baseTrade, status: 'accepted' }, 'seller123');
      expect(actions).toContain('ship');
      expect(actions).toContain('dispute');
      expect(actions).not.toContain('accept');
    });

    it('allows cancellation while accepted', () => {
      const actions = getAvailableActions({ ...baseTrade, status: 'accepted' }, 'buyer123');
      expect(actions).toContain('cancel');
      expect(actions).toContain('dispute');
    });
  });

  describe('completed status', () => {
    it('returns empty array for completed trades', () => {
      const actions = getAvailableActions({ ...baseTrade, status: 'completed' }, 'buyer123');
      expect(actions).toEqual([]);
    });
  });

  describe('disputed status', () => {
    it('returns empty array for disputed trades', () => {
      const actions = getAvailableActions({ ...baseTrade, status: 'disputed' }, 'buyer123');
      expect(actions).toEqual([]);
    });
  });
});
