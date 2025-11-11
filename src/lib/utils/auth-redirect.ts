import { redirect } from '@sveltejs/kit';

/**
 * Redirects to login with a next parameter to return to the current page after login
 * @param pathname The current pathname to return to after login
 */
export function redirectToLogin(pathname: string): never {
  throw redirect(302, `/login?next=${encodeURIComponent(pathname)}`);
}
