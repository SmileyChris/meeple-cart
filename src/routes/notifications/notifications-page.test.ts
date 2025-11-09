import { afterEach, describe, expect, it, vi } from 'vitest';
import * as pocketbaseModule from '$lib/pocketbase';

const redirectStub = vi.fn((status: number, location: string) => {
  const error = new Error('REDIRECT');
  (error as any).status = status;
  (error as any).location = location;
  throw error;
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

describe('notifications page load', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('redirects unauthenticated users to login', async () => {
    const { load } = await import('./+page.ts');
    const { get } = await import('svelte/store');
    vi.mocked(get).mockReturnValue(null);

    await expect(load({ url: { pathname: '/notifications' } } as any)).rejects.toMatchObject({
      message: 'REDIRECT',
      status: 302,
      location: '/login?next=%2Fnotifications',
    });
  });

  it('returns notifications and unread count for authenticated users', async () => {
    const { load } = await import('./+page.ts');
    const { get } = await import('svelte/store');
    vi.mocked(get).mockReturnValue({ id: 'user-1' });

    const mockNotifications = {
      items: [
        {
          id: 'notif-1',
          type: 'new_listing',
          title: 'New listing',
          message: 'Check out this game',
          link: '/listings/1',
          read: false,
          created: '2024-05-01T12:00:00Z',
        },
        {
          id: 'notif-2',
          type: 'new_message',
          title: 'You have a new message',
          message: 'Morgan sent you a reply',
          link: '/messages/1',
          read: true,
          created: '2024-05-02T12:00:00Z',
        },
      ],
    };

    const getList = vi.fn().mockResolvedValue(mockNotifications);
    vi.mocked(pocketbaseModule.pb.collection).mockReturnValue({ getList } as any);

    const result = await load({ url: { pathname: '/notifications' } } as any);

    expect(getList).toHaveBeenCalledWith(1, 50, {
      filter: 'user = "user-1"',
      sort: '-created',
    });
    expect(result.notifications).toHaveLength(2);
    expect(result.unreadCount).toBe(1);
  });

  it('returns empty data when fetching notifications fails', async () => {
    const { load } = await import('./+page.ts');
    const { get } = await import('svelte/store');
    vi.mocked(get).mockReturnValue({ id: 'user-1' });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const getList = vi.fn().mockRejectedValue(new Error('network'));
    vi.mocked(pocketbaseModule.pb.collection).mockReturnValue({ getList } as any);

    const result = await load({ url: { pathname: '/notifications' } } as any);

    expect(consoleSpy).toHaveBeenCalledWith('Failed to load notifications', expect.any(Error));
    expect(result).toEqual({
      notifications: [],
      unreadCount: 0,
    });
    consoleSpy.mockRestore();
  });
});
