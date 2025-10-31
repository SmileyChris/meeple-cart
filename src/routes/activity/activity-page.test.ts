import { beforeEach, describe, expect, it, vi } from 'vitest';
import { load } from './+page.ts';

const envMock = { url: 'https://pb.example' };

vi.mock('$env/static/public', () => ({
  get PUBLIC_POCKETBASE_URL() {
    return envMock.url;
  },
}));

const createJsonResponse = (payload: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(payload), {
    headers: { 'content-type': 'application/json' },
    ...init,
  });

describe('activity page load', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    envMock.url = 'https://pb.example';
  });

  it('fetches activity feed and maps items correctly', async () => {
    const activityPayload = {
      page: 1,
      perPage: 50,
      totalPages: 3,
      totalItems: 120,
      items: [
        {
          id: 'game-1',
          title: 'Gloomhaven',
          condition: 'excellent',
          status: 'available',
          price: 200,
          trade_value: null,
          created: '2024-05-05T12:00:00Z',
          bgg_id: 174430,
          expand: {
            listing: {
              id: 'listing-1',
              listing_type: 'trade',
              status: 'active',
              location: 'Wellington',
              photos: ['cover.jpg'],
              expand: {
                owner: {
                  display_name: 'Chris',
                },
              },
            },
          },
        },
        {
          id: 'game-2',
          title: 'Terraforming Mars',
          condition: 'good',
          status: 'available',
          price: null,
          trade_value: 120,
          created: '2024-05-06T08:00:00Z',
          bgg_id: null,
          expand: {
            listing: {
              id: 'listing-2',
              listing_type: 'sell',
              status: 'active',
              location: null,
              photos: [],
              expand: {
                owner: {
                  display_name: null,
                },
              },
            },
          },
        },
      ],
    };

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      expect(url).toContain('/collections/games/records');
      const requestUrl = new URL(url);
      const filter = requestUrl.searchParams.get('filter');
      expect(filter).toContain('listing.status = "active"');
      expect(filter).toContain('listing.listing_type = "sell"');
      return createJsonResponse(activityPayload, { status: 200 });
    });

    const url = new URL('https://meeple.cart/activity?type=sell');
    const result = await load({ fetch: fetchMock as any, url } as any);

    expect(result.loadError).toBe(false);
    expect(result.currentFilter).toBe('sell');
    expect(result.hasMore).toBe(true);
    expect(result.currentPage).toBe(1);
    expect(result.totalPages).toBe(3);
    expect(result.activities).toEqual([
      {
        id: 'game-1',
        type: 'trade',
        gameTitle: 'Gloomhaven',
        bggId: 174430,
        condition: 'excellent',
        price: 200,
        tradeValue: null,
        timestamp: '2024-05-05T12:00:00Z',
        userName: 'Chris',
        userLocation: 'Wellington',
        listingHref: '/listings/listing-1',
        thumbnail:
          'https://pb.example/api/files/listings/listing-1/cover.jpg?thumb=800x600',
      },
      {
        id: 'game-2',
        type: 'sell',
        gameTitle: 'Terraforming Mars',
        bggId: null,
        condition: 'good',
        price: null,
        tradeValue: 120,
        timestamp: '2024-05-06T08:00:00Z',
        userName: null,
        userLocation: null,
        listingHref: '/listings/listing-2',
        thumbnail: null,
      },
    ]);
  });

  it('returns fallback data when the activity request fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetchMock = vi.fn(async () =>
      createJsonResponse({ error: 'fail' }, { status: 500, statusText: 'Server error' })
    );

    const result = await load({
      fetch: fetchMock as any,
      url: new URL('https://meeple.cart/activity'),
    } as any);

    expect(result).toEqual({
      activities: [],
      loadError: true,
      currentPage: 1,
      totalPages: 1,
      hasMore: false,
      currentFilter: null,
    });
    consoleSpy.mockRestore();
  });
});
