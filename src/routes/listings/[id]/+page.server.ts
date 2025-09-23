import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { GameRecord, ListingGameDetail, ListingRecord } from '$lib/types/listing';
import type { UserRecord } from '$lib/types/pocketbase';
import { serializeNonPOJOs } from '$lib/utils/object';
import { normalizeListingType } from '$lib/types/listing';

const GAMES_EXPAND_KEY = 'games(listing)';

export const load: PageServerLoad = async ({ params, locals }) => {
  const { id } = params;

  try {
    const listing = await locals.pb.collection('listings').getOne<ListingRecord>(id, {
      expand: 'owner,games(listing)',
    });

    const owner = listing.expand?.owner as UserRecord | undefined;
    const games = (listing.expand?.[GAMES_EXPAND_KEY] as GameRecord[] | undefined) ?? [];
    const formattedGames: ListingGameDetail[] = games.map((game) => {
      const bggId = typeof game.bgg_id === 'number' ? game.bgg_id : null;

      return {
        id: game.id,
        title: game.title,
        condition: game.condition,
        status: game.status,
        bggId,
        bggUrl: bggId ? `https://boardgamegeek.com/boardgame/${bggId}` : null,
        price: typeof game.price === 'number' ? game.price : null,
        tradeValue: typeof game.trade_value === 'number' ? game.trade_value : null,
        notes: game.notes ?? null,
        year: typeof game.year === 'number' ? game.year : null,
      };
    });

    const photos = Array.isArray(listing.photos)
      ? listing.photos.map((photo) => ({
          id: photo,
          full: locals.pb.files.getUrl(listing, photo).toString(),
          thumb: locals.pb.files.getUrl(listing, photo, { thumb: '400x300' }).toString(),
        }))
      : [];

    const normalizedListing = {
      ...listing,
      listing_type: normalizeListingType(String(listing.listing_type)),
    } satisfies ListingRecord;

    return {
      listing: serializeNonPOJOs(normalizedListing),
      owner: owner ? serializeNonPOJOs(owner) : null,
      games: serializeNonPOJOs(formattedGames),
      photos: serializeNonPOJOs(photos),
    };
  } catch (err) {
    console.error(`Failed to load listing ${id}`, err);
    throw error(404, 'Listing not found');
  }
};
