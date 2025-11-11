import { redirect } from '@sveltejs/kit';
import { pb } from '$lib/pocketbase';
import { browser } from '$app/environment';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
  // In browser, check if user is authenticated
  if (browser) {
    // If there's a token but it's marked as invalid, clear it completely
    if (pb.authStore.token && !pb.authStore.isValid) {
      console.log('[Login] Invalid token in storage, clearing');
      pb.authStore.clear();
    }

    if (pb.authStore.isValid) {
      try {
        // Validate the auth is actually valid by trying to refresh
        await pb.collection('users').authRefresh();
        // Auth is valid, redirect to profile
        redirect(302, '/profile');
      } catch (e) {
        // Check if it's a SvelteKit redirect error (has status and location properties)
        if (e && typeof e === 'object' && 'status' in e && 'location' in e) {
          throw e;
        }
        // Auth refresh failed - token is invalid, clear it
        console.log('[Login] Auth refresh failed, clearing', e);
        pb.authStore.clear();
        // Continue to show login page
      }
    }
  }

  return {};
};
