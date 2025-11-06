import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import type { ItemRecord, ListingRecord } from '$lib/types/listing';
import type { UserRecord } from '$lib/types/pocketbase';
import type { StatusChange } from '$lib/utils/listing-status';
import { pb, currentUser } from '$lib/pocketbase';
import { get } from 'svelte/store';

const ITEMS_EXPAND_KEY = 'items(listing)';

export const load: PageLoad = async ({ params }) => {
  const { id } = params;
  const user = get(currentUser);

  // Must be authenticated
  if (!user) {
    throw error(401, 'Must be logged in to manage listings');
  }

  try {
    const listing = await pb.collection('listings').getOne<ListingRecord>(id, {
      expand: 'owner,items(listing)',
    });

    // Must be the owner
    if (listing.owner !== user.id) {
      throw error(403, 'You can only manage your own listings');
    }

    const owner = listing.expand?.owner as UserRecord | undefined;
    const games = (listing.expand?.[ITEMS_EXPAND_KEY] as ItemRecord[] | undefined) ?? [];

    // Get status history
    const statusHistory = (listing.status_history as StatusChange[] | undefined) ?? [];

    // Condition options for game forms
    const conditionOptions = ['mint', 'excellent', 'good', 'fair', 'poor'];

    // Game status options
    const gameStatuses = ['available', 'pending', 'sold', 'bundled'];

    return {
      listing,
      owner: owner || null,
      games,
      statusHistory,
      conditionOptions,
      gameStatuses,
    };
  } catch (err) {
    console.error(`Failed to load listing ${id}`, err);
    if ((err as { status?: number }).status === 403) {
      throw error(403, 'You can only manage your own listings');
    }
    throw error(404, 'Listing not found');
  }
};
