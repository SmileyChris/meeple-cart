import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import type { ItemRecord, ListingRecord } from '$lib/types/listing';
import { pb, currentUser } from '$lib/pocketbase';
import { get } from 'svelte/store';

const ITEMS_EXPAND_KEY = 'items_via_listing';

export const load: PageLoad = async ({ params }) => {
  const { id } = params;
  const user = get(currentUser);

  // Must be authenticated
  if (!user) {
    throw error(401, 'Must be logged in to create offer templates');
  }

  try {
    const listing = await pb.collection('listings').getOne<ListingRecord>(id, {
      expand: 'items_via_listing',
    });

    // Must be the owner
    if (listing.owner !== user.id) {
      throw error(403, 'You can only create templates for your own listings');
    }

    const items = (listing.expand?.[ITEMS_EXPAND_KEY] as ItemRecord[] | undefined) ?? [];

    // Only show available items
    const availableItems = items.filter(item => item.status === 'available');

    if (availableItems.length === 0) {
      throw error(400, 'No available items to create a template for');
    }

    return {
      listing,
      items: availableItems,
    };
  } catch (err) {
    console.error(`Failed to load listing ${id} for template creation`, err);
    if ((err as { status?: number }).status === 403) {
      throw error(403, 'You can only create templates for your own listings');
    }
    if ((err as { status?: number }).status === 400) {
      throw err;
    }
    throw error(404, 'Listing not found');
  }
};
