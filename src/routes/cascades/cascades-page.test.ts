import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import { load } from './+page';

const envMock = { url: 'https://pb.example' };

vi.mock('$env/static/public', () => ({
  get PUBLIC_POCKETBASE_URL() {
    return envMock.url;
  },
}));

const createJsonResponse = (data: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(data), {
    headers: { 'content-type': 'application/json' },
    ...init,
  });

describe('cascades listing load', () => {
  const now = new Date('2024-05-01T10:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    vi.restoreAllMocks();
    envMock.url = 'https://pb.example';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fetches cascades, applies filters, and maps results', async () => {
    const responsePayload = {
      page: 2,
      perPage: 24,
      totalPages: 5,
      totalItems: 120,
      items: [
        {
          id: 'cascade-1',
          name: 'Meeple Madness',
          status: 'accepting_entries',
          generation: 3,
          entry_count: 15,
          entry_deadline: '2024-05-02T12:00:00Z',
          region: 'wellington',
          expand: {
            current_game: {
              id: 'game-1',
              title: 'Gloomhaven',
              condition: 'excellent',
              expand: {
                listing: {
                  id: 'listing-1',
                  photos: ['cover.jpg'],
                },
              },
            },
            current_holder: {
              id: 'user-1',
              display_name: 'Chris',
            },
          },
        },
        {
          id: 'cascade-2',
          name: 'Auckland Express',
          status: 'in_transit',
          generation: 5,
          entry_count: 20,
          entry_deadline: '2024-04-30T23:00:00Z',
          region: 'canterbury',
          expand: {
            current_game: {
              id: 'game-2',
              title: 'Terraforming Mars',
              condition: 'good',
              expand: {
                listing: {
                  id: 'listing-2',
                  photos: [],
                },
              },
            },
            current_holder: {
              id: 'user-2',
              display_name: 'Morgan',
            },
          },
        },
      ],
    };

    let capturedUrl: URL | null = null;
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url =
        typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      capturedUrl = new URL(url);
      return createJsonResponse(responsePayload, { status: 200 });
    });

    const result = (await load({
      fetch: fetchMock as any,
      url: new URL(
        'https://meeple.cart/cascades?page=2&status=accepting_entries&region=wellington&sort=entries'
      ),
    } as any))!;

    expect(capturedUrl).not.toBeNull();
    const filter = capturedUrl!.searchParams.get('filter');
    expect(filter).toContain('status = "accepting_entries"');
    expect(filter).toContain('region = "wellington"');
    expect(capturedUrl!.searchParams.get('sort')).toBe('-entry_count');
    expect(capturedUrl!.searchParams.get('page')).toBe('2');

    expect(result.loadError).toBe(false);
    expect(result.pagination).toEqual({
      page: 2,
      totalPages: 5,
      totalItems: 120,
    });
    expect(result.filters).toEqual({
      status: 'accepting_entries',
      region: 'wellington',
      sort: 'entries',
    });
    expect(result.cascades).toEqual([
      {
        id: 'cascade-1',
        name: 'Meeple Madness',
        status: 'accepting_entries',
        generation: 3,
        entryCount: 15,
        deadline: '2024-05-02T12:00:00Z',
        region: 'wellington',
        gameTitle: 'Gloomhaven',
        gameCondition: 'excellent',
        gameImage: 'https://pb.example/api/files/listings/listing-1/cover.jpg?thumb=400x300',
        holderName: 'Chris',
        holderId: 'user-1',
        timeRemaining: '1 day remaining',
      },
      {
        id: 'cascade-2',
        name: 'Auckland Express',
        status: 'in_transit',
        generation: 5,
        entryCount: 20,
        deadline: '2024-04-30T23:00:00Z',
        region: 'canterbury',
        gameTitle: 'Terraforming Mars',
        gameCondition: 'good',
        gameImage: undefined,
        holderName: 'Morgan',
        holderId: 'user-2',
        timeRemaining: 'Ended',
      },
    ]);
  });

  it('returns fallback data when fetch fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const fetchMock = vi.fn(async () =>
      createJsonResponse({ error: 'fail' }, { status: 500, statusText: 'Server error' })
    );

    const result = await load({
      fetch: fetchMock as any,
      url: new URL('https://meeple.cart/cascades'),
    } as any);

    expect(result).toEqual({
      cascades: [],
      filters: {
        status: undefined,
        region: undefined,
        sort: 'deadline',
      },
      pagination: {
        page: 1,
        totalPages: 1,
        totalItems: 0,
      },
      loadError: true,
    });
    consoleSpy.mockRestore();
  });
});
