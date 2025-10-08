import { error, redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { GameRecord, ListingRecord } from '$lib/types/listing';
import type { UserRecord } from '$lib/types/pocketbase';
import { serializeNonPOJOs } from '$lib/utils/object';
import { handleGamePriceUpdate } from '$lib/server/price-tracking';

const GAMES_EXPAND_KEY = 'games(listing)';

export const load: PageServerLoad = async ({ params, locals }) => {
  const { id } = params;

  if (!locals.user) {
    throw redirect(303, '/login');
  }

  try {
    const listing = await locals.pb.collection('listings').getOne<ListingRecord>(id, {
      expand: 'owner,games(listing)',
    });

    // Check if user is the owner
    if (listing.owner !== locals.user.id) {
      throw error(403, 'You can only edit your own listings');
    }

    const owner = listing.expand?.owner as UserRecord | undefined;
    const games = (listing.expand?.[GAMES_EXPAND_KEY] as GameRecord[] | undefined) ?? [];

    return {
      listing: serializeNonPOJOs(listing),
      owner: owner ? serializeNonPOJOs(owner) : null,
      games: serializeNonPOJOs(games),
    };
  } catch (err) {
    console.error(`Failed to load listing ${id} for editing`, err);
    throw error(404, 'Listing not found');
  }
};

export const actions: Actions = {
  update_prices: async ({ locals, params, request }) => {
    if (!locals.user) {
      return fail(401, { error: 'Not authenticated' });
    }

    const formData = await request.formData();
    const { id } = params;

    try {
      // Verify ownership
      const listing = await locals.pb.collection('listings').getOne<ListingRecord>(id);
      if (listing.owner !== locals.user.id) {
        return fail(403, { error: 'You can only edit your own listings' });
      }

      // Get all games for this listing
      const games = await locals.pb.collection('games').getFullList<GameRecord>({
        filter: `listing = "${id}"`,
      });

      const fieldErrors: Record<string, string> = {};
      let updatedCount = 0;

      // Process each game's price update
      for (const game of games) {
        const priceStr = formData.get(`price_${game.id}`)?.toString();
        const tradeValueStr = formData.get(`trade_value_${game.id}`)?.toString();

        // Parse prices (allow empty = null)
        const newPrice = priceStr && priceStr.trim() !== '' ? parseFloat(priceStr.trim()) : null;
        const newTradeValue =
          tradeValueStr && tradeValueStr.trim() !== '' ? parseFloat(tradeValueStr.trim()) : null;

        // Validate prices
        if (newPrice !== null && (isNaN(newPrice) || newPrice < 0)) {
          fieldErrors[`price_${game.id}`] = 'Price must be a valid positive number';
          continue;
        }

        if (newTradeValue !== null && (isNaN(newTradeValue) || newTradeValue < 0)) {
          fieldErrors[`trade_value_${game.id}`] = 'Trade value must be a valid positive number';
          continue;
        }

        // Check if price changed
        const priceChanged = game.price !== newPrice;
        const tradeValueChanged = game.trade_value !== newTradeValue;

        if (priceChanged || tradeValueChanged) {
          // Update the game record
          await locals.pb.collection('games').update(game.id, {
            price: newPrice,
            trade_value: newTradeValue,
          });

          // Track price change and notify watchers
          await handleGamePriceUpdate(
            locals.pb,
            game.id,
            game,
            newPrice ?? undefined,
            newTradeValue ?? undefined
          );

          updatedCount++;
        }
      }

      if (Object.keys(fieldErrors).length > 0) {
        return fail(400, { fieldErrors, message: 'Some prices could not be updated' });
      }

      return {
        success: true,
        message: updatedCount > 0 ? `Updated ${updatedCount} game price(s)` : 'No changes made',
      };
    } catch (err) {
      console.error('Failed to update game prices', err);
      return fail(500, { error: 'Failed to update prices. Please try again.' });
    }
  },
};
