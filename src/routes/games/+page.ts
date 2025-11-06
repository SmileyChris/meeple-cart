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

export const load: PageLoad = async ({ fetch, url, depends }) => {
  depends('app:games');

  const pageParam = Number.parseInt(url.searchParams.get('page') ?? '1', 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  // Get current user's preferred regions
  const user = get(currentUser);

  // Get types filter - check individual params, default to all three
  const allTypes = ['sell', 'trade', 'want'];
  const selectedTypes = allTypes.filter(type => url.searchParams.get(type) !== 'false');

  // Get regions from URL params (changed from 'regions' to 'region')
  const urlRegions = url.searchParams.getAll('region');
  const myRegionsFilter = urlRegions.length > 0;
  const canPostFilter = url.searchParams.get('canPost') === 'true';

  // Get guest regions from localStorage if not logged in
  let guestRegions: string[] = [];
  if (typeof window !== 'undefined' && !user) {
    const stored = localStorage.getItem('guestPreferredRegions');
    if (stored) {
      try {
        guestRegions = JSON.parse(stored);
      } catch {
        guestRegions = [];
      }
    }
  }

  // Use URL regions if provided
  const regions = urlRegions;

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

  // Filter by selected listing types
  if (selectedTypes.length > 0 && selectedTypes.length < 3) {
    const typeConditions = selectedTypes
      .filter((t) => ['trade', 'sell', 'want'].includes(t))
      .map((t) => `listing.listing_type = "${t}"`);
    if (typeConditions.length > 0) {
      filters.push(`(${typeConditions.join(' || ')})`);
    }
  }

  // Filter by regions if any are selected
  // Note: can_post filtering is done client-side because it's a game property
  // and we need to filter based on listings that have games with can_post=true
  if (regions.length > 0 && !canPostFilter) {
    const regionFilters = regions
      .map((region) => `listing.regions ~ "${sanitizeForFilter(region)}"`)
      .join(' || ');
    filters.push(`(${regionFilters})`);
  }

  // Search in game titles
  if (search) {
    filters.push(`title ~ "${sanitizeForFilter(search)}"`);
  }

  // Filter by game condition
  if (condition) {
    if (condition === 'mint') {
      // "Only mint" - exact match
      filters.push(`condition = "mint"`);
    } else {
      // "At least X" - include this condition and better ones
      const conditionOrder = ['poor', 'fair', 'good', 'excellent', 'mint'];
      const minIndex = conditionOrder.indexOf(condition);
      if (minIndex >= 0) {
        const allowedConditions = conditionOrder.slice(minIndex);
        const conditionFilters = allowedConditions.map(c => `condition = "${c}"`).join(' || ');
        filters.push(`(${conditionFilters})`);
      }
    }
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
    type: selectedTypes.length === 1 ? selectedTypes[0] as ListingType : '',
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

    let activities: ActivityItem[] = result.items
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
          userId: owner?.id ?? null,
          userJoinedDate: owner?.created ?? null,
          userVouchedTrades: typeof owner?.vouch_count === 'number' ? owner.vouch_count : 0,
          userLocation: listing.location ?? null,
          listingHref: `/listings/${listing.id}`,
          thumbnail,
          listingRegions: Array.isArray(listing.regions) ? listing.regions : [],
          canPost: game.can_post === true,
        };
      });

    // Client-side filters for regions with can_post
    if (myRegionsFilter && regions.length > 0) {
      activities = activities.filter((activity) => {
        // Match if listing is in filtered regions
        const matchesRegion = activity.listingRegions.some((region) => regions.includes(region));

        // OR if "can post" is enabled and game has can_post=true
        const matchesCanPost = canPostFilter && activity.canPost;

        return matchesRegion || matchesCanPost;
      });
    }

    return {
      activities,
      filters: filtersState,
      pagination: {
        page: result.page,
        totalPages: result.totalPages,
        totalItems: result.totalItems,
      },
      loadError: false as const,
      selectedTypes,
      myRegionsFilter,
      canPostFilter,
      hasPreferredRegions: Boolean(user?.preferred_regions?.length || guestRegions.length > 0),
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
      selectedTypes: ['sell', 'trade', 'want'],
      myRegionsFilter: false,
      canPostFilter: false,
      hasPreferredRegions: false,
    };
  }
};
