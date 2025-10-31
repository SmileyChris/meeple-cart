import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { load } from './+page.ts';

const envMock = { url: 'https://pb.example' };

vi.mock('$env/static/public', () => ({
  get PUBLIC_POCKETBASE_URL() {
    return envMock.url;
  },
}));

const createJsonResponse = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    headers: { 'content-type': 'application/json' },
    ...init,
  });

describe('home page load function', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    envMock.url = 'https://pb.example';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('loads listings and activity, applying filters and mapping records', async () => {
    const listingsPayload = {
      page: 2,
      perPage: 24,
      totalPages: 10,
      totalItems: 240,
      items: [
        {
          id: 'listing-1',
          collectionId: 'abc123',
          collectionName: 'listings',
          created: '2024-05-01T12:00:00Z',
          listing_type: 'trade',
          title: 'Gloomhaven bundle',
          summary: 'Great condition set',
          location: 'Wellington',
          photos: ['cover.jpg'],
          expand: {
            owner: {
              id: 'owner-1',
              display_name: 'Chris',
            },
            'games(listing)': [
              {
                id: 'game-1',
                title: 'Gloomhaven',
                condition: 'excellent',
                status: 'available',
                bgg_id: 174430,
                price: 150,
                trade_value: null,
              },
              {
                id: 'game-2',
                title: 'Frosthaven',
                condition: 'good',
                status: 'pending',
                bgg_id: null,
                price: null,
                trade_value: 200,
              },
            ],
          },
        },
      ],
    };

    const activityPayload = {
      page: 1,
      perPage: 50,
      totalPages: 1,
      totalItems: 1,
      items: [
        {
          id: 'game-activity',
          title: 'Brass: Birmingham',
          condition: 'excellent',
          status: 'available',
          created: '2024-05-05T09:30:00Z',
          price: 120,
          trade_value: null,
          bgg_id: 224517,
          expand: {
            listing: {
              id: 'listing-1',
              collectionId: 'abc123',
              collectionName: 'listings',
              listing_type: 'sell',
              status: 'active',
              created: '2024-05-04T09:00:00Z',
              location: 'Auckland',
              photos: ['activity-cover.jpg'],
              expand: {
                owner: {
                  id: 'owner-2',
                  display_name: 'Morgan',
                },
              },
            },
          },
        },
      ],
    };

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

      if (url.includes('/collections/listings/records')) {
        return createJsonResponse(listingsPayload, { status: 200 });
      }

      if (url.includes('/collections/games/records')) {
        return createJsonResponse(activityPayload, { status: 200 });
      }

      throw new Error(`Unexpected fetch call for ${url}`);
    });

    const url = new URL(
      'https://meeple.cart/?page=2&type=Trade&location=Wellington%20"CITY"%0A&search=Gloom%0AHaven&condition=excellent&minPrice=100&maxPrice=250'
    );

    const result = await load({
      fetch: fetchMock as any,
      url,
    } as any);

    const listingsCall = fetchMock.mock.calls.find(([request]) =>
      request.toString().includes('/collections/listings/records')
    );
    expect(listingsCall).toBeTruthy();

    const listingsUrl = new URL(listingsCall![0].toString());
    const filterParam = listingsUrl.searchParams.get('filter');
    expect(filterParam).toContain('status = "active"');
    expect(filterParam).toContain('listing_type = "trade"');
    expect(filterParam).toContain('location ~ "Wellington \\"CITY\\""');
    expect(filterParam).toContain('games_via_listing.title ~ "Gloom Haven"');
    expect(filterParam).toContain('games_via_listing.condition = "excellent"');
    expect(filterParam).toContain('games_via_listing.price >= 100');
    expect(filterParam).toContain('games_via_listing.price <= 250');

    expect(result.pagination).toEqual({
      page: 2,
      totalPages: 10,
      totalItems: 240,
    });
    expect(result.loadError).toBe(false);
    expect(result.filters).toMatchObject({
      type: 'trade',
      location: 'Wellington "CITY"',
      search: 'Gloom\nHaven',
      condition: 'excellent',
      minPrice: '100',
      maxPrice: '250',
    });

    expect(result.listings).toHaveLength(1);
    const listing = result.listings[0];
    expect(listing).toMatchObject({
      id: 'listing-1',
      title: 'Gloomhaven bundle',
      listingType: 'trade',
      ownerName: 'Chris',
      ownerId: 'owner-1',
      coverImage:
        'https://pb.example/api/files/abc123/listing-1/cover.jpg?thumb=800x600',
      href: '/listings/listing-1',
    });
    expect(listing.games).toEqual([
      {
        id: 'game-1',
        title: 'Gloomhaven',
        condition: 'excellent',
        status: 'available',
        bggId: 174430,
        bggUrl: 'https://boardgamegeek.com/boardgame/174430',
        price: 150,
        tradeValue: null,
      },
      {
        id: 'game-2',
        title: 'Frosthaven',
        condition: 'good',
        status: 'pending',
        bggId: null,
        bggUrl: null,
        price: null,
        tradeValue: 200,
      },
    ]);

    expect(result.activities).toEqual([
      {
        id: 'game-activity',
        type: 'sell',
        gameTitle: 'Brass: Birmingham',
        bggId: 224517,
        condition: 'excellent',
        price: 120,
        tradeValue: null,
        timestamp: '2024-05-05T09:30:00Z',
        userName: 'Morgan',
        userLocation: 'Auckland',
        listingHref: '/listings/listing-1',
        thumbnail:
          'https://pb.example/api/files/abc123/listing-1/activity-cover.jpg?thumb=100x100',
      },
    ]);
  });

  it('returns empty results with loadError when listings request fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

      if (url.includes('/collections/listings/records')) {
        return createJsonResponse({ error: 'fail' }, { status: 500, statusText: 'Server error' });
      }

      if (url.includes('/collections/games/records')) {
        throw new Error('network down');
      }

      throw new Error(`Unexpected fetch call for ${url}`);
    });

    const result = await load({
      fetch: fetchMock as any,
      url: new URL('https://meeple.cart/'),
    } as any);

    expect(result).toMatchObject({
      listings: [],
      activities: [],
      loadError: true,
      pagination: {
        page: 1,
        totalItems: 0,
        totalPages: 1,
      },
    });
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
