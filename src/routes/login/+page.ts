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
      // Check if it's a redirect (successful validation)
      if (e && typeof e === 'object' && 'status' in e && e.status === 302) {
        throw e;
      }
      // Auth refresh failed - token is invalid, clear it
      pb.authStore.clear();
      // Continue to show login page
    }
  }

  return {};
};
