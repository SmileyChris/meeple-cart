import { redirect } from '@sveltejs/kit';
import { pb } from '$lib/pocketbase';
import { browser } from '$app/environment';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
  // In browser, check if user is authenticated
  if (browser) {
    // If there's a token but it's marked as invalid, clear it completely
    if (pb.authStore.token && !pb.authStore.isValid) {
      console.log('[Register] Invalid token in storage, clearing');
      pb.authStore.clear();
    }

    if (pb.authStore.isValid) {
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
        console.log('[Register] Auth refresh failed, clearing');
        pb.authStore.clear();
        // Continue to show register page
      }
    }
  }

  return {};
};
