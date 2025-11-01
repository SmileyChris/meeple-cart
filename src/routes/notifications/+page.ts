import type { PageLoad } from './$types';
import { pb, currentUser } from '$lib/pocketbase';
import { redirectToLogin } from '$lib/utils/auth-redirect';
import { get } from 'svelte/store';

export const load: PageLoad = async ({ url }) => {
  const user = get(currentUser);

  if (!user) {
    redirectToLogin(url.pathname);
  }

  try {
    // Fetch user's notifications
    const notificationsResult = await pb.collection('notifications').getList(1, 50, {
      filter: `user = "${user.id}"`,
      sort: '-created',
    });

    const notifications = notificationsResult.items.map((notification) => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      link: notification.link,
      read: notification.read,
      created: notification.created,
    }));

    const unreadCount = notifications.filter((n) => !n.read).length;

    return {
      notifications,
      unreadCount,
    };
  } catch (err) {
    console.error('Failed to load notifications', err);
    return {
      notifications: [],
      unreadCount: 0,
    };
  }
};
