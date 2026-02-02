import type { PageLoad } from './$types';
import { pb, currentUser } from '$lib/pocketbase';
import type { DiscussionCategoryRecord } from '$lib/types/pocketbase';
import { get } from 'svelte/store';
import { redirect } from '@sveltejs/kit';
import { redirectToLogin } from '$lib/utils/auth-redirect';

export const load: PageLoad = async ({ url }) => {
  const user = get(currentUser);

  if (!user) {
    redirectToLogin(url.pathname + url.search);
  }

  // Check if linking to a listing
  const listingId = url.searchParams.get('listing');

  let listing = null;
  if (listingId) {
    try {
      listing = await pb.collection('listings').getOne(listingId, {
        expand: 'owner',
      });
    } catch (err) {
      console.error('Failed to load listing:', err);
      // Continue without listing - user can still create general discussion
    }
  }

  // Load categories
  const categories = await pb
    .collection('discussion_categories')
    .getFullList<DiscussionCategoryRecord>({
      filter: 'enabled = true',
      sort: 'order',
    });

  return {
    listing,
    categories,
  };
};
