import type { RecordModel } from 'pocketbase';
import type { UserRecord } from './pocketbase';
import type { PhotoRegion } from './photo-region';

export type ListingType = 'trade' | 'sell' | 'want';

export const LISTING_TYPES: readonly ListingType[] = ['trade', 'sell', 'want'] as const;

export const normalizeListingType = (value: string): ListingType => {
  if (value === 'bundle') {
    return 'sell';
  }

  return LISTING_TYPES.includes(value as ListingType) ? (value as ListingType) : 'sell';
};

export interface PriceHistoryEntry {
  price?: number;
  trade_value?: number;
  timestamp: string;
}

/**
 * ItemRecord represents an item in a listing.
 * Can be a board game (with optional bgg_id) or non-game item
 * (furniture, accessories, boxes, etc.)
 */
export interface ItemRecord extends RecordModel {
  listing: string;
  bgg_id?: number; // Optional: links to BGG metadata for board games
  title: string;
  year?: number;
  condition: 'mint' | 'excellent' | 'good' | 'fair' | 'poor';
  price?: number;
  trade_value?: number;
  notes?: string;
  status: 'available' | 'pending' | 'sold' | 'bundled';
  can_post?: boolean;
  photo_regions?: Record<string, unknown>;
  price_history?: PriceHistoryEntry[];
}

export interface ListingRecord extends RecordModel {
  owner: string;
  title: string;
  listing_type: ListingType;
  status: 'active' | 'pending' | 'completed' | 'cancelled';
  summary?: string;
  location?: string;
  regions?: string[];
  prefer_bundle?: boolean;
  bundle_discount?: number;
  views: number;
  bump_date?: string;
  photos?: string[];
  photo_region_map?: PhotoRegion[];
  // Expiration fields
  last_activity?: string;
  expires_at?: string;
  auto_extend?: boolean;
  // Wanted listing fields
  response_count?: number;
  max_price?: number;
  urgent?: boolean;
  // Browse filtering
  condition?: 'New' | 'Like New' | 'Very Good' | 'Good' | 'Fair';
  price?: number;
  expand?: {
    owner?: UserRecord;
    'items(listing)'?: ItemRecord[];
  };
}

export interface ListingGameSummary {
  id: string;
  title: string;
  condition: ItemRecord['condition'];
  status: ItemRecord['status'];
  bggId: number | null;
  bggUrl: string | null;
  price: number | null;
  tradeValue: number | null;
  canPost: boolean;
}

export interface ListingGameDetail extends ListingGameSummary {
  notes: string | null;
  year: number | null;
  previousPrice: number | null;
  previousTradeValue: number | null;
  listingCreated: string;
  priceHistory?: PriceHistoryEntry[];
  canPost: boolean;
}

export interface ListingPreview {
  id: string;
  title: string;
  listingType: ListingType;
  summary: string;
  location: string | null;
  regions: string[] | null;
  created: string;
  ownerName: string | null;
  ownerId: string | null;
  ownerJoinedDate: string | null;
  ownerVouchedTrades: number;
  coverImage: string | null;
  href: string;
  games: ListingGameSummary[];
}

export interface OwnerListingSummary {
  id: string;
  title: string;
  listingType: ListingType;
  status: 'active' | 'pending' | 'completed' | 'cancelled';
  created: string;
  views: number;
}

export interface ListingFilters {
  regions?: string[];
  type: ListingType | '';
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
