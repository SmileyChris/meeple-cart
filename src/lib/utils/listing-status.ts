/**
 * Listing Status Management Utilities
 *
 * Handles listing status transitions with audit logging.
 */

import { pb } from '$lib/pocketbase';

export interface StatusChange {
  from: string;
  to: string;
  reason: string;
  actor: string;
  timestamp: string;
}

/**
 * Log a listing status change
 *
 * TODO: This currently logs to console. Once we add the status_history JSON field
 * to the listings collection schema, this will persist to the database.
 *
 * @param listingId - The listing ID
 * @param fromStatus - Previous status
 * @param toStatus - New status
 * @param reason - Reason for change
 * @param actorId - User ID who made the change
 */
export async function logStatusChange(
  listingId: string,
  fromStatus: string,
  toStatus: string,
  reason: string,
  actorId: string
): Promise<void> {
  const change: StatusChange = {
    from: fromStatus,
    to: toStatus,
    reason,
    actor: actorId,
    timestamp: new Date().toISOString(),
  };

  // Log to console for now
  console.log(`[Listing ${listingId}] Status change:`, change);

  // TODO: Once status_history field is added to listings schema:
  /*
  try {
    const listing = await pb.collection('listings').getOne(listingId);
    const history = (listing.status_history as StatusChange[]) || [];

    history.push(change);

    await pb.collection('listings').update(listingId, {
      status_history: history
    });
  } catch (err) {
    console.error('Failed to log status change:', err);
  }
  */
}

/**
 * Update listing status with automatic logging
 *
 * @param listingId - The listing ID
 * @param newStatus - New status value
 * @param reason - Reason for change
 * @param actorId - User ID making the change
 */
export async function updateListingStatus(
  listingId: string,
  newStatus: string,
  reason: string,
  actorId: string
): Promise<void> {
  // Get current listing to know the old status
  const listing = await pb.collection('listings').getOne(listingId);
  const oldStatus = listing.status;

  // Update the status
  await pb.collection('listings').update(listingId, {
    status: newStatus,
  });

  // Log the change
  await logStatusChange(listingId, oldStatus, newStatus, reason, actorId);
}

/**
 * Get status change history for a listing
 *
 * @param listingId - The listing ID
 * @returns Array of status changes
 */
export async function getStatusHistory(listingId: string): Promise<StatusChange[]> {
  try {
    const listing = await pb.collection('listings').getOne(listingId);
    return (listing.status_history as StatusChange[]) || [];
  } catch (err) {
    console.error('Failed to get status history:', err);
    return [];
  }
}
