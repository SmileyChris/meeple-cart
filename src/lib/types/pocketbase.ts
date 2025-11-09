import type { RecordModel } from 'pocketbase';

// Re-export BGG types
export type { BggInfoRecord } from './bgg';

export interface UserRecord extends RecordModel {
  display_name: string;
  location?: string;
  phone?: string;
  phone_verified?: boolean; // Trust Buddy: Phone verification status
  phone_hash?: string; // Trust Buddy: SHA-256 hash of phone number
  trade_count: number;
  vouch_count: number;
  joined_date: string;
  bio?: string;
  preferred_contact: 'platform' | 'email' | 'phone';
  notification_prefs?: Record<string, unknown>;
  preferred_regions?: string[]; // User's favorite regions for default filtering
  // Cascade stats
  cascades_seeded: number;
  cascades_received: number;
  cascades_passed: number;
  cascades_broken: number;
  cascade_reputation: number;
  cascade_restricted_until?: string;
  can_enter_cascades: boolean;
}

export type AuthenticatedUser = UserRecord | null;

export type OfferStatus = 'pending' | 'accepted' | 'declined' | 'withdrawn';
export type TradeStatus = 'initiated' | 'confirmed' | 'completed' | 'disputed' | 'cancelled';
export type ShippingMethod = 'in_person' | 'shipped' | 'either';

export interface ItemRecord extends RecordModel {
  listing: string;
  bgg_id?: number;
  title: string;
  year?: number;
  condition: 'mint' | 'excellent' | 'good' | 'fair' | 'poor';
  notes?: string;
  status: 'available' | 'pending' | 'sold' | 'bundled';
  photo_regions?: Record<string, unknown>;
  expand?: {
    listing?: RecordModel;
  };
}

export interface OfferTemplateRecord extends RecordModel {
  listing: string;
  owner: string;
  items: string[]; // Item IDs
  template_type: 'cash_only' | 'trade_only' | 'cash_or_trade';
  cash_amount?: number; // NZD cents
  trade_for_items?: Array<{ title: string; bgg_id?: number }>;
  open_to_lower_offers: boolean;
  open_to_shipping_negotiation: boolean;
  open_to_trade_offers: boolean;
  status: 'active' | 'accepted' | 'invalidated' | 'withdrawn';
  display_name?: string;
  notes?: string;
  expand?: {
    listing?: RecordModel;
    owner?: UserRecord;
    items?: ItemRecord[];
  };
}

export interface TradeRecord extends RecordModel {
  listing: string;
  buyer: string;
  seller: string;
  // Offer-related fields
  offer_status: OfferStatus;
  offer_template?: string; // Reference to accepted offer template
  cash_offer_amount?: number; // NZD cents
  requested_items?: string[]; // Item IDs the buyer wants
  shipping_method?: ShippingMethod;
  offer_message?: string; // Buyer's message with their offer
  declined_reason?: string; // Seller's reason for declining
  // Trade status (post-acceptance)
  status: TradeStatus;
  rating?: number;
  review?: string;
  completed_date?: string;
  expand?: {
    listing?: RecordModel;
    buyer?: UserRecord;
    seller?: UserRecord;
    requested_items?: ItemRecord[];
    offer_template?: OfferTemplateRecord;
  };
}

export const REACTION_EMOJIS = ['👀', '❤️', '🔥', '👍', '🎉', '😍'] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

export interface ReactionRecord extends RecordModel {
  user: string;
  listing: string;
  emoji: ReactionEmoji;
  expand?: {
    user?: UserRecord;
  };
}

export interface ReactionCounts {
  '👀': number;
  '❤️': number;
  '🔥': number;
  '👍': number;
  '🎉': number;
  '😍': number;
}

export interface DiscussionCategoryRecord extends RecordModel {
  slug: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  order: number;
  enabled: boolean;
}

export interface DiscussionThreadRecord extends RecordModel {
  title: string;
  content: string;
  author: string;
  category: string; // Relation to discussion_categories
  thread_type: 'discussion' | 'wanted';
  tags?: string[]; // Array of tag strings
  wanted_items?: Array<{ title: string; bgg_id?: number; max_price?: number }>;
  wanted_offer_type?: 'buying' | 'trading' | 'either';
  listing?: string; // Optional - links discussion to a specific listing
  pinned?: boolean;
  locked?: boolean;
  view_count: number;
  reply_count: number;
  last_reply_at?: string;
  expand?: {
    author?: UserRecord;
    category?: DiscussionCategoryRecord;
    listing?: RecordModel;
  };
}

export interface DiscussionReplyRecord extends RecordModel {
  thread: string;
  author: string;
  content: string;
  quoted_reply?: string; // Optional relation to parent reply
  edited?: boolean;
  edited_at?: string;
  expand?: {
    thread?: DiscussionThreadRecord;
    author?: UserRecord;
    quoted_reply?: DiscussionReplyRecord;
  };
}

export const DISCUSSION_REACTION_EMOJIS = ['❤️', '👍', '🔥', '😂', '🤔', '👀'] as const;
export type DiscussionReactionEmoji = (typeof DISCUSSION_REACTION_EMOJIS)[number];

export interface DiscussionReactionRecord extends RecordModel {
  thread?: string; // Relation to discussion_threads (if reacting to OP)
  reply?: string; // Relation to discussion_replies (if reacting to reply)
  user: string; // Relation to users
  emoji: DiscussionReactionEmoji;
  expand?: {
    thread?: DiscussionThreadRecord;
    reply?: DiscussionReplyRecord;
    user?: UserRecord;
  };
}

export interface DiscussionReactionCounts {
  '❤️': number;
  '👍': number;
  '🔥': number;
  '😂': number;
  '🤔': number;
  '👀': number;
}

export interface DiscussionSubscriptionRecord extends RecordModel {
  user: string;
  thread: string;
  expand?: {
    user?: UserRecord;
    thread?: DiscussionThreadRecord;
  };
}

// ============================================
// TRUST BUDDY VERIFICATION SYSTEM
// ============================================

export type VerificationRequestStatus =
  | 'pending'
  | 'assigned'
  | 'sent'
  | 'completed'
  | 'expired'
  | 'cancelled';

export interface VerificationRequestRecord extends RecordModel {
  user: string; // User requesting verification
  phone_hash: string; // SHA-256 hash of phone number
  phone_last_four?: string; // Last 4 digits for display
  status: VerificationRequestStatus;
  queue_position?: number;
  assigned_at?: string;
  completed_at?: string;
  expires_at?: string;
  expand?: {
    user?: UserRecord;
  };
}

export interface VerificationLinkRecord extends RecordModel {
  code: string; // 8-character alphanumeric code
  request: string; // Relation to verification_requests
  verifier: string; // User who is verifying
  target_phone_hash: string; // SHA-256 hash of target phone
  attempt_count: number;
  used: boolean;
  expires_at: string;
  used_at?: string;
  expand?: {
    request?: VerificationRequestRecord;
    verifier?: UserRecord;
  };
}

export interface VerifierSettingsRecord extends RecordModel {
  user: string; // User ID (unique)
  is_active: boolean;
  weekly_limit: number;
  total_verifications: number;
  success_count: number;
  last_verification?: string;
  karma_earned: number;
  expand?: {
    user?: UserRecord;
  };
}

export interface VerificationPairRecord extends RecordModel {
  verifier: string; // User who verified
  verified: string; // User who was verified
  verified_at: string;
  expand?: {
    verifier?: UserRecord;
    verified?: UserRecord;
  };
}
