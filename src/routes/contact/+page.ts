import { pb } from '$lib/pocketbase';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
  try {
    // Try to find Chris Beaven's account
    const result = await pb.collection('users').getList(1, 1, {
      filter: 'email = "smileychris@gmail.com"',
    });

    return {
      developer: result.items.length > 0 ? result.items[0] : null,
    };
  } catch (error) {
    console.error('Failed to load developer account:', error);
    return {
      developer: null,
    };
  }
};
