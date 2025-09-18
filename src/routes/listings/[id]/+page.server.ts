import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { GameRecord, ListingRecord } from '$lib/types/listing';
import type { UserRecord } from '$lib/types/pocketbase';
import { serializeNonPOJOs } from '$lib/utils/object';

const GAMES_EXPAND_KEY = 'games(listing)';

export const load: PageServerLoad = async ({ params, locals }) => {
  const { id } = params;

  try {
    const listing = await locals.pb.collection('listings').getOne<ListingRecord>(id, {
      expand: 'owner,games(listing)',
    });

    const owner = listing.expand?.owner as UserRecord | undefined;
    const games = (listing.expand?.[GAMES_EXPAND_KEY] as GameRecord[] | undefined) ?? [];

    const photos = Array.isArray(listing.photos)
      ? listing.photos.map((photo) => ({
          id: photo,
          full: locals.pb.files.getUrl(listing, photo).toString(),
          thumb: locals.pb.files.getUrl(listing, photo, { thumb: '400x300' }).toString(),
        }))
      : [];

    return {
      listing: serializeNonPOJOs(listing),
      owner: owner ? serializeNonPOJOs(owner) : null,
      games: serializeNonPOJOs(games),
      photos: serializeNonPOJOs(photos),
    };
  } catch (err) {
    console.error(`Failed to load listing ${id}`, err);
    throw error(404, 'Listing not found');
  }
};
