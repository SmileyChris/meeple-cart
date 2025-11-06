
import type { PageLoad } from './$types';
import { redirectToLogin } from '$lib/utils/auth-redirect';
import type { ItemRecord } from '$lib/types/listing';
import { pb, currentUser } from '$lib/pocketbase';
import { get } from 'svelte/store';

export const load: PageLoad = async ({ url }) => {
  const user = get(currentUser);

  if (!user) {
    redirectToLogin(url.pathname);
  }

  try {
    // Fetch user's active listings
    const listings = await pb.collection('listings').getFullList({
      filter: `owner = "${user.id}" && status = "active"`,
      fields: 'id,title',
    });

    if (listings.length === 0) {
      return { availableGames: [] };
    }

    // Fetch available games from user's listings
    // Games must be available and not already in a cascade
    const listingIds = listings.map((l) => l.id);
    const listingFilter = listingIds.map((id) => `listing = "${id}"`).join(' || ');

    const items = await pb.collection('items').getFullList<ItemRecord>({
      filter: `(${listingFilter}) && status = "available"`,
      expand: 'listing',
      sort: 'title',
    });

    // Filter out games that are already in an active cascade
    const cascades = await pb.collection('cascades').getFullList({
      filter: `current_holder = "${user.id}" && (status = "accepting_entries" || status = "selecting_winner" || status = "in_transit" || status = "awaiting_pass")`,
      fields: 'current_game',
    });

    const cascadeGameIds = new Set(cascades.map((c: any) => c.current_game));

    const availableGames = items
      .filter((item) => !cascadeGameIds.has(item.id))
      .map((item) => ({
        id: item.id,
        title: item.title,
        condition: item.condition,
        listingTitle: item.expand?.listing?.title || 'Unknown Listing',
      }));

    return {
      availableGames,
    };
  } catch (err) {
    console.error('Failed to load available games for cascade', err);
    return {
      availableGames: [],
    };
  }
};
