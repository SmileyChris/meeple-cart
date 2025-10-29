import type { PageLoad } from './$types';
import { pb, currentUser } from '$lib/pocketbase';
import { error, redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';

export const load: PageLoad = async ({ params }) => {
  const user = get(currentUser);

  // Require authentication
  if (!user) {
    throw redirect(302, `/login?redirect=/listings/${params.id}/photos`);
  }

  try {
    // Load listing with owner info
    const listing = await pb.collection('listings').getOne(params.id, {
      expand: 'owner',
    });

    // Verify ownership
    if (listing.owner !== user.id) {
      throw error(403, 'Only the listing owner can manage photos');
    }

    // Load games for this listing (needed for region mapping)
    const games = await pb.collection('games').getFullList({
      filter: `listing = "${params.id}"`,
      sort: 'created',
    });

    // Generate photo URLs
    const photos = Array.isArray(listing.photos)
      ? listing.photos.map((photo) => ({
          id: photo,
          filename: photo,
          full: pb.files.getUrl(listing, photo).toString(),
          thumb: pb.files.getUrl(listing, photo, { thumb: '400x300' }).toString(),
        }))
      : [];

    return {
      listing,
      games,
      photos,
      owner: listing.expand?.owner,
    };
  } catch (err) {
    console.error('Error loading listing for photo management:', err);
    if (err && typeof err === 'object' && 'status' in err) {
      throw err;
    }
    throw error(404, 'Listing not found');
  }
};
