import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { pb, currentUser } from '$lib/pocketbase';
import { get } from 'svelte/store';

export const load: PageLoad = async () => {
  const user = get(currentUser);

  if (!user) {
    throw redirect(302, '/login');
  }

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
