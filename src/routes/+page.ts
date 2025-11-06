import { PUBLIC_POCKETBASE_URL } from '$env/static/public';
import type { PageLoad } from './$types';
import type { GameRecord, ListingPreview, ListingRecord } from '$lib/types/listing';
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

export const load: PageLoad = async ({ fetch, url, parent, depends }) => {
  depends('app:listings');
  const baseUrl = (PUBLIC_POCKETBASE_URL || FALLBACK_BASE_URL).replace(/\/$/, '');

  const page = url.searchParams.get('page') || '1';

  // Get current user from parent layout (need this early)
  const { currentUser } = await parent();

  // Get types filter - check individual params, default to all three
  const allTypes = ['sell', 'trade', 'want'];
  const selectedTypes = allTypes.filter(type => url.searchParams.get(type) !== 'false');

  const canPostFilter = url.searchParams.get('canPost') === 'true';

  // Get regions from URL params
  const urlRegions = url.searchParams.getAll('region');
  const myRegionsFilter = urlRegions.length > 0;

  // Get guest regions from localStorage if not logged in
  let guestRegions: string[] = [];
  if (typeof window !== 'undefined' && !currentUser) {
    const stored = localStorage.getItem('guestPreferredRegions');
    if (stored) {
      try {
        guestRegions = JSON.parse(stored);
      } catch {
        guestRegions = [];
      }
    }
  }

  // Build filter - always include active status
  const filters = ['status = "active"'];

  // Filter by selected listing types
  if (selectedTypes.length > 0 && selectedTypes.length < 3) {
    const typeConditions = selectedTypes
      .filter((t) => ['trade', 'sell', 'want'].includes(t))
      .map((t) => `listing_type = "${t}"`);
    if (typeConditions.length > 0) {
      filters.push(`(${typeConditions.join(' || ')})`);
    }
  }

  // Note: can_post filter requires checking games, which is complex in PocketBase
  // We'll filter on the client side after loading

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

    let listings: ListingPreview[] = result.items.map((item) => {
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
              canPost: game.can_post === true,
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
        regions: Array.isArray(item.regions) ? item.regions : null,
        created: item.created,
        ownerName: owner?.display_name ?? null,
        ownerId: owner?.id ?? null,
        ownerJoinedDate: owner?.created ?? null,
        ownerVouchedTrades: typeof owner?.vouched_trade_count === 'number' ? owner.vouched_trade_count : 0,
        coverImage,
        href: `/listings/${item.id}`,
        games,
      };
    });

    // Client-side filters
    if (myRegionsFilter && urlRegions.length > 0) {
      listings = listings.filter((listing) => {
        // Match if listing is in filtered regions
        const matchesRegion =
          listing.regions && listing.regions.some((region) => urlRegions.includes(region));

        // OR if "can post" is enabled and listing has games that can be posted
        const matchesCanPost = canPostFilter && listing.games.some((game) => game.canPost);

        return matchesRegion || matchesCanPost;
      });
    }

    return {
      listings,
      loadError: false as const,
      currentPage: result.page,
      totalPages: result.totalPages,
      hasMore: result.page < result.totalPages,
      selectedTypes,
      canPostFilter,
      myRegionsFilter,
      userPreferredRegions: currentUser?.preferred_regions || guestRegions.length > 0 ? guestRegions : null,
      hasPreferredRegions: Boolean(currentUser?.preferred_regions?.length || guestRegions.length > 0),
    };
  } catch (error) {
    console.error('Failed to load activity', error);

    return {
      listings: [],
      loadError: true as const,
      currentPage: 1,
      totalPages: 1,
      hasMore: false,
      selectedTypes: ['sell', 'trade', 'want'],
      canPostFilter: false,
      myRegionsFilter: false,
      userPreferredRegions: null,
      hasPreferredRegions: false,
    };
  }
};
