import type { RecordModel } from 'pocketbase';

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

export interface TradeRecord extends RecordModel {
  listing: string;
  buyer: string;
  seller: string;
  games?: string[]; // Selected game IDs for this trade
  shipping_method?: 'in_person' | 'shipped';
  status: 'initiated' | 'confirmed' | 'completed' | 'disputed' | 'cancelled';
  rating?: number;
  review?: string;
  completed_date?: string;
  expand?: {
    listing?: RecordModel;
    buyer?: UserRecord;
    seller?: UserRecord;
    games?: RecordModel[];
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

export interface DiscussionThreadRecord extends RecordModel {
  title: string;
  content: string;
  author: string;
  listing?: string; // Optional - links discussion to a specific listing
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

export interface DiscussionReplyRecord extends RecordModel {
  thread: string;
  content: string;
  author: string;
  expand?: {
    thread?: DiscussionThreadRecord;
    author?: UserRecord;
  };
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
