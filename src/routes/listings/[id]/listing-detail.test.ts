import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { load } from './+page.ts';
import * as pocketbaseModule from '$lib/pocketbase';

// Mock modules
vi.mock('$lib/pocketbase', () => ({
  pb: {
    collection: vi.fn(),
    files: {
      getUrl: vi.fn(),
    },
  },
  currentUser: {
    subscribe: vi.fn(),
  },
}));

vi.mock('svelte/store', () => ({
  get: vi.fn(),
}));

vi.mock('@sveltejs/kit', () => ({
  error: vi.fn((status, message) => {
    const err = new Error(message);
    (err as any).status = status;
    throw err;
  }),
}));

vi.mock('$lib/server/price-tracking', () => ({
  getLowestHistoricalPrice: vi.fn(() => null),
}));

const baseListing = {
  id: 'listing123',
  owner: 'user123',
  title: 'Test Listing',
  listing_type: 'trade',
  status: 'active',
  created: '2024-01-01T12:00:00Z',
  photos: ['photo1.jpg'],
  expand: {
    owner: {
      id: 'user123',
      display_name: 'Chris',
    },
    'games(listing)': [
      {
        id: 'game1',
        title: 'Gloomhaven',
        condition: 'excellent',
        status: 'available',
        bgg_id: 174430,
        price: 100,
        trade_value: null,
        notes: null,
      },
    ],
  },
};

describe('listing detail client-side load', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads listing with owner, games, and photos', async () => {
    const { pb } = pocketbaseModule;
    const { get } = await import('svelte/store');

    const getOne = vi.fn().mockResolvedValue(baseListing);
    const getFullList = vi.fn().mockResolvedValue([]);
    vi.mocked(pb.collection).mockReturnValue({ getOne, getFullList } as any);
    vi.mocked(pb.files.getUrl).mockImplementation(
      (_record, file, options?) =>
        new URL(
          options?.thumb
            ? `https://example.com/thumb-${file}`
            : `https://example.com/${file}`
        ) as any
    );
    vi.mocked(get).mockReturnValue(null); // No user watching

    const result = await load({ params: { id: 'listing123' } } as any);

    expect(getOne).toHaveBeenCalledWith('listing123', {
      expand: 'owner,games(listing)',
    });

    expect(result.listing).toMatchObject({
      id: 'listing123',
      title: 'Test Listing',
      listing_type: 'trade',
    });

    expect(result.owner).toMatchObject({
      id: 'user123',
      display_name: 'Chris',
    });

    expect(result.games).toHaveLength(1);
    expect(result.games[0]).toMatchObject({
      id: 'game1',
      title: 'Gloomhaven',
      bggUrl: 'https://boardgamegeek.com/boardgame/174430',
    });

    expect(result.photos).toEqual([
      {
        id: 'photo1.jpg',
        full: 'https://example.com/photo1.jpg',
        thumb: 'https://example.com/thumb-photo1.jpg',
      },
    ]);

    expect(result.isWatching).toBe(false);
  });

  it('checks if authenticated user is watching the listing', async () => {
    const { pb } = pocketbaseModule;
    const { get } = await import('svelte/store');

    const getOne = vi.fn().mockResolvedValue(baseListing);
    const getFullList = vi.fn().mockResolvedValue([{ id: 'watchlist1' }]);
    vi.mocked(pb.collection).mockImplementation((name) => {
      if (name === 'listings') return { getOne, getFullList } as any;
      if (name === 'watchlist') return { getFullList } as any;
      return {} as any;
    });
    vi.mocked(pb.files.getUrl).mockReturnValue(new URL('https://example.com/photo.jpg') as any);
    vi.mocked(get).mockReturnValue({ id: 'currentUser123' });

    const result = await load({ params: { id: 'listing123' } } as any);

    expect(result.isWatching).toBe(true);
    expect(getFullList).toHaveBeenCalledWith({
      filter: `user = "currentUser123" && listing = "listing123"`,
    });
  });

  it('throws 404 when listing is not found', async () => {
    const { pb } = pocketbaseModule;
    const getOne = vi.fn().mockRejectedValue(new Error('Not found'));
    vi.mocked(pb.collection).mockReturnValue({ getOne } as any);

    await expect(load({ params: { id: 'missing' } } as any)).rejects.toMatchObject({
      status: 404,
      message: 'Listing not found',
    });
  });

  it('normalizes bundle listing type to sell', async () => {
    const { pb } = pocketbaseModule;
    const { get } = await import('svelte/store');

    const bundleListing = {
      ...baseListing,
      listing_type: 'bundle',
    };

    const getOne = vi.fn().mockResolvedValue(bundleListing);
    const getFullList = vi.fn().mockResolvedValue([]);
    vi.mocked(pb.collection).mockReturnValue({ getOne, getFullList } as any);
    vi.mocked(pb.files.getUrl).mockReturnValue(new URL('https://example.com/photo.jpg') as any);
    vi.mocked(get).mockReturnValue(null);

    const result = await load({ params: { id: 'listing123' } } as any);

    expect(result.listing.listing_type).toBe('sell');
  });
});
