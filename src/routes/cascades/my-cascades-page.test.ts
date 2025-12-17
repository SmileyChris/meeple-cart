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

describe('my cascades page load', () => {
  const entriesCollection = { getFullList: vi.fn() };
  const cascadesCollection = { getFullList: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(pocketbaseModule.pb.collection).mockImplementation((name: string) => {
      switch (name) {
        case 'cascade_entries':
          return entriesCollection as any;
        case 'cascades':
          return cascadesCollection as any;
        default:
          throw new Error(`Unexpected collection ${name}`);
      }
    });
  });

  it('redirects guests to login', async () => {
    const { load } = await import('./my-cascades/+page');
    const { get } = await import('svelte/store');
    vi.mocked(get).mockReturnValue(null);

    await expect(load({ url: { pathname: '/cascades/my-cascades' } } as any)).rejects.toMatchObject({
      message: 'REDIRECT',
      status: 302,
      location: '/login?next=%2Fcascades%2Fmy-cascades',
    });
  });

  it('returns entered, won, and started cascades with user stats', async () => {
    const { load } = await import('./my-cascades/+page');
    const { get } = await import('svelte/store');
    vi.mocked(get).mockReturnValue({
      id: 'user-1',
      cascades_seeded: 3,
      cascades_received: 4,
      cascades_passed: 5,
      cascades_broken: 1,
      cascade_reputation: 98,
    });

    entriesCollection.getFullList
      .mockResolvedValueOnce([
        {
          is_winner: false,
          expand: {
            cascade: {
              id: 'cascade-1',
              name: 'Meeple Madness',
              status: 'accepting_entries',
              entry_deadline: '2024-05-05T12:00:00Z',
              expand: {
                current_game: { title: 'Gloomhaven' },
                current_holder: { display_name: 'Chris' },
              },
            },
          },
        },
      ])
      .mockResolvedValueOnce([
        {
          is_winner: true,
          expand: {
            cascade: {
              id: 'cascade-2',
              name: 'Terraforming Express',
              status: 'in_transit',
              expand: {
                current_game: { title: 'Terraforming Mars' },
              },
            },
          },
        },
      ]);

    cascadesCollection.getFullList.mockResolvedValue([
      {
        id: 'cascade-3',
        name: 'Auckland Express',
        status: 'awaiting_pass',
        generation: 4,
        entry_count: 12,
        entry_deadline: '2024-05-10T12:00:00Z',
        expand: {
          current_game: { title: 'Azul' },
        },
      },
    ]);

    const result = (await load({ url: { pathname: '/cascades/my-cascades' } } as any))!;

    expect(result.enteredCascades).toEqual([
      {
        id: 'cascade-1',
        name: 'Meeple Madness',
        status: 'accepting_entries',
        deadline: '2024-05-05T12:00:00Z',
        gameTitle: 'Gloomhaven',
        holderName: 'Chris',
        isWinner: false,
      },
    ]);
    expect(result.wonCascades).toEqual([
      {
        id: 'cascade-2',
        name: 'Terraforming Express',
        status: 'in_transit',
        gameTitle: 'Terraforming Mars',
      },
    ]);
    expect(result.startedCascades).toEqual([
      {
        id: 'cascade-3',
        name: 'Auckland Express',
        status: 'awaiting_pass',
        generation: 4,
        entryCount: 12,
        deadline: '2024-05-10T12:00:00Z',
        gameTitle: 'Azul',
      },
    ]);
    expect(result.stats).toEqual({
      cascadesSeeded: 3,
      cascadesReceived: 4,
      cascadesPassed: 5,
      cascadesBroken: 1,
      cascadeReputation: 98,
    });
  });

  it('returns fallback when data fetching fails', async () => {
    const { load } = await import('./my-cascades/+page');
    const { get } = await import('svelte/store');
    vi.mocked(get).mockReturnValue({ id: 'user-1' });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    entriesCollection.getFullList.mockRejectedValue(new Error('db failed'));

    const result = (await load({ url: { pathname: '/cascades/my-cascades' } } as any))!;

    expect(result).toEqual({
      enteredCascades: [],
      wonCascades: [],
      startedCascades: [],
      stats: {
        cascadesSeeded: 0,
        cascadesReceived: 0,
        cascadesPassed: 0,
        cascadesBroken: 0,
        cascadeReputation: 0,
      },
    });
    consoleSpy.mockRestore();
  });
});
