import { describe, expect, it, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { load } from './+page';
import { browser } from '$app/environment';
import type { OfferTemplateRecord, UserRecord, ItemRecord, DiscussionThreadRecord } from '$lib/types/pocketbase';
import type { ListingRecord } from '$lib/types/listing';
import type { CascadeRecord } from '$lib/types/cascade';

// Mock $app/environment
vi.mock('$app/environment', () => ({
  browser: true,
}));

// Mock $env/static/public
vi.mock('$env/static/public', () => ({
  PUBLIC_POCKETBASE_URL: 'http://test-pb.com',
}));

// Constants
const BASE_URL = 'http://test-pb.com';

// Types for mocks
type FetchMock = Mock<[input: RequestInfo | URL, init?: RequestInit], Promise<Response>>;

describe('home page load function', () => {
  let mockFetch: FetchMock;
  let mockParent: Mock<[], Promise<{ currentUser: UserRecord | null }>>;
  let mockDepends: Mock<[string], void>;
  let mockUrl: URL;

  // Mock Data Helpers
  const createMockUser = (overrides: Partial<UserRecord> = {}): UserRecord => ({
    id: 'user1',
    collectionId: 'users',
    collectionName: 'users',
    created: '2023-01-01',
    updated: '2023-01-01',
    display_name: 'Test User',
    trade_count: 5,
    vouch_count: 10,
    joined_date: '2023-01-01',
    preferred_contact: 'platform',
    cascades_seeded: 0,
    cascades_received: 0,
    cascades_passed: 0,
    cascades_broken: 0,
    cascade_reputation: 0,
    can_enter_cascades: true,
    ...overrides,
  } as UserRecord);

  const createMockItem = (overrides: Partial<ItemRecord> = {}): ItemRecord => ({
    id: 'item1',
    collectionId: 'items',
    collectionName: 'items',
    created: '2023-01-01',
    updated: '2023-01-01',
    listing: 'listing1',
    title: 'Catan',
    condition: 'good',
    status: 'available',
    ...overrides,
  } as ItemRecord);

  const createMockListing = (overrides: Partial<ListingRecord> = {}): ListingRecord => ({
    id: 'listing1',
    collectionId: 'listings',
    collectionName: 'listings',
    created: '2023-01-01',
    updated: '2023-01-01',
    owner: 'user1',
    title: 'My Listing',
    status: 'active',
    views: 0,
    photos: ['photo1.jpg'],
    regions: ['auckland'],
    ...overrides,
  } as ListingRecord);

  const createMockOffer = (overrides: Partial<OfferTemplateRecord> = {}): OfferTemplateRecord => ({
    id: 'offer1',
    collectionId: 'offer_templates',
    collectionName: 'offer_templates',
    created: '2023-01-01T10:00:00.000Z',
    updated: '2023-01-01',
    listing: 'listing1',
    owner: 'user1',
    items: ['item1'],
    open_to_lower_offers: true,
    open_to_trade_offers: true,
    will_consider_split: false,
    can_post: true,
    status: 'active',
    expand: {
        listing: createMockListing(),
        owner: createMockUser(),
        items: [createMockItem()]
    },
    ...overrides,
  } as OfferTemplateRecord);

  const createMockDiscussion = (overrides: Partial<DiscussionThreadRecord> = {}): DiscussionThreadRecord => ({
    id: 'disc1',
    collectionId: 'discussion_threads',
    collectionName: 'discussion_threads',
    created: '2023-01-01T09:00:00.000Z',
    updated: '2023-01-01',
    title: 'Wanted: Gloomhaven',
    content: 'Looking for it',
    author: 'user1',
    category: 'cat1',
    view_count: 10,
    reply_count: 2,
    ...overrides,
  } as DiscussionThreadRecord);

  const createMockCascade = (overrides: Partial<CascadeRecord> = {}): CascadeRecord => ({
    id: 'cascade1',
    collectionId: 'cascades',
    collectionName: 'cascades',
    created: '2023-01-01T08:00:00.000Z',
    updated: '2023-01-01',
    status: 'accepting_entries',
    current_game: 'item_c1',
    current_holder: 'user_c1',
    entry_deadline: '2023-02-01',
    shipping_requirement: 'shipping_available',
    generation: 1,
    entry_count: 5,
    view_count: 20,
    ...overrides,
  } as CascadeRecord);

  const mockPocketBaseResponse = <T>(items: T[]) => ({
    page: 1,
    perPage: 40,
    totalPages: 1,
    totalItems: items.length,
    items,
  });

  beforeEach(() => {
    mockFetch = vi.fn();
    mockParent = vi.fn();
    mockDepends = vi.fn();
    mockUrl = new URL('http://localhost/');

    // Setup LocalStorage mock
    const localStorageMock = (function() {
      let store: Record<string, string> = {};
      return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          store[key] = value.toString();
        }),
        clear: vi.fn(() => {
          store = {};
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key];
        })
      };
    })();
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
    });

    // Default fetch behavior: return empty lists for all calls
    mockFetch.mockImplementation(async (url) => {
      const urlStr = url.toString();
      if (urlStr.includes('offer_templates')) {
        return new Response(JSON.stringify(mockPocketBaseResponse([])), { status: 200 });
      }
      if (urlStr.includes('discussion_threads')) {
        return new Response(JSON.stringify(mockPocketBaseResponse([])), { status: 200 });
      }
      if (urlStr.includes('cascades')) {
        return new Response(JSON.stringify(mockPocketBaseResponse([])), { status: 200 });
      }
      return new Response('Not Found', { status: 404 });
    });

    // Default parent behavior: no logged in user
    mockParent.mockResolvedValue({ currentUser: null });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('loads successfully with default parameters', async () => {
    const offer = createMockOffer({ id: 'offer1', created: '2023-01-03' });
    const discussion = createMockDiscussion({ id: 'disc1', created: '2023-01-02' });
    const cascade = createMockCascade({ id: 'cascade1', created: '2023-01-01' });

    mockFetch.mockImplementation(async (url) => {
        const urlStr = url.toString();
        if (urlStr.includes('offer_templates')) {
          return new Response(JSON.stringify(mockPocketBaseResponse([offer])), { status: 200 });
        }
        if (urlStr.includes('discussion_threads')) {
          return new Response(JSON.stringify(mockPocketBaseResponse([discussion])), { status: 200 });
        }
        if (urlStr.includes('cascades')) {
          return new Response(JSON.stringify(mockPocketBaseResponse([cascade])), { status: 200 });
        }
        return new Response('Not Found', { status: 404 });
    });

    const result = await load({ fetch: mockFetch, url: mockUrl, parent: mockParent, depends: mockDepends } as any);

    expect(result.loadError).toBe(false);
    expect(result.activity).toHaveLength(3);
    expect(result.activity[0].id).toBe('offer1'); // Most recent
    expect(result.activity[1].id).toBe('disc1');
    expect(result.activity[2].id).toBe('cascade1'); // Oldest

    // Check transformation of offer
    const offerResult = result.activity[0] as any;
    expect(offerResult.itemType).toBe('offer');
    expect(offerResult.id).toBe(offer.id);
    expect(offerResult.ownerName).toBe('Test User');
    expect(offerResult.games).toHaveLength(1);
    expect(offerResult.games[0].title).toBe('Catan');

    expect(mockDepends).toHaveBeenCalledWith('app:listings');
  });

  it('applies filters correctly: canPost', async () => {
    mockUrl.searchParams.set('canPost', 'true');

    await load({ fetch: mockFetch, url: mockUrl, parent: mockParent, depends: mockDepends } as any);

    // Verify fetch call for offers includes correct filter
    const calls = mockFetch.mock.calls;
    const offerCall = calls.find(call => call[0].toString().includes('offer_templates'));
    expect(offerCall).toBeDefined();

    const url = new URL(offerCall![0].toString());
    const filter = url.searchParams.get('filter');
    expect(filter).toContain('can_post = true');
  });

  it('applies filters correctly: openToTrades', async () => {
    mockUrl.searchParams.set('openToTrades', 'true');

    await load({ fetch: mockFetch, url: mockUrl, parent: mockParent, depends: mockDepends } as any);

    const calls = mockFetch.mock.calls;
    const offerCall = calls.find(call => call[0].toString().includes('offer_templates'));
    expect(offerCall).toBeDefined();

    const url = new URL(offerCall![0].toString());
    const filter = url.searchParams.get('filter');
    expect(filter).toContain('open_to_trade_offers = true');
  });

  it('filters offers by region client-side', async () => {
    mockUrl.searchParams.append('region', 'wellington');

    const offerInRegion = createMockOffer({
        id: 'offer1',
        expand: {
            ...createMockOffer().expand!,
            listing: createMockListing({ regions: ['wellington'] })
        }
    });

    const offerOutsideRegion = createMockOffer({
        id: 'offer2',
        expand: {
            ...createMockOffer().expand!,
            listing: createMockListing({ regions: ['auckland'] })
        }
    });

    mockFetch.mockImplementation(async (url) => {
        const urlStr = url.toString();
        if (urlStr.includes('offer_templates')) {
          return new Response(JSON.stringify(mockPocketBaseResponse([offerInRegion, offerOutsideRegion])), { status: 200 });
        }
        // Return empty for others
        return new Response(JSON.stringify(mockPocketBaseResponse([])), { status: 200 });
    });

    const result = await load({ fetch: mockFetch, url: mockUrl, parent: mockParent, depends: mockDepends } as any);

    const offers = result.activity.filter(a => a.itemType === 'offer');
    expect(offers).toHaveLength(1);
    expect(offers[0].id).toBe('offer1');
  });

  it('includes can-post offers even if region does not match when filtering by region and canPost is enabled', async () => {
    // This tests the logic: const canPostToRegion = canPostFilter && offer.canPost;
    mockUrl.searchParams.append('region', 'wellington');
    mockUrl.searchParams.set('canPost', 'true');

    const offerCanPost = createMockOffer({
        id: 'offer1',
        can_post: true,
        expand: {
            ...createMockOffer().expand!,
            listing: createMockListing({ regions: ['auckland'] }) // Region doesn't match
        }
    });

    mockFetch.mockImplementation(async (url) => {
        const urlStr = url.toString();
        if (urlStr.includes('offer_templates')) {
          return new Response(JSON.stringify(mockPocketBaseResponse([offerCanPost])), { status: 200 });
        }
        return new Response(JSON.stringify(mockPocketBaseResponse([])), { status: 200 });
    });

    const result = await load({ fetch: mockFetch, url: mockUrl, parent: mockParent, depends: mockDepends } as any);

    const offers = result.activity.filter(a => a.itemType === 'offer');
    expect(offers).toHaveLength(1);
    expect(offers[0].id).toBe('offer1');
  });

  it('uses guest regions from localStorage when not logged in', async () => {
    const guestRegions = ['wellington'];
    window.localStorage.getItem = vi.fn().mockReturnValue(JSON.stringify(guestRegions));

    const result = await load({ fetch: mockFetch, url: mockUrl, parent: mockParent, depends: mockDepends } as any);

    expect(result.userPreferredRegions).toEqual(guestRegions);
    expect(result.hasPreferredRegions).toBe(true);
  });

  it('uses user preferred regions when logged in', async () => {
    const userRegions = ['canterbury'];
    const user = createMockUser({ preferred_regions: userRegions });
    mockParent.mockResolvedValue({ currentUser: user });

    const result = await load({ fetch: mockFetch, url: mockUrl, parent: mockParent, depends: mockDepends } as any);

    expect(result.userPreferredRegions).toEqual(userRegions);
    expect(result.hasPreferredRegions).toBe(true);
  });

  it('handles fetch errors gracefully', async () => {
    mockFetch.mockResolvedValue(new Response('Error', { status: 500 }));

    const result = await load({ fetch: mockFetch, url: mockUrl, parent: mockParent, depends: mockDepends } as any);

    expect(result.loadError).toBe(true);
    expect(result.activity).toEqual([]);
    expect(result.hasMore).toBe(false);
  });

  it('correctly constructs cover image URL', async () => {
      const listing = createMockListing({
          id: 'list123',
          collectionId: 'listings_col',
          photos: ['pic.jpg']
      });
      const offer = createMockOffer({
          expand: {
              ...createMockOffer().expand!,
              listing: listing
          }
      });

      mockFetch.mockImplementation(async (url) => {
        const urlStr = url.toString();
        if (urlStr.includes('offer_templates')) {
          return new Response(JSON.stringify(mockPocketBaseResponse([offer])), { status: 200 });
        }
        return new Response(JSON.stringify(mockPocketBaseResponse([])), { status: 200 });
    });

    const result = await load({ fetch: mockFetch, url: mockUrl, parent: mockParent, depends: mockDepends } as any);
    const loadedOffer = result.activity[0] as any;

    expect(loadedOffer.coverImage).toContain('/api/files/listings_col/list123/pic.jpg?thumb=800x600');
  });

  it('fetches discussions with wanted category', async () => {
    await load({ fetch: mockFetch, url: mockUrl, parent: mockParent, depends: mockDepends } as any);

    const calls = mockFetch.mock.calls;
    const discussionCall = calls.find(call => call[0].toString().includes('discussion_threads'));
    expect(discussionCall).toBeDefined();

    const url = new URL(discussionCall![0].toString());
    const filter = url.searchParams.get('filter');
    expect(filter).toContain('category.slug = "wanted"');
  });

  it('fetches active cascades', async () => {
    await load({ fetch: mockFetch, url: mockUrl, parent: mockParent, depends: mockDepends } as any);

    const calls = mockFetch.mock.calls;
    const cascadeCall = calls.find(call => call[0].toString().includes('cascades'));
    expect(cascadeCall).toBeDefined();

    const url = new URL(cascadeCall![0].toString());
    const filter = url.searchParams.get('filter');
    expect(filter).toContain('status = "accepting_entries" || status = "selecting_winner"');
  });
});
