import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createNotification, notifyNewListing } from './notifications';
import type { ListingRecord } from '$lib/types/listing';

const createPbMock = () => {
  const create = vi.fn().mockResolvedValue(undefined);
  const getFullList = vi.fn();
  const collection = vi.fn((name: string) => {
    if (name === 'notifications') {
      return { create };
    }
    if (name === 'users') {
      return { getFullList };
    }
    throw new Error(`Unexpected collection: ${name}`);
  });

  return {
    collection,
    create,
    getFullList,
  };
};

describe('notifications server utilities', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('creates notifications with the provided payload', async () => {
    const pb = createPbMock();

    await createNotification(pb as any, 'user-123', 'new_message', 'You have a new message', {
      message: 'Morgan sent you a reply',
      link: '/messages/thread-1',
      listingId: 'listing-42',
    });

    expect(pb.collection).toHaveBeenCalledWith('notifications');
    expect(pb.create).toHaveBeenCalledWith({
      user: 'user-123',
      type: 'new_message',
      title: 'You have a new message',
      message: 'Morgan sent you a reply',
      link: '/messages/thread-1',
      listing: 'listing-42',
      read: false,
    });
  });

  it('logs an error when creating notifications fails', async () => {
    const pb = createPbMock();
    const error = new Error('PocketBase unavailable');
    pb.create.mockRejectedValue(error);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await createNotification(pb as any, 'user-123', 'new_listing', 'New listing available');

    expect(consoleSpy).toHaveBeenCalledWith('Failed to create notification', error);
  });

  it('notifies matching users for new listings while skipping non-matching preferences', async () => {
    const pb = createPbMock();
    pb.getFullList.mockResolvedValue([
      {
        id: 'owner-1',
        notification_prefs: { notify_new_listings: true, watched_regions: ['wellington'] },
      },
      {
        id: 'user-2',
        notification_prefs: { notify_new_listings: true, watched_regions: ['Wellington'] },
      },
      {
        id: 'user-3',
        notification_prefs: { notify_new_listings: false, watched_regions: ['wellington'] },
      },
      {
        id: 'user-4',
        notification_prefs: { notify_new_listings: true, watched_regions: ['auckland'] },
      },
      {
        id: 'user-5',
        notification_prefs: null,
      },
    ]);

    const listing = {
      id: 'listing-99',
      owner: 'owner-1',
      title: 'Gloomhaven Bundle',
      listing_type: 'trade',
      status: 'active',
      location: 'Wellington Central',
    } as ListingRecord;

    await notifyNewListing(pb as any, listing, 'Chris');

    expect(pb.collection).toHaveBeenCalledWith('users');
    expect(pb.getFullList).toHaveBeenCalledWith({ filter: 'notification_prefs != null' });
    expect(pb.create).toHaveBeenCalledTimes(1);
    expect(pb.create).toHaveBeenCalledWith({
      user: 'user-2',
      type: 'new_listing',
      title: 'New listing in Wellington Central',
      message: 'Chris listed "Gloomhaven Bundle" for trade',
      link: '/listings/listing-99',
      listing: 'listing-99',
      read: false,
    });
  });

  it('logs errors when fetching users fails', async () => {
    const pb = createPbMock();
    const failure = new Error('fetch failed');
    pb.getFullList.mockRejectedValue(failure);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const listing = {
      id: 'listing-1',
      owner: 'owner-1',
      title: 'Terraforming Mars',
      listing_type: 'sell',
      status: 'active',
      location: 'Auckland',
    } as ListingRecord;

    await notifyNewListing(pb as any, listing, 'Morgan');

    expect(consoleSpy).toHaveBeenCalledWith('Failed to notify users about new listing', failure);
    expect(pb.create).not.toHaveBeenCalled();
  });
});
