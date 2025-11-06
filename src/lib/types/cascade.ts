import type { RecordModel } from 'pocketbase';
import type { CascadeRegionValue } from '$lib/constants/regions';
import type { UserRecord } from './pocketbase';
import type { ItemRecord } from './listing';

export type CascadeStatus =
  | 'accepting_entries'
  | 'selecting_winner'
  | 'in_transit'
  | 'awaiting_pass'
  | 'completed'
  | 'broken';

export type CascadeRegion = Exclude<CascadeRegionValue, ''>;

export type ShippingRequirement = 'pickup_only' | 'shipping_available' | 'shipping_only';

export type ReceivedConfirmedBy = 'sender' | 'receiver' | 'auto';

export type CascadeEventType =
  | 'seeded'
  | 'winner_selected'
  | 'shipped'
  | 'received'
  | 'passed_on'
  | 'deadline_missed'
  | 'broken';

export interface CascadeRecord extends RecordModel {
  name?: string;
  description?: string;
  status: CascadeStatus;
  current_game: string; // Game ID
  current_holder: string; // User ID
  entry_deadline: string;
  region?: CascadeRegion;
  shipping_requirement: ShippingRequirement;
  special_rules?: string;
  winner?: string; // User ID
  shipped_at?: string;
  shipping_tracking?: string;
  received_at?: string;
  received_confirmed_by?: ReceivedConfirmedBy;
  pass_deadline?: string;
  generation: number;
  origin_cascade?: string; // Cascade ID
  previous_cascade?: string; // Cascade ID
  entry_count: number;
  view_count: number;
  // Expanded relations (added by PocketBase when using expand)
  expand?: {
    current_game?: ItemRecord;
    current_holder?: UserRecord;
    winner?: UserRecord;
    origin_cascade?: CascadeRecord;
    previous_cascade?: CascadeRecord;
    'cascade_entries(cascade)'?: CascadeEntryRecord[];
  };
}

export interface CascadeEntryRecord extends RecordModel {
  cascade: string; // Cascade ID
  user: string; // User ID
  message?: string;
  withdrew: boolean;
  // Expanded relations
  expand?: {
    cascade?: CascadeRecord;
    user?: UserRecord;
  };
}

export interface CascadeHistoryRecord extends RecordModel {
  cascade: string; // Cascade ID
  generation: number;
  event_type: CascadeEventType;
  event_date: string;
  actor: string; // User ID
  related_user?: string; // User ID
  game?: string; // Game ID
  notes?: string;
  shipped_to_location?: string;
  shipping_days?: number;
  // Expanded relations
  expand?: {
    cascade?: CascadeRecord;
    actor?: UserRecord;
    related_user?: UserRecord;
    game?: ItemRecord;
  };
}

// Badge types for the cascade system
export type CascadeBadgeType =
  | 'seed_starter'
  | 'cascade_keeper'
  | 'cascade_champion'
  | 'cascade_legend'
  | 'ancient_lineage'
  | 'regional_hero';

export interface CascadeBadge {
  type: CascadeBadgeType;
  name: string;
  description: string;
  icon: string;
  color: string;
  earned: boolean;
}

// Helper type for cascade lineage visualization
export interface CascadeLineageNode {
  cascade: CascadeRecord;
  generation: number;
  holder: UserRecord;
  game: ItemRecord;
  children: CascadeLineageNode[];
}

// Notification types for cascades
export type CascadeNotificationType =
  | 'cascade_won'
  | 'cascade_shipped'
  | 'cascade_received'
  | 'cascade_reminder'
  | 'cascade_deadline'
  | 'cascade_broken';
