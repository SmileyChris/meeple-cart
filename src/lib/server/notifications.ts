import type PocketBase from 'pocketbase';
import type { NotificationPreferences, NotificationType } from '$lib/types/notification';
import type { ListingRecord } from '$lib/types/listing';

/**
 * Create a notification for a user
 */
export async function createNotification(
  pb: PocketBase,
  userId: string,
  type: NotificationType,
  title: string,
  options: {
    message?: string;
    link?: string;
    listingId?: string;
  } = {}
) {
  try {
    await pb.collection('notifications').create({
      user: userId,
      type,
      title,
      message: options.message,
      link: options.link,
      listing: options.listingId,
      read: false,
    });
  } catch (error) {
    console.error('Failed to create notification', error);
  }
}

/**
 * Check if a listing matches a user's notification preferences
 */
function matchesPreferences(listing: ListingRecord, prefs: NotificationPreferences): boolean {
  // Check if user is watching new listings
  if (!prefs.notify_new_listings) {
    return false;
  }

  // Check if location matches watched regions
  if (prefs.watched_regions && prefs.watched_regions.length > 0) {
    if (!listing.location) {
      return false;
    }

    // Check if listing location includes any watched region
    const matchesRegion = prefs.watched_regions.some((region) =>
      listing.location?.toLowerCase().includes(region.toLowerCase())
    );

    if (!matchesRegion) {
      return false;
    }
  }

  // TODO: Implement distance filtering when we have geocoding
  // if (prefs.max_distance_km) {
  //   // Check distance
  // }

  return true;
}

/**
 * Notify users about a new listing based on their preferences
 */
export async function notifyNewListing(pb: PocketBase, listing: ListingRecord, ownerName: string) {
  try {
    // Get all users with notification preferences
    const users = await pb.collection('users').getFullList({
      filter: 'notification_prefs != null',
    });

    for (const user of users) {
      // Skip the listing owner
      if (user.id === listing.owner) {
        continue;
      }

      const prefs = user.notification_prefs as NotificationPreferences;

      if (!prefs || !matchesPreferences(listing, prefs)) {
        continue;
      }

      // Create notification
      await createNotification(pb, user.id, 'new_listing', `New listing in ${listing.location}`, {
        message: `${ownerName} listed "${listing.title}"`,
        link: `/listings/${listing.id}`,
        listingId: listing.id,
      });
    }
  } catch (error) {
    console.error('Failed to notify users about new listing', error);
  }
}
