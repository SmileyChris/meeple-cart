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
}

export type AuthenticatedUser = UserRecord | null;
