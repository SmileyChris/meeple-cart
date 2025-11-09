import type { RecordModel } from 'pocketbase';
import type { UserRecord, ItemRecord } from './pocketbase';
import type { PhotoRegion } from './photo-region';

// Re-export ItemRecord for backwards compatibility
export type { ItemRecord } from './pocketbase';

// ListingType kept for UI/domain logic even though not in DB schema
// UI may infer type from offer templates or other fields
export type ListingType = 'trade' | 'sell' | 'want';

export const LISTING_TYPES: readonly ListingType[] = ['trade', 'sell', 'want'] as const;

export interface ListingRecord extends RecordModel {
  owner: string;
  title: string;
  status: 'active' | 'pending' | 'completed' | 'cancelled';
  summary?: string;
  location?: string;
  regions?: string[];
  shipping_available?: boolean;
  views: number;
  bump_date?: string;
  photos?: string[];
  photo_region_map?: PhotoRegion[];
  // Expiration fields
  last_activity?: string;
  expires_at?: string;
  auto_extend?: boolean;
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
  canPost: boolean;
}

export interface ListingGameDetail extends ListingGameSummary {
  notes: string | null;
  year: number | null;
  listingCreated: string;
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
