import { PUBLIC_POCKETBASE_URL } from '$env/static/public';
import type { PageLoad } from './$types';
import type {
  ListingFilters,
  ListingPreview,
  ListingRecord,
  ListingType,
} from '$lib/types/listing';
import type { UserRecord } from '$lib/types/pocketbase';

const LISTING_TYPES: ListingType[] = ['trade', 'sell', 'want', 'bundle'];
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

export const prerender = true;

export const load: PageLoad = async ({ fetch, url }) => {
  const pageParam = Number.parseInt(url.searchParams.get('page') ?? '1', 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const rawType = (url.searchParams.get('type') ?? '').toLowerCase();
  const type = LISTING_TYPES.includes(rawType as ListingType) ? (rawType as ListingType) : '';

  const locationParam = url.searchParams.get('location')?.trim() ?? '';
  const location = locationParam.slice(0, 120);

  const filters: string[] = ['status = "active"'];

  if (type) {
    filters.push(`listing_type = "${type}"`);
  }

  if (location) {
    filters.push(`location ~ "${sanitizeForFilter(location)}"`);
  }

  const filtersState: ListingFilters = {
    type,
    location,
  };

  const baseUrl = (PUBLIC_POCKETBASE_URL || FALLBACK_BASE_URL).replace(/\/$/, '');
  const searchParams = new URLSearchParams({
    page: String(page),
    perPage: String(PAGE_LIMIT),
    sort: '-created',
    expand: 'owner',
  });

  if (filters.length > 0) {
    searchParams.set('filter', filters.join(' && '));
  }

  try {
    const response = await fetch(
      `${baseUrl}/api/collections/listings/records?${searchParams.toString()}`,
      {
        headers: {
          accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch listings: ${response.status} ${response.statusText}`);
    }

    const result = (await response.json()) as PocketBaseListResponse<ListingRecord>;

    const listings: ListingPreview[] = result.items.map((item) => {
      const owner = item.expand?.owner as UserRecord | undefined;
      const coverImage =
        Array.isArray(item.photos) && item.photos.length > 0
          ? buildFileUrl(baseUrl, item, item.photos[0], '800x600')
          : null;

      return {
        id: item.id,
        title: item.title,
        listingType: item.listing_type as ListingType,
        summary: item.summary ?? '',
        location: item.location ?? null,
        created: item.created,
        ownerName: owner?.display_name ?? null,
        ownerId: owner?.id ?? null,
        coverImage,
        href: `/listings/${item.id}`,
      };
    });

    return {
      listings,
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
