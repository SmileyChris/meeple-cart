import type { RecordModel } from 'pocketbase';

export interface UserRecord extends RecordModel {
  display_name: string;
  location?: string;
  phone?: string;
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
