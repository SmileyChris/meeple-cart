import type { PageLoad } from './$types';
import { get } from 'svelte/store';
import { currentUser as authUser } from '$lib/pocketbase';
import type { ListingRecord, OfferFilters } from '$lib/types/listing';
import type { UserRecord, ItemRecord, OfferTemplateRecord } from '$lib/types/pocketbase';
import type { ListingActivity, SignupActivity } from '$lib/types/activity';

const ACTIVITY_LIMIT = 50;
const FALLBACK_BASE_URL = 'http://127.0.0.1:8090';

/** Game preview used on the /games browse page - adds year/price on top of the shared activity shape. */
export interface GameListingActivity extends ListingActivity {
  year: number | null;
  /** NZD cents, sourced from the item's own price if present, otherwise the offer's cash_amount. */
  price: number | null;
}

export type GameActivityItem = GameListingActivity | SignupActivity;

export type GameSortOption = 'newest' | 'price' | 'title';

export const GAME_SORT_OPTIONS: GameSortOption[] = ['newest', 'price', 'title'];

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

// The `items` collection has no forward relation to `offer_templates`, so price/can_post
// (which live on the offer_template) are reached via the `offer_templates_via_items`
// back-relation - same naming convention already used for `items_via_listing` elsewhere.
type ExpandedItemRecord = ItemRecord & {
  price?: number;
  expand?: {
    listing?: ListingRecord & {
      expand?: {
        owner?: UserRecord;
      };
    };
    offer_templates_via_items?: OfferTemplateRecord[];
  };
};

export interface ItemsFilterOptions {
  regions: string[];
  search: string;
  condition: string;
  canPost: boolean;
}

/**
 * Builds the PocketBase filter string for the `items` list query.
 * Pure function so the filter-building rules can be unit tested directly.
 */
export const buildItemsFilter = ({
  regions,
  search,
  condition,
  canPost,
}: ItemsFilterOptions): string => {
  const filters: string[] = ['listing.status = "active"'];

  if (regions.length > 0) {
    const regionFilters = regions
      .map((region) => `listing.regions ~ "${sanitizeForFilter(region)}"`)
      .join(' || ');
    filters.push(`(${regionFilters})`);
  }

  if (search) {
    filters.push(`title ~ "${sanitizeForFilter(search)}"`);
  }

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
        const conditionFilters = allowedConditions.map((c) => `condition = "${c}"`).join(' || ');
        filters.push(`(${conditionFilters})`);
      }
    }
  }

  // Independent of the region filter - applied whenever the "Can post" toggle is on.
  // can_post lives on the offer_template, reached via the items back-relation.
  if (canPost) {
    filters.push('offer_templates_via_items.can_post = true');
  }

  return filters.join(' && ');
};

/** Validates a `sort` URL param, defaulting to 'newest'. */
export const resolveGameSort = (value: string | null): GameSortOption => {
  return value === 'price' || value === 'title' ? value : 'newest';
};

/**
 * Maps a sort option to a PocketBase `sort` string for the `items` collection.
 * 'price' has no reliable PocketBase equivalent because price/cash_amount lives on the
 * related offer_template, not a top-level `items` field - callers should fetch newest-first
 * and re-sort client-side with `sortActivitiesByPrice`.
 */
export const mapSortToPocketBaseSort = (sort: GameSortOption): string => {
  switch (sort) {
    case 'title':
      return 'title';
    case 'price':
    case 'newest':
    default:
      return '-created';
  }
};

/** Client-side re-sort by resolved price (ascending, nulls last). Used for the 'price' sort option. */
export const sortActivitiesByPrice = (activities: GameActivityItem[]): GameActivityItem[] => {
  const priceOf = (activity: GameActivityItem): number | null =>
    activity.activityType === 'listing' ? activity.price : null;

  return [...activities].sort((a, b) => {
    const aPrice = priceOf(a);
    const bPrice = priceOf(b);
    if (aPrice == null && bPrice == null) return 0;
    if (aPrice == null) return 1;
    if (bPrice == null) return -1;
    return aPrice - bPrice;
  });
};

/** Formats the results-count label using the total match count, not the current page size. */
export const formatResultsCount = (totalItems: number): string => {
  const count = Math.max(0, totalItems);
  return `${count} ${count === 1 ? 'game matches' : 'games match'}`;
};

export const prerender = false;

export const load: PageLoad = async ({ fetch, url, depends }) => {
  depends('app:games');

  const pageParam = Number.parseInt(url.searchParams.get('page') ?? '1', 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  // Get current user from parent layout (consistent with activity page)
  const user = get(authUser);

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

  // Check if URL has any filter params (excluding search/condition which are page-specific)
  const hasUrlParams = url.searchParams.has('canPost') || url.searchParams.has('region');

  // Get filter states - from URL if present, otherwise from localStorage
  let urlRegions = url.searchParams.getAll('region');
  let myRegionsFilter = urlRegions.length > 0;
  let canPostFilter = url.searchParams.get('canPost') === 'true';

  // Apply stored preferences if no URL params
  if (typeof window !== 'undefined' && !hasUrlParams) {
    const storedRegionFilter = localStorage.getItem('preferredRegionFilter');
    if (storedRegionFilter === 'true') {
      const regionsToUse = user?.preferred_regions ?? guestRegions;
      if (regionsToUse.length > 0) {
        urlRegions = regionsToUse;
        myRegionsFilter = true;

        // Only apply canPost if region filter is active
        const storedCanPost = localStorage.getItem('preferredCanPost');
        if (storedCanPost === 'true') {
          canPostFilter = true;
        }
      }
    }
  }

  // Use the resolved regions
  const regions = urlRegions;

  const searchParam = url.searchParams.get('search')?.trim() ?? '';
  const search = searchParam.slice(0, 200);

  const conditionParam = url.searchParams.get('condition')?.trim() ?? '';
  const condition = ['mint', 'excellent', 'good', 'fair', 'poor'].includes(conditionParam)
    ? conditionParam
    : '';

  const sort = resolveGameSort(url.searchParams.get('sort'));

  const filtersState: OfferFilters = {
    regions: regions.length > 0 ? regions : undefined,
    search: search || undefined,
    condition: condition || undefined,
    canPost: canPostFilter || undefined,
  };

  const baseUrl = (import.meta.env.VITE_PUBLIC_POCKETBASE_URL || FALLBACK_BASE_URL).replace(
    /\/$/,
    ''
  );
  const searchParams = new URLSearchParams({
    page: String(page),
    perPage: String(ACTIVITY_LIMIT),
    sort: mapSortToPocketBaseSort(sort),
    expand: 'listing,listing.owner,offer_templates_via_items',
    filter: buildItemsFilter({ regions, search, condition, canPost: canPostFilter }),
  });

  try {
    const itemsResponse = await fetch(
      `${baseUrl}/api/collections/items/records?${searchParams.toString()}`,
      {
        headers: {
          accept: 'application/json',
        },
      }
    );

    if (!itemsResponse.ok) {
      throw new Error(`Failed to fetch items: ${itemsResponse.status} ${itemsResponse.statusText}`);
    }

    const result = (await itemsResponse.json()) as PocketBaseListResponse<ExpandedItemRecord>;

    let activities: GameActivityItem[] = result.items
      .filter((item) => {
        return item.expand?.listing && item.expand.listing.status === 'active';
      })
      .map((item) => {
        const listing = item.expand!.listing!;
        const owner = listing.expand?.owner;
        const bggId = typeof item.bgg_id === 'number' ? item.bgg_id : null;
        const offerTemplate = item.expand?.offer_templates_via_items?.[0];

        const thumbnail =
          Array.isArray(listing.photos) && listing.photos.length > 0
            ? buildFileUrl(baseUrl, listing, listing.photos[0], '100x100')
            : null;

        const year = typeof item.year === 'number' ? item.year : null;
        const price =
          typeof item.price === 'number'
            ? item.price
            : typeof offerTemplate?.cash_amount === 'number'
              ? offerTemplate.cash_amount
              : null;

        return {
          id: item.id,
          activityType: 'listing' as const,
          gameTitle: item.title,
          listingTitle: listing.title,
          bggId,
          condition: item.condition,
          timestamp: item.created,
          userName: owner?.display_name ?? null,
          userId: owner?.id ?? null,
          userJoinedDate: owner?.created ?? null,
          userVouchedTrades: typeof owner?.vouch_count === 'number' ? owner.vouch_count : 0,
          userLocation: listing.location ?? null,
          listingHref: `/listings/${listing.id}`,
          thumbnail,
          listingRegions: Array.isArray(listing.regions) ? listing.regions : [],
          year,
          price,
        };
      });

    // Client-side filters for regions
    if (myRegionsFilter && regions.length > 0) {
      activities = activities.filter((activity) => {
        if (activity.activityType !== 'listing') return true;
        return activity.listingRegions.some((region) => regions.includes(region));
      });
    }

    // PocketBase can't sort by the related offer_template's cash_amount, so re-sort client-side.
    if (sort === 'price') {
      activities = sortActivitiesByPrice(activities);
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
      myRegionsFilter,
      canPostFilter,
      sort,
      hasPreferredRegions: Boolean(user?.preferred_regions?.length || guestRegions.length > 0),
    };
  } catch (error) {
    console.error('Failed to load games', error);

    return {
      activities: [] as GameActivityItem[],
      filters: filtersState,
      pagination: {
        page: 1,
        totalPages: 1,
        totalItems: 0,
      },
      loadError: true as const,
      myRegionsFilter: false,
      canPostFilter: false,
      sort,
      hasPreferredRegions: false,
    };
  }
};
