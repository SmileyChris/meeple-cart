import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
  toggle: async ({ locals, request }) => {
    if (!locals.user) {
      return fail(401, { error: 'Not authenticated' });
    }

    const formData = await request.formData();
    const listingId = formData.get('listing_id')?.toString();

    if (!listingId) {
      return fail(400, { error: 'Missing listing ID' });
    }

    try {
      // Check if already watching
      const existing = await locals.pb.collection('watchlist').getFullList({
        filter: `user = "${locals.user.id}" && listing = "${listingId}"`,
      });

      if (existing.length > 0) {
        // Remove from watchlist
        await locals.pb.collection('watchlist').delete(existing[0].id);
        return { success: true, watching: false };
      } else {
        // Add to watchlist
        await locals.pb.collection('watchlist').create({
          user: locals.user.id,
          listing: listingId,
        });
        return { success: true, watching: true };
      }
    } catch (error) {
      console.error('Failed to toggle watchlist', error);
      return fail(500, { error: 'Failed to update watchlist' });
    }
  },
};
