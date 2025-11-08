import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logStatusChange, updateListingStatus, getStatusHistory } from './listing-status';
import type { StatusChange } from './listing-status';

// Create mock functions
const mockGetOne = vi.fn();
const mockUpdate = vi.fn();

// Mock PocketBase
vi.mock('$lib/pocketbase', () => ({
  pb: {
    collection: vi.fn(() => ({
      getOne: mockGetOne,
      update: mockUpdate,
    })),
  },
}));

describe('listing-status utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOne.mockClear();
    mockUpdate.mockClear();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('logStatusChange', () => {
    it('should create and persist a status change record', async () => {
      // Mock existing listing with history
      mockGetOne.mockResolvedValue({
        id: 'listing123',
        status: 'active',
        status_history: [
          {
            from: 'draft',
            to: 'active',
            reason: 'Listing published',
            actor: 'user1',
            timestamp: '2025-10-29T10:00:00.000Z',
          },
        ],
      });

      mockUpdate.mockResolvedValue({ success: true });

      await logStatusChange('listing123', 'active', 'pending', 'Trade initiated', 'user2');

      // Verify getOne was called
      expect(mockGetOne).toHaveBeenCalledWith('listing123');

      // Verify update was called with new history entry
      expect(mockUpdate).toHaveBeenCalledWith('listing123', {
        status_history: expect.arrayContaining([
          {
            from: 'draft',
            to: 'active',
            reason: 'Listing published',
            actor: 'user1',
            timestamp: '2025-10-29T10:00:00.000Z',
          },
          expect.objectContaining({
            from: 'active',
            to: 'pending',
            reason: 'Trade initiated',
            actor: 'user2',
            timestamp: expect.any(String),
          }),
        ]),
      });

      // Verify console.log was called
      expect(console.log).toHaveBeenCalledWith(
        '[Listing listing123] Status change:',
        expect.objectContaining({
          from: 'active',
          to: 'pending',
          reason: 'Trade initiated',
          actor: 'user2',
        })
      );
    });

    it('should handle listings with no existing history', async () => {
      // Mock listing without history
      mockGetOne.mockResolvedValue({
        id: 'listing456',
        status: 'active',
        status_history: null,
      });

      mockUpdate.mockResolvedValue({ success: true });

      await logStatusChange('listing456', 'active', 'completed', 'Trade completed', 'user3');

      expect(mockUpdate).toHaveBeenCalledWith('listing456', {
        status_history: [
          expect.objectContaining({
            from: 'active',
            to: 'completed',
            reason: 'Trade completed',
            actor: 'user3',
          }),
        ],
      });
    });

    it('should not throw on database error', async () => {
      mockGetOne.mockRejectedValue(new Error('Database error'));

      // Should not throw
      await expect(
        logStatusChange('listing789', 'active', 'cancelled', 'User cancelled', 'user4')
      ).resolves.toBeUndefined();

      // Should log error
      expect(console.error).toHaveBeenCalledWith('Failed to log status change:', expect.any(Error));
    });
  });

  describe('updateListingStatus', () => {
    it('should update status and log the change', async () => {
      // Mock initial listing
      mockGetOne.mockResolvedValueOnce({
        id: 'listing123',
        status: 'active',
        status_history: [],
      });

      // Mock updated listing for logging
      mockGetOne.mockResolvedValueOnce({
        id: 'listing123',
        status: 'pending',
        status_history: [],
      });

      mockUpdate.mockResolvedValue({ success: true });

      await updateListingStatus('listing123', 'pending', 'Trade initiated', 'user5');

      // Verify status was updated
      expect(mockUpdate).toHaveBeenCalledWith('listing123', {
        status: 'pending',
      });

      // Verify logging was called (getOne called twice - once for status, once for logging)
      expect(mockGetOne).toHaveBeenCalledTimes(2);
    });
  });

  describe('getStatusHistory', () => {
    it('should retrieve status history from listing', async () => {
      const mockHistory: StatusChange[] = [
        {
          from: 'draft',
          to: 'active',
          reason: 'Published',
          actor: 'user1',
          timestamp: '2025-10-29T10:00:00.000Z',
        },
        {
          from: 'active',
          to: 'pending',
          reason: 'Trade initiated',
          actor: 'user2',
          timestamp: '2025-10-30T11:00:00.000Z',
        },
      ];

      mockGetOne.mockResolvedValue({
        id: 'listing123',
        status: 'pending',
        status_history: mockHistory,
      });

      const history = await getStatusHistory('listing123');

      expect(history).toEqual(mockHistory);
      expect(mockGetOne).toHaveBeenCalledWith('listing123');
    });

    it('should return empty array if no history', async () => {
      mockGetOne.mockResolvedValue({
        id: 'listing456',
        status: 'active',
        status_history: null,
      });

      const history = await getStatusHistory('listing456');

      expect(history).toEqual([]);
    });

    it('should return empty array on error', async () => {
      mockGetOne.mockRejectedValue(new Error('Not found'));

      const history = await getStatusHistory('listing789');

      expect(history).toEqual([]);
      expect(console.error).toHaveBeenCalledWith(
        'Failed to get status history:',
        expect.any(Error)
      );
    });
  });

  describe('StatusChange type', () => {
    it('should have correct structure', () => {
      const change: StatusChange = {
        from: 'active',
        to: 'pending',
        reason: 'Test',
        actor: 'user1',
        timestamp: '2025-10-30T12:00:00.000Z',
      };

      expect(change).toHaveProperty('from');
      expect(change).toHaveProperty('to');
      expect(change).toHaveProperty('reason');
      expect(change).toHaveProperty('actor');
      expect(change).toHaveProperty('timestamp');
    });
  });
});
