import { redirect } from '@sveltejs/kit';
import { pb } from '$lib/pocketbase';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
  // Redirect to profile if already authenticated
  if (pb.authStore.isValid && pb.authStore.model) {
    throw redirect(302, '/profile');
  }

  return {};
};
