import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const CONDITION_OPTIONS = ['mint', 'excellent', 'good', 'fair', 'poor'] as const;
const GAME_STATUSES = ['available', 'pending', 'sold', 'bundled'] as const;

const parseOptionalNumber = (
  value: FormDataEntryValue | null,
  { allowDecimals = true, min = 0, max }: { allowDecimals?: boolean; min?: number; max?: number }
): number | null => {
  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }

  const sanitized = value.trim();
  const parsed = allowDecimals ? Number.parseFloat(sanitized) : Number.parseInt(sanitized, 10);

  if (Number.isNaN(parsed)) {
    return Number.NaN;
  }

  if (parsed < min || (typeof max === 'number' && parsed > max)) {
    return Number.NaN;
  }

  return parsed;
};

export const load: PageServerLoad = async ({ locals, params }) => {
  if (!locals.user) {
    throw redirect(302, '/login');
  }

  const listingId = params.id;

  // Fetch the listing to verify ownership
  const listing = await locals.pb.collection('listings').getOne(listingId, {
    expand: 'owner',
  });

  if (listing.owner !== locals.user.id) {
    throw error(403, 'You do not have permission to manage this listing.');
  }

  // Fetch all games for this listing
  const games = await locals.pb.collection('games').getFullList({
    filter: `listing = "${listingId}"`,
    sort: 'created',
  });

  return {
    listing,
    games,
    conditionOptions: CONDITION_OPTIONS,
    gameStatuses: GAME_STATUSES,
  };
};

export const actions: Actions = {
  add_game: async ({ request, locals, params }) => {
    if (!locals.user) {
      throw redirect(302, '/login');
    }

    const listingId = params.id;
    const form = await request.formData();

    const title = String(form.get('title') ?? '').trim();
    const condition = String(form.get('condition') ?? '').toLowerCase();
    const priceRaw = form.get('price');
    const tradeValueRaw = form.get('trade_value');
    const notes = String(form.get('notes') ?? '').trim();
    const bggIdRaw = form.get('bgg_id');

    const fieldErrors: Record<string, string> = {};

    if (!title) {
      fieldErrors.title = 'Game title is required.';
    }

    if (!CONDITION_OPTIONS.includes(condition as (typeof CONDITION_OPTIONS)[number])) {
      fieldErrors.condition = 'Select a valid condition.';
    }

    const price = parseOptionalNumber(priceRaw, { allowDecimals: true, min: 0 });
    if (Number.isNaN(price)) {
      fieldErrors.price = 'Price must be a valid number greater than or equal to zero.';
    }

    const tradeValue = parseOptionalNumber(tradeValueRaw, { allowDecimals: true, min: 0 });
    if (Number.isNaN(tradeValue)) {
      fieldErrors.trade_value = 'Trade value must be a valid number greater than or equal to zero.';
    }

    const bggId = parseOptionalNumber(bggIdRaw, { allowDecimals: false, min: 0 });
    if (Number.isNaN(bggId)) {
      fieldErrors.bgg_id = 'BGG ID must be a whole number.';
    }

    if (Object.keys(fieldErrors).length > 0) {
      return fail(400, {
        action: 'add_game',
        fieldErrors,
        values: {
          title,
          condition,
          price: typeof priceRaw === 'string' ? priceRaw : '',
          trade_value: typeof tradeValueRaw === 'string' ? tradeValueRaw : '',
          notes,
          bgg_id: typeof bggIdRaw === 'string' ? bggIdRaw : '',
        },
      });
    }

    try {
      // Verify ownership
      const listing = await locals.pb.collection('listings').getOne(listingId);
      if (listing.owner !== locals.user.id) {
        throw error(403, 'You do not have permission to manage this listing.');
      }

      const gamePayload: Record<string, unknown> = {
        listing: listingId,
        title,
        condition,
        status: 'available',
        notes: notes || null,
      };

      if (price !== null) {
        gamePayload.price = price;
      }

      if (tradeValue !== null) {
        gamePayload.trade_value = tradeValue;
      }

      if (bggId !== null) {
        gamePayload.bgg_id = bggId;
      }

      // Initialize price history
      gamePayload.price_history = [
        {
          price: price !== null ? price : undefined,
          trade_value: tradeValue !== null ? tradeValue : undefined,
          timestamp: new Date().toISOString(),
        },
      ];

      await locals.pb.collection('games').create(gamePayload);

      return { action: 'add_game', success: true };
    } catch (err) {
      console.error('Failed to add game:', err);
      return fail(500, {
        action: 'add_game',
        message: 'Failed to add game. Please try again.',
      });
    }
  },

  update_game: async ({ request, locals, params }) => {
    if (!locals.user) {
      throw redirect(302, '/login');
    }

    const listingId = params.id;
    const form = await request.formData();

    const gameId = String(form.get('game_id') ?? '');
    const title = String(form.get('title') ?? '').trim();
    const condition = String(form.get('condition') ?? '').toLowerCase();
    const notes = String(form.get('notes') ?? '').trim();
    const bggIdRaw = form.get('bgg_id');

    const fieldErrors: Record<string, string> = {};

    if (!gameId) {
      return fail(400, { action: 'update_game', message: 'Game ID is required.' });
    }

    if (!title) {
      fieldErrors.title = 'Game title is required.';
    }

    if (!CONDITION_OPTIONS.includes(condition as (typeof CONDITION_OPTIONS)[number])) {
      fieldErrors.condition = 'Select a valid condition.';
    }

    const bggId = parseOptionalNumber(bggIdRaw, { allowDecimals: false, min: 0 });
    if (Number.isNaN(bggId)) {
      fieldErrors.bgg_id = 'BGG ID must be a whole number.';
    }

    if (Object.keys(fieldErrors).length > 0) {
      return fail(400, {
        action: 'update_game',
        fieldErrors,
        gameId,
      });
    }

    try {
      // Verify ownership
      const listing = await locals.pb.collection('listings').getOne(listingId);
      if (listing.owner !== locals.user.id) {
        throw error(403, 'You do not have permission to manage this listing.');
      }

      const gamePayload: Record<string, unknown> = {
        title,
        condition,
        notes: notes || null,
      };

      if (bggId !== null) {
        gamePayload.bgg_id = bggId;
      }

      await locals.pb.collection('games').update(gameId, gamePayload);

      return { action: 'update_game', success: true };
    } catch (err) {
      console.error('Failed to update game:', err);
      return fail(500, {
        action: 'update_game',
        message: 'Failed to update game. Please try again.',
      });
    }
  },

  update_status: async ({ request, locals, params }) => {
    if (!locals.user) {
      throw redirect(302, '/login');
    }

    const listingId = params.id;
    const form = await request.formData();

    const gameId = String(form.get('game_id') ?? '');
    const status = String(form.get('status') ?? '').toLowerCase();

    if (!gameId) {
      return fail(400, { action: 'update_status', message: 'Game ID is required.' });
    }

    if (!GAME_STATUSES.includes(status as (typeof GAME_STATUSES)[number])) {
      return fail(400, { action: 'update_status', message: 'Invalid status.' });
    }

    try {
      // Verify ownership
      const listing = await locals.pb.collection('listings').getOne(listingId);
      if (listing.owner !== locals.user.id) {
        throw error(403, 'You do not have permission to manage this listing.');
      }

      await locals.pb.collection('games').update(gameId, { status });

      return { action: 'update_status', success: true };
    } catch (err) {
      console.error('Failed to update game status:', err);
      return fail(500, {
        action: 'update_status',
        message: 'Failed to update game status. Please try again.',
      });
    }
  },

  remove_game: async ({ request, locals, params }) => {
    if (!locals.user) {
      throw redirect(302, '/login');
    }

    const listingId = params.id;
    const form = await request.formData();

    const gameId = String(form.get('game_id') ?? '');

    if (!gameId) {
      return fail(400, { action: 'remove_game', message: 'Game ID is required.' });
    }

    try {
      // Verify ownership
      const listing = await locals.pb.collection('listings').getOne(listingId);
      if (listing.owner !== locals.user.id) {
        throw error(403, 'You do not have permission to manage this listing.');
      }

      // Check if this is the last game
      const games = await locals.pb.collection('games').getFullList({
        filter: `listing = "${listingId}"`,
      });

      if (games.length <= 1) {
        return fail(400, {
          action: 'remove_game',
          message: 'Cannot remove the last game from a listing.',
        });
      }

      await locals.pb.collection('games').delete(gameId);

      return { action: 'remove_game', success: true };
    } catch (err) {
      console.error('Failed to remove game:', err);
      return fail(500, {
        action: 'remove_game',
        message: 'Failed to remove game. Please try again.',
      });
    }
  },
};
