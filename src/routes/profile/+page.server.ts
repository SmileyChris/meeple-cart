import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { serializeNonPOJOs } from '$lib/utils/object';
import type { OwnerListingSummary } from '$lib/types/listing';
import { normalizeListingType } from '$lib/types/listing';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(302, '/login');
  }

  const profile = await locals.pb.collection('users').getOne(locals.user.id);

  let listings: OwnerListingSummary[] = [];

  try {
    const results = await locals.pb.collection('listings').getList(1, 50, {
      filter: `owner = "${locals.user.id}"`,
      sort: '-created',
      fields: 'id,title,listing_type,status,created,views',
    });

    listings = results.items.map((item) => ({
      id: item.id,
      title: item.title,
      listingType: normalizeListingType(String(item.listing_type)),
      status: item.status,
      created: item.created,
      views: item.views ?? 0,
    }));
  } catch (error) {
    console.error('Failed to load user listings', error);
  }

  return {
    profile: serializeNonPOJOs(profile),
    listings: serializeNonPOJOs(listings),
  };
};

export const actions: Actions = {
  update: async ({ request, locals }) => {
    if (!locals.user) {
      throw redirect(302, '/login');
    }

    const form = await request.formData();
    const display_name = String(form.get('display_name') ?? '').trim();
    const location = String(form.get('location') ?? '').trim();
    const bio = String(form.get('bio') ?? '').trim();
    const preferred_contact = String(form.get('preferred_contact') ?? 'platform');

    if (!display_name) {
      return fail(400, { message: 'Display name is required.' });
    }

    try {
      const updated = await locals.pb.collection('users').update(locals.user.id, {
        display_name,
        location: location || null,
        bio: bio || null,
        preferred_contact,
      });

      locals.user = serializeNonPOJOs(updated);

      return {
        success: true,
        profile: serializeNonPOJOs(updated),
      };
    } catch (error) {
      console.error('Profile update failed', error);
      return fail(400, { message: 'Unable to update profile. Please try again.' });
    }
  },
};
