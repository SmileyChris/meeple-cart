import type { RecordModel } from 'pocketbase';
import type { UserRecord } from './pocketbase';
import type { ListingRecord } from './listing';

/**
 * Base message record from PocketBase
 */
export interface MessageRecord extends RecordModel {
  /** ID of the listing this message is about */
  listing: string;
  /** Thread identifier to group related messages */
  thread_id: string;
  /** User who sent the message */
  sender: string;
  /** User who receives the message (null for public comments) */
  recipient?: string;
  /** Message content */
  content: string;
  /** Whether this is a public comment or private message */
  is_public: boolean;
  /** Whether the message has been read by the recipient */
  read: boolean;
}

/**
 * Expanded message with user and listing details
 */
export interface ExpandedMessageRecord extends MessageRecord {
  expand?: {
    sender?: UserRecord;
    recipient?: UserRecord;
    listing?: ListingRecord;
  };
}

/**
 * Message for display in UI
 */
export interface MessageItem {
  id: string;
  content: string;
  senderName: string;
  senderId: string;
  senderAvatar?: string;
  recipientName?: string;
  recipientId?: string;
  timestamp: string;
  isPublic: boolean;
  isRead: boolean;
  isOwnMessage: boolean;
}

/**
 * Message thread summary for inbox/list views
 */
export interface MessageThread {
  threadId: string;
  listingId: string;
  listingTitle: string;
  listingThumbnail?: string;
  otherUser: {
    id: string;
    name: string;
    avatar?: string;
  };
  lastMessage: {
    content: string;
    timestamp: string;
    isRead: boolean;
  };
  unreadCount: number;
  messageCount: number;
}

/**
 * Request to send a new message
 */
export interface SendMessageRequest {
  listingId: string;
  threadId?: string; // Generate if not provided
  content: string;
  recipientId?: string; // Not needed for public comments
  isPublic: boolean;
}

/**
 * Generate a thread ID from two user IDs (for private messages)
 */
export function generateThreadId(userId1: string, userId2: string): string {
  // Sort IDs to ensure consistent thread ID regardless of who initiates
  const sorted = [userId1, userId2].sort();
  return `thread_${sorted[0]}_${sorted[1]}`;
}

/**
 * Generate a public thread ID for a listing
 */
export function generatePublicThreadId(listingId: string): string {
  return `public_${listingId}`;
}
