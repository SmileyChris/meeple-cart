import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { pb, currentUser } from '$lib/pocketbase';
import { get } from 'svelte/store';

export const load: PageLoad = async () => {
  // Check auth directly from PocketBase authStore (more reliable than store)
  if (!pb.authStore.isValid || !pb.authStore.model) {
    throw redirect(302, '/login');
  }

  const user = pb.authStore.model;

  // Fetch user's listings
  const listings = await pb.collection('listings').getFullList({
    filter: `owner = "${user.id}"`,
    sort: '-created',
  });

  return {
    profile: user,
    listings,
  };
};
