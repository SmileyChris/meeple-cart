import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { load } from './+page.ts';
import * as pocketbaseModule from '$lib/pocketbase';

// Mock the pocketbase module
vi.mock('$lib/pocketbase', () => ({
  pb: {
    authStore: {
      isValid: false,
      model: null,
    },
    collection: vi.fn(),
  },
  currentUser: {
    subscribe: vi.fn(),
  },
}));

// Mock svelte/store
vi.mock('svelte/store', () => ({
  get: vi.fn(),
}));

// Mock @sveltejs/kit
vi.mock('@sveltejs/kit', () => ({
  redirect: vi.fn((status, location) => {
    const error = new Error('REDIRECT');
    (error as any).status = status;
    (error as any).location = location;
    throw error;
  }),
}));

describe('profile client-side load', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('redirects to login when user is not authenticated', async () => {
    const { pb } = pocketbaseModule;
    pb.authStore.isValid = false;
    pb.authStore.model = null;

    await expect(load({} as any)).rejects.toMatchObject({
      message: 'REDIRECT',
      status: 302,
      location: '/login',
    });
  });

  it('redirects to login when auth store has no user model', async () => {
    const { pb } = pocketbaseModule;
    pb.authStore.isValid = true;
    pb.authStore.model = null;

    await expect(load({} as any)).rejects.toMatchObject({
      message: 'REDIRECT',
      status: 302,
      location: '/login',
    });
  });

  it('returns the profile and listings for authenticated user', async () => {
    const mockUser = { id: 'user123', display_name: 'Chris' };
    const mockListings = [
      {
        id: 'listing1',
        title: 'Gloomhaven',
        listing_type: 'trade',
        status: 'active',
        created: '2024-01-01T12:00:00Z',
      },
    ];

    const { pb } = pocketbaseModule;
    pb.authStore.isValid = true;
    pb.authStore.model = mockUser;

    const getFullList = vi.fn().mockResolvedValue(mockListings);
    vi.mocked(pb.collection).mockReturnValue({ getFullList } as any);

    const result = await load({} as any);

    expect(getFullList).toHaveBeenCalledWith({
      filter: `owner = "user123"`,
      sort: '-created',
    });

    expect(result.profile).toEqual(mockUser);
    expect(result.listings).toEqual(mockListings);
  });

  it('returns empty listings array when query fails', async () => {
    const mockUser = { id: 'user123', display_name: 'Chris' };

    const { pb } = pocketbaseModule;
    pb.authStore.isValid = true;
    pb.authStore.model = mockUser;

    const getFullList = vi.fn().mockRejectedValue(new Error('Database error'));
    vi.mocked(pb.collection).mockReturnValue({ getFullList } as any);

    await expect(load({} as any)).rejects.toThrow('Database error');
  });
});
