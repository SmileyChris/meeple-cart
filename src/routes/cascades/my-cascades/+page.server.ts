import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { CascadeRecord, CascadeEntryRecord } from '$lib/types/cascade';
import type { UserRecord } from '$lib/types/pocketbase';
import type { GameRecord, ListingRecord } from '$lib/types/listing';

interface CascadeListItem {
  id: string;
  name?: string;
  status: string;
  gameTitle: string;
  gameCondition: string;
  holderName: string;
  deadline?: string;
  generation: number;
  entryCount: number;
}

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(302, '/login?redirect=/cascades/my-cascades');
  }

  try {
    const userId = locals.user.id;

    // Fetch cascades user has entered
    const entries = await locals.pb.collection('cascade_entries').getFullList<CascadeEntryRecord>({
      filter: `user = "${userId}" && withdrew = false`,
      expand: 'cascade,cascade.current_game,cascade.current_holder',
      sort: '-created',
    });

    const enteredCascades: CascadeListItem[] = entries
      .filter((e) => e.expand?.cascade)
      .map((e) => {
        const cascade = e.expand!.cascade!;
        const game = cascade.expand?.current_game;
        const holder = cascade.expand?.current_holder;

        return {
          id: cascade.id,
          name: cascade.name,
          status: cascade.status,
          gameTitle: game?.title ?? 'Unknown Game',
          gameCondition: game?.condition ?? 'unknown',
          holderName: holder?.display_name ?? 'Unknown',
          deadline: cascade.entry_deadline,
          generation: cascade.generation,
          entryCount: cascade.entry_count,
        };
      });

    // Fetch cascades user has won (where they are the winner)
    const wonCascades = await locals.pb.collection('cascades').getFullList<CascadeRecord>({
      filter: `winner = "${userId}"`,
      expand: 'current_game,current_holder',
      sort: '-created',
    });

    const wonCascadesList: CascadeListItem[] = wonCascades.map((cascade) => {
      const game = cascade.expand?.current_game;
      const holder = cascade.expand?.current_holder;

      return {
        id: cascade.id,
        name: cascade.name,
        status: cascade.status,
        gameTitle: game?.title ?? 'Unknown Game',
        gameCondition: game?.condition ?? 'unknown',
        holderName: holder?.display_name ?? 'Unknown',
        deadline: undefined,
        generation: cascade.generation,
        entryCount: cascade.entry_count,
      };
    });

    // Fetch cascades user has started (where they are the current holder and generation 0)
    const startedCascades = await locals.pb.collection('cascades').getFullList<CascadeRecord>({
      filter: `current_holder = "${userId}"`,
      expand: 'current_game,winner',
      sort: '-created',
    });

    const startedCascadesList: CascadeListItem[] = startedCascades.map((cascade) => {
      const game = cascade.expand?.current_game;
      const winner = cascade.expand?.winner;

      return {
        id: cascade.id,
        name: cascade.name,
        status: cascade.status,
        gameTitle: game?.title ?? 'Unknown Game',
        gameCondition: game?.condition ?? 'unknown',
        holderName: winner?.display_name ?? 'No winner yet',
        deadline: cascade.entry_deadline,
        generation: cascade.generation,
        entryCount: cascade.entry_count,
      };
    });

    // Get user stats
    const user = await locals.pb.collection('users').getOne<UserRecord>(userId);

    const stats = {
      cascadesSeeded: user.cascades_seeded ?? 0,
      cascadesReceived: user.cascades_received ?? 0,
      cascadesPassed: user.cascades_passed ?? 0,
      cascadesBroken: user.cascades_broken ?? 0,
      cascadeReputation: user.cascade_reputation ?? 0,
    };

    return {
      enteredCascades: enteredCascadesList,
      wonCascades: wonCascadesList,
      startedCascades: startedCascadesList,
      stats,
    };
  } catch (err) {
    console.error('Failed to load user cascades', err);
    throw error(500, 'Failed to load your cascades');
  }
};
