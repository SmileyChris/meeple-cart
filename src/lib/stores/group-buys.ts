import { writable, derived, get } from 'svelte/store';
import { currentUser } from '$lib/pocketbase';

// Types
export interface GroupBuy {
  id: string;
  title: string;
  campaign_url: string;
  description: string;
  pledge_deadline: string;
  estimated_delivery: string;
  status: 'collecting_interest' | 'collecting_payments' | 'ordered' | 'fulfillment' | 'completed' | 'cancelled';
  managers: string[]; // user IDs
  usage_mode: 'regional' | 'federated';
  delivery_policy: 'hub_only' | 'hub_or_direct';
  created: string;
  updated: string;
}

export interface GroupBuyTier {
  id: string;
  group_buy_id: string;
  name: string;
  price_per_unit: number;
  shipping_per_unit: number;
  min_quantity: number;
  max_quantity: number;
  notes: string;
}

export interface GroupBuyHub {
  id: string;
  group_buy_id: string;
  name: string;
  city: string;
  instructions: string;
  managers: string[]; // user IDs
  shipping_type: 'flat_per_order' | 'flat_per_unit' | 'no_fee';
  shipping_amount: number;
}

export interface GroupBuyParticipant {
  id: string;
  group_buy_id: string;
  user_id: string;
  user_name: string; // denormalized for display
  tier_id: string;
  quantity: number;
  hub_id?: string;
  shipping_method: 'hub_pickup' | 'direct_delivery';
  shipping_cost: number;
  shipping_address?: {
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
  };
  interest_status: 'interested' | 'withdrawn' | 'committed';
  payment_code?: string;
  payment_status: 'awaiting' | 'pending_verification' | 'paid' | 'partial' | 'refunded';
  payment_notes?: string;
  fulfillment_status: 'pending' | 'at_main_hub' | 'at_regional_hub' | 'ready' | 'picked_up' | 'shipped' | 'delivered';
  fulfillment_notes?: string;
  audit_log: Array<{
    action: string;
    actor_id: string;
    timestamp: string;
    notes?: string;
  }>;
  created: string;
}

// Stores
export const groupBuys = writable<GroupBuy[]>([]);
export const tiers = writable<GroupBuyTier[]>([]);
export const hubs = writable<GroupBuyHub[]>([]);
export const participants = writable<GroupBuyParticipant[]>([]);

// Derived stores
export const activeGroupBuys = derived(groupBuys, $groupBuys =>
  $groupBuys.filter(gb => ['collecting_interest', 'collecting_payments', 'ordered', 'fulfillment'].includes(gb.status))
);

export const completedGroupBuys = derived(groupBuys, $groupBuys =>
  $groupBuys.filter(gb => gb.status === 'completed')
);

// Helper functions
function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function generatePaymentCode(groupBuyId: string, userId: string): string {
  const shortId = (groupBuyId + userId).substring(0, 6).toUpperCase();
  return `GB-${shortId}`;
}

// CRUD Operations
export const groupBuyOperations = {
  create: (data: Omit<GroupBuy, 'id' | 'created' | 'updated'>): GroupBuy => {
    const now = new Date().toISOString();
    const groupBuy: GroupBuy = {
      ...data,
      id: generateId(),
      created: now,
      updated: now,
    };
    groupBuys.update(gbs => [...gbs, groupBuy]);
    return groupBuy;
  },

  update: (id: string, updates: Partial<GroupBuy>) => {
    groupBuys.update(gbs =>
      gbs.map(gb => gb.id === id ? { ...gb, ...updates, updated: new Date().toISOString() } : gb)
    );
  },

  delete: (id: string) => {
    groupBuys.update(gbs => gbs.filter(gb => gb.id !== id));
    // Cascade delete related data
    tiers.update(t => t.filter(tier => tier.group_buy_id !== id));
    hubs.update(h => h.filter(hub => hub.group_buy_id !== id));
    participants.update(p => p.filter(part => part.group_buy_id !== id));
  },

  getById: (id: string): GroupBuy | undefined => {
    return get(groupBuys).find(gb => gb.id === id);
  },

  getTiers: (groupBuyId: string): GroupBuyTier[] => {
    return get(tiers).filter(t => t.group_buy_id === groupBuyId);
  },

  getHubs: (groupBuyId: string): GroupBuyHub[] => {
    return get(hubs).filter(h => h.group_buy_id === groupBuyId);
  },

  getParticipants: (groupBuyId: string): GroupBuyParticipant[] => {
    return get(participants).filter(p => p.group_buy_id === groupBuyId);
  },

  isManager: (groupBuyId: string, userId: string): boolean => {
    const groupBuy = get(groupBuys).find(gb => gb.id === groupBuyId);
    return groupBuy?.managers.includes(userId) || false;
  },

  getUserParticipation: (groupBuyId: string, userId: string): GroupBuyParticipant | undefined => {
    return get(participants).find(p => p.group_buy_id === groupBuyId && p.user_id === userId);
  },
};

export const tierOperations = {
  create: (data: Omit<GroupBuyTier, 'id'>): GroupBuyTier => {
    const tier: GroupBuyTier = {
      ...data,
      id: generateId(),
    };
    tiers.update(t => [...t, tier]);
    return tier;
  },

  update: (id: string, updates: Partial<GroupBuyTier>) => {
    tiers.update(t => t.map(tier => tier.id === id ? { ...tier, ...updates } : tier));
  },

  delete: (id: string) => {
    tiers.update(t => t.filter(tier => tier.id !== id));
  },

  batchCreate: (tiersData: Omit<GroupBuyTier, 'id'>[]): GroupBuyTier[] => {
    const newTiers = tiersData.map(data => ({
      ...data,
      id: generateId(),
    }));
    tiers.update(t => [...t, ...newTiers]);
    return newTiers;
  },
};

export const hubOperations = {
  create: (data: Omit<GroupBuyHub, 'id'>): GroupBuyHub => {
    const hub: GroupBuyHub = {
      ...data,
      id: generateId(),
    };
    hubs.update(h => [...h, hub]);
    return hub;
  },

  update: (id: string, updates: Partial<GroupBuyHub>) => {
    hubs.update(h => h.map(hub => hub.id === id ? { ...hub, ...updates } : hub));
  },

  delete: (id: string) => {
    hubs.update(h => h.filter(hub => hub.id !== id));
  },

  batchCreate: (hubsData: Omit<GroupBuyHub, 'id'>[]): GroupBuyHub[] => {
    const newHubs = hubsData.map(data => ({
      ...data,
      id: generateId(),
    }));
    hubs.update(h => [...h, ...newHubs]);
    return newHubs;
  },
};

export const participantOperations = {
  register: (data: {
    group_buy_id: string;
    user_id: string;
    user_name: string;
    tier_id: string;
    quantity: number;
    hub_id?: string;
    shipping_method: 'hub_pickup' | 'direct_delivery';
    shipping_address?: GroupBuyParticipant['shipping_address'];
  }): GroupBuyParticipant => {
    const tier = get(tiers).find(t => t.id === data.tier_id);
    const hub = data.hub_id ? get(hubs).find(h => h.id === data.hub_id) : undefined;

    // Calculate shipping cost
    let shipping_cost = tier ? tier.shipping_per_unit * data.quantity : 0;
    if (hub && hub.shipping_type === 'flat_per_order') {
      shipping_cost += hub.shipping_amount;
    } else if (hub && hub.shipping_type === 'flat_per_unit') {
      shipping_cost += hub.shipping_amount * data.quantity;
    }

    const participant: GroupBuyParticipant = {
      id: generateId(),
      group_buy_id: data.group_buy_id,
      user_id: data.user_id,
      user_name: data.user_name,
      tier_id: data.tier_id,
      quantity: data.quantity,
      hub_id: data.hub_id,
      shipping_method: data.shipping_method,
      shipping_cost,
      shipping_address: data.shipping_address,
      interest_status: 'interested',
      payment_status: 'awaiting',
      fulfillment_status: 'pending',
      audit_log: [{
        action: 'registered_interest',
        actor_id: data.user_id,
        timestamp: new Date().toISOString(),
      }],
      created: new Date().toISOString(),
    };

    participants.update(p => [...p, participant]);
    return participant;
  },

  commit: (participantId: string, actorId: string) => {
    participants.update(parts =>
      parts.map(p => {
        if (p.id === participantId) {
          const paymentCode = generatePaymentCode(p.group_buy_id, p.user_id);
          return {
            ...p,
            interest_status: 'committed' as const,
            payment_code: paymentCode,
            audit_log: [
              ...p.audit_log,
              {
                action: 'committed',
                actor_id: actorId,
                timestamp: new Date().toISOString(),
                notes: `Payment code: ${paymentCode}`,
              },
            ],
          };
        }
        return p;
      })
    );
  },

  updatePaymentStatus: (
    participantId: string,
    status: GroupBuyParticipant['payment_status'],
    notes: string,
    actorId: string
  ) => {
    participants.update(parts =>
      parts.map(p => {
        if (p.id === participantId) {
          return {
            ...p,
            payment_status: status,
            payment_notes: notes,
            audit_log: [
              ...p.audit_log,
              {
                action: `payment_${status}`,
                actor_id: actorId,
                timestamp: new Date().toISOString(),
                notes,
              },
            ],
          };
        }
        return p;
      })
    );
  },

  updateFulfillmentStatus: (
    participantId: string,
    status: GroupBuyParticipant['fulfillment_status'],
    notes: string,
    actorId: string
  ) => {
    participants.update(parts =>
      parts.map(p => {
        if (p.id === participantId) {
          return {
            ...p,
            fulfillment_status: status,
            fulfillment_notes: notes,
            audit_log: [
              ...p.audit_log,
              {
                action: `fulfillment_${status}`,
                actor_id: actorId,
                timestamp: new Date().toISOString(),
                notes,
              },
            ],
          };
        }
        return p;
      })
    );
  },

  withdraw: (participantId: string, actorId: string) => {
    participants.update(parts =>
      parts.map(p => {
        if (p.id === participantId) {
          return {
            ...p,
            interest_status: 'withdrawn' as const,
            audit_log: [
              ...p.audit_log,
              {
                action: 'withdrawn',
                actor_id: actorId,
                timestamp: new Date().toISOString(),
              },
            ],
          };
        }
        return p;
      })
    );
  },

  delete: (id: string) => {
    participants.update(p => p.filter(part => part.id !== id));
  },
};

// Initialize with mock data
export function initializeMockData() {
  const mockUser = get(currentUser);
  const userId = mockUser?.id || 'mock-user-1';
  const userName = mockUser?.display_name || 'Test User';

  // Create a sample group buy
  const groupBuy = groupBuyOperations.create({
    title: 'Frosthaven Expansion - Group Pledge',
    campaign_url: 'https://www.kickstarter.com/projects/example/frosthaven',
    description: 'Coordinating a group pledge for the Frosthaven expansion. Save on shipping by combining orders! We\'ll be getting the deluxe pledge tier with all stretch goals included.',
    pledge_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    estimated_delivery: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'collecting_interest',
    managers: [userId],
    usage_mode: 'regional',
    delivery_policy: 'hub_or_direct',
  });

  // Create tiers
  const tier1 = tierOperations.create({
    group_buy_id: groupBuy.id,
    name: 'Base Game + Expansions',
    price_per_unit: 12000, // $120 NZD in cents
    shipping_per_unit: 1500, // $15 NZD
    min_quantity: 1,
    max_quantity: 1,
    notes: 'Core box with all stretch goals',
  });

  tierOperations.create({
    group_buy_id: groupBuy.id,
    name: 'Deluxe Edition',
    price_per_unit: 18000, // $180 NZD
    shipping_per_unit: 2000, // $20 NZD
    min_quantity: 1,
    max_quantity: 1,
    notes: 'Includes upgraded components and metal coins',
  });

  // Create hubs
  const hub1 = hubOperations.create({
    group_buy_id: groupBuy.id,
    name: 'Auckland Central Pickup',
    city: 'Auckland',
    instructions: 'Pickup from 123 Queen Street, CBD. Saturdays 10am-2pm.',
    managers: [userId],
    shipping_type: 'no_fee',
    shipping_amount: 0,
  });

  hubOperations.create({
    group_buy_id: groupBuy.id,
    name: 'Wellington Pickup',
    city: 'Wellington',
    instructions: 'Pickup from Garage Games, Cuba Street. Weekdays after 5pm.',
    managers: [],
    shipping_type: 'flat_per_order',
    shipping_amount: 500, // $5 NZD fee
  });

  // Create some sample participants
  participantOperations.register({
    group_buy_id: groupBuy.id,
    user_id: 'user-2',
    user_name: 'Alice Cooper',
    tier_id: tier1.id,
    quantity: 1,
    hub_id: hub1.id,
    shipping_method: 'hub_pickup',
  });

  participantOperations.register({
    group_buy_id: groupBuy.id,
    user_id: 'user-3',
    user_name: 'Bob Smith',
    tier_id: tier1.id,
    quantity: 1,
    hub_id: hub1.id,
    shipping_method: 'hub_pickup',
  });

  // Create a second group buy in different status
  const groupBuy2 = groupBuyOperations.create({
    title: 'Wingspan European Expansion - Bulk Order',
    campaign_url: 'https://stonemaiergames.com/games/wingspan/',
    description: 'Splitting a bulk order to save on international shipping. Looking for 8-10 people interested in the European expansion.',
    pledge_deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    estimated_delivery: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'collecting_payments',
    managers: ['user-4'],
    usage_mode: 'regional',
    delivery_policy: 'hub_only',
  });

  const tier3 = tierOperations.create({
    group_buy_id: groupBuy2.id,
    name: 'European Expansion',
    price_per_unit: 4500, // $45 NZD
    shipping_per_unit: 800, // $8 NZD
    min_quantity: 1,
    max_quantity: 2,
    notes: 'Standard retail edition',
  });

  hubOperations.create({
    group_buy_id: groupBuy2.id,
    name: 'Christchurch Pickup',
    city: 'Christchurch',
    instructions: 'Pickup from organizer\'s home in Riccarton. Contact for address.',
    managers: ['user-4'],
    shipping_type: 'no_fee',
    shipping_amount: 0,
  });
}

// Call this to load mock data (in development)
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('group_buys_initialized');
  if (!stored) {
    initializeMockData();
    localStorage.setItem('group_buys_initialized', 'true');
  }
}
