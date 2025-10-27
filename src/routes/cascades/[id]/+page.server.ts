import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { CascadeRecord, CascadeEntryRecord, CascadeHistoryRecord } from '$lib/types/cascade';
import type { UserRecord } from '$lib/types/pocketbase';
import type { GameRecord, ListingRecord } from '$lib/types/listing';

export const load: PageServerLoad = async ({ params, locals }) => {
  const { id } = params;

  try {
    // Fetch cascade with expanded relations
    const cascade = await locals.pb.collection('cascades').getOne<CascadeRecord>(id, {
      expand:
        'current_game,current_game.listing,current_holder,winner,origin_cascade,previous_cascade',
    });

    // Fetch entries
    const entries = await locals.pb.collection('cascade_entries').getFullList<CascadeEntryRecord>({
      filter: `cascade = "${id}" && withdrew = false`,
      expand: 'user',
      sort: '-created',
    });

    // Fetch history
    const history = await locals.pb
      .collection('cascade_history')
      .getFullList<CascadeHistoryRecord>({
        filter: `cascade = "${id}"`,
        expand: 'actor,related_user,game',
        sort: '-event_date',
      });

    // Check if current user has entered
    let userEntry: CascadeEntryRecord | null = null;
    if (locals.user) {
      const userEntries = await locals.pb
        .collection('cascade_entries')
        .getFullList<CascadeEntryRecord>({
          filter: `cascade = "${id}" && user = "${locals.user.id}"`,
        });
      userEntry = userEntries.find((e) => !e.withdrew) || null;
    }

    // Check eligibility to enter
    let canEnter = false;
    let eligibilityMessage = '';

    if (locals.user) {
      const user = locals.user;

      if (cascade.status !== 'accepting_entries') {
        eligibilityMessage = 'This cascade is no longer accepting entries.';
      } else if (new Date(cascade.entry_deadline) < new Date()) {
        eligibilityMessage = 'The entry deadline has passed.';
      } else if (userEntry) {
        eligibilityMessage = 'You have already entered this cascade.';
      } else if (cascade.current_holder === user.id) {
        eligibilityMessage = 'You are the current holder of this cascade.';
      } else if (
        user.cascade_restricted_until &&
        new Date(user.cascade_restricted_until) > new Date()
      ) {
        eligibilityMessage = 'You are temporarily restricted from entering cascades.';
      } else if (!user.can_enter_cascades) {
        eligibilityMessage = 'You are not eligible to enter cascades.';
      } else {
        // Check account requirements
        const accountAge = Math.floor(
          (new Date().getTime() - new Date(user.joined_date).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (accountAge < 30 && user.vouch_count < 2 && user.trade_count < 1) {
          eligibilityMessage =
            'To enter cascades, you need either: account age ≥30 days, 2+ vouches, or 1+ completed trade.';
        } else {
          canEnter = true;
        }
      }
    } else {
      eligibilityMessage = 'You must be logged in to enter cascades.';
    }

    // Format data for display
    const game = cascade.expand?.current_game;
    const listing = game?.expand?.listing as ListingRecord | undefined;
    const holder = cascade.expand?.current_holder;

    return {
      cascade: {
        id: cascade.id,
        name: cascade.name,
        description: cascade.description,
        status: cascade.status,
        generation: cascade.generation,
        deadline: cascade.entry_deadline,
        region: cascade.region,
        shippingRequirement: cascade.shipping_requirement,
        specialRules: cascade.special_rules,
        entryCount: cascade.entry_count,
        viewCount: cascade.view_count,
      },
      game: game
        ? {
            id: game.id,
            title: game.title,
            condition: game.condition,
            notes: game.notes,
            bggId: game.bgg_id,
          }
        : null,
      listing: listing
        ? {
            id: listing.id,
            photos: listing.photos,
          }
        : null,
      holder: holder
        ? {
            id: holder.id,
            displayName: holder.display_name,
            vouchCount: holder.vouch_count,
            tradeCount: holder.trade_count,
            cascadesSeeded: holder.cascades_seeded,
            cascadeReputation: holder.cascade_reputation,
          }
        : null,
      entries: entries.map((entry) => {
        const user = entry.expand?.user;
        return {
          id: entry.id,
          userName: user?.display_name ?? 'Unknown',
          userId: user?.id ?? null,
          message: entry.message,
          created: entry.created,
        };
      }),
      history: history.map((h) => {
        const actor = h.expand?.actor;
        const relatedUser = h.expand?.related_user;
        return {
          eventType: h.event_type,
          eventDate: h.event_date,
          actorName: actor?.display_name ?? 'Unknown',
          relatedUserName: relatedUser?.display_name,
          notes: h.notes,
        };
      }),
      userEntry: userEntry
        ? {
            id: userEntry.id,
            message: userEntry.message,
          }
        : null,
      canEnter,
      eligibilityMessage,
    };
  } catch (err) {
    console.error(`Failed to load cascade ${id}`, err);
    throw error(404, 'Cascade not found');
  }
};

export const actions: Actions = {
  enter: async ({ request, locals, params }) => {
    if (!locals.user) {
      return fail(401, { error: 'You must be logged in to enter cascades' });
    }

    const formData = await request.formData();
    const message = formData.get('message') as string;
    const { id } = params;

    try {
      // Verify cascade is still accepting entries
      const cascade = await locals.pb.collection('cascades').getOne<CascadeRecord>(id);

      if (cascade.status !== 'accepting_entries') {
        return fail(400, { error: 'This cascade is no longer accepting entries' });
      }

      if (new Date(cascade.entry_deadline) < new Date()) {
        return fail(400, { error: 'The entry deadline has passed' });
      }

      // Check if user already entered
      const existingEntries = await locals.pb
        .collection('cascade_entries')
        .getFullList<CascadeEntryRecord>({
          filter: `cascade = "${id}" && user = "${locals.user.id}"`,
        });

      const activeEntry = existingEntries.find((e) => !e.withdrew);
      if (activeEntry) {
        return fail(400, { error: 'You have already entered this cascade' });
      }

      // Create entry
      await locals.pb.collection('cascade_entries').create({
        cascade: id,
        user: locals.user.id,
        message: message || null,
        withdrew: false,
      });

      // Update cascade entry count
      await locals.pb.collection('cascades').update(id, {
        entry_count: cascade.entry_count + 1,
      });

      return { success: true, message: 'Successfully entered cascade!' };
    } catch (err) {
      console.error('Failed to enter cascade', err);
      return fail(500, { error: 'Failed to enter cascade. Please try again.' });
    }
  },

  withdraw: async ({ locals, params }) => {
    if (!locals.user) {
      return fail(401, { error: 'You must be logged in' });
    }

    const { id } = params;

    try {
      // Find user's entry
      const entries = await locals.pb
        .collection('cascade_entries')
        .getFullList<CascadeEntryRecord>({
          filter: `cascade = "${id}" && user = "${locals.user.id}" && withdrew = false`,
        });

      if (entries.length === 0) {
        return fail(400, { error: 'You have not entered this cascade' });
      }

      const entry = entries[0];

      // Mark as withdrew
      await locals.pb.collection('cascade_entries').update(entry.id, {
        withdrew: true,
      });

      // Update cascade entry count
      const cascade = await locals.pb.collection('cascades').getOne<CascadeRecord>(id);
      await locals.pb.collection('cascades').update(id, {
        entry_count: Math.max(0, cascade.entry_count - 1),
      });

      return { success: true, message: 'Successfully withdrew from cascade' };
    } catch (err) {
      console.error('Failed to withdraw from cascade', err);
      return fail(500, { error: 'Failed to withdraw. Please try again.' });
    }
  },
};
