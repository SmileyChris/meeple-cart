import type { RecordModel } from 'pocketbase';
import type { ListingRecord } from './listing';
import type { UserRecord } from './pocketbase';

/**
 * Notification types
 */
export type NotificationType =
  | 'new_listing'
  | 'new_message'
  | 'price_drop'
  | 'listing_update'
  | 'discussion_reply'
  | 'discussion_mention';

/**
 * Base notification record from PocketBase
 */
export interface NotificationRecord extends RecordModel {
  /** User who receives this notification */
  user: string;
  /** Type of notification */
  type: NotificationType;
  /** Notification title */
  title: string;
  /** Optional longer message */
  message?: string;
  /** Link to relevant page */
  link?: string;
  /** Related listing (if applicable) */
  listing?: string;
  /** Whether the notification has been read */
  read: boolean;
}

/**
 * Expanded notification with related data
 */
export interface ExpandedNotificationRecord extends NotificationRecord {
  expand?: {
    user?: UserRecord;
    listing?: ListingRecord;
  };
}

/**
 * Notification for display in UI
 */
export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  link?: string;
  timestamp: string;
  read: boolean;
  listingTitle?: string;
  listingThumbnail?: string;
}

/**
 * User notification preferences
 */
export type DigestFrequency = 'instant' | 'daily' | 'weekly' | 'never';

export interface NotificationPreferences {
  /** Regions to watch for new listings */
  watched_regions?: string[];
  /** Maximum distance in km for location-based alerts */
  max_distance_km?: number;
  /** Email notification frequency */
  email_frequency?: DigestFrequency;
  /** In-app notification digest frequency */
  in_app_digest?: DigestFrequency;
  /** Enable notifications for new listings in watched regions */
  notify_new_listings?: boolean;
  /** Enable notifications for price drops on watched items */
  notify_price_drops?: boolean;
  /** Enable notifications for new messages */
  notify_new_messages?: boolean;
}

/**
 * Default notification preferences
 */
export const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  watched_regions: [],
  max_distance_km: undefined,
  email_frequency: 'daily',
  in_app_digest: 'instant',
  notify_new_listings: true,
  notify_price_drops: false,
  notify_new_messages: true,
};

/**
 * Notification type icons
 */
export const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  new_listing: '🎲',
  new_message: '💬',
  price_drop: '📉',
  listing_update: '🔔',
  discussion_reply: '💭',
  discussion_mention: '📢',
};

/**
 * Notification type colors (Tailwind classes)
 */
export const NOTIFICATION_COLORS: Record<
  NotificationType,
  { bg: string; border: string; text: string }
> = {
  new_listing: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-600',
    text: 'text-emerald-200',
  },
  new_message: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-600',
    text: 'text-blue-200',
  },
  price_drop: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-600',
    text: 'text-purple-200',
  },
  listing_update: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-600',
    text: 'text-amber-200',
  },
  discussion_reply: {
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-600',
    text: 'text-cyan-200',
  },
  discussion_mention: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-600',
    text: 'text-rose-200',
  },
};
