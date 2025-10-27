import type { PageServerLoad } from './$types';
import { pb } from '$lib/server/pocketbase';

export const load: PageServerLoad = async ({ url, locals }) => {
  const page = Number(url.searchParams.get('page')) || 1;
  const pageSize = 20;

  try {
    // Fetch only wanted listings, sorted by activity
    const listings = await pb.collection('listings').getList(page, pageSize, {
      filter: 'type = "want"',
      sort: '-updated,-created',
      expand: 'user',
    });

    return {
      listings: listings.items,
      pagination: {
        page: listings.page,
        perPage: listings.perPage,
        totalItems: listings.totalItems,
        totalPages: listings.totalPages,
      },
      user: locals.user,
    };
  } catch (error) {
    console.error('Error fetching wanted listings:', error);
    return {
      listings: [],
      pagination: {
        page: 1,
        perPage: pageSize,
        totalItems: 0,
        totalPages: 0,
      },
      user: locals.user,
    };
  }
};
