import { error, redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import type { ItemRecord, ListingRecord } from '$lib/types/listing';
import type { TradeRecord, UserRecord } from '$lib/types/pocketbase';
import { pb, currentUser } from '$lib/pocketbase';
import { get } from 'svelte/store';

export const load: PageLoad = async ({ params }) => {
  const { id } = params;
  const user = get(currentUser);

  // Must be authenticated
  if (!user) {
    throw redirect(302, `/login?redirect=/listings/${id}/offers`);
  }

  try {
    // Load the listing
    const listing = await pb.collection('listings').getOne<ListingRecord>(id, {
      expand: 'owner',
    });

    const owner = listing.expand?.owner as UserRecord | undefined;

    // Verify current user is the listing owner
    if (!owner || owner.id !== user.id) {
      throw error(403, 'Only the listing owner can view offers');
    }

    // Load all pending offers for this listing
    const pendingOffers = await pb.collection('trades').getFullList<TradeRecord>({
      filter: `listing = "${id}" && offer_status = "pending"`,
      sort: '-created',
      expand: 'buyer,requested_items',
    });

    // Load all games for this listing (for display)
    const games = await pb.collection('items').getFullList<ItemRecord>({
      filter: `listing = "${id}"`,
      sort: 'created',
    });

    return {
      listing,
      owner,
      pendingOffers,
      games,
    };
  } catch (err) {
    console.error(`Failed to load offers for listing ${id}`, err);
    if (err instanceof Error && 'status' in err) {
      throw err; // Re-throw error/redirect
    }
    throw error(404, 'Listing not found');
  }
};
