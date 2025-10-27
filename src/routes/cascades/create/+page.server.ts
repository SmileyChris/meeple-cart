import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { GameRecord, ListingRecord } from '$lib/types/listing';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(302, '/login?redirect=/cascades/create');
  }

  try {
    // Fetch user's active listings with available games
    const listings = await locals.pb.collection('listings').getFullList<ListingRecord>({
      filter: `owner = "${locals.user.id}" && status = "active"`,
      expand: 'games(listing)',
      sort: '-created',
    });

    // Format games for selection
    const availableGames = listings.flatMap((listing) => {
      const games = (listing.expand?.['games(listing)'] as GameRecord[] | undefined) ?? [];
      return games
        .filter((game) => game.status === 'available') // Only available games
        .map((game) => ({
          id: game.id,
          title: game.title,
          condition: game.condition,
          listingId: listing.id,
          listingTitle: listing.title,
        }));
    });

    return {
      availableGames,
    };
  } catch (err) {
    console.error('Failed to load games for cascade creation', err);
    throw error(500, 'Failed to load your games');
  }
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    if (!locals.user) {
      return fail(401, { error: 'You must be logged in to create a cascade' });
    }

    const formData = await request.formData();
    const gameId = formData.get('game_id') as string;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const deadlineDays = Number.parseInt(formData.get('deadline_days') as string, 10);
    const region = formData.get('region') as string;
    const shippingRequirement = formData.get('shipping_requirement') as string;
    const specialRules = formData.get('special_rules') as string;

    // Validation
    if (!gameId) {
      return fail(400, { error: 'Please select a game' });
    }

    if (!deadlineDays || deadlineDays < 7 || deadlineDays > 30) {
      return fail(400, { error: 'Deadline must be between 7 and 30 days' });
    }

    if (
      !shippingRequirement ||
      !['pickup_only', 'shipping_available', 'shipping_only'].includes(shippingRequirement)
    ) {
      return fail(400, { error: 'Invalid shipping requirement' });
    }

    try {
      // Verify the game exists and belongs to user
      const game = await locals.pb.collection('games').getOne<GameRecord>(gameId, {
        expand: 'listing',
      });

      const listing = game.expand?.listing as ListingRecord | undefined;
      if (!listing || listing.owner !== locals.user.id) {
        return fail(403, { error: 'You do not own this game' });
      }

      if (game.status !== 'available') {
        return fail(400, { error: 'This game is not available' });
      }

      // Calculate deadline
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + deadlineDays);

      // Create cascade
      const cascade = await locals.pb.collection('cascades').create({
        name: name || null,
        description: description || null,
        status: 'accepting_entries',
        current_game: gameId,
        current_holder: locals.user.id,
        entry_deadline: deadline.toISOString(),
        region: region || null,
        shipping_requirement: shippingRequirement,
        special_rules: specialRules || null,
        generation: 0, // New seed cascade
        entry_count: 0,
        view_count: 0,
      });

      // Create history entry
      await locals.pb.collection('cascade_history').create({
        cascade: cascade.id,
        generation: 0,
        event_type: 'seeded',
        event_date: new Date().toISOString(),
        actor: locals.user.id,
        game: gameId,
      });

      // Update game status to 'pending' (locked in cascade)
      await locals.pb.collection('games').update(gameId, {
        status: 'pending',
      });

      // Update user stats
      await locals.pb.collection('users').update(locals.user.id, {
        cascades_seeded: (locals.user.cascades_seeded || 0) + 1,
      });

      throw redirect(303, `/cascades/${cascade.id}`);
    } catch (err) {
      console.error('Failed to create cascade', err);
      if (err instanceof Error && 'status' in err && err.status === 303) {
        throw err; // Re-throw redirect
      }
      return fail(500, { error: 'Failed to create cascade. Please try again.' });
    }
  },
};
