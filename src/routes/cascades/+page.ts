import { PUBLIC_POCKETBASE_URL } from '$env/static/public';
import type { PageLoad } from './$types';
import type { CascadeRecord, CascadeRegion, CascadeStatus } from '$lib/types/cascade';
import type { UserRecord } from '$lib/types/pocketbase';
import type { GameRecord } from '$lib/types/listing';

const PAGE_LIMIT = 24;
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

const buildGameImageUrl = (
  baseUrl: string,
  listingId: string,
  filename: string,
  thumb?: string
): string => {
  const encodedFilename = encodeURIComponent(filename);
  const fileUrl = `${baseUrl}/api/files/listings/${listingId}/${encodedFilename}`;

  return thumb ? `${fileUrl}?thumb=${encodeURIComponent(thumb)}` : fileUrl;
};

export interface CascadeListItem {
  id: string;
  name?: string;
  status: CascadeStatus;
  generation: number;
  entryCount: number;
  deadline: string;
  region?: CascadeRegion;
  gameTitle: string;
  gameCondition: string;
  gameImage?: string;
  holderName: string;
  holderId: string;
  timeRemaining: string;
}

export interface CascadeFilters {
  status?: CascadeStatus;
  region?: CascadeRegion;
  sort?: string;
}

export const load: PageLoad = async ({ fetch, url }) => {
  const pageParam = Number.parseInt(url.searchParams.get('page') ?? '1', 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const statusParam = url.searchParams.get('status') ?? '';
  const status = ['accepting_entries', 'selecting_winner', 'in_transit', 'awaiting_pass'].includes(
    statusParam
  )
    ? (statusParam as CascadeStatus)
    : undefined;

  const regionParam = url.searchParams.get('region') ?? '';
  const region = ['nz', 'au', 'worldwide', 'north_island', 'south_island'].includes(regionParam)
    ? (regionParam as CascadeRegion)
    : undefined;

  const sortParam = url.searchParams.get('sort') ?? 'deadline';
  const sort =
    sortParam === 'newest'
      ? '-created'
      : sortParam === 'generation'
        ? '-generation'
        : sortParam === 'entries'
          ? '-entry_count'
          : 'entry_deadline'; // Default: ending soonest

  const filters: string[] = [];

  // By default, only show cascades accepting entries
  if (!status) {
    filters.push('status = "accepting_entries"');
  } else {
    filters.push(`status = "${status}"`);
  }

  if (region) {
    filters.push(`region = "${region}"`);
  }

  const filtersState: CascadeFilters = {
    status,
    region,
    sort: sortParam,
  };

  const baseUrl = (PUBLIC_POCKETBASE_URL || FALLBACK_BASE_URL).replace(/\/$/, '');
  const searchParams = new URLSearchParams({
    page: String(page),
    perPage: String(PAGE_LIMIT),
    sort,
    expand: 'current_game,current_game.listing,current_holder',
  });

  if (filters.length > 0) {
    searchParams.set('filter', filters.join(' && '));
  }

  try {
    const response = await fetch(
      `${baseUrl}/api/collections/cascades/records?${searchParams.toString()}`,
      {
        headers: {
          accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch cascades: ${response.status} ${response.statusText}`);
    }

    const result = (await response.json()) as PocketBaseListResponse<CascadeRecord>;

    const cascades: CascadeListItem[] = result.items
      .filter((item) => item.expand?.current_game && item.expand?.current_holder)
      .map((item) => {
        const game = item.expand!.current_game!;
        const holder = item.expand!.current_holder!;
        const listing = game.expand?.listing;

        // Get game image from listing
        const gameImage =
          listing && Array.isArray(listing.photos) && listing.photos.length > 0
            ? buildGameImageUrl(baseUrl, listing.id, listing.photos[0], '400x300')
            : undefined;

        // Calculate time remaining
        const deadline = new Date(item.entry_deadline);
        const now = new Date();
        const diffMs = deadline.getTime() - now.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        let timeRemaining: string;
        if (diffMs < 0) {
          timeRemaining = 'Ended';
        } else if (diffHours < 1) {
          const diffMinutes = Math.floor(diffMs / (1000 * 60));
          timeRemaining = `${diffMinutes}m remaining`;
        } else if (diffHours < 24) {
          timeRemaining = `${diffHours}h remaining`;
        } else if (diffDays === 1) {
          timeRemaining = '1 day remaining';
        } else {
          timeRemaining = `${diffDays} days remaining`;
        }

        return {
          id: item.id,
          name: item.name,
          status: item.status,
          generation: item.generation,
          entryCount: item.entry_count,
          deadline: item.entry_deadline,
          region: item.region,
          gameTitle: game.title,
          gameCondition: game.condition,
          gameImage,
          holderName: holder.display_name,
          holderId: holder.id,
          timeRemaining,
        };
      });

    return {
      cascades,
      filters: filtersState,
      pagination: {
        page: result.page,
        totalPages: result.totalPages,
        totalItems: result.totalItems,
      },
      loadError: false as const,
    };
  } catch (error) {
    console.error('Failed to load cascades', error);

    return {
      cascades: [],
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
