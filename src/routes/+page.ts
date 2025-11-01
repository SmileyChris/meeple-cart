import { PUBLIC_POCKETBASE_URL } from '$env/static/public';
import type { PageLoad } from './$types';
import type {
  GameRecord,
  ListingPreview,
  ListingRecord,
} from '$lib/types/listing';
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
  const filters = ['status = "active"'];
  if (typeFilter && ['trade', 'sell', 'want'].includes(typeFilter)) {
    filters.push(`listing_type = "${typeFilter}"`);
  }

  const activityParams = new URLSearchParams({
    page,
    perPage: String(ACTIVITY_LIMIT),
    sort: '-created',
    expand: 'owner,games(listing)',
    filter: filters.join(' && '),
  });

  try {
    const response = await fetch(
      `${baseUrl}/api/collections/listings/records?${activityParams.toString()}`,
      {
        headers: {
          accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch activity: ${response.status} ${response.statusText}`);
    }

    const result = (await response.json()) as PocketBaseListResponse<ListingRecord>;

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
      loadError: false as const,
      currentPage: result.page,
      totalPages: result.totalPages,
      hasMore: result.page < result.totalPages,
      currentFilter: typeFilter || null,
    };
  } catch (error) {
    console.error('Failed to load activity', error);

    return {
      listings: [],
      loadError: true as const,
      currentPage: 1,
      totalPages: 1,
      hasMore: false,
      currentFilter: null,
    };
  }
};
