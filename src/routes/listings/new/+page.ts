import type { PageLoad } from './$types';
import { get } from 'svelte/store';
import { currentUser } from '$lib/pocketbase';
import { redirect } from '@sveltejs/kit';

export const load: PageLoad = async () => {
  const user = get(currentUser);

  // Redirect to login if not authenticated
  if (!user) {
    throw redirect(307, '/login');
  }

  return {};
};
