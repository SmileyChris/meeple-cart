import type { PageLoad } from './$types';
import { redirectToLogin } from '$lib/utils/auth-redirect';
import type { TradeRecord } from '$lib/types/pocketbase';
import { pb, currentUser } from '$lib/pocketbase';
import { get } from 'svelte/store';

export const load: PageLoad = async ({ url }) => {
  const user = get(currentUser);

  if (!user) {
    redirectToLogin(url.pathname);
  }

  const filter = url.searchParams.get('filter') ?? 'active';

  let statusFilter = '';
  if (filter === 'active') {
    statusFilter = 'status = "initiated" || status = "confirmed"';
  } else if (filter === 'completed') {
    statusFilter = 'status = "completed"';
  } else if (filter === 'disputed') {
    statusFilter = 'status = "disputed"';
  }

  const trades = await pb.collection('trades').getFullList<TradeRecord>({
    filter: `(buyer = "${user.id}" || seller = "${user.id}") && (${statusFilter})`,
    expand: 'listing,buyer,seller',
    sort: '-created',
  });

  // Count trades by status
  const allTrades = await pb.collection('trades').getFullList<TradeRecord>({
    filter: `buyer = "${user.id}" || seller = "${user.id}"`,
    fields: 'id,status',
  });

  const activeTrades = allTrades.filter(
    (t) => t.status === 'initiated' || t.status === 'confirmed'
  ).length;
  const completedTrades = allTrades.filter((t) => t.status === 'completed').length;
  const disputedTrades = allTrades.filter((t) => t.status === 'disputed').length;

  return {
    trades,
    filter,
    counts: {
      active: activeTrades,
      completed: completedTrades,
      disputed: disputedTrades,
    },
  };
};
