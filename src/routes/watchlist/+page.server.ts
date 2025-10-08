import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { WatchlistRecord } from '$lib/types/watchlist';
import type { ListingRecord, GameRecord } from '$lib/types/listing';
import type { UserRecord } from '$lib/types/pocketbase';
import { serializeNonPOJOs } from '$lib/utils/object';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(303, '/login');
  }

  try {
    // Get all watchlist items for this user
    const watchlistItems = await locals.pb.collection('watchlist').getFullList<WatchlistRecord>({
      filter: `user = "${locals.user.id}" && listing != null`,
      expand: 'listing,listing.owner,listing.games(listing)',
      sort: '-created',
    });

    const watchedListings = watchlistItems
      .map((item) => {
        const listing = item.expand?.listing as ListingRecord | undefined;
        if (!listing) return null;

        const owner = listing.expand?.owner as UserRecord | undefined;
        const games = (listing.expand?.['games(listing)'] as GameRecord[] | undefined) ?? [];

        // Get cover image
        let coverImage: string | null = null;
        if (listing.photos && listing.photos.length > 0) {
          coverImage = locals.pb.files.getUrl(listing, listing.photos[0], {
            thumb: '400x300',
          });
        }

        return {
          watchlistId: item.id,
          listingId: listing.id,
          title: listing.title,
          listingType: listing.listing_type,
          status: listing.status,
          location: listing.location ?? null,
          created: listing.created,
          ownerName: owner?.display_name ?? null,
          coverImage,
          gameCount: games.length,
          watchedAt: item.created,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return {
      watchedListings: serializeNonPOJOs(watchedListings),
    };
  } catch (err) {
    console.error('Failed to load watchlist', err);
    return {
      watchedListings: [],
    };
  }
};

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

  remove: async ({ locals, request }) => {
    if (!locals.user) {
      return fail(401, { error: 'Not authenticated' });
    }

    const formData = await request.formData();
    const watchlistId = formData.get('watchlist_id')?.toString();

    if (!watchlistId) {
      return fail(400, { error: 'Missing watchlist ID' });
    }

    try {
      // Verify ownership before deleting
      const item = await locals.pb.collection('watchlist').getOne(watchlistId);
      if (item.user !== locals.user.id) {
        return fail(403, { error: 'Unauthorized' });
      }

      await locals.pb.collection('watchlist').delete(watchlistId);
      return { success: true, removed: true };
    } catch (error) {
      console.error('Failed to remove from watchlist', error);
      return fail(500, { error: 'Failed to remove from watchlist' });
    }
  },
};
