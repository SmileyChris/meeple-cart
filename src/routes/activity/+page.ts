import { PUBLIC_POCKETBASE_URL } from '$env/static/public';
import type { PageLoad } from './$types';
import type { ActivityItem } from '$lib/types/activity';
import type { GameRecord, ListingRecord } from '$lib/types/listing';
import type { UserRecord } from '$lib/types/pocketbase';
import { normalizeListingType } from '$lib/types/listing';

const ACTIVITY_LIMIT = 50;
const FALLBACK_BASE_URL = 'http://127.0.0.1:8090';

type PocketBaseListResponse<T> = {
  page: number;
  perPage: number;
  totalPages: number;
  totalItems: number;
  items: T[];
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

export const prerender = false;

export const load: PageLoad = async ({ fetch, url }) => {
  const baseUrl = (PUBLIC_POCKETBASE_URL || FALLBACK_BASE_URL).replace(/\/$/, '');

  const page = url.searchParams.get('page') || '1';
  const typeFilter = url.searchParams.get('type');

  // Build filter - always include active status
  const filters = ['listing.status = "active"'];
  if (typeFilter && ['trade', 'sell', 'want'].includes(typeFilter)) {
    filters.push(`listing.listing_type = "${typeFilter}"`);
  }

  const activityParams = new URLSearchParams({
    page,
    perPage: String(ACTIVITY_LIMIT),
    sort: '-created',
    expand: 'listing,listing.owner',
    filter: filters.join(' && '),
  });

  try {
    const response = await fetch(
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
            ? buildFileUrl(baseUrl, listing, listing.photos[0], '800x600')
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

    return {
      activities,
      loadError: false as const,
      currentPage: result.page,
      totalPages: result.totalPages,
      hasMore: result.page < result.totalPages,
      currentFilter: typeFilter || null,
    };
  } catch (error) {
    console.error('Failed to load activity', error);

    return {
      activities: [],
      loadError: true as const,
      currentPage: 1,
      totalPages: 1,
      hasMore: false,
      currentFilter: null,
    };
  }
};
