import type { PageServerLoad } from './$types';
import { pb } from '$lib/server/pocketbase';

export const load: PageServerLoad = async ({ url, locals }) => {
  const page = Number(url.searchParams.get('page')) || 1;
  const category = url.searchParams.get('category') || '';
  const minPrice = Number(url.searchParams.get('min_price')) || 0;
  const maxPrice = Number(url.searchParams.get('max_price')) || 10000;
  const conditions = url.searchParams.get('conditions')?.split(',') || [];
  const sort = url.searchParams.get('sort') || 'newest';
  const seller = url.searchParams.get('seller') || '';

  const pageSize = 24;

  // Build filter
  let filter = '(type = "sell" || type = "trade")';
  
  if (minPrice > 0) {
    filter += ` && price >= ${minPrice}`;
  }
  
  if (maxPrice < 10000) {
    filter += ` && price <= ${maxPrice}`;
  }
  
  if (seller) {
    filter += ` && user = "${seller}"`;
  }

  // Sort options
  let sortOption = '-created';
  switch (sort) {
    case 'price-low':
      sortOption = 'price';
      break;
    case 'price-high':
      sortOption = '-price';
      break;
    case 'name':
      sortOption = 'title';
      break;
    default:
      sortOption = '-created';
  }

  try {
    const listings = await pb.collection('listings').getList(page, pageSize, {
      filter,
      sort: sortOption,
      expand: 'user,games',
    });

    return {
      listings: listings.items,
      pagination: {
        page: listings.page,
        perPage: listings.perPage,
        totalItems: listings.totalItems,
        totalPages: listings.totalPages,
      },
      filters: {
        category,
        minPrice,
        maxPrice,
        conditions,
        sort,
        seller,
      },
      user: locals.user,
    };
  } catch (error) {
    console.error('Error fetching listings:', error);
    return {
      listings: [],
      pagination: {
        page: 1,
        perPage: pageSize,
        totalItems: 0,
        totalPages: 0,
      },
      filters: {
        category,
        minPrice,
        maxPrice,
        conditions,
        sort,
        seller,
      },
      user: locals.user,
    };
  }
};