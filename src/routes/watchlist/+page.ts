import type { PageLoad } from './$types';
import { pb } from '$lib/pocketbase';
import { get } from 'svelte/store';
import { currentUser } from '$lib/pocketbase';

export const load: PageLoad = async () => {
  const user = get(currentUser);

  if (!user) {
    return {
      watchedListings: [],
    };
  }

  try {
    // Fetch watchlist items for the current user
    const watchlist = await pb.collection('watchlist').getList(1, 50, {
      filter: `user = "${user.id}"`,
      expand: 'listing,listing.owner',
      sort: '-created',
    });

    return {
      watchedListings: watchlist.items,
    };
  } catch (error) {
    console.error('Failed to load watchlist:', error);
    return {
      watchedListings: [],
    };
  }
};
