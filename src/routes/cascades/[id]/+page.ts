import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { pb, currentUser } from '$lib/pocketbase';
import { get } from 'svelte/store';

export const load: PageLoad = async ({ params }) => {
  const user = get(currentUser);
  const { id } = params;

  try {
    // Fetch cascade with expanded relations
    const cascade = await pb.collection('cascades').getOne(id, {
      expand: 'current_game,current_game.listing,current_holder',
    });

    const game = cascade.expand?.current_game;
    const listing = game?.expand?.listing;
    const holder = cascade.expand?.current_holder;

    if (!game || !holder) {
      throw error(404, 'Cascade data incomplete');
    }

    // Fetch entries
    const entriesResult = await pb.collection('cascade_entries').getList(1, 50, {
      filter: `cascade = "${id}"`,
      expand: 'user',
      sort: '-created',
    });

    const entries = entriesResult.items.map((entry: any) => ({
      id: entry.id,
      userId: entry.user,
      userName: entry.expand?.user?.display_name || 'Anonymous',
      message: entry.message,
      created: entry.created,
      isWinner: entry.is_winner,
    }));

    // Fetch cascade history
    const historyResult = await pb.collection('cascade_history').getList(1, 20, {
      filter: `cascade = "${id}"`,
      expand: 'actor,related_user',
      sort: '-created',
    });

    const history = historyResult.items.map((item: any) => ({
      id: item.id,
      generation: item.generation,
      eventType: item.event_type,
      eventDate: item.event_date || item.created,
      actorName: item.expand?.actor?.display_name || 'Unknown',
      relatedUserName: item.expand?.related_user?.display_name || null,
      notes: item.notes,
    }));

    // Check if user has entered
    let userEntry = null;
    let canEnter = false;
    let eligibilityMessage = '';

    if (user) {
      const userEntries = await pb.collection('cascade_entries').getList(1, 1, {
        filter: `cascade = "${id}" && user = "${user.id}"`,
      });

      userEntry = userEntries.items[0] || null;

      // Check eligibility
      if (cascade.status !== 'accepting_entries') {
        eligibilityMessage = 'This cascade is no longer accepting entries';
      } else if (holder.id === user.id) {
        eligibilityMessage = 'You are the current holder of this cascade';
      } else if (userEntry) {
        eligibilityMessage = 'You have already entered this cascade';
      } else if (!user.can_enter_cascades) {
        eligibilityMessage = user.cascade_restricted_until
          ? `You are restricted from cascades until ${new Date(user.cascade_restricted_until).toLocaleDateString()}`
          : 'You are not eligible to enter cascades';
      } else {
        canEnter = true;
        eligibilityMessage = 'You are eligible to enter this cascade';
      }
    } else {
      eligibilityMessage = 'Log in to enter this cascade';
    }

    return {
      cascade: {
        id: cascade.id,
        name: cascade.name,
        description: cascade.description,
        status: cascade.status,
        generation: cascade.generation,
        entryCount: cascade.entry_count,
        deadline: cascade.entry_deadline,
        region: cascade.region,
        shippingRequirement: cascade.shipping_requirement,
        specialRules: cascade.special_rules,
      },
      game: {
        id: game.id,
        title: game.title,
        condition: game.condition,
        notes: game.notes,
        bggId: game.bgg_id,
      },
      listing,
      holder: {
        id: holder.id,
        displayName: holder.display_name,
        tradeCount: holder.trade_count,
        vouchCount: holder.vouch_count,
        cascadesSeeded: holder.cascades_seeded,
        cascadesReceived: holder.cascades_received,
      },
      entries,
      history,
      userEntry,
      canEnter,
      eligibilityMessage,
    };
  } catch (err: any) {
    console.error(`Failed to load cascade ${id}`, err);
    if (err.status === 404) {
      throw error(404, 'Cascade not found');
    }
    throw error(500, 'Failed to load cascade');
  }
};
