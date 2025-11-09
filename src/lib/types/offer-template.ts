import type { RecordModel } from 'pocketbase';
import type { ItemRecord } from './listing';
import type { UserRecord, TradeRecord } from './pocketbase';

// ============================================
// Offer Template Types
// ============================================

export type TemplateType = 'cash_only' | 'trade_only' | 'cash_or_trade';
export type TemplateStatus = 'active' | 'accepted' | 'invalidated' | 'withdrawn';

export interface TradeForItem {
  title: string;
  bgg_id?: number;
}

export interface OfferTemplateRecord extends RecordModel {
  listing: string;
  owner: string;
  items: string[]; // Item IDs
  template_type: TemplateType;
  cash_amount?: number; // NZD cents
  trade_for_items?: TradeForItem[]; // Games seller wants in trade
  open_to_lower_offers: boolean; // "Or Nearest Offer"
  open_to_shipping_negotiation: boolean;
  open_to_trade_offers: boolean;
  status: TemplateStatus;
  accepted_by_trade?: string; // Trade ID
  display_name?: string; // e.g., "Wingspan Bundle"
  notes?: string;
  expand?: {
    listing?: RecordModel;
    owner?: UserRecord;
    items?: ItemRecord[];
    accepted_by_trade?: TradeRecord;
  };
}

// Helper type for creating templates
export interface CreateOfferTemplate {
  listing: string;
  owner: string;
  items: string[];
  template_type: TemplateType;
  cash_amount?: number;
  trade_for_items?: TradeForItem[];
  open_to_lower_offers: boolean;
  open_to_shipping_negotiation: boolean;
  open_to_trade_offers: boolean;
  display_name?: string;
  notes?: string;
}

// UI-friendly template with expanded data
export interface OfferTemplateDetail extends OfferTemplateRecord {
  expandedItems: ItemRecord[];
  expandedOwner: UserRecord;
}

// ============================================
// Wanted Post Types (Discussion Threads)
// ============================================

export type ThreadType = 'discussion' | 'wanted';
export type WantedOfferType = 'buying' | 'trading' | 'either';

export interface WantedItem {
  title: string;
  bgg_id?: number;
  max_price?: number; // NZD cents
}

export interface DiscussionThreadWithWanted extends RecordModel {
  title: string;
  content: string;
  author: string;
  listing?: string;
  thread_type: ThreadType;
  wanted_items?: WantedItem[];
  wanted_offer_type?: WantedOfferType;
  pinned?: boolean;
  locked?: boolean;
  view_count: number;
  reply_count: number;
  last_reply_at?: string;
  expand?: {
    author?: UserRecord;
    listing?: RecordModel;
  };
}
