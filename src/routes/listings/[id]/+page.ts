import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import type { GameRecord, ListingGameDetail, ListingRecord } from '$lib/types/listing';
import type { UserRecord } from '$lib/types/pocketbase';
import { normalizeListingType } from '$lib/types/listing';
import { getLowestHistoricalPrice } from '$lib/utils/price-history';
import { pb, currentUser } from '$lib/pocketbase';
import { get } from 'svelte/store';

const GAMES_EXPAND_KEY = 'games(listing)';

export const load: PageLoad = async ({ params }) => {
  const { id } = params;

  try {
    const listing = await pb.collection('listings').getOne<ListingRecord>(id, {
      expand: 'owner,games(listing)',
    });

    const owner = listing.expand?.owner as UserRecord | undefined;
    const games = (listing.expand?.[GAMES_EXPAND_KEY] as GameRecord[] | undefined) ?? [];
    const formattedGames: ListingGameDetail[] = games.map((game) => {
      const bggId = typeof game.bgg_id === 'number' ? game.bgg_id : null;

      // Get lowest historical price using anti-gaming logic
      const currentPrice = typeof game.price === 'number' ? game.price : null;
      const currentTradeValue = typeof game.trade_value === 'number' ? game.trade_value : null;

      let previousPrice: number | null = null;
      let previousTradeValue: number | null = null;

      if (game.price_history && game.price_history.length >= 1) {
        const lowestPrice = getLowestHistoricalPrice(game.price_history, listing.created, 'price');
        const lowestTradeValue = getLowestHistoricalPrice(
          game.price_history,
          listing.created,
          'trade_value'
        );

        // Only show previous price if current is lower (actual drop)
        if (lowestPrice !== null && currentPrice !== null && currentPrice < lowestPrice) {
          previousPrice = lowestPrice;
        }

        if (
          lowestTradeValue !== null &&
          currentTradeValue !== null &&
          currentTradeValue < lowestTradeValue
        ) {
          previousTradeValue = lowestTradeValue;
        }
      }

      return {
        id: game.id,
        title: game.title,
        condition: game.condition,
        status: game.status,
        bggId,
        bggUrl: bggId ? `https://boardgamegeek.com/boardgame/${bggId}` : null,
        price: currentPrice,
        tradeValue: currentTradeValue,
        notes: game.notes ?? null,
        year: typeof game.year === 'number' ? game.year : null,
        previousPrice,
        previousTradeValue,
        listingCreated: listing.created,
        priceHistory: game.price_history,
      };
    });

    const photos = Array.isArray(listing.photos)
      ? listing.photos.map((photo) => ({
          id: photo,
          full: pb.files.getUrl(listing, photo).toString(),
          thumb: pb.files.getUrl(listing, photo, { thumb: '400x300' }).toString(),
        }))
      : [];

    const normalizedListing = {
      ...listing,
      listing_type: normalizeListingType(String(listing.listing_type)),
    } satisfies ListingRecord;

    // Check if user is watching this listing
    let isWatching = false;
    const user = get(currentUser);
    if (user) {
      const watchlist = await pb.collection('watchlist').getFullList({
        filter: `user = "${user.id}" && listing = "${id}"`,
      });
      isWatching = watchlist.length > 0;
    }

    return {
      listing: normalizedListing,
      owner: owner || null,
      games: formattedGames,
      photos,
      isWatching,
    };
  } catch (err) {
    console.error(`Failed to load listing ${id}`, err);
    throw error(404, 'Listing not found');
  }
};
