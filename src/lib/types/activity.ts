import type { ListingType } from './listing';

/**
 * Represents a single activity item in the timeline
 */
export interface ActivityItem {
  /** Unique identifier (game ID) */
  id: string;
  /** Type of listing activity (trade, sell, want) */
  type: ListingType;
  /** Game title */
  gameTitle: string;
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
