import type { PageLoad } from './$types';
import { redirectToLogin } from '$lib/utils/auth-redirect';
import { pb, currentUser } from '$lib/pocketbase';
import { get } from 'svelte/store';

export const load: PageLoad = async ({ url }) => {
  // Wait for auth to initialize on fresh page loads
  await currentUser.init();

  const user = get(currentUser);

  if (!user) {
    redirectToLogin(url.pathname);
  }

  // Fetch user's listings
  // Note: listings table doesn't have a created field, sorting by id instead (newer ids come later)
  const listings = await pb.collection('listings').getFullList({
    filter: `owner = "${user.id}"`,
    sort: '-id',
  });

  return {
    profile: user,
    listings,
  };
};
