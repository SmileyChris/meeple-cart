import type { RecordModel } from 'pocketbase';
import type { UserRecord } from './pocketbase';

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

export interface GameRecord extends RecordModel {
  listing: string;
  bgg_id?: number;
  title: string;
  year?: number;
  condition: 'mint' | 'excellent' | 'good' | 'fair' | 'poor';
  price?: number;
  trade_value?: number;
  notes?: string;
  status: 'available' | 'pending' | 'sold' | 'bundled';
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
  shipping_available?: boolean;
  prefer_bundle?: boolean;
  bundle_discount?: number;
  views: number;
  bump_date?: string;
  photos?: string[];
  expand?: {
    owner?: UserRecord;
    'games(listing)'?: GameRecord[];
  };
}

export interface ListingGameSummary {
  id: string;
  title: string;
  condition: GameRecord['condition'];
  status: GameRecord['status'];
  bggId: number | null;
  bggUrl: string | null;
  price: number | null;
  tradeValue: number | null;
}

export interface ListingGameDetail extends ListingGameSummary {
  notes: string | null;
  year: number | null;
  previousPrice: number | null;
  previousTradeValue: number | null;
  listingCreated: string;
  priceHistory?: PriceHistoryEntry[];
}

export interface ListingPreview {
  id: string;
  title: string;
  listingType: ListingType;
  summary: string;
  location: string | null;
  created: string;
  ownerName: string | null;
  ownerId: string | null;
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
  location: string;
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
