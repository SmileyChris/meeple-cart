import { redirect } from '@sveltejs/kit';
import { pb } from '$lib/pocketbase';
import { browser } from '$app/environment';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
  // In browser, check if user is authenticated via localStorage
  // PocketBase stores auth in localStorage with key 'pocketbase_auth'
  if (browser) {
    const authData = localStorage.getItem('pocketbase_auth');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        // If we have a token in localStorage, user is logged in
        if (parsed.token) {
          throw redirect(302, '/profile');
        }
      } catch (e) {
        // Invalid auth data or redirect error, continue
        if (e instanceof Error && e.message === 'Redirect') {
          throw e; // Re-throw redirect
        }
      }
    }
  }

  return {};
};
