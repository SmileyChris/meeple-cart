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
