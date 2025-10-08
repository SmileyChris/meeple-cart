import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { NotificationPreferences } from '$lib/types/notification';
import { DEFAULT_NOTIFICATION_PREFS } from '$lib/types/notification';

// Common NZ regions
export const NZ_REGIONS = [
  'Northland',
  'Auckland',
  'Waikato',
  'Bay of Plenty',
  'Gisborne',
  "Hawke's Bay",
  'Taranaki',
  'Manawatū-Whanganui',
  'Wellington',
  'Tasman',
  'Nelson',
  'Marlborough',
  'West Coast',
  'Canterbury',
  'Otago',
  'Southland',
];

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(303, '/login');
  }

  const prefs =
    (locals.user.notification_prefs as NotificationPreferences) || DEFAULT_NOTIFICATION_PREFS;

  return {
    preferences: prefs,
    regions: NZ_REGIONS,
  };
};

export const actions: Actions = {
  update: async ({ locals, request }) => {
    if (!locals.user) {
      return fail(401, { error: 'Not authenticated' });
    }

    const formData = await request.formData();

    // Parse watched regions from checkboxes
    const watchedRegions: string[] = [];
    for (const region of NZ_REGIONS) {
      if (formData.get(`region_${region}`)) {
        watchedRegions.push(region);
      }
    }

    const maxDistanceStr = formData.get('max_distance_km')?.toString();
    const maxDistance = maxDistanceStr ? parseInt(maxDistanceStr, 10) : undefined;

    const emailFrequency = formData.get('email_frequency')?.toString() as
      | 'instant'
      | 'daily'
      | 'weekly'
      | 'never'
      | undefined;

    const inAppDigest = formData.get('in_app_digest')?.toString() as
      | 'instant'
      | 'daily'
      | 'weekly'
      | undefined;

    const prefs: NotificationPreferences = {
      watched_regions: watchedRegions,
      max_distance_km: maxDistance && maxDistance > 0 ? maxDistance : undefined,
      email_frequency: emailFrequency || 'daily',
      in_app_digest: inAppDigest || 'instant',
      notify_new_listings: formData.get('notify_new_listings') === 'on',
      notify_price_drops: formData.get('notify_price_drops') === 'on',
      notify_new_messages: formData.get('notify_new_messages') === 'on',
    };

    try {
      await locals.pb.collection('users').update(locals.user.id, {
        notification_prefs: prefs,
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to update notification preferences', error);
      return fail(500, { error: 'Failed to update preferences' });
    }
  },
};
