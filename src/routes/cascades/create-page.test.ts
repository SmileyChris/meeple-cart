import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as pocketbaseModule from '$lib/pocketbase';

const redirectStub = vi.fn((status: number, location: string) => {
  const err = new Error('REDIRECT');
  (err as any).status = status;
  (err as any).location = location;
  throw err;
});

vi.mock('@sveltejs/kit', () => ({
  redirect: redirectStub,
}));

vi.mock('$lib/pocketbase', () => {
  const pb = {
    collection: vi.fn(),
  };
  const currentUser = {
    subscribe: vi.fn(),
  };
  return { pb, currentUser };
});

vi.mock('svelte/store', () => ({
  get: vi.fn(),
}));

describe('cascade create load', () => {
  const listingsCollection = { getFullList: vi.fn() };
  const itemsCollection = { getFullList: vi.fn() };
  const cascadesCollection = { getFullList: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(pocketbaseModule.pb.collection).mockImplementation((name: string) => {
      switch (name) {
        case 'listings':
          return listingsCollection as any;
        case 'items':
          return itemsCollection as any;
        case 'cascades':
          return cascadesCollection as any;
        default:
          throw new Error(`Unexpected collection ${name}`);
      }
    });
  });

  it('redirects unauthenticated users to login', async () => {
    const { load } = await import('./create/+page.ts');
    const { get } = await import('svelte/store');
    vi.mocked(get).mockReturnValue(null);

    await expect(load({ url: { pathname: '/cascades/create' } } as any)).rejects.toMatchObject({
      message: 'REDIRECT',
      status: 302,
      location: '/login?next=%2Fcascades%2Fcreate',
    });
  });

  it('returns available games filtered by active cascades', async () => {
    const { load } = await import('./create/+page.ts');
    const { get } = await import('svelte/store');
    vi.mocked(get).mockReturnValue({ id: 'user-1' });

    listingsCollection.getFullList.mockResolvedValue([
      { id: 'listing-1', title: 'Trade Bundle' },
      { id: 'listing-2', title: 'Family Games' },
    ]);

    itemsCollection.getFullList.mockResolvedValue([
      {
        id: 'game-1',
        title: 'Gloomhaven',
        condition: 'excellent',
        status: 'available',
        expand: { listing: { title: 'Trade Bundle' } },
      },
      {
        id: 'game-2',
        title: 'Terraforming Mars',
        condition: 'good',
        status: 'available',
        expand: { listing: { title: 'Family Games' } },
      },
    ]);

    cascadesCollection.getFullList.mockResolvedValue([{ current_game: 'game-2' }]);

    const result = await load({ url: { pathname: '/cascades/create' } } as any);

    expect(listingsCollection.getFullList).toHaveBeenCalledWith({
      filter: 'owner = "user-1" && status = "active"',
      fields: 'id,title',
    });

    const gameFilter = itemsCollection.getFullList.mock.calls[0][0].filter;
    expect(gameFilter).toContain('listing = "listing-1"');
    expect(gameFilter).toContain('listing = "listing-2"');

    expect(result.availableGames).toEqual([
      {
        id: 'game-1',
        title: 'Gloomhaven',
        condition: 'excellent',
        listingTitle: 'Trade Bundle',
      },
    ]);
  });

  it('returns empty array when user has no eligible listings', async () => {
    const { load } = await import('./create/+page.ts');
    const { get } = await import('svelte/store');
    vi.mocked(get).mockReturnValue({ id: 'user-1' });

    listingsCollection.getFullList.mockResolvedValue([]);

    const result = await load({ url: { pathname: '/cascades/create' } } as any);

    expect(result.availableGames).toEqual([]);
    expect(itemsCollection.getFullList).not.toHaveBeenCalled();
  });

  it('returns fallback when loading fails', async () => {
    const { load } = await import('./create/+page.ts');
    const { get } = await import('svelte/store');
    vi.mocked(get).mockReturnValue({ id: 'user-1' });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    listingsCollection.getFullList.mockRejectedValue(new Error('db down'));

    const result = await load({ url: { pathname: '/cascades/create' } } as any);

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to load available games for cascade',
      expect.any(Error)
    );
    expect(result).toEqual({ availableGames: [] });
    consoleSpy.mockRestore();
  });
});
