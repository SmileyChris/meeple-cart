
import type { PageLoad } from './$types';
import { redirectToLogin } from '$lib/utils/auth-redirect';
import { pb, currentUser } from '$lib/pocketbase';
import { get } from 'svelte/store';

export const load: PageLoad = async ({ url }) => {
  const user = get(currentUser);

  if (!user) {
    redirectToLogin(url.pathname);
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
