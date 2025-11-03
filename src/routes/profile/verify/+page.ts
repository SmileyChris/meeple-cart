import type { PageLoad } from './$types';
import { currentUser } from '$lib/pocketbase';
import { get } from 'svelte/store';
import { redirect } from '@sveltejs/kit';

export const load: PageLoad = async ({ url }) => {
  const user = get(currentUser);

  // Redirect to login if not authenticated
  if (!user) {
    throw redirect(302, `/login?next=${url.pathname}`);
  }

  // Get verification token from URL (if present)
  const token = url.searchParams.get('token');

  return {
    user,
    token,
  };
};
