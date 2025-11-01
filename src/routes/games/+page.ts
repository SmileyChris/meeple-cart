import { PUBLIC_POCKETBASE_URL } from '$env/static/public';
import type { PageLoad } from './$types';
import type {
  GameRecord,
  ListingFilters,
  ListingRecord,
  ListingType,
} from '$lib/types/listing';
import { LISTING_TYPES, normalizeListingType } from '$lib/types/listing';
import type { UserRecord } from '$lib/types/pocketbase';
import type { ActivityItem } from '$lib/types/activity';
import { currentUser } from '$lib/pocketbase';
import { get } from 'svelte/store';

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

  // Get regions from URL params (can be multiple)
  const urlRegions = url.searchParams.getAll('regions');

  // Get current user's preferred regions as defaults if no URL regions specified
  const user = get(currentUser);
  const defaultRegions = user?.preferred_regions || [];

  // Use URL regions if provided, otherwise use user's preferred regions
  const regions = urlRegions.length > 0 ? urlRegions : defaultRegions;

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

  // Build filters for games collection
  const filters: string[] = ['listing.status = "active"'];

  if (type) {
    filters.push(`listing.listing_type = "${type}"`);
  }

  // Filter by regions if any are selected
  if (regions.length > 0) {
    const regionFilters = regions
      .map((region) => `listing.location ~ "${sanitizeForFilter(region)}"`)
      .join(' || ');
    filters.push(`(${regionFilters})`);
  }

  // Search in game titles
  if (search) {
    filters.push(`title ~ "${sanitizeForFilter(search)}"`);
  }

  // Filter by game condition
  if (condition) {
    filters.push(`condition = "${condition}"`);
  }

  // Filter by price range
  if (minPrice) {
    const minVal = parseFloat(minPrice);
    if (!isNaN(minVal) && minVal >= 0) {
      filters.push(`price >= ${minVal}`);
    }
  }

  if (maxPrice) {
    const maxVal = parseFloat(maxPrice);
    if (!isNaN(maxVal) && maxVal >= 0) {
      filters.push(`price <= ${maxVal}`);
    }
  }

  const filtersState: ListingFilters = {
    type,
    regions: regions.length > 0 ? regions : undefined,
    search: search || undefined,
    condition: condition || undefined,
    minPrice: minPrice || undefined,
    maxPrice: maxPrice || undefined,
  };

  const baseUrl = (PUBLIC_POCKETBASE_URL || FALLBACK_BASE_URL).replace(/\/$/, '');
  const searchParams = new URLSearchParams({
    page: String(page),
    perPage: String(ACTIVITY_LIMIT),
    sort: '-created',
    expand: 'listing,listing.owner',
  });

  if (filters.length > 0) {
    searchParams.set('filter', filters.join(' && '));
  }

  try {
    const gamesResponse = await fetch(
      `${baseUrl}/api/collections/games/records?${searchParams.toString()}`,
      {
        headers: {
          accept: 'application/json',
        },
      }
    );

    if (!gamesResponse.ok) {
      throw new Error(
        `Failed to fetch games: ${gamesResponse.status} ${gamesResponse.statusText}`
      );
    }

    const result = (await gamesResponse.json()) as PocketBaseListResponse<ExpandedGameRecord>;

    const activities: ActivityItem[] = result.items
      .filter((game) => {
        return game.expand?.listing && game.expand.listing.status === 'active';
      })
      .map((game) => {
        const listing = game.expand!.listing!;
        const owner = listing.expand?.owner;
        const bggId = typeof game.bgg_id === 'number' ? game.bgg_id : null;

        const thumbnail =
          Array.isArray(listing.photos) && listing.photos.length > 0
            ? buildFileUrl(baseUrl, listing, listing.photos[0], '100x100')
            : null;

        return {
          id: game.id,
          activityType: 'listing' as const,
          type: normalizeListingType(String(listing.listing_type)),
          gameTitle: game.title,
          listingTitle: listing.title,
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

    return {
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
    console.error('Failed to load games', error);

    return {
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
