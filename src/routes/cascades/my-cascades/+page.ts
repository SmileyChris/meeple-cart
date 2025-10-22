import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { pb, currentUser } from '$lib/pocketbase';
import { get } from 'svelte/store';

export const load: PageLoad = async () => {
  const user = get(currentUser);

  if (!user) {
    throw redirect(302, '/login');
  }

  try {
    // Fetch cascades user has entered
    const entryRecords = await pb.collection('cascade_entries').getFullList({
      filter: `user = "${user.id}"`,
      expand: 'cascade,cascade.current_game,cascade.current_holder',
      sort: '-created',
    });

    const enteredCascades = entryRecords.map((entry: any) => {
      const cascade = entry.expand?.cascade;
      const game = cascade?.expand?.current_game;
      const holder = cascade?.expand?.current_holder;

      return {
        id: cascade?.id,
        name: cascade?.name,
        status: cascade?.status,
        deadline: cascade?.entry_deadline,
        gameTitle: game?.title || 'Unknown Game',
        holderName: holder?.display_name || 'Unknown',
        isWinner: entry.is_winner,
      };
    });

    // Fetch cascades user has won
    const wonRecords = await pb.collection('cascade_entries').getFullList({
      filter: `user = "${user.id}" && is_winner = true`,
      expand: 'cascade,cascade.current_game',
      sort: '-created',
    });

    const wonCascades = wonRecords.map((entry: any) => {
      const cascade = entry.expand?.cascade;
      const game = cascade?.expand?.current_game;

      return {
        id: cascade?.id,
        name: cascade?.name,
        status: cascade?.status,
        gameTitle: game?.title || 'Unknown Game',
      };
    });

    // Fetch cascades user has started
    const startedRecords = await pb.collection('cascades').getFullList({
      filter: `current_holder = "${user.id}"`,
      expand: 'current_game',
      sort: '-created',
    });

    const startedCascades = startedRecords.map((cascade: any) => {
      const game = cascade.expand?.current_game;

      return {
        id: cascade.id,
        name: cascade.name,
        status: cascade.status,
        generation: cascade.generation,
        entryCount: cascade.entry_count,
        deadline: cascade.entry_deadline,
        gameTitle: game?.title || 'Unknown Game',
      };
    });

    // User stats
    const stats = {
      cascadesSeeded: user.cascades_seeded || 0,
      cascadesReceived: user.cascades_received || 0,
      cascadesPassed: user.cascades_passed || 0,
      cascadesBroken: user.cascades_broken || 0,
      cascadeReputation: user.cascade_reputation || 0,
    };

    return {
      enteredCascades,
      wonCascades,
      startedCascades,
      stats,
    };
  } catch (err) {
    console.error('Failed to load user cascades', err);
    return {
      enteredCascades: [],
      wonCascades: [],
      startedCascades: [],
      stats: {
        cascadesSeeded: 0,
        cascadesReceived: 0,
        cascadesPassed: 0,
        cascadesBroken: 0,
        cascadeReputation: 0,
      },
    };
  }
};
