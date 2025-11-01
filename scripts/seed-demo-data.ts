import PocketBase, { ClientResponseError, RecordModel } from 'pocketbase';
import { REACTION_EMOJIS } from '../src/lib/types/pocketbase';

const baseUrl = (process.env.POCKETBASE_URL ?? 'http://127.0.0.1:8090').replace(/\/$/, '');

// Parse command line arguments
const args = process.argv.slice(2);
const clearListings = args.includes('--clear-listings');
const help = args.includes('--help') || args.includes('-h');

if (help) {
  console.log(`
Demo Data Seeder for Meeple Cart

Usage:
  npm run seed:demo [options]

Options:
  --clear-listings    Delete all existing listings before creating new ones
  --help, -h         Show this help message

Examples:
  npm run seed:demo                    # Create demo data (keeps existing listings)
  npm run seed:demo --clear-listings   # Clear all listings and recreate
`);
  process.exit(0);
}

type SeedUser = {
  email: string;
  password: string;
  displayName: string;
  location: string;
  joinedDaysAgo: number;
  tradeCount: number;
  vouchCount: number;
  preferredContact: 'platform' | 'email' | 'phone';
  bio?: string;
  phone?: string;
  preferredRegions?: string[];
};

type SeedGame = {
  title: string;
  bggId?: number;
  year?: number;
  condition: 'mint' | 'excellent' | 'good' | 'fair' | 'poor';
  price?: number;
  tradeValue?: number;
  notes?: string;
  status?: 'available' | 'pending' | 'sold' | 'bundled';
};

type SeedListing = {
  ownerEmail: string;
  title: string;
  summary: string;
  listingType: 'trade' | 'sell' | 'want';
  location: string;
  shippingAvailable: boolean;
  preferBundle: boolean;
  bundleDiscount?: number;
  daysAgo: number;
  games: SeedGame[];
};

const demoUsers: SeedUser[] = [
  {
    email: 'demo-alex@meeplecart.test',
    password: 'TradeDemo2024!',
    displayName: 'Alex Thompson',
    location: 'Wellington',
    joinedDaysAgo: 547,
    tradeCount: 12,
    vouchCount: 5,
    preferredContact: 'platform',
    bio: 'Co-op enthusiast with a soft spot for crunchy euros. Happy to meetup in the CBD.',
    phone: '+64 21 555 1234',
    preferredRegions: ['wellington'],
  },
  {
    email: 'demo-bella@meeplecart.test',
    password: 'TradeDemo2024!',
    displayName: 'Bella Ngata',
    location: 'Auckland',
    joinedDaysAgo: 284,
    tradeCount: 7,
    vouchCount: 3,
    preferredContact: 'email',
    bio: 'Collecting narrative-heavy games and teaching them at our local community hub.',
    preferredRegions: ['auckland'],
  },
  {
    email: 'demo-kiran@meeplecart.test',
    password: 'TradeDemo2024!',
    displayName: 'Kiran Patel',
    location: 'Christchurch',
    joinedDaysAgo: 730,
    tradeCount: 21,
    vouchCount: 11,
    preferredContact: 'phone',
    bio: 'Runs monthly swap nights. Looking to rehome well-loved strategy titles.',
    phone: '+64 27 777 8899',
    preferredRegions: ['canterbury'],
  },
  {
    email: 'demo-sarah@meeplecart.test',
    password: 'TradeDemo2024!',
    displayName: 'Sarah Mitchell',
    location: 'Hamilton',
    joinedDaysAgo: 156,
    tradeCount: 4,
    vouchCount: 2,
    preferredContact: 'platform',
    bio: 'Party game collector. Always looking for quick-to-teach crowd pleasers!',
    preferredRegions: ['waikato'],
  },
  {
    email: 'demo-james@meeplecart.test',
    password: 'TradeDemo2024!',
    displayName: 'James Chen',
    location: 'Dunedin',
    joinedDaysAgo: 421,
    tradeCount: 15,
    vouchCount: 8,
    preferredContact: 'email',
    bio: '18XX fanatic. Also into deck builders and engine builders.',
    phone: '+64 22 444 5566',
    preferredRegions: ['otago'],
  },
  {
    email: 'demo-maya@meeplecart.test',
    password: 'TradeDemo2024!',
    displayName: 'Maya Rodriguez',
    location: 'Tauranga',
    joinedDaysAgo: 92,
    tradeCount: 3,
    vouchCount: 1,
    preferredContact: 'platform',
    bio: 'New to the hobby! Looking for gateway games and friendly trades.',
    preferredRegions: ['bay_of_plenty'],
  },
  {
    email: 'demo-tom@meeplecart.test',
    password: 'TradeDemo2024!',
    displayName: 'Tom Harrison',
    location: 'Nelson',
    joinedDaysAgo: 245,
    tradeCount: 9,
    vouchCount: 4,
    preferredContact: 'email',
    bio: 'War games and miniatures. Open to trades or sales with shipping.',
    preferredRegions: ['nelson', 'tasman'],
  },
  {
    email: 'demo-lisa@meeplecart.test',
    password: 'TradeDemo2024!',
    displayName: 'Lisa Wang',
    location: 'Palmerston North',
    joinedDaysAgo: 33,
    tradeCount: 1,
    vouchCount: 0,
    preferredContact: 'platform',
    bio: 'Just joined! Love cooperative games and anything with a good theme.',
    preferredRegions: ['manawatu_whanganui'],
  },
];

const demoListings: SeedListing[] = [
  {
    ownerEmail: 'demo-alex@meeplecart.test',
    title: 'Wellington euro trade bundle',
    summary: 'Mix of medium-heavy euros ready for the next table. Prefer bundle swaps but open to offers.',
    listingType: 'trade',
    location: 'Wellington',
    shippingAvailable: true,
    preferBundle: true,
    bundleDiscount: 15,
    daysAgo: 2,
    games: [
      {
        title: 'Everdell',
        bggId: 199792,
        year: 2018,
        condition: 'excellent',
        tradeValue: 95,
        notes: "Collector's Edition with metal coins and wooden berries.",
      },
      {
        title: 'Great Western Trail (2nd ed.)',
        bggId: 341169,
        year: 2021,
        condition: 'good',
        tradeValue: 75,
        notes: 'Sleeved cards; minor shelf wear on box corners.',
      },
    ],
  },
  {
    ownerEmail: 'demo-bella@meeplecart.test',
    title: 'Auckland family night sale',
    summary: 'Family-friendly lineup that we have outgrown. Priced to move, can post nationwide.',
    listingType: 'sell',
    location: 'Auckland',
    shippingAvailable: true,
    preferBundle: false,
    daysAgo: 5,
    games: [
      {
        title: 'Ticket to Ride: Europe',
        bggId: 14996,
        year: 2005,
        condition: 'excellent',
        price: 55,
        notes: 'Includes 1912 expansion routes laminated for durability.',
      },
      {
        title: 'Azul',
        bggId: 230802,
        year: 2017,
        condition: 'mint',
        price: 45,
        notes: 'All tiles bagged; instructions pristine.',
      },
      {
        title: 'Parks',
        bggId: 266524,
        year: 2019,
        condition: 'excellent',
        price: 60,
        notes: 'Nightfall expansion included; minor ding on outer sleeve.',
      },
    ],
  },
  {
    ownerEmail: 'demo-kiran@meeplecart.test',
    title: 'Christchurch wishlist - narrative co-ops wanted',
    summary: 'Looking to buy or trade for narrative co-ops with strong solo support.',
    listingType: 'want',
    location: 'Christchurch',
    shippingAvailable: false,
    preferBundle: false,
    daysAgo: 8,
    games: [
      {
        title: 'Sleeping Gods',
        bggId: 255984,
        condition: 'good',
        notes: 'Happy with minor wear; prefer copy with Tides of Ruin expansion.',
        status: 'pending',
      },
      {
        title: 'Destinies',
        bggId: 317058,
        condition: 'good',
        notes: 'Looking for base game plus Myth & Folklore expansion.',
        status: 'pending',
      },
    ],
  },
  {
    ownerEmail: 'demo-sarah@meeplecart.test',
    title: 'Party games - Hamilton pickup preferred',
    summary: 'Great for game nights! Selling to make room for new arrivals.',
    listingType: 'sell',
    location: 'Hamilton',
    shippingAvailable: true,
    preferBundle: true,
    bundleDiscount: 20,
    daysAgo: 1,
    games: [
      {
        title: 'Wavelength',
        bggId: 262543,
        year: 2019,
        condition: 'excellent',
        price: 35,
        notes: 'Perfect party icebreaker. All components present.',
      },
      {
        title: 'Just One',
        bggId: 254640,
        year: 2018,
        condition: 'good',
        price: 25,
        notes: 'Spiel des Jahres winner. Minor wear on cards.',
      },
      {
        title: 'Decrypto',
        bggId: 225694,
        year: 2018,
        condition: 'mint',
        price: 30,
        notes: 'Unopened/unplayed. Received as duplicate gift.',
      },
    ],
  },
  {
    ownerEmail: 'demo-james@meeplecart.test',
    title: 'Strategy heavyweights - Dunedin',
    summary: 'Premium titles for experienced gamers. All well-maintained.',
    listingType: 'trade',
    location: 'Dunedin',
    shippingAvailable: true,
    preferBundle: false,
    daysAgo: 12,
    games: [
      {
        title: 'Brass: Birmingham',
        bggId: 224517,
        year: 2018,
        condition: 'excellent',
        tradeValue: 110,
        notes: 'Deluxe edition with poker chips. In pristine condition.',
      },
      {
        title: 'Wingspan',
        bggId: 266192,
        year: 2019,
        condition: 'good',
        tradeValue: 65,
        notes: 'Base game + European expansion. Cards sleeved.',
      },
    ],
  },
  {
    ownerEmail: 'demo-maya@meeplecart.test',
    title: 'Looking for beginner-friendly games',
    summary: 'New collector wanting gateway games to build my collection!',
    listingType: 'want',
    location: 'Tauranga',
    shippingAvailable: true,
    preferBundle: false,
    daysAgo: 3,
    games: [
      {
        title: 'Carcassonne',
        bggId: 822,
        condition: 'good',
        notes: 'Base game or with expansions - happy either way!',
      },
      {
        title: 'Splendor',
        bggId: 148228,
        condition: 'good',
        notes: 'Looking for a good price on this classic.',
      },
    ],
  },
  {
    ownerEmail: 'demo-tom@meeplecart.test',
    title: 'War game collection - Nelson',
    summary: 'Downsizing my war game collection. Shipping available nationwide.',
    listingType: 'sell',
    location: 'Nelson',
    shippingAvailable: true,
    preferBundle: true,
    bundleDiscount: 10,
    daysAgo: 18,
    games: [
      {
        title: 'Twilight Struggle',
        bggId: 12333,
        year: 2005,
        condition: 'excellent',
        price: 70,
        notes: 'Deluxe edition. All cards sleeved.',
      },
      {
        title: 'Root',
        bggId: 237182,
        year: 2018,
        condition: 'good',
        price: 85,
        notes: 'Base game + Riverfolk expansion. Minor box wear.',
      },
    ],
  },
  {
    ownerEmail: 'demo-lisa@meeplecart.test',
    title: 'Cooperative games for trade',
    summary: 'Looking to trade my co-ops for other co-ops or party games!',
    listingType: 'trade',
    location: 'Palmerston North',
    shippingAvailable: true,
    preferBundle: false,
    daysAgo: 7,
    games: [
      {
        title: 'Pandemic Legacy: Season 1',
        bggId: 161936,
        year: 2015,
        condition: 'good',
        tradeValue: 50,
        notes: 'Partially played (month 5). Great condition.',
      },
      {
        title: 'Spirit Island',
        bggId: 162886,
        year: 2017,
        condition: 'excellent',
        tradeValue: 90,
        notes: 'Includes Branch & Claw expansion. All components organized.',
      },
    ],
  },
  {
    ownerEmail: 'demo-alex@meeplecart.test',
    title: 'Quick sell - Moving overseas',
    summary: 'Need to sell quickly before my move. Great prices!',
    listingType: 'sell',
    location: 'Wellington',
    shippingAvailable: true,
    preferBundle: true,
    bundleDiscount: 25,
    daysAgo: 25,
    games: [
      {
        title: '7 Wonders Duel',
        bggId: 173346,
        year: 2015,
        condition: 'excellent',
        price: 40,
        notes: 'Two-player classic. Perfect condition.',
      },
      {
        title: 'Agricola',
        bggId: 31260,
        year: 2007,
        condition: 'good',
        price: 55,
        notes: 'Revised edition. All components present.',
      },
    ],
  },
  {
    ownerEmail: 'demo-bella@meeplecart.test',
    title: 'Modern classics bundle',
    summary: 'Award-winning games in excellent condition.',
    listingType: 'trade',
    location: 'Auckland',
    shippingAvailable: true,
    preferBundle: true,
    bundleDiscount: 15,
    daysAgo: 14,
    games: [
      {
        title: 'Cascadia',
        bggId: 295947,
        year: 2021,
        condition: 'mint',
        tradeValue: 55,
        notes: 'Spiel des Jahres 2022 winner. Unplayed.',
      },
      {
        title: 'Lost Ruins of Arnak',
        bggId: 312484,
        year: 2020,
        condition: 'excellent',
        tradeValue: 70,
        notes: 'Includes expedition leaders expansion.',
      },
    ],
  },
];

const escapeFilterValue = (value: string): string => {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
};

const findRecord = async (
  pb: PocketBase,
  collection: string,
  filter: string
): Promise<RecordModel | null> => {
  try {
    return await pb.collection(collection).getFirstListItem(filter);
  } catch (error) {
    if (error instanceof ClientResponseError && error.status === 404) {
      return null;
    }
    throw error;
  }
};

const ensureUser = async (seed: SeedUser): Promise<RecordModel | null> => {
  const joinedDate = new Date();
  joinedDate.setDate(joinedDate.getDate() - seed.joinedDaysAgo);

  const updatePayload = {
    display_name: seed.displayName,
    location: seed.location,
    phone: seed.phone ?? null,
    trade_count: seed.tradeCount,
    vouch_count: seed.vouchCount,
    joined_date: joinedDate.toISOString(),
    bio: seed.bio ?? '',
    preferred_contact: seed.preferredContact,
    preferred_regions: seed.preferredRegions ?? [],
    cascades_seeded: 0,
    cascades_received: 0,
    cascades_passed: 0,
    cascades_broken: 0,
    cascade_reputation: 50,
    can_enter_cascades: true,
  };

  const authClient = new PocketBase(baseUrl);

  try {
    const auth = await authClient.collection('users').authWithPassword(seed.email, seed.password);
    const updated = await authClient.collection('users').update(auth.record.id, updatePayload);
    authClient.authStore.clear();
    return updated;
  } catch (error) {
    if (!(error instanceof ClientResponseError) || error.status !== 400) {
      authClient.authStore.clear();
      throw error;
    }
  }

  authClient.authStore.clear();
  const createClient = new PocketBase(baseUrl);

  try {
    const created = await createClient.collection('users').create({
      email: seed.email,
      password: seed.password,
      passwordConfirm: seed.password,
      ...updatePayload,
    });
    createClient.authStore.clear();
    return created;
  } catch (error) {
    createClient.authStore.clear();
    if (error instanceof ClientResponseError && error.status === 400) {
      const details = JSON.stringify(error.response?.data ?? {});
      console.warn(`Skipping demo user ${seed.email}: ${error.message} ${details}`);
      return null;
    }
    throw error;
  }
};

const recreateListing = async (
  seed: SeedListing,
  ownerRecord: RecordModel,
  userPassword: string
): Promise<RecordModel> => {
  const userPb = new PocketBase(baseUrl);
  await userPb.collection('users').authWithPassword(seed.ownerEmail, userPassword);

  // Calculate created timestamp based on daysAgo
  const createdDate = new Date();
  createdDate.setDate(createdDate.getDate() - seed.daysAgo);

  const payload: Record<string, unknown> = {
    owner: ownerRecord.id,
    title: seed.title,
    summary: seed.summary,
    listing_type: seed.listingType,
    status: 'active',
    location: seed.location,
    shipping_available: seed.shippingAvailable,
    prefer_bundle: seed.preferBundle,
    bundle_discount: seed.bundleDiscount ?? null,
    views: Math.floor(Math.random() * 150) + 10,
  };

  const listing = await userPb.collection('listings').create(payload);

  // Update created timestamp to backdate the listing
  await userPb.collection('listings').update(listing.id, { created: createdDate.toISOString() });

  for (const game of seed.games) {
    const gamePayload: Record<string, unknown> = {
      listing: listing.id,
      title: game.title,
      condition: game.condition,
      status: game.status ?? 'available',
    };

    if (typeof game.bggId === 'number') {
      gamePayload.bgg_id = game.bggId;
    }

    if (typeof game.year === 'number') {
      gamePayload.year = game.year;
    }

    if (typeof game.price === 'number') {
      gamePayload.price = game.price;
    }

    if (typeof game.tradeValue === 'number') {
      gamePayload.trade_value = game.tradeValue;
    }

    if (game.notes) {
      gamePayload.notes = game.notes;
    }

    const gameRecord = await userPb.collection('games').create(gamePayload);

    // Backdate game creation
    await userPb.collection('games').update(gameRecord.id, { created: createdDate.toISOString() });
  }

  userPb.authStore.clear();
  return listing;
};

const addRandomReactions = async (listingId: string, userRecords: Map<string, RecordModel>, userEmails: string[]): Promise<void> => {
  const pb = new PocketBase(baseUrl);

  // Random number of reactions (0-4 users will react)
  const numReactions = Math.floor(Math.random() * 5);
  const shuffledUsers = [...userEmails].sort(() => Math.random() - 0.5);

  for (let i = 0; i < numReactions; i++) {
    const userEmail = shuffledUsers[i];
    const userRecord = userRecords.get(userEmail);
    if (!userRecord) continue;

    // Pick random emoji
    const randomEmoji = REACTION_EMOJIS[Math.floor(Math.random() * REACTION_EMOJIS.length)];

    try {
      await pb.collection('reactions').create({
        user: userRecord.id,
        listing: listingId,
        emoji: randomEmoji,
      });
    } catch (error) {
      // Ignore duplicate errors (unique constraint)
    }
  }
};

const clearAllListings = async (): Promise<void> => {
  const pb = new PocketBase(baseUrl);

  console.log('Clearing all listings...');

  // Get counts before deleting
  const games = await pb.collection('games').getFullList();
  const listings = await pb.collection('listings').getFullList();
  const reactions = await pb.collection('reactions').getFullList();

  // Delete reactions first (they reference listings)
  for (const reaction of reactions) {
    try {
      await pb.collection('reactions').delete(reaction.id);
    } catch (err) {
      // Ignore if already deleted
    }
  }

  // Delete listings (this will cascade delete games)
  for (const listing of listings) {
    try {
      await pb.collection('listings').delete(listing.id);
    } catch (err) {
      // Ignore if already deleted
    }
  }

  console.log(`Deleted ${listings.length} listings, ${games.length} games, and ${reactions.length} reactions.`);
};

const seedDemoData = async (): Promise<void> => {
  if (clearListings) {
    await clearAllListings();
  }

  console.log('\n=== Creating Demo Users ===\n');
  const userRecords = new Map<string, RecordModel>();

  for (const user of demoUsers) {
    const record = await ensureUser(user);

    if (!record) {
      continue;
    }

    userRecords.set(user.email, record);
    console.log(`✓ ${record.display_name} (joined ${user.joinedDaysAgo} days ago)`);
  }

  console.log('\n=== Creating Demo Listings ===\n');
  const listingRecords: RecordModel[] = [];

  for (const listing of demoListings) {
    const ownerRecord = userRecords.get(listing.ownerEmail);

    if (!ownerRecord) {
      console.warn(`⚠ Skipping listing for missing owner: ${listing.ownerEmail}`);
      continue;
    }

    const ownerSeed = demoUsers.find((user) => user.email === listing.ownerEmail);

    if (!ownerSeed) {
      console.warn(`⚠ Skipping listing; missing seed credentials for ${listing.ownerEmail}`);
      continue;
    }

    const record = await recreateListing(listing, ownerRecord, ownerSeed.password);
    listingRecords.push(record);
    console.log(`✓ "${listing.title}" (${listing.daysAgo} days ago, ${listing.games.length} games)`);

    // Add random reactions to this listing
    await addRandomReactions(record.id, userRecords, demoUsers.map((u) => u.email));
  }

  console.log('\n=== Summary ===\n');
  console.log(`✓ ${userRecords.size} demo users ensured`);
  console.log(`✓ ${listingRecords.length} listings created`);
  console.log(`✓ Activities spread across the last ${Math.max(...demoListings.map(l => l.daysAgo))} days`);
  console.log('\n✨ Demo data seeded successfully!\n');
};

seedDemoData()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed to seed demo data:\n', error);
    process.exit(1);
  });
