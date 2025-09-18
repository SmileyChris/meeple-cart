import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) {
    throw redirect(302, '/profile');
  }

  return {};
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const data = await request.formData();
    const email = String(data.get('email') ?? '').trim();
    const password = String(data.get('password') ?? '');

    if (!email || !password) {
      return fail(400, { email, missing: true });
    }

    try {
      await locals.pb.collection('users').authWithPassword(email, password);
    } catch (error) {
      console.error('Login failed', error);
      return fail(400, { email, invalid: true });
    }

    throw redirect(303, '/profile');
  },
};
