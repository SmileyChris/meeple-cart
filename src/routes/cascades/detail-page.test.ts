import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as pocketbaseModule from '$lib/pocketbase';

const redirectError = (status: number, message: string) => {
  const err = new Error(message);
  (err as any).status = status;
  return err;
};

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

vi.mock('@sveltejs/kit', () => ({
  error: vi.fn((status: number, message: string) => {
    throw redirectError(status, message);
  }),
}));

describe('cascade detail load', () => {
  const cascadesCollection = {
    getOne: vi.fn(),
  };
  const entriesCollection = {
    getList: vi.fn(),
  };
  const historyCollection = {
    getList: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(pocketbaseModule.pb.collection).mockImplementation((name: string) => {
      switch (name) {
        case 'cascades':
          return cascadesCollection as any;
        case 'cascade_entries':
          return entriesCollection as any;
        case 'cascade_history':
          return historyCollection as any;
        default:
          throw new Error(`Unexpected collection ${name}`);
      }
    });
  });

  it('returns cascade details with entries and eligibility info for authenticated user', async () => {
    const { load } = await import('./[id]/+page');
    const { get } = await import('svelte/store');

    vi.mocked(get).mockReturnValue({
      id: 'user-123',
      can_enter_cascades: true,
      cascades_seeded: 2,
    });

    cascadesCollection.getOne.mockResolvedValue({
      id: 'cascade-1',
      name: 'Meeple Madness',
      description: 'Exciting cascade',
      status: 'accepting_entries',
      generation: 3,
      entry_count: 12,
      entry_deadline: '2024-05-05T12:00:00Z',
      region: 'wellington',
      shipping_requirement: 'NZ only',
      special_rules: 'Be awesome',
      expand: {
        current_game: {
          id: 'game-1',
          title: 'Gloomhaven',
          condition: 'excellent',
          notes: 'Lightly played',
          bgg_id: 174430,
          expand: {
            listing: {
              id: 'listing-1',
            },
          },
        },
        current_holder: {
          id: 'user-999',
          display_name: 'Morgan',
          trade_count: 10,
          vouch_count: 5,
          cascades_seeded: 2,
          cascades_received: 3,
        },
      },
    });

    entriesCollection.getList
      .mockResolvedValueOnce({
        items: [
          {
            id: 'entry-1',
            user: 'user-777',
            message: 'Count me in!',
            created: '2024-05-01T10:00:00Z',
            is_winner: false,
            expand: {
              user: {
                display_name: 'Alex',
              },
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        items: [],
      });

    historyCollection.getList.mockResolvedValue({
      items: [
        {
          id: 'history-1',
          generation: 2,
          event_type: 'passed',
          event_date: '2024-04-20T12:00:00Z',
          created: '2024-04-20T12:00:00Z',
          notes: null,
          expand: {
            actor: { display_name: 'Sam' },
            related_user: { display_name: 'Jamie' },
          },
        },
      ],
    });

    const result = (await load({ params: { id: 'cascade-1' } } as any))!;

    expect(result.cascade).toMatchObject({
      id: 'cascade-1',
      name: 'Meeple Madness',
      status: 'accepting_entries',
      entryCount: 12,
    });
    expect(result.game).toMatchObject({
      id: 'game-1',
      title: 'Gloomhaven',
      condition: 'excellent',
    });
    expect(result.holder).toMatchObject({
      id: 'user-999',
      displayName: 'Morgan',
    });
    expect(result.entries).toEqual([
      {
        id: 'entry-1',
        userId: 'user-777',
        userName: 'Alex',
        message: 'Count me in!',
        created: '2024-05-01T10:00:00Z',
        isWinner: false,
      },
    ]);
    expect(result.history).toEqual([
      {
        id: 'history-1',
        generation: 2,
        eventType: 'passed',
        eventDate: '2024-04-20T12:00:00Z',
        actorName: 'Sam',
        relatedUserName: 'Jamie',
        notes: null,
      },
    ]);
    expect(result.userEntry).toBeNull();
    expect(result.canEnter).toBe(true);
    expect(result.eligibilityMessage).toBe('You are eligible to enter this cascade');
  });

  it('returns guest eligibility message when user is not authenticated', async () => {
    const { load } = await import('./[id]/+page');
    const { get } = await import('svelte/store');

    vi.mocked(get).mockReturnValue(null);

    cascadesCollection.getOne.mockResolvedValue({
      id: 'cascade-1',
      status: 'accepting_entries',
      entry_count: 0,
      expand: {
        current_game: {
          id: 'game-1',
          title: 'Game',
          condition: 'good',
          expand: {},
        },
        current_holder: {
          id: 'holder',
          display_name: 'Morgan',
        },
      },
    });

    entriesCollection.getList.mockResolvedValueOnce({ items: [] });
    historyCollection.getList.mockResolvedValue({ items: [] });

    const result = (await load({ params: { id: 'cascade-1' } } as any))!;

    expect(result.canEnter).toBe(false);
    expect(result.eligibilityMessage).toBe('Log in to enter this cascade');
  });

  it('throws 404 when cascade data is incomplete', async () => {
    const { load } = await import('./[id]/+page');
    const { get } = await import('svelte/store');
    vi.mocked(get).mockReturnValue({ id: 'user-1', can_enter_cascades: true });

    cascadesCollection.getOne.mockResolvedValue({
      id: 'cascade-1',
      status: 'accepting_entries',
      expand: {
        current_game: null,
        current_holder: null,
      },
    });

    await expect(load({ params: { id: 'cascade-1' } } as any)).rejects.toMatchObject({
      status: 404,
      message: 'Cascade not found',
    });
  });
});
