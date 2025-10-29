import { redirect } from '@sveltejs/kit';
import { currentUser } from '$lib/pocketbase';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
  // Logout and redirect to home
  currentUser.logout();
  throw redirect(302, '/');
};
