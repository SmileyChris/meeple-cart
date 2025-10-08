import { error, redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { GameRecord, ListingGameDetail, ListingRecord } from '$lib/types/listing';
import type { UserRecord } from '$lib/types/pocketbase';
import { serializeNonPOJOs } from '$lib/utils/object';
import { normalizeListingType } from '$lib/types/listing';
import { generateThreadId } from '$lib/types/message';

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

      // Get previous price from price history
      let previousPrice: number | null = null;
      let previousTradeValue: number | null = null;
      if (game.price_history && game.price_history.length >= 2) {
        const prevEntry = game.price_history[game.price_history.length - 2];
        previousPrice = typeof prevEntry.price === 'number' ? prevEntry.price : null;
        previousTradeValue =
          typeof prevEntry.trade_value === 'number' ? prevEntry.trade_value : null;
      }

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
        previousPrice,
        previousTradeValue,
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

    // Check if user is watching this listing
    let isWatching = false;
    if (locals.user) {
      const watchlist = await locals.pb.collection('watchlist').getFullList({
        filter: `user = "${locals.user.id}" && listing = "${id}"`,
      });
      isWatching = watchlist.length > 0;
    }

    return {
      listing: serializeNonPOJOs(normalizedListing),
      owner: owner ? serializeNonPOJOs(owner) : null,
      games: serializeNonPOJOs(formattedGames),
      photos: serializeNonPOJOs(photos),
      isWatching,
    };
  } catch (err) {
    console.error(`Failed to load listing ${id}`, err);
    throw error(404, 'Listing not found');
  }
};

export const actions: Actions = {
  start_message: async ({ locals, params, request }) => {
    if (!locals.user) {
      return fail(401, { error: 'Not authenticated' });
    }

    const formData = await request.formData();
    const ownerId = formData.get('ownerId')?.toString();
    const initialMessage = formData.get('message')?.toString().trim();

    if (!ownerId) {
      return fail(400, { error: 'Owner ID required' });
    }

    if (ownerId === locals.user.id) {
      return fail(400, { error: 'Cannot message yourself' });
    }

    if (!initialMessage || initialMessage.length === 0) {
      return fail(400, { error: 'Message cannot be empty' });
    }

    if (initialMessage.length > 4000) {
      return fail(400, { error: 'Message too long' });
    }

    try {
      // Generate thread ID from user IDs
      const threadId = generateThreadId(locals.user.id, ownerId);

      // Create the first message in the thread
      await locals.pb.collection('messages').create({
        listing: params.id,
        thread_id: threadId,
        sender: locals.user.id,
        recipient: ownerId,
        content: initialMessage,
        is_public: false,
        read: false,
      });

      // Redirect to the thread
      throw redirect(303, `/messages/${threadId}`);
    } catch (err) {
      if (err instanceof Error && 'status' in err && err.status === 303) {
        throw err; // Re-throw redirects
      }
      console.error('Failed to create message', err);
      return fail(500, { error: 'Failed to send message' });
    }
  },
};
