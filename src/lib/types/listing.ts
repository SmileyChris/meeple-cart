import type { RecordModel } from 'pocketbase';
import type { UserRecord } from './pocketbase';

export type ListingType = 'trade' | 'sell' | 'want' | 'bundle';

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
}

export interface ListingPagination {
  page: number;
  totalPages: number;
  totalItems: number;
}
