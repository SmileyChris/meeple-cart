import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const DEFAULT_NOTIFICATION_PREFS = {
  messages: true,
  trades: true,
};

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user) {
    throw redirect(302, '/profile');
  }

  return {};
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const data = await request.formData();
    const email = String(data.get('email') ?? '')
      .trim()
      .toLowerCase();
    const password = String(data.get('password') ?? '');
    const passwordConfirm = String(data.get('passwordConfirm') ?? '');
    const displayName = String(data.get('display_name') ?? '').trim();

    if (!email || !password || !passwordConfirm || !displayName) {
      return fail(400, {
        email,
        display_name: displayName,
        missing: true,
      });
    }

    if (password !== passwordConfirm) {
      return fail(400, {
        email,
        display_name: displayName,
        mismatch: true,
      });
    }

    try {
      await locals.pb.collection('users').create({
        email,
        password,
        passwordConfirm,
        display_name: displayName,
        preferred_contact: 'platform',
        trade_count: 0,
        vouch_count: 0,
        joined_date: new Date().toISOString(),
        notification_prefs: DEFAULT_NOTIFICATION_PREFS,
      });

      await locals.pb.collection('users').authWithPassword(email, password);
    } catch (error) {
      console.error('Registration failed', error);
      return fail(400, {
        email,
        display_name: displayName,
        error: 'Unable to create account, please check the details and try again.',
      });
    }

    throw redirect(303, '/profile');
  },
};
