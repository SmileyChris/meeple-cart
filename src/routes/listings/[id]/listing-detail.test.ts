import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { load } from './+page';
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
  status: 'active',
  created: '2024-01-01T12:00:00Z',
  photos: ['photo1.jpg'],
  collectionName: 'listings',
  expand: {
    owner: {
      id: 'user123',
      display_name: 'Chris',
    },
    'items_via_listing': [
      {
        id: 'game1',
        title: 'Gloomhaven',
        condition: 'excellent',
        status: 'available',
        bgg_id: 174430,
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

    // Create mocks for each collection call
    const listingGetOne = vi.fn().mockResolvedValue(baseListing);
    const reactionsGetFullList = vi.fn().mockResolvedValue([]);
    const tradesGetList = vi.fn().mockResolvedValue({ items: [], totalItems: 0 });
    const offerTemplatesGetFullList = vi.fn().mockResolvedValue([]);
    const discussionThreadsGetList = vi.fn().mockResolvedValue({ items: [], totalItems: 0 });

    vi.mocked(pb.collection).mockImplementation((collectionName) => {
      switch (collectionName) {
        case 'listings':
          return { getOne: listingGetOne } as any;
        case 'reactions':
          return { getFullList: reactionsGetFullList } as any;
        case 'trades':
          return { getList: tradesGetList } as any;
        case 'offer_templates':
          return { getFullList: offerTemplatesGetFullList } as any;
        case 'discussion_threads':
          return { getList: discussionThreadsGetList } as any;
        default:
          return {} as any;
      }
    });

    vi.mocked(pb.files.getUrl).mockImplementation(
      (_record, file, options?) =>
        new URL(
          options?.thumb ? `https://example.com/thumb-${file}` : `https://example.com/${file}`
        ) as any
    );
    vi.mocked(get).mockReturnValue(null); // No user watching

    const result = (await load({ params: { id: 'listing123' } } as any))!;

    expect(listingGetOne).toHaveBeenCalledWith('listing123', {
      expand: 'owner,items_via_listing',
    });

    expect(result.listing).toMatchObject({
      id: 'listing123',
      title: 'Test Listing',
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

    // Photos are built with hardcoded base URL in the loader
    expect(result.photos).toHaveLength(1);
    expect(result.photos[0].id).toBe('photo1.jpg');
    expect(result.photos[0].full).toContain('photo1.jpg');
    expect(result.photos[0].thumb).toContain('photo1.jpg');
    expect(result.photos[0].thumb).toContain('thumb=');

    expect(result.isWatching).toBe(false);
  });

  it('checks if authenticated user is watching the listing', async () => {
    const { pb } = pocketbaseModule;
    const { get } = await import('svelte/store');

    const user = { id: 'user456', email: 'test@example.com' };
    vi.mocked(get).mockReturnValue(user);

    // Mock reactions response indicating the user has reacted
    const reactions = [
      { id: 'r1', user: 'user456', listing: 'listing123', emoji: '👀' }
    ];

    // Create mocks for each collection call
    const listingGetOne = vi.fn().mockResolvedValue(baseListing);
    const reactionsGetFullList = vi.fn().mockResolvedValue(reactions);
    const tradesGetList = vi.fn().mockResolvedValue({ items: [], totalItems: 0 });
    const offerTemplatesGetFullList = vi.fn().mockResolvedValue([]);
    const discussionThreadsGetList = vi.fn().mockResolvedValue({ items: [], totalItems: 0 });

    vi.mocked(pb.collection).mockImplementation((collectionName) => {
      switch (collectionName) {
        case 'listings':
          return { getOne: listingGetOne } as any;
        case 'reactions':
          return { getFullList: reactionsGetFullList } as any;
        case 'trades':
          return { getList: tradesGetList } as any;
        case 'offer_templates':
          return { getFullList: offerTemplatesGetFullList } as any;
        case 'discussion_threads':
          return { getList: discussionThreadsGetList } as any;
        default:
          return {} as any;
      }
    });

    const result = (await load({ params: { id: 'listing123' } } as any))!;

    expect(reactionsGetFullList).toHaveBeenCalledWith({
      filter: `listing = "listing123"`,
    });

    expect(result.isWatching).toBe(true);
    expect(result.userReaction).toBe('👀');
    expect(result.reactionCounts['👀']).toBe(1);
  });

  it('throws 500 when listing load fails', async () => {
    const { pb } = pocketbaseModule;
    const getOne = vi.fn().mockRejectedValue(new Error('Not found'));

    vi.mocked(pb.collection).mockImplementation((collectionName) => {
        if (collectionName === 'listings') {
            return { getOne } as any;
        }
        return {} as any;
    });

    // The loader wraps all errors in a 500 status
    await expect(load({ params: { id: 'missing' } } as any)).rejects.toMatchObject({
      status: 500,
    });
  });

  // Test removed: listing_type field no longer exists in schema
});
