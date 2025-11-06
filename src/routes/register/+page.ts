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
      throw redirect(302, '/profile');
    } catch (e) {
      // Auth refresh failed - token is invalid, clear it
      if (e instanceof Error && 'status' in e) {
        pb.authStore.clear();
      } else {
        // It's a redirect, re-throw it
        throw e;
      }
    }
  }

  return {};
};
