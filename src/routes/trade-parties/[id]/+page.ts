import { pb } from '$lib/pocketbase';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
  const { id } = params;

  try {
    const party = await pb.collection('trade_parties').getOne(id, {
      expand: 'organizer',
    });

    return {
      party,
    };
  } catch (err) {
    console.error('Failed to load trade party:', err);
    throw error(404, 'Trade party not found');
  }
};
