import { pb, currentUser } from '$lib/pocketbase';
import { error } from '@sveltejs/kit';
import { get } from 'svelte/store';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
  const { id } = params;

  try {
    const party = await pb.collection('trade_parties').getOne(id, {
      expand: 'organizer',
    });

    // Load user's submissions for this party (if logged in)
    const user = get(currentUser);
    let mySubmissions = [];

    if (user) {
      try {
        mySubmissions = await pb.collection('trade_party_submissions').getFullList({
          filter: `trade_party = "${id}" && user = "${user.id}"`,
          sort: '-created',
        });
      } catch (err) {
        console.error('Failed to load user submissions:', err);
        // Non-fatal error, continue with empty submissions
      }
    }

    return {
      party,
      mySubmissions,
    };
  } catch (err) {
    console.error('Failed to load trade party:', err);
    throw error(404, 'Trade party not found');
  }
};
