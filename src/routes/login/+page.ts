import { redirect } from '@sveltejs/kit';
import { pb } from '$lib/pocketbase';
import { browser } from '$app/environment';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
  // In browser, check if user is authenticated
  if (browser && pb.authStore.isValid) {
    try {
      // Validate the auth is actually valid by trying to refresh
      await pb.collection('users').authRefresh();
      // Auth is valid, redirect to profile
      throw redirect(302, '/profile');
    } catch (e) {
      // Check if it's a SvelteKit redirect (has location property)
      if (e && typeof e === 'object' && 'location' in e) {
        throw e;
      }
      // Auth refresh failed - token is invalid, clear it
      console.log('Invalid auth detected, clearing:', e);
      pb.authStore.clear();
      // Continue to show login page
    }
  }

  return {};
};
