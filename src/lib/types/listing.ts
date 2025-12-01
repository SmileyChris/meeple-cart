import type { RecordModel } from 'pocketbase';
import type { UserRecord, ItemRecord, OfferTemplateRecord } from './pocketbase';
import type { PhotoRegion } from './photo-region';

// Re-export ItemRecord for backwards compatibility
export type { ItemRecord } from './pocketbase';

/**
 * ListingRecord - Container/grouping owned by user
 *
 * A listing groups games and offers together. The actual "for sale/trade" units
 * are offer_templates which reference one or more games.
 */
export interface ListingRecord extends RecordModel {
  owner: string;
  title: string;
  status: 'active' | 'pending' | 'completed' | 'cancelled';
  summary?: string;
  location?: string;
  regions?: string[]; // Which regions the user serves
  views: number;
  bump_date?: string;
  photos?: string[];
  photo_region_map?: PhotoRegion[];
  status_history?: Array<{ status: string; date: string }>;
  // Expiration fields
  last_activity?: string;
  expires_at?: string;
  auto_extend?: boolean;
  expand?: {
    owner?: UserRecord;
    items_via_listing?: ItemRecord[];
    offer_templates_via_listing?: OfferTemplateRecord[];
  };
}

export interface ListingGameSummary {
  id: string;
  title: string;
  condition: ItemRecord['condition'];
  status: ItemRecord['status'];
  bggId: number | null;
  bggUrl: string | null;
}

export interface ListingGameDetail extends ListingGameSummary {
  notes: string | null;
  year: number | null;
  listingCreated: string;
}

/**
 * OfferPreview - What appears in the activity feed
 *
 * An offer is the "for sale/trade" unit that users browse.
 * It contains one or more games with associated terms.
 */
export interface OfferPreview {
  id: string;
  displayName: string | null;
  cashAmount: number | null; // NZD cents
  openToLowerOffers: boolean;
  openToTradeOffers: boolean;
  willConsiderSplit: boolean; // Will consider selling individual items from bundle
  canPost: boolean;
  tradeForItems: Array<{ title: string; bgg_id?: number }> | null;
  status: 'active' | 'accepted' | 'invalidated' | 'withdrawn';
  created: string;
  // From listing
  location: string | null;
  regions: string[] | null;
  // From owner
  ownerName: string | null;
  ownerId: string | null;
  ownerJoinedDate: string | null;
  ownerVouchedTrades: number;
  // Games in this offer
  games: ListingGameSummary[];
  coverImage: string | null;
  href: string;
}

export interface OwnerListingSummary {
  id: string;
  title: string;
  status: 'active' | 'pending' | 'completed' | 'cancelled';
  created: string;
  views: number;
  offerCount: number;
}

/**
 * OfferFilters - Filters for the activity feed
 *
 * Filters apply to offer_templates, not listings.
 */
export interface OfferFilters {
  regions?: string[];
  canPost?: boolean;
  openToTrades?: boolean;
  search?: string;
  condition?: string;
  minPrice?: string;
  maxPrice?: string;
}

export interface ListingPagination {
  page: number;
  totalPages: number;
  totalItems: number;
}
