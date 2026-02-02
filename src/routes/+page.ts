import { PUBLIC_POCKETBASE_URL } from '$env/static/public';
import { browser } from '$app/environment';
import type { PageLoad } from './$types';
import type { OfferPreview, ListingRecord } from '$lib/types/listing';
import type { UserRecord, ItemRecord, OfferTemplateRecord, DiscussionThreadRecord } from '$lib/types/pocketbase';
import type { CascadeRecord } from '$lib/types/cascade';

const ACTIVITY_LIMIT = 40;
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

  // Get guest regions from localStorage if in browser and not logged in
  let guestRegions: string[] = [];
  if (browser && !currentUser) {
    const stored = localStorage.getItem('guestPreferredRegions');
    if (stored) {
      try {
        guestRegions = JSON.parse(stored);
      } catch {
        guestRegions = [];
      }
    }
  }

  // Check if URL has any filter params
  const hasUrlParams =
    url.searchParams.has('canPost') ||
    url.searchParams.has('openToTrades') ||
    url.searchParams.has('region');

  // Get filter states - from URL if present, otherwise from localStorage
  let canPostFilter = url.searchParams.get('canPost') === 'true';
  let openToTradesFilter = url.searchParams.get('openToTrades') === 'true';
  let urlRegions = url.searchParams.getAll('region');
  let myRegionsFilter = urlRegions.length > 0;

  // Apply stored preferences if no URL params
  if (browser && !hasUrlParams) {
    const storedOpenToTrades = localStorage.getItem('preferredOpenToTrades');
    if (storedOpenToTrades === 'true') {
      openToTradesFilter = true;
    }

    const storedRegionFilter = localStorage.getItem('preferredRegionFilter');
    if (storedRegionFilter === 'true') {
      const regionsToUse = currentUser?.preferred_regions ?? guestRegions;
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

  // Build filter for offer_templates
  const filters = ['status = "active"'];

  // Filter by can_post if enabled
  if (canPostFilter) {
    filters.push('can_post = true');
  }

  // Filter by open_to_trade_offers if enabled
  if (openToTradesFilter) {
    filters.push('open_to_trade_offers = true');
  }

  const offersParams = new URLSearchParams({
    page,
    perPage: String(ACTIVITY_LIMIT),
    sort: '-created',
    expand: 'listing,listing.owner,owner,items',
    filter: filters.join(' && '),
  });

  try {
    // Fetch offer_templates (the main activity feed items)
    const offersResponse = await fetch(
      `${baseUrl}/api/collections/offer_templates/records?${offersParams.toString()}`,
      {
        headers: {
          accept: 'application/json',
        },
      }
    );

    if (!offersResponse.ok) {
      throw new Error(`Failed to fetch offers: ${offersResponse.status} ${offersResponse.statusText}`);
    }

    const offersResult = (await offersResponse.json()) as PocketBaseListResponse<OfferTemplateRecord>;

    // Transform offer_templates into OfferPreview format
    let offers: OfferPreview[] = offersResult.items.map((offerTemplate) => {
      const listing = offerTemplate.expand?.listing as ListingRecord | undefined;
      const owner = (offerTemplate.expand?.owner || listing?.expand?.owner) as UserRecord | undefined;
      const items = Array.isArray(offerTemplate.expand?.items)
        ? (offerTemplate.expand?.items as ItemRecord[]).map((itemRecord) => {
            const bggId = typeof itemRecord.bgg_id === 'number' ? itemRecord.bgg_id : null;
            return {
              id: itemRecord.id,
              title: itemRecord.title,
              condition: itemRecord.condition,
              status: itemRecord.status,
              bggId,
              bggUrl: bggId ? `https://boardgamegeek.com/boardgame/${bggId}` : null,
            };
          })
        : [];

      // Get cover image from the listing's photos
      const coverImage =
        listing && Array.isArray(listing.photos) && listing.photos.length > 0
          ? buildFileUrl(baseUrl, listing, listing.photos[0], '800x600')
          : null;

      return {
        id: offerTemplate.id,
        displayName: offerTemplate.display_name || null,
        cashAmount: offerTemplate.cash_amount || null,
        openToLowerOffers: offerTemplate.open_to_lower_offers,
        openToTradeOffers: offerTemplate.open_to_trade_offers,
        willConsiderSplit: offerTemplate.will_consider_split ?? false,
        canPost: offerTemplate.can_post,
        tradeForItems: offerTemplate.trade_for_items || null,
        status: offerTemplate.status,
        created: offerTemplate.created,
        location: listing?.location ?? null,
        regions: listing && Array.isArray(listing.regions) ? listing.regions : null,
        ownerName: owner?.display_name ?? null,
        ownerId: owner?.id ?? null,
        ownerJoinedDate: owner?.created ?? null,
        ownerVouchedTrades: typeof owner?.vouch_count === 'number' ? owner.vouch_count : 0,
        games: items,
        coverImage,
        href: `/listings/${listing?.id || offerTemplate.listing}`,
      };
    });

    // Client-side region filter
    if (myRegionsFilter && urlRegions.length > 0) {
      offers = offers.filter((offer) => {
        // Match if offer is in a selected region OR can post (when canPost filter enabled)
        const inRegion = offer.regions && offer.regions.some((region) => urlRegions.includes(region));
        const canPostToRegion = canPostFilter && offer.canPost;
        return inRegion || canPostToRegion;
      });
    }

    // Fetch discussions - only wanted category discussions
    // Listing-linked discussions live within the listing page
    // General discussions live in the discussions section
    const discussionParams = new URLSearchParams({
      page: '1',
      perPage: String(ACTIVITY_LIMIT),
      sort: '-created',
      expand: 'author,category',
      filter: 'category.slug = "wanted"',
    });

    const discussionsResponse = await fetch(
      `${baseUrl}/api/collections/discussion_threads/records?${discussionParams.toString()}`,
      {
        headers: {
          accept: 'application/json',
        },
      }
    );

    let discussions: DiscussionThreadRecord[] = [];
    if (discussionsResponse.ok) {
      const discussionsResult = (await discussionsResponse.json()) as PocketBaseListResponse<DiscussionThreadRecord>;
      discussions = discussionsResult.items;
    }

    // Fetch active gift cascades
    const cascadeParams = new URLSearchParams({
      page: '1',
      perPage: String(ACTIVITY_LIMIT),
      sort: '-created',
      expand: 'current_game,current_holder',
      filter: 'status = "accepting_entries" || status = "selecting_winner"',
    });

    const cascadesResponse = await fetch(
      `${baseUrl}/api/collections/cascades/records?${cascadeParams.toString()}`,
      {
        headers: {
          accept: 'application/json',
        },
      }
    );

    let cascades: CascadeRecord[] = [];
    if (cascadesResponse.ok) {
      const cascadesResult = (await cascadesResponse.json()) as PocketBaseListResponse<CascadeRecord>;
      cascades = cascadesResult.items;
    }

    // Combine all activity types into a unified array
    type ActivityItem =
      | (OfferPreview & { itemType: 'offer' })
      | (DiscussionThreadRecord & { itemType: 'discussion' })
      | (CascadeRecord & { itemType: 'cascade' });

    const activity: ActivityItem[] = [
      ...offers.map((o) => ({ ...o, itemType: 'offer' as const })),
      ...discussions.map((d) => ({ ...d, itemType: 'discussion' as const })),
      ...cascades.map((c) => ({ ...c, itemType: 'cascade' as const })),
    ];

    // Sort by created date descending
    activity.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

    return {
      activity,
      loadError: false as const,
      currentPage: offersResult.page,
      totalPages: offersResult.totalPages,
      hasMore: offersResult.page < offersResult.totalPages,
      canPostFilter,
      openToTradesFilter,
      myRegionsFilter,
      // For logged-in users, use their preferred regions
      // For guests, use localStorage regions (available when running in browser)
      userPreferredRegions: currentUser?.preferred_regions ?? (guestRegions.length > 0 ? guestRegions : null),
      // Check if user has preferred regions configured (profile or localStorage)
      hasPreferredRegions: Boolean(currentUser?.preferred_regions?.length || guestRegions.length > 0),
    };
  } catch (error) {
    console.error('Failed to load activity', error);

    return {
      activity: [],
      loadError: true as const,
      currentPage: 1,
      totalPages: 1,
      hasMore: false,
      canPostFilter: false,
      openToTradesFilter: false,
      myRegionsFilter: false,
      userPreferredRegions: null,
      hasPreferredRegions: false,
    };
  }
};
