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

vi.mock('$lib/pocketbase', () => ({
  pb: {
    collection: vi.fn(),
  },
  currentUser: {
    subscribe: vi.fn(),
  },
}));

vi.mock('svelte/store', () => ({
  get: vi.fn(),
}));

vi.mock('$lib/utils/auth-redirect', () => ({
  redirectToLogin: vi.fn((pathname: string) => {
    throw redirectStub(302, `/login?next=${encodeURIComponent(pathname)}`);
  }),
}));

describe('chat new page load', () => {
  const listingsCollection = { getOne: vi.fn() };
  const categoriesCollection = { getFullList: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(pocketbaseModule.pb.collection).mockImplementation((name: string) => {
      switch (name) {
        case 'listings':
          return listingsCollection as any;
        case 'discussion_categories':
          return categoriesCollection as any;
        default:
          throw new Error(`Unexpected collection ${name}`);
      }
    });
  });

  it('redirects unauthenticated users to login', async () => {
    const { load } = await import('./+page');
    const { get } = await import('svelte/store');
    vi.mocked(get).mockReturnValue(null);

    await expect(
      load({
        url: { pathname: '/chat/new', search: '', searchParams: new URLSearchParams() },
      } as any)
    ).rejects.toMatchObject({
      status: 302,
      location: '/login?next=%2Fchat%2Fnew',
    });
  });

  it('loads categories without listing when no listing param provided', async () => {
    const { load } = await import('./+page');
    const { get } = await import('svelte/store');
    vi.mocked(get).mockReturnValue({ id: 'user-1' });

    const mockCategories = [
      { id: 'cat-1', name: 'General', slug: 'general', order: 1, enabled: true },
      { id: 'cat-2', name: 'Trading Tips', slug: 'trading-tips', order: 2, enabled: true },
    ];

    categoriesCollection.getFullList.mockResolvedValue(mockCategories);

    const url = {
      pathname: '/chat/new',
      search: '',
      searchParams: new URLSearchParams(),
    };

    const result = (await load({ url } as any))!;

    expect(categoriesCollection.getFullList).toHaveBeenCalledWith({
      filter: 'enabled = true',
      sort: 'order',
    });
    expect(result.listing).toBeNull();
    expect(result.categories).toEqual(mockCategories);
  });

  it('loads listing and categories when listing param provided', async () => {
    const { load } = await import('./+page');
    const { get } = await import('svelte/store');
    vi.mocked(get).mockReturnValue({ id: 'user-1' });

    const mockListing = {
      id: 'listing-1',
      title: 'Gloomhaven Bundle',
      status: 'active',
    };

    const mockCategories = [
      { id: 'cat-1', name: 'General', slug: 'general', order: 1, enabled: true },
    ];

    listingsCollection.getOne.mockResolvedValue(mockListing);
    categoriesCollection.getFullList.mockResolvedValue(mockCategories);

    const url = {
      pathname: '/chat/new',
      search: '?listing=listing-1',
      searchParams: new URLSearchParams('listing=listing-1'),
    };

    const result = (await load({ url } as any))!;

    expect(listingsCollection.getOne).toHaveBeenCalledWith('listing-1', {
      expand: 'owner',
    });
    expect(result.listing).toEqual(mockListing);
    expect(result.categories).toEqual(mockCategories);
  });

  it('continues without listing when loading listing fails', async () => {
    const { load } = await import('./+page');
    const { get } = await import('svelte/store');
    vi.mocked(get).mockReturnValue({ id: 'user-1' });

    const mockCategories = [
      { id: 'cat-1', name: 'General', slug: 'general', order: 1, enabled: true },
    ];

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
    listingsCollection.getOne.mockRejectedValue(new Error('Listing not found'));
    categoriesCollection.getFullList.mockResolvedValue(mockCategories);

    const url = {
      pathname: '/chat/new',
      search: '?listing=listing-1',
      searchParams: new URLSearchParams('listing=listing-1'),
    };

    const result = (await load({ url } as any))!;

    expect(consoleSpy).toHaveBeenCalledWith('Failed to load listing:', expect.any(Error));
    expect(result.listing).toBeNull();
    expect(result.categories).toEqual(mockCategories);
    consoleSpy.mockRestore();
  });
});
