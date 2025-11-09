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
    let allSubmissions = [];

    if (user) {
      try {
        mySubmissions = await pb.collection('trade_party_submissions').getFullList({
          filter: `trade_party = "${id}" && user = "${user.id}" && status = "approved"`,
          sort: '-created',
        });
      } catch (err) {
        console.error('Failed to load user submissions:', err);
        // Non-fatal error, continue with empty submissions
      }
    }

    // Load all approved submissions for the party (for want list builder)
    try {
      allSubmissions = await pb.collection('trade_party_submissions').getFullList({
        filter: `trade_party = "${id}" && status = "approved"`,
        sort: '-created',
        expand: 'user',
      });
    } catch (err) {
      console.error('Failed to load all submissions:', err);
    }

    return {
      party,
      mySubmissions,
      allSubmissions,
    };
  } catch (err) {
    console.error('Failed to load trade party:', err);
    throw error(404, 'Trade party not found');
  }
};
