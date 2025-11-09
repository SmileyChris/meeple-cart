import { describe, expect, it, vi } from 'vitest';
import { handleGamePriceUpdate } from './price-tracking';

/**
 * DEPRECATED: These tests verify that price tracking functions are properly stubbed.
 * Price functionality has moved to offer_templates collection.
 */
describe('price tracking handlers (deprecated)', () => {
  it('handleGamePriceUpdate is stubbed and does nothing', async () => {
    const pb = {
      collection: vi.fn(),
    };

    // Should not throw and should complete immediately
    await handleGamePriceUpdate(
      pb as any,
      'game-1',
      {} as any,
      100,
      200
    );

    // Should not call any collection methods
    expect(pb.collection).not.toHaveBeenCalled();
  });
});
