import type { TradeRecord, TradeStatus } from '$lib/types/pocketbase';

export type { TradeStatus } from '$lib/types/pocketbase';
export type UserRole = 'buyer' | 'seller' | 'other';
export type TradeAction = 'accept' | 'ship' | 'receive' | 'complete' | 'dispute' | 'cancel';

/**
 * Determines if a trade can transition from one status to another for a given user role
 */
export function canTransitionTo(
  currentStatus: TradeStatus,
  newStatus: TradeStatus,
  userRole: UserRole
): boolean {
  // Non-participants cannot transition
  if (userRole === 'other') {
    return false;
  }

  // Completed, disputed, and cancelled trades are terminal.
  if (['completed', 'disputed', 'cancelled'].includes(currentStatus)) {
    return false;
  }

  // Define valid transitions
  const validTransitions: Record<TradeStatus, TradeStatus[]> = {
    initiated: ['accepted', 'disputed', 'cancelled'],
    accepted: ['shipped', 'disputed', 'cancelled'],
    shipped: ['received', 'disputed'],
    received: ['completed', 'disputed'],
    completed: [], // Terminal state
    disputed: [], // Terminal state
    cancelled: [], // Terminal state
  };

  return validTransitions[currentStatus]?.includes(newStatus) ?? false;
}

/**
 * Validates a status transition and returns an error message if invalid
 */
export function validateStatusTransition(
  currentStatus: TradeStatus,
  newStatus: TradeStatus,
  userRole: UserRole
): string | null {
  // Check if user is a participant
  if (userRole === 'other') {
    return 'You are not a participant in this trade';
  }

  // Check if already completed
  if (currentStatus === 'completed') {
    return 'This trade is already completed and cannot be modified';
  }

  // Check if disputed
  if (currentStatus === 'disputed') {
    return 'This trade is disputed and requires admin resolution';
  }

  // Check if trying to go backwards
  const statusOrder: TradeStatus[] = ['initiated', 'accepted', 'shipped', 'received', 'completed'];
  const currentIndex = statusOrder.indexOf(currentStatus);
  const newIndex = statusOrder.indexOf(newStatus);

  if (
    currentIndex !== -1 &&
    newIndex !== -1 &&
    newIndex < currentIndex &&
    newStatus !== 'disputed'
  ) {
    return 'Trade status cannot go backwards';
  }

  // Check if transition is valid
  if (!canTransitionTo(currentStatus, newStatus, userRole)) {
    return `Cannot transition from ${currentStatus} to ${newStatus}`;
  }

  return null;
}

/**
 * Gets the available actions for a user on a trade
 */
export function getAvailableActions(trade: TradeRecord, userId: string): TradeAction[] {
  const actions: TradeAction[] = [];

  // Determine user role
  let userRole: UserRole = 'other';
  if (userId === trade.buyer) {
    userRole = 'buyer';
  } else if (userId === trade.seller) {
    userRole = 'seller';
  }

  // Non-participants have no actions
  if (userRole === 'other') {
    return [];
  }

  // Terminal states have no actions
  if (['completed', 'disputed', 'cancelled'].includes(trade.status)) {
    return [];
  }

  // Add available actions based on current status
  if (trade.status === 'initiated') {
    actions.push('accept', 'cancel', 'dispute');
  } else if (trade.status === 'accepted') {
    actions.push('ship', 'cancel', 'dispute');
  } else if (trade.status === 'shipped') {
    actions.push('receive', 'dispute');
  } else if (trade.status === 'received') {
    actions.push('complete', 'dispute');
  }

  return actions;
}

/**
 * Gets a human-readable label for a trade status
 */
export function getStatusLabel(status: TradeStatus): string {
  const labels: Record<TradeStatus, string> = {
    initiated: 'Proposed',
    accepted: 'Accepted',
    shipped: 'Shipped',
    received: 'Received',
    completed: 'Completed',
    disputed: 'Disputed',
    cancelled: 'Cancelled',
  };

  return labels[status] || status;
}

/**
 * Gets a CSS class for styling a trade status badge
 */
export function getStatusColor(status: TradeStatus): string {
  const colors: Record<TradeStatus, string> = {
    initiated: 'bg-blue-500',
    accepted: 'bg-blue-500',
    shipped: 'bg-amber-500',
    received: 'bg-green-500',
    completed: 'bg-gray-500',
    disputed: 'bg-red-500',
    cancelled: 'bg-gray-500',
  };

  return colors[status] || 'bg-gray-500';
}
