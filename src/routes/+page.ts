import { PUBLIC_POCKETBASE_URL } from '$env/static/public';
import type { PageLoad } from './$types';
import type {
  GameRecord,
  ListingFilters,
  ListingPreview,
  ListingRecord,
  ListingType,
} from '$lib/types/listing';
import { LISTING_TYPES, normalizeListingType } from '$lib/types/listing';
import type { UserRecord } from '$lib/types/pocketbase';
import type { ActivityItem } from '$lib/types/activity';

const PAGE_LIMIT = 24;
const ACTIVITY_LIMIT = 50;
const FALLBACK_BASE_URL = 'http://127.0.0.1:8090';

type PocketBaseListResponse<T> = {
  page: number;
  perPage: number;
  totalPages: number;
  totalItems: number;
  items: T[];
};

const sanitizeForFilter = (value: string): string => {
  return value.replace(/"/g, '\\"').replace(/\n/g, ' ').trim();
};

const buildFileUrl = (
  baseUrl: string,
  record: Pick<ListingRecord, 'id' | 'collectionId' | 'collectionName'>,
  filename: string,
  thumb?: string
): string => {
  const collection = record.collectionId ?? record.collectionName ?? 'listings';
  const encodedFilename = encodeURIComponent(filename);
  const fileUrl = `${baseUrl}/api/files/${collection}/${record.id}/${encodedFilename}`;

  return thumb ? `${fileUrl}?thumb=${encodeURIComponent(thumb)}` : fileUrl;
};

type ExpandedGameRecord = GameRecord & {
  expand?: {
    listing?: ListingRecord & {
      expand?: {
        owner?: UserRecord;
      };
    };
  };
};

const fetchActivityData = async (
  baseUrl: string,
  fetchFn: typeof fetch
): Promise<ActivityItem[]> => {
  const activityParams = new URLSearchParams({
    page: '1',
    perPage: String(ACTIVITY_LIMIT),
    sort: '-created',
    expand: 'listing,listing.owner',
    filter: 'listing.status = "active"',
  });

  try {
    const response = await fetchFn(
      `${baseUrl}/api/collections/games/records?${activityParams.toString()}`,
      {
        headers: {
          accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch activity: ${response.status} ${response.statusText}`);
    }

    const result = (await response.json()) as PocketBaseListResponse<ExpandedGameRecord>;

    return result.items
      .filter((game) => {
        // Ensure we have the expanded listing data
        return game.expand?.listing && game.expand.listing.status === 'active';
      })
      .map((game) => {
        const listing = game.expand!.listing!;
        const owner = listing.expand?.owner;
        const bggId = typeof game.bgg_id === 'number' ? game.bgg_id : null;

        // Get thumbnail from listing photos
        const thumbnail =
          Array.isArray(listing.photos) && listing.photos.length > 0
            ? buildFileUrl(baseUrl, listing, listing.photos[0], '100x100')
            : null;

        return {
          id: game.id,
          type: normalizeListingType(String(listing.listing_type)),
          gameTitle: game.title,
          bggId,
          condition: game.condition,
          price: typeof game.price === 'number' ? game.price : null,
          tradeValue: typeof game.trade_value === 'number' ? game.trade_value : null,
          timestamp: game.created,
          userName: owner?.display_name ?? null,
          userLocation: listing.location ?? null,
          listingHref: `/listings/${listing.id}`,
          thumbnail,
        };
      });
  } catch (error) {
    console.error('Failed to load activity', error);
    return [];
  }
};

export const prerender = false;

export const load: PageLoad = async ({ fetch, url }) => {
  const pageParam = Number.parseInt(url.searchParams.get('page') ?? '1', 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const rawType = (url.searchParams.get('type') ?? '').toLowerCase();
  let type: ListingType | '' = '';

  if (rawType === 'bundle') {
    type = 'sell';
  } else if (LISTING_TYPES.includes(rawType as ListingType)) {
    type = rawType as ListingType;
  }

  const locationParam = url.searchParams.get('location')?.trim() ?? '';
  const location = locationParam.slice(0, 120);

  const searchParam = url.searchParams.get('search')?.trim() ?? '';
  const search = searchParam.slice(0, 200);

  const conditionParam = url.searchParams.get('condition')?.trim() ?? '';
  const condition = ['mint', 'excellent', 'good', 'fair', 'poor'].includes(conditionParam)
    ? conditionParam
    : '';

  const minPriceParam = url.searchParams.get('minPrice')?.trim() ?? '';
  const maxPriceParam = url.searchParams.get('maxPrice')?.trim() ?? '';
  const minPrice = minPriceParam;
  const maxPrice = maxPriceParam;

  const filters: string[] = ['status = "active"'];

  if (type) {
    filters.push(`listing_type = "${type}"`);
  }

  if (location) {
    filters.push(`location ~ "${sanitizeForFilter(location)}"`);
  }

  // Search in game titles via relation
  if (search) {
    filters.push(`games_via_listing.title ~ "${sanitizeForFilter(search)}"`);
  }

  // Filter by game condition via relation
  if (condition) {
    filters.push(`games_via_listing.condition = "${condition}"`);
  }

  // Filter by price range via relation
  if (minPrice) {
    const minVal = parseFloat(minPrice);
    if (!isNaN(minVal) && minVal >= 0) {
      filters.push(`games_via_listing.price >= ${minVal}`);
    }
  }

  if (maxPrice) {
    const maxVal = parseFloat(maxPrice);
    if (!isNaN(maxVal) && maxVal >= 0) {
      filters.push(`games_via_listing.price <= ${maxVal}`);
    }
  }

  const filtersState: ListingFilters = {
    type,
    location,
    search: search || undefined,
    condition: condition || undefined,
    minPrice: minPrice || undefined,
    maxPrice: maxPrice || undefined,
  };

  const baseUrl = (PUBLIC_POCKETBASE_URL || FALLBACK_BASE_URL).replace(/\/$/, '');
  const searchParams = new URLSearchParams({
    page: String(page),
    perPage: String(PAGE_LIMIT),
    sort: '-created',
    expand: 'owner,games(listing)',
  });

  if (filters.length > 0) {
    searchParams.set('filter', filters.join(' && '));
  }

  try {
    // Fetch both listings and activity in parallel
    const [listingsResponse, activities] = await Promise.all([
      fetch(`${baseUrl}/api/collections/listings/records?${searchParams.toString()}`, {
        headers: {
          accept: 'application/json',
        },
      }),
      fetchActivityData(baseUrl, fetch),
    ]);

    if (!listingsResponse.ok) {
      throw new Error(
        `Failed to fetch listings: ${listingsResponse.status} ${listingsResponse.statusText}`
      );
    }

    const result = (await listingsResponse.json()) as PocketBaseListResponse<ListingRecord>;

    const listings: ListingPreview[] = result.items.map((item) => {
      const owner = item.expand?.owner as UserRecord | undefined;
      const games = Array.isArray(item.expand?.['games(listing)'])
        ? (item.expand?.['games(listing)'] as GameRecord[]).map((game) => {
            const bggId = typeof game.bgg_id === 'number' ? game.bgg_id : null;
            return {
              id: game.id,
              title: game.title,
              condition: game.condition,
              status: game.status,
              bggId,
              bggUrl: bggId ? `https://boardgamegeek.com/boardgame/${bggId}` : null,
              price: typeof game.price === 'number' ? game.price : null,
              tradeValue: typeof game.trade_value === 'number' ? game.trade_value : null,
            };
          })
        : [];
      const coverImage =
        Array.isArray(item.photos) && item.photos.length > 0
          ? buildFileUrl(baseUrl, item, item.photos[0], '800x600')
          : null;

      return {
        id: item.id,
        title: item.title,
        listingType: normalizeListingType(String(item.listing_type)),
        summary: item.summary ?? '',
        location: item.location ?? null,
        created: item.created,
        ownerName: owner?.display_name ?? null,
        ownerId: owner?.id ?? null,
        coverImage,
        href: `/listings/${item.id}`,
        games,
      };
    });

    return {
      listings,
      activities,
      filters: filtersState,
      pagination: {
        page: result.page,
        totalPages: result.totalPages,
        totalItems: result.totalItems,
      },
      loadError: false as const,
    };
  } catch (error) {
    console.error('Failed to load listings', error);

    return {
      listings: [],
      activities: [],
      filters: filtersState,
      pagination: {
        page: 1,
        totalPages: 1,
        totalItems: 0,
      },
      loadError: true as const,
    };
  }
};
