import type { LayoutServerLoad } from './$types';
import { serializeNonPOJOs } from '$lib/utils/object';

export const load: LayoutServerLoad = async ({ locals }) => {
  let unreadNotifications = 0;

  if (locals.user) {
    try {
      const result = await locals.pb.collection('notifications').getList(1, 1, {
        filter: `user = "${locals.user.id}" && read = false`,
      });
      unreadNotifications = result.totalItems;
    } catch (error) {
      console.error('Failed to fetch unread notifications count', error);
    }
  }

  return {
    user: locals.user ? serializeNonPOJOs(locals.user) : null,
    unreadNotifications,
  };
};
