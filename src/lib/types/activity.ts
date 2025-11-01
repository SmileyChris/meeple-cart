import type { ListingType } from './listing';

/**
 * Represents a listing activity item
 */
export interface ListingActivity {
  /** Unique identifier (game ID) */
  id: string;
  /** Type of activity */
  activityType: 'listing';
  /** Type of listing activity (trade, sell, want) */
  type: ListingType;
  /** Game title */
  gameTitle: string;
  /** Optional listing title (for context when showing games) */
  listingTitle?: string;
  /** Optional BoardGameGeek ID */
  bggId: number | null;
  /** Game condition */
  condition: 'mint' | 'excellent' | 'good' | 'fair' | 'poor';
  /** Price (for sell listings) */
  price: number | null;
  /** Trade value (for trade listings) */
  tradeValue: number | null;
  /** When this game was created/listed */
  timestamp: string;
  /** User who created the listing */
  userName: string | null;
  /** User's location */
  userLocation: string | null;
  /** Link to the parent listing */
  listingHref: string;
  /** Optional thumbnail image */
  thumbnail: string | null;
}

/**
 * Represents a grouped signup activity (new members from a time period)
 */
export interface SignupActivity {
  /** Unique identifier */
  id: string;
  /** Type of activity */
  activityType: 'signup';
  /** Number of users who signed up */
  count: number;
  /** List of user display names */
  userNames: string[];
  /** When these signups occurred */
  timestamp: string;
  /** Time period label (e.g., "today", "yesterday") */
  timePeriod: 'today' | 'yesterday';
}

/**
 * Union type for all activity items
 */
export type ActivityItem = ListingActivity | SignupActivity;
