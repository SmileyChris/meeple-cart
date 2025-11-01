import type { PageLoad } from './$types';
import { redirectToLogin } from '$lib/utils/auth-redirect';
import { get } from 'svelte/store';
import { currentUser } from '$lib/pocketbase';


export const load: PageLoad = async ({ url }) => {
  const user = get(currentUser);

  // Redirect to login if not authenticated
  if (!user) {
    throw redirect(307, '/login');
  }

  return {};
};
