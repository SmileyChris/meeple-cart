import { error, redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { redirectToLogin } from '$lib/utils/auth-redirect';
import type { TradeRecord } from '$lib/types/pocketbase';
import { pb, currentUser } from '$lib/pocketbase';
import { get } from 'svelte/store';

export const load: PageLoad = async ({ params, url }) => {
  const user = get(currentUser);

  if (!user) {
    redirectToLogin(url.pathname);
  }

  const { id } = params;

  try {
    // Fetch trade with expanded relations including items
    const trade = await pb.collection('trades').getOne<TradeRecord>(id, {
      expand: 'listing,buyer,seller,seller_items,buyer_items',
    });

    // Verify user is a participant
    if (trade.buyer !== user.id && trade.seller !== user.id) {
      throw error(403, 'You do not have access to this trade');
    }

    // Determine the other party
    const otherPartyId = trade.buyer === user.id ? trade.seller : trade.buyer;

    // Check if user has already vouched for the other party
    const existingVouches = await pb.collection('vouches').getList(1, 1, {
      filter: `voucher = "${user.id}" && vouchee = "${otherPartyId}"`,
    });

    const hasVouched = existingVouches.totalItems > 0;

    return {
      trade,
      hasVouched,
    };
  } catch (err: any) {
    if (err.status === 403) throw err;
    console.error(`Failed to load trade ${id}`, err);
    throw error(404, 'Trade not found');
  }
};
