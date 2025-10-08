import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type {
  ExpandedNotificationRecord,
  NotificationItem,
  NotificationPreferences,
} from '$lib/types/notification';
import { DEFAULT_NOTIFICATION_PREFS } from '$lib/types/notification';
import type { ListingRecord } from '$lib/types/listing';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(303, '/login');
  }

  try {
    // Fetch notifications for the user
    const notifications = await locals.pb
      .collection('notifications')
      .getFullList<ExpandedNotificationRecord>({
        filter: `user = "${locals.user.id}"`,
        sort: '-created',
        expand: 'listing',
        limit: 50,
      });

    // Transform to NotificationItem
    const notificationItems: NotificationItem[] = notifications.map((notif) => {
      const listing = notif.expand?.listing as ListingRecord | undefined;

      const thumbnail =
        listing && Array.isArray(listing.photos) && listing.photos.length > 0
          ? locals.pb.files.getUrl(listing, listing.photos[0], { thumb: '100x100' })
          : undefined;

      return {
        id: notif.id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        link: notif.link,
        timestamp: notif.created,
        read: notif.read,
        listingTitle: listing?.title,
        listingThumbnail: thumbnail,
      };
    });

    const unreadCount = notificationItems.filter((n) => !n.read).length;

    // Get user preferences
    const prefs =
      (locals.user.notification_prefs as NotificationPreferences) || DEFAULT_NOTIFICATION_PREFS;

    return {
      notifications: notificationItems,
      unreadCount,
      preferences: prefs,
    };
  } catch (error) {
    console.error('Failed to load notifications', error);
    return {
      notifications: [],
      unreadCount: 0,
      preferences: DEFAULT_NOTIFICATION_PREFS,
    };
  }
};

export const actions: Actions = {
  mark_read: async ({ locals, request }) => {
    if (!locals.user) {
      return fail(401, { error: 'Not authenticated' });
    }

    const formData = await request.formData();
    const notificationId = formData.get('id')?.toString();

    if (!notificationId) {
      return fail(400, { error: 'Notification ID required' });
    }

    try {
      await locals.pb.collection('notifications').update(notificationId, {
        read: true,
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to mark notification as read', error);
      return fail(500, { error: 'Failed to update notification' });
    }
  },

  mark_all_read: async ({ locals }) => {
    if (!locals.user) {
      return fail(401, { error: 'Not authenticated' });
    }

    try {
      // Get all unread notifications
      const unread = await locals.pb.collection('notifications').getFullList({
        filter: `user = "${locals.user.id}" && read = false`,
      });

      // Mark each as read
      for (const notif of unread) {
        await locals.pb.collection('notifications').update(notif.id, {
          read: true,
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to mark all notifications as read', error);
      return fail(500, { error: 'Failed to update notifications' });
    }
  },

  delete: async ({ locals, request }) => {
    if (!locals.user) {
      return fail(401, { error: 'Not authenticated' });
    }

    const formData = await request.formData();
    const notificationId = formData.get('id')?.toString();

    if (!notificationId) {
      return fail(400, { error: 'Notification ID required' });
    }

    try {
      await locals.pb.collection('notifications').delete(notificationId);
      return { success: true };
    } catch (error) {
      console.error('Failed to delete notification', error);
      return fail(500, { error: 'Failed to delete notification' });
    }
  },
};
