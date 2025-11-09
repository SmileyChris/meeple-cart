import { PUBLIC_POCKETBASE_URL } from '$env/static/public';
import type { PageLoad } from './$types';
import type {
  ListingFilters,
  ListingRecord,
  ListingType,
} from '$lib/types/listing';
import { LISTING_TYPES } from '$lib/types/listing';
import type { UserRecord, ItemRecord } from '$lib/types/pocketbase';
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

type ExpandedItemRecord = ItemRecord & {
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

  // Build filters for items collection
  const filters: string[] = ['listing.status = "active"'];

  // Note: listing_type field no longer exists - type filtering removed
  // In future, could filter by offer template type instead

  // Filter by regions if any are selected
  if (regions.length > 0) {
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

  // Note: Price filtering removed - price is now in offer_templates, not items

  const filtersState: ListingFilters = {
    type: '', // listing_type field no longer exists
    regions: regions.length > 0 ? regions : undefined,
    search: search || undefined,
    condition: condition || undefined,
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
    const itemsResponse = await fetch(
      `${baseUrl}/api/collections/items/records?${searchParams.toString()}`,
      {
        headers: {
          accept: 'application/json',
        },
      }
    );

    if (!itemsResponse.ok) {
      throw new Error(
        `Failed to fetch items: ${itemsResponse.status} ${itemsResponse.statusText}`
      );
    }

    const result = (await itemsResponse.json()) as PocketBaseListResponse<ExpandedItemRecord>;

    let activities: ActivityItem[] = result.items
      .filter((item) => {
        return item.expand?.listing && item.expand.listing.status === 'active';
      })
      .map((item) => {
        const listing = item.expand!.listing!;
        const owner = listing.expand?.owner;
        const bggId = typeof item.bgg_id === 'number' ? item.bgg_id : null;

        const thumbnail =
          Array.isArray(listing.photos) && listing.photos.length > 0
            ? buildFileUrl(baseUrl, listing, listing.photos[0], '100x100')
            : null;

        return {
          id: item.id,
          activityType: 'listing' as const,
          type: 'sell' as ListingType, // Default type since listing_type removed
          gameTitle: item.title,
          listingTitle: listing.title,
          bggId,
          condition: item.condition,
          price: null, // Price now in offer_templates
          tradeValue: null, // Trade value now in offer_templates
          timestamp: item.created,
          userName: owner?.display_name ?? null,
          userId: owner?.id ?? null,
          userJoinedDate: owner?.created ?? null,
          userVouchedTrades: typeof owner?.vouch_count === 'number' ? owner.vouch_count : 0,
          userLocation: listing.location ?? null,
          listingHref: `/listings/${listing.id}`,
          thumbnail,
          listingRegions: Array.isArray(listing.regions) ? listing.regions : [],
          canPost: false, // can_post field removed from schema
        };
      });

    // Client-side filters for regions
    if (myRegionsFilter && regions.length > 0) {
      activities = activities.filter((activity) => {
        return activity.listingRegions.some((region) => regions.includes(region));
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
      myRegionsFilter: false,
      canPostFilter: false,
      hasPreferredRegions: false,
    };
  }
};
