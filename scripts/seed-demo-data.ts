import PocketBase, { ClientResponseError, RecordModel } from 'pocketbase';

const baseUrl = (process.env.POCKETBASE_URL ?? 'http://127.0.0.1:8090').replace(/\/$/, '');

type SeedUser = {
  email: string;
  password: string;
  displayName: string;
  location: string;
  joinedDate: string;
  tradeCount: number;
  vouchCount: number;
  preferredContact: 'platform' | 'email' | 'phone';
  bio?: string;
  phone?: string;
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
  key: string;
  ownerEmail: string;
  title: string;
  summary: string;
  listingType: 'trade' | 'sell' | 'want';
  location: string;
  shippingAvailable: boolean;
  preferBundle: boolean;
  bundleDiscount?: number;
  views: number;
  games: SeedGame[];
};

type SeedTrade = {
  listingKey: string;
  buyerEmail: string;
  sellerEmail: string;
  status: 'initiated' | 'confirmed' | 'completed' | 'disputed';
  rating?: number;
  review?: string;
  completedDate?: string;
};

const demoUsers: SeedUser[] = [
  {
    email: 'demo-alex@meeplecart.test',
    password: 'TradeDemo2024!',
    displayName: 'Alex Thompson',
    location: 'Wellington, NZ',
    joinedDate: '2023-06-12T09:00:00.000Z',
    tradeCount: 12,
    vouchCount: 5,
    preferredContact: 'platform',
    bio: 'Co-op enthusiast with a soft spot for crunchy euros. Happy to meetup in the CBD.',
    phone: '+64 21 555 1234',
  },
  {
    email: 'demo-bella@meeplecart.test',
    password: 'TradeDemo2024!',
    displayName: 'Bella Ngata',
    location: 'Auckland, NZ',
    joinedDate: '2024-01-20T10:30:00.000Z',
    tradeCount: 7,
    vouchCount: 3,
    preferredContact: 'email',
    bio: 'Collecting narrative-heavy games and teaching them at our local community hub.',
  },
  {
    email: 'demo-kiran@meeplecart.test',
    password: 'TradeDemo2024!',
    displayName: 'Kiran Patel',
    location: 'Christchurch, NZ',
    joinedDate: '2022-11-05T08:45:00.000Z',
    tradeCount: 21,
    vouchCount: 11,
    preferredContact: 'phone',
    bio: 'Runs monthly swap nights. Looking to rehome well-loved strategy titles.',
    phone: '+64 27 777 8899',
  },
];

const demoListings: SeedListing[] = [
  {
    key: 'alex-trade-bundle',
    ownerEmail: 'demo-alex@meeplecart.test',
    title: '[Demo] Wellington euro trade bundle',
    summary:
      'Mix of medium-heavy euros ready for the next table. Prefer bundle swaps but open to offers.',
    listingType: 'trade',
    location: 'Wellington',
    shippingAvailable: true,
    preferBundle: true,
    bundleDiscount: 15,
    views: 128,
    games: [
      {
        title: 'Everdell',
        bggId: 199792,
        year: 2018,
        condition: 'excellent',
        tradeValue: 95,
        notes: 'Collector’s Edition with metal coins and wooden berries.',
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
    key: 'bella-sell-family',
    ownerEmail: 'demo-bella@meeplecart.test',
    title: '[Demo] Auckland family night sale',
    summary: 'Family-friendly lineup that we have outgrown. Priced to move, can post nationwide.',
    listingType: 'sell',
    location: 'Auckland',
    shippingAvailable: true,
    preferBundle: false,
    views: 86,
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
    key: 'kiran-want-to-buy',
    ownerEmail: 'demo-kiran@meeplecart.test',
    title: '[Demo] Christchurch wishlist',
    summary: 'Looking to buy or trade for narrative co-ops with strong solo support.',
    listingType: 'want',
    location: 'Christchurch',
    shippingAvailable: false,
    preferBundle: false,
    views: 44,
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
];

const demoTrades: SeedTrade[] = [
  {
    listingKey: 'alex-trade-bundle',
    buyerEmail: 'demo-bella@meeplecart.test',
    sellerEmail: 'demo-alex@meeplecart.test',
    status: 'completed',
    rating: 5,
    review: 'Smooth swap at Wellycon — games in top condition and great communication.',
    completedDate: '2024-05-18T01:30:00.000Z',
  },
  {
    listingKey: 'bella-sell-family',
    buyerEmail: 'demo-kiran@meeplecart.test',
    sellerEmail: 'demo-bella@meeplecart.test',
    status: 'confirmed',
    rating: 4,
    review: 'Awaiting courier pickup but Bella shared tracking immediately.',
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
  const updatePayload = {
    display_name: seed.displayName,
    location: seed.location,
    phone: seed.phone ?? null,
    trade_count: seed.tradeCount,
    vouch_count: seed.vouchCount,
    joined_date: seed.joinedDate,
    bio: seed.bio ?? '',
    preferred_contact: seed.preferredContact,
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

  const filter = `title = "${escapeFilterValue(seed.title)}" && owner = "${escapeFilterValue(ownerRecord.id)}"`;
  const existing = await findRecord(userPb, 'listings', filter);

  if (existing) {
    await userPb.collection('listings').delete(existing.id);
  }

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
    views: seed.views,
  };

  const listing = await userPb.collection('listings').create(payload);

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

    await userPb.collection('games').create(gamePayload);
  }

  userPb.authStore.clear();
  return listing;
};

const recreateTrade = async (
  seed: SeedTrade,
  listing: RecordModel,
  buyer: RecordModel,
  seller: RecordModel,
  buyerPassword: string
): Promise<void> => {
  const buyerPb = new PocketBase(baseUrl);
  await buyerPb.collection('users').authWithPassword(seed.buyerEmail, buyerPassword);

  const filter = `listing = "${escapeFilterValue(listing.id)}" && buyer = "${escapeFilterValue(buyer.id)}" && seller = "${escapeFilterValue(seller.id)}"`;
  const existing = await findRecord(buyerPb, 'trades', filter);

  if (existing) {
    await buyerPb.collection('trades').delete(existing.id);
  }

  const payload: Record<string, unknown> = {
    listing: listing.id,
    buyer: buyer.id,
    seller: seller.id,
    status: seed.status,
  };

  if (typeof seed.rating === 'number') {
    payload.rating = seed.rating;
  }

  if (seed.review) {
    payload.review = seed.review;
  }

  if (seed.completedDate) {
    payload.completed_date = seed.completedDate;
  }

  await buyerPb.collection('trades').create(payload);
  buyerPb.authStore.clear();
};

const seedDemoData = async (): Promise<void> => {
  const userRecords = new Map<string, RecordModel>();

  for (const user of demoUsers) {
    const record = await ensureUser(user);

    if (!record) {
      continue;
    }

    userRecords.set(user.email, record);
    console.log(`Ensured demo user: ${record.display_name ?? user.displayName}`);
  }

  const listingRecords = new Map<string, RecordModel>();

  for (const listing of demoListings) {
    const ownerRecord = userRecords.get(listing.ownerEmail);

    if (!ownerRecord) {
      console.warn(`Skipping listing for missing owner: ${listing.ownerEmail}`);
      continue;
    }

    const ownerSeed = demoUsers.find((user) => user.email === listing.ownerEmail);

    if (!ownerSeed) {
      console.warn(`Skipping listing; missing seed credentials for ${listing.ownerEmail}`);
      continue;
    }

    const record = await recreateListing(listing, ownerRecord, ownerSeed.password);
    listingRecords.set(listing.key, record);
    console.log(`Rebuilt demo listing: ${listing.title}`);
  }

  for (const trade of demoTrades) {
    const listingRecord = listingRecords.get(trade.listingKey);

    if (!listingRecord) {
      console.warn(`Skipping trade for missing listing: ${trade.listingKey}`);
      continue;
    }

    const buyerRecord = userRecords.get(trade.buyerEmail);
    const sellerRecord = userRecords.get(trade.sellerEmail);

    if (!buyerRecord || !sellerRecord) {
      console.warn(`Skipping trade with missing participants: ${trade.listingKey}`);
      continue;
    }

    const buyerSeed = demoUsers.find((user) => user.email === trade.buyerEmail);

    if (!buyerSeed) {
      console.warn(`Skipping trade; missing buyer credentials for ${trade.buyerEmail}`);
      continue;
    }

    await recreateTrade(trade, listingRecord, buyerRecord, sellerRecord, buyerSeed.password);
    console.log(
      `Recorded demo trade on ${listingRecord.title} between ${buyerRecord.display_name} and ${sellerRecord.display_name}`
    );
  }
};

seedDemoData()
  .then(() => {
    console.log('Demo data seed complete.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to seed demo data:\n', error);
    process.exit(1);
  });
