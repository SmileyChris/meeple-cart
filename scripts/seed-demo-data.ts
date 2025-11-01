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

type SeedVouch = {
  voucherEmail: string;
  voucheeEmail: string;
  message: string;
  daysAgo: number;
};

type SeedDiscussionThread = {
  authorEmail: string;
  title: string;
  content: string;
  daysAgo: number;
  listingTitle?: string; // If present, link to this listing
  pinned?: boolean;
  replies: SeedDiscussionReply[];
};

type SeedDiscussionReply = {
  authorEmail: string;
  content: string;
  hoursAfterThread: number; // Hours after thread creation
};

const demoUsers: SeedUser[] = [
  // Pillar of Trust - 10+ vouches, 20+ trades
  {
    email: 'demo-kiran@meeplecart.test',
    password: 'TradeDemo2024!',
    displayName: 'Kiran Patel',
    location: 'Christchurch',
    joinedDaysAgo: 730,
    tradeCount: 24,
    vouchCount: 12,
    preferredContact: 'phone',
    bio: 'Runs monthly swap nights. Looking to rehome well-loved strategy titles.',
    phone: '+64 27 777 8899',
    preferredRegions: ['canterbury'],
  },
  // Established Trader - 6-9 vouches, 10+ trades
  {
    email: 'demo-alex@meeplecart.test',
    password: 'TradeDemo2024!',
    displayName: 'Alex Thompson',
    location: 'Wellington',
    joinedDaysAgo: 547,
    tradeCount: 16,
    vouchCount: 8,
    preferredContact: 'platform',
    bio: 'Co-op enthusiast with a soft spot for crunchy euros. Happy to meetup in the CBD.',
    phone: '+64 21 555 1234',
    preferredRegions: ['wellington'],
  },
  {
    email: 'demo-james@meeplecart.test',
    password: 'TradeDemo2024!',
    displayName: 'James Chen',
    location: 'Dunedin',
    joinedDaysAgo: 421,
    tradeCount: 18,
    vouchCount: 7,
    preferredContact: 'email',
    bio: '18XX fanatic. Also into deck builders and engine builders.',
    phone: '+64 22 444 5566',
    preferredRegions: ['otago'],
  },
  // Trusted Member - 3-5 vouches, 5+ trades
  {
    email: 'demo-bella@meeplecart.test',
    password: 'TradeDemo2024!',
    displayName: 'Bella Ngata',
    location: 'Auckland',
    joinedDaysAgo: 284,
    tradeCount: 9,
    vouchCount: 5,
    preferredContact: 'email',
    bio: 'Collecting narrative-heavy games and teaching them at our local community hub.',
    preferredRegions: ['auckland'],
  },
  {
    email: 'demo-tom@meeplecart.test',
    password: 'TradeDemo2024!',
    displayName: 'Tom Harrison',
    location: 'Nelson',
    joinedDaysAgo: 245,
    tradeCount: 11,
    vouchCount: 4,
    preferredContact: 'email',
    bio: 'War games and miniatures. Open to trades or sales with shipping.',
    preferredRegions: ['nelson', 'tasman'],
  },
  {
    email: 'demo-sarah@meeplecart.test',
    password: 'TradeDemo2024!',
    displayName: 'Sarah Mitchell',
    location: 'Hamilton',
    joinedDaysAgo: 156,
    tradeCount: 7,
    vouchCount: 3,
    preferredContact: 'platform',
    bio: 'Party game collector. Always looking for quick-to-teach crowd pleasers!',
    preferredRegions: ['waikato'],
  },
  // Newcomer - 0-2 vouches, <5 trades
  {
    email: 'demo-maya@meeplecart.test',
    password: 'TradeDemo2024!',
    displayName: 'Maya Rodriguez',
    location: 'Tauranga',
    joinedDaysAgo: 92,
    tradeCount: 4,
    vouchCount: 2,
    preferredContact: 'platform',
    bio: 'New to the hobby! Looking for gateway games and friendly trades.',
    preferredRegions: ['bay_of_plenty'],
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
    title: 'Wellington euro trade bundle - Large collection',
    summary: 'Mix of medium-heavy euros ready for the next table. Prefer bundle swaps but open to offers. Moving to smaller space, need to downsize!',
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
      {
        title: 'Viticulture Essential Edition',
        bggId: 183394,
        year: 2015,
        condition: 'excellent',
        tradeValue: 80,
        notes: 'Includes Tuscany expansion. All components in great shape.',
      },
      {
        title: 'Terraforming Mars',
        bggId: 167791,
        year: 2016,
        condition: 'good',
        tradeValue: 70,
        notes: 'Base game with player mats. Cards are sleeved.',
      },
      {
        title: 'Scythe',
        bggId: 169786,
        year: 2016,
        condition: 'excellent',
        tradeValue: 85,
        notes: 'Metal coins included. Some minor box wear.',
      },
      {
        title: 'Concordia',
        bggId: 124361,
        year: 2013,
        condition: 'good',
        tradeValue: 65,
        notes: 'Classic euro, well-loved but complete.',
      },
      {
        title: 'A Feast for Odin',
        bggId: 177736,
        year: 2016,
        condition: 'excellent',
        tradeValue: 110,
        notes: 'All pieces punched and organized. Heavy game!',
      },
      {
        title: 'Caverna',
        bggId: 102794,
        year: 2013,
        condition: 'good',
        tradeValue: 90,
        notes: 'Lots of wooden pieces, all accounted for.',
      },
      {
        title: 'Gaia Project',
        bggId: 220308,
        year: 2017,
        condition: 'excellent',
        tradeValue: 100,
        notes: 'Brain burner! In excellent condition.',
      },
      {
        title: 'Underwater Cities',
        bggId: 247763,
        year: 2018,
        condition: 'mint',
        tradeValue: 75,
        notes: 'Played once, basically new.',
      },
    ],
  },
  {
    ownerEmail: 'demo-bella@meeplecart.test',
    title: 'Auckland family night sale - Big collection clearout',
    summary: 'Family-friendly lineup that we have outgrown. Priced to move, can post nationwide. Some already sold!',
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
        status: 'available',
      },
      {
        title: 'Azul',
        bggId: 230802,
        year: 2017,
        condition: 'mint',
        price: 45,
        notes: 'All tiles bagged; instructions pristine.',
        status: 'sold',
      },
      {
        title: 'Parks',
        bggId: 266524,
        year: 2019,
        condition: 'excellent',
        price: 60,
        notes: 'Nightfall expansion included; minor ding on outer sleeve.',
        status: 'pending',
      },
      {
        title: 'Kingdomino',
        bggId: 204583,
        year: 2016,
        condition: 'excellent',
        price: 30,
        notes: 'Spiel des Jahres winner. Perfect for kids.',
        status: 'available',
      },
      {
        title: 'Splendor',
        bggId: 148228,
        year: 2014,
        condition: 'good',
        price: 35,
        notes: 'Chips have minor wear but still gorgeous.',
        status: 'available',
      },
      {
        title: 'Carcassonne',
        bggId: 822,
        year: 2000,
        condition: 'good',
        price: 40,
        notes: 'Base game with Inns & Cathedrals expansion.',
        status: 'sold',
      },
      {
        title: 'Sushi Go Party!',
        bggId: 192291,
        year: 2016,
        condition: 'excellent',
        price: 25,
        notes: 'Kids favorite! All cards present.',
        status: 'available',
      },
      {
        title: 'Dixit',
        bggId: 39856,
        year: 2008,
        condition: 'excellent',
        price: 40,
        notes: 'Base game plus Journey expansion.',
        status: 'available',
      },
      {
        title: 'Pandemic',
        bggId: 30549,
        year: 2008,
        condition: 'good',
        price: 45,
        notes: 'Well-loved classic co-op. All pieces accounted for.',
        status: 'pending',
      },
      {
        title: 'Codenames',
        bggId: 178900,
        year: 2015,
        condition: 'excellent',
        price: 28,
        notes: 'Great party game. Used only a handful of times.',
        status: 'available',
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
    title: 'Party games collection - Hamilton pickup preferred',
    summary: 'Great for game nights! Selling to make room for new arrivals. Buy the bundle and save!',
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
        status: 'available',
      },
      {
        title: 'Just One',
        bggId: 254640,
        year: 2018,
        condition: 'good',
        price: 25,
        notes: 'Spiel des Jahres winner. Minor wear on cards.',
        status: 'bundled',
      },
      {
        title: 'Decrypto',
        bggId: 225694,
        year: 2018,
        condition: 'mint',
        price: 30,
        notes: 'Unopened/unplayed. Received as duplicate gift.',
        status: 'bundled',
      },
      {
        title: 'The Mind',
        bggId: 244992,
        year: 2018,
        condition: 'excellent',
        price: 18,
        notes: 'Surprisingly engaging! All cards in great shape.',
        status: 'available',
      },
      {
        title: 'Telestrations',
        bggId: 46213,
        year: 2009,
        condition: 'good',
        price: 32,
        notes: 'Hilarious drawing game. Some markers running low.',
        status: 'available',
      },
      {
        title: 'Skull',
        bggId: 92415,
        year: 2011,
        condition: 'excellent',
        price: 22,
        notes: 'Beautiful bluffing game. Minimal components.',
        status: 'bundled',
      },
      {
        title: 'Concept',
        bggId: 147151,
        year: 2013,
        condition: 'good',
        price: 28,
        notes: 'Creative guessing game. All tokens present.',
        status: 'available',
      },
      {
        title: 'Werewolf Legacy',
        bggId: 255796,
        year: 2018,
        condition: 'mint',
        price: 35,
        notes: 'Unopened. Legacy version of the classic.',
        status: 'available',
      },
      {
        title: 'Camel Up',
        bggId: 153938,
        year: 2014,
        condition: 'excellent',
        price: 38,
        notes: 'Spiel des Jahres winner. Betting and racing fun!',
        status: 'available',
      },
      {
        title: 'Monikers',
        bggId: 156546,
        year: 2015,
        condition: 'good',
        price: 30,
        notes: 'Like Charades but better. Well-loved.',
        status: 'available',
      },
    ],
  },
  {
    ownerEmail: 'demo-james@meeplecart.test',
    title: 'Strategy heavyweights collection - Dunedin',
    summary: 'Premium titles for experienced gamers. All well-maintained. Looking for other heavy euros or 18XX games.',
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
        status: 'available',
      },
      {
        title: 'Wingspan',
        bggId: 266192,
        year: 2019,
        condition: 'good',
        tradeValue: 65,
        notes: 'Base game + European expansion. Cards sleeved.',
        status: 'available',
      },
      {
        title: 'Food Chain Magnate',
        bggId: 175914,
        year: 2015,
        condition: 'excellent',
        tradeValue: 140,
        notes: 'Splotter classic. All components pristine.',
        status: 'available',
      },
      {
        title: 'Through the Ages',
        bggId: 182028,
        year: 2015,
        condition: 'good',
        tradeValue: 75,
        notes: 'New Story edition. Well-loved but complete.',
        status: 'pending',
      },
      {
        title: 'Twilight Imperium 4th Edition',
        bggId: 233078,
        year: 2017,
        condition: 'excellent',
        tradeValue: 150,
        notes: 'Epic space opera. Includes Prophecy of Kings expansion.',
        status: 'available',
      },
      {
        title: 'Spirit Island',
        bggId: 162886,
        year: 2017,
        condition: 'excellent',
        tradeValue: 90,
        notes: 'Base game with Branch & Claw expansion.',
        status: 'available',
      },
      {
        title: 'The Gallerist',
        bggId: 125153,
        year: 2015,
        condition: 'good',
        tradeValue: 85,
        notes: 'Lacerda masterpiece. Minor box wear.',
        status: 'available',
      },
      {
        title: 'On Mars',
        bggId: 184267,
        year: 2020,
        condition: 'mint',
        tradeValue: 120,
        notes: 'Another Lacerda brain burner. Played twice.',
        status: 'available',
      },
      {
        title: 'Leaving Earth',
        bggId: 173064,
        year: 2015,
        condition: 'excellent',
        tradeValue: 70,
        notes: 'Realistic space exploration. All expansions included.',
        status: 'available',
      },
      {
        title: 'Age of Steam',
        bggId: 4098,
        year: 2002,
        condition: 'good',
        tradeValue: 95,
        notes: 'Classic train game with several map expansions.',
        status: 'available',
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
    title: 'War game & miniatures collection - Nelson',
    summary: 'Downsizing my war game collection. Shipping available nationwide. Bundle discount available!',
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
        status: 'available',
      },
      {
        title: 'Root',
        bggId: 237182,
        year: 2018,
        condition: 'good',
        price: 85,
        notes: 'Base game + Riverfolk expansion. Minor box wear.',
        status: 'available',
      },
      {
        title: 'Star Wars: Rebellion',
        bggId: 187645,
        year: 2016,
        condition: 'excellent',
        price: 110,
        notes: 'Epic 2-player experience. All miniatures painted.',
        status: 'available',
      },
      {
        title: 'Memoir 44',
        bggId: 10630,
        year: 2004,
        condition: 'good',
        price: 55,
        notes: 'WW2 tactical game. Includes Eastern Front expansion.',
        status: 'available',
      },
      {
        title: 'Commands & Colors: Ancients',
        bggId: 14105,
        year: 2006,
        condition: 'excellent',
        price: 80,
        notes: 'Ancient warfare at its finest. Multiple expansions included.',
        status: 'sold',
      },
      {
        title: 'War of the Ring (2nd ed.)',
        bggId: 115746,
        year: 2012,
        condition: 'excellent',
        price: 120,
        notes: 'Epic LOTR experience. Minor shelf wear on box.',
        status: 'available',
      },
      {
        title: 'Axis & Allies 1942',
        bggId: 41863,
        year: 2009,
        condition: 'good',
        price: 50,
        notes: 'Classic WW2 grand strategy. Well-played but complete.',
        status: 'available',
      },
      {
        title: 'Combat Commander: Europe',
        bggId: 21050,
        year: 2006,
        condition: 'good',
        price: 65,
        notes: 'Tactical WW2 card-driven game.',
        status: 'available',
      },
      {
        title: 'Star Wars: Legion Core Set',
        bggId: 233094,
        year: 2018,
        condition: 'excellent',
        price: 95,
        notes: 'Miniatures game. All minis primed, many painted.',
        status: 'pending',
      },
      {
        title: 'Blood Rage',
        bggId: 170216,
        year: 2015,
        condition: 'mint',
        price: 90,
        notes: 'Viking area control with gorgeous minis.',
        status: 'available',
      },
    ],
  },
  {
    ownerEmail: 'demo-lisa@meeplecart.test',
    title: 'Cooperative games collection for trade',
    summary: 'Looking to trade my co-ops for other co-ops or party games! Love thematic games with good narratives.',
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
        status: 'available',
      },
      {
        title: 'Spirit Island',
        bggId: 162886,
        year: 2017,
        condition: 'excellent',
        tradeValue: 90,
        notes: 'Includes Branch & Claw expansion. All components organized.',
        status: 'available',
      },
      {
        title: 'Arkham Horror: The Card Game',
        bggId: 205637,
        year: 2016,
        condition: 'excellent',
        tradeValue: 60,
        notes: 'Core set plus Dunwich Legacy campaign. Cards sleeved.',
        status: 'available',
      },
      {
        title: 'Robinson Crusoe',
        bggId: 121921,
        year: 2012,
        condition: 'good',
        tradeValue: 70,
        notes: 'Challenging survival co-op. Minor component wear.',
        status: 'available',
      },
      {
        title: 'Mansions of Madness 2nd Edition',
        bggId: 205059,
        year: 2016,
        condition: 'excellent',
        tradeValue: 95,
        notes: 'App-driven horror game. All miniatures included.',
        status: 'pending',
      },
      {
        title: 'Horrified',
        bggId: 282524,
        year: 2019,
        condition: 'mint',
        tradeValue: 45,
        notes: 'Universal Monsters co-op. Unplayed.',
        status: 'available',
      },
      {
        title: 'Forbidden Desert',
        bggId: 136063,
        year: 2013,
        condition: 'good',
        tradeValue: 30,
        notes: 'Quick co-op survival game. Well-loved.',
        status: 'available',
      },
      {
        title: 'Zombicide: Black Plague',
        bggId: 176189,
        year: 2015,
        condition: 'excellent',
        tradeValue: 80,
        notes: 'Medieval zombie slaying. Lots of minis!',
        status: 'available',
      },
      {
        title: 'The Crew: Quest for Planet Nine',
        bggId: 284083,
        year: 2019,
        condition: 'excellent',
        tradeValue: 25,
        notes: 'Co-op trick-taking game. Kenner Spiel winner.',
        status: 'available',
      },
      {
        title: 'Gloomhaven: Jaws of the Lion',
        bggId: 291457,
        year: 2020,
        condition: 'excellent',
        tradeValue: 55,
        notes: 'Campaign dungeon crawler. Great intro to Gloomhaven.',
        status: 'available',
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

const demoVouches: SeedVouch[] = [
  // Kiran (Pillar) receives vouches from many people
  {
    voucherEmail: 'demo-alex@meeplecart.test',
    voucheeEmail: 'demo-kiran@meeplecart.test',
    message: 'Super reliable trader! Met up twice and both times were smooth. Highly recommend.',
    daysAgo: 45,
  },
  {
    voucherEmail: 'demo-bella@meeplecart.test',
    voucheeEmail: 'demo-kiran@meeplecart.test',
    message: 'Kiran runs amazing game nights and is always fair in trades. A+',
    daysAgo: 67,
  },
  {
    voucherEmail: 'demo-james@meeplecart.test',
    voucheeEmail: 'demo-kiran@meeplecart.test',
    message: 'Completed a large trade with Kiran. Games were exactly as described. Trustworthy!',
    daysAgo: 120,
  },
  {
    voucherEmail: 'demo-tom@meeplecart.test',
    voucheeEmail: 'demo-kiran@meeplecart.test',
    message: 'Great communication and honest about condition. Would trade again!',
    daysAgo: 156,
  },
  {
    voucherEmail: 'demo-sarah@meeplecart.test',
    voucheeEmail: 'demo-kiran@meeplecart.test',
    message: 'Kiran helped me get started in the hobby. Generous and patient!',
    daysAgo: 89,
  },
  {
    voucherEmail: 'demo-maya@meeplecart.test',
    voucheeEmail: 'demo-kiran@meeplecart.test',
    message: 'First trade and Kiran made it super easy. Thank you!',
    daysAgo: 23,
  },

  // Alex (Established) receives vouches
  {
    voucherEmail: 'demo-kiran@meeplecart.test',
    voucheeEmail: 'demo-alex@meeplecart.test',
    message: 'Alex is a great trader with excellent taste in euros. Smooth transaction!',
    daysAgo: 50,
  },
  {
    voucherEmail: 'demo-james@meeplecart.test',
    voucheeEmail: 'demo-alex@meeplecart.test',
    message: 'Quick responses, fair deals. Would definitely trade again.',
    daysAgo: 78,
  },
  {
    voucherEmail: 'demo-bella@meeplecart.test',
    voucheeEmail: 'demo-alex@meeplecart.test',
    message: 'Met up in Wellington. Alex is friendly and honest. Recommended!',
    daysAgo: 102,
  },
  {
    voucherEmail: 'demo-sarah@meeplecart.test',
    voucheeEmail: 'demo-alex@meeplecart.test',
    message: 'Great experience trading with Alex!',
    daysAgo: 145,
  },

  // James (Established) receives vouches
  {
    voucherEmail: 'demo-kiran@meeplecart.test',
    voucheeEmail: 'demo-james@meeplecart.test',
    message: 'Fellow heavy gamer! James always packs games well for shipping.',
    daysAgo: 134,
  },
  {
    voucherEmail: 'demo-alex@meeplecart.test',
    voucheeEmail: 'demo-james@meeplecart.test',
    message: 'Traded some heavy euros. All in perfect condition as described.',
    daysAgo: 92,
  },
  {
    voucherEmail: 'demo-tom@meeplecart.test',
    voucheeEmail: 'demo-james@meeplecart.test',
    message: 'Great knowledge and fair prices. Pleasure to trade with!',
    daysAgo: 67,
  },

  // Bella (Trusted) receives vouches
  {
    voucherEmail: 'demo-kiran@meeplecart.test',
    voucheeEmail: 'demo-bella@meeplecart.test',
    message: 'Bella is wonderful to work with. Games arrived perfectly packed!',
    daysAgo: 76,
  },
  {
    voucherEmail: 'demo-alex@meeplecart.test',
    voucheeEmail: 'demo-bella@meeplecart.test',
    message: 'Smooth trade! Bella is trustworthy and communicative.',
    daysAgo: 112,
  },
  {
    voucherEmail: 'demo-sarah@meeplecart.test',
    voucheeEmail: 'demo-bella@meeplecart.test',
    message: 'Great selection of family games. Thanks Bella!',
    daysAgo: 45,
  },

  // Tom (Trusted) receives vouches
  {
    voucherEmail: 'demo-james@meeplecart.test',
    voucheeEmail: 'demo-tom@meeplecart.test',
    message: 'Tom knows war games inside and out. Fair trades every time.',
    daysAgo: 88,
  },
  {
    voucherEmail: 'demo-kiran@meeplecart.test',
    voucheeEmail: 'demo-tom@meeplecart.test',
    message: 'Reliable and responsive. Would trade again!',
    daysAgo: 134,
  },

  // Sarah (Trusted) receives vouches
  {
    voucherEmail: 'demo-bella@meeplecart.test',
    voucheeEmail: 'demo-sarah@meeplecart.test',
    message: 'Sarah has the best party games! Great trader.',
    daysAgo: 56,
  },
  {
    voucherEmail: 'demo-maya@meeplecart.test',
    voucheeEmail: 'demo-sarah@meeplecart.test',
    message: 'Helped me find games for game night. Super helpful!',
    daysAgo: 34,
  },

  // Maya (Newcomer) receives vouches
  {
    voucherEmail: 'demo-kiran@meeplecart.test',
    voucheeEmail: 'demo-maya@meeplecart.test',
    message: 'Great first trade with Maya. Looking forward to more!',
    daysAgo: 29,
  },
  {
    voucherEmail: 'demo-sarah@meeplecart.test',
    voucheeEmail: 'demo-maya@meeplecart.test',
    message: 'Maya is enthusiastic and reliable. Welcome to the community!',
    daysAgo: 18,
  },

  // Additional vouches to match counts
  // More for Kiran (needs 6 more)
  {
    voucherEmail: 'demo-lisa@meeplecart.test',
    voucheeEmail: 'demo-kiran@meeplecart.test',
    message: 'Kiran was so helpful for my first trade! Patient and kind.',
    daysAgo: 200,
  },
  {
    voucherEmail: 'demo-maya@meeplecart.test',
    voucheeEmail: 'demo-kiran@meeplecart.test',
    message: 'Second trade with Kiran, just as smooth!',
    daysAgo: 180,
  },
  {
    voucherEmail: 'demo-tom@meeplecart.test',
    voucheeEmail: 'demo-kiran@meeplecart.test',
    message: 'Always fair and honest. Top trader!',
    daysAgo: 220,
  },
  {
    voucherEmail: 'demo-sarah@meeplecart.test',
    voucheeEmail: 'demo-kiran@meeplecart.test',
    message: 'Second vouch - Kiran is consistently excellent!',
    daysAgo: 165,
  },
  {
    voucherEmail: 'demo-james@meeplecart.test',
    voucheeEmail: 'demo-kiran@meeplecart.test',
    message: 'Another great trade! Kiran is the best.',
    daysAgo: 190,
  },
  {
    voucherEmail: 'demo-bella@meeplecart.test',
    voucheeEmail: 'demo-kiran@meeplecart.test',
    message: 'Multiple trades, all perfect. Highly recommend!',
    daysAgo: 175,
  },

  // More for Alex (needs 4 more)
  {
    voucherEmail: 'demo-tom@meeplecart.test',
    voucheeEmail: 'demo-alex@meeplecart.test',
    message: 'Good communication and fair deals!',
    daysAgo: 234,
  },
  {
    voucherEmail: 'demo-lisa@meeplecart.test',
    voucheeEmail: 'demo-alex@meeplecart.test',
    message: 'Alex helped me understand game values. Great trader!',
    daysAgo: 198,
  },
  {
    voucherEmail: 'demo-maya@meeplecart.test',
    voucheeEmail: 'demo-alex@meeplecart.test',
    message: 'Smooth trade, would recommend!',
    daysAgo: 167,
  },
  {
    voucherEmail: 'demo-kiran@meeplecart.test',
    voucheeEmail: 'demo-alex@meeplecart.test',
    message: 'Another successful trade with Alex!',
    daysAgo: 143,
  },

  // More for James (needs 4 more)
  {
    voucherEmail: 'demo-bella@meeplecart.test',
    voucheeEmail: 'demo-james@meeplecart.test',
    message: 'Traded some heavy games. James knows his stuff!',
    daysAgo: 189,
  },
  {
    voucherEmail: 'demo-sarah@meeplecart.test',
    voucheeEmail: 'demo-james@meeplecart.test',
    message: 'Great trader, very knowledgeable!',
    daysAgo: 156,
  },
  {
    voucherEmail: 'demo-lisa@meeplecart.test',
    voucheeEmail: 'demo-james@meeplecart.test',
    message: 'James was patient with my questions. Thanks!',
    daysAgo: 201,
  },
  {
    voucherEmail: 'demo-maya@meeplecart.test',
    voucheeEmail: 'demo-james@meeplecart.test',
    message: 'Good experience trading with James!',
    daysAgo: 178,
  },

  // More for Bella (needs 2 more)
  {
    voucherEmail: 'demo-james@meeplecart.test',
    voucheeEmail: 'demo-bella@meeplecart.test',
    message: 'Bella has great games and is easy to work with!',
    daysAgo: 167,
  },
  {
    voucherEmail: 'demo-tom@meeplecart.test',
    voucheeEmail: 'demo-bella@meeplecart.test',
    message: 'Reliable and friendly. Would trade again!',
    daysAgo: 145,
  },

  // More for Tom (needs 2 more)
  {
    voucherEmail: 'demo-bella@meeplecart.test',
    voucheeEmail: 'demo-tom@meeplecart.test',
    message: 'Tom shipped quickly and safely. Great trader!',
    daysAgo: 198,
  },
  {
    voucherEmail: 'demo-alex@meeplecart.test',
    voucheeEmail: 'demo-tom@meeplecart.test',
    message: 'Smooth trade with Tom. Recommended!',
    daysAgo: 167,
  },

  // More for Sarah (needs 1 more)
  {
    voucherEmail: 'demo-alex@meeplecart.test',
    voucheeEmail: 'demo-sarah@meeplecart.test',
    message: 'Great party games collection! Thanks Sarah.',
    daysAgo: 123,
  },
];

const demoDiscussions: SeedDiscussionThread[] = [
  // General discussions
  {
    authorEmail: 'demo-kiran@meeplecart.test',
    title: 'Welcome to Meeple Cart!',
    content:
      "Kia ora everyone! 👋\n\nWelcome to the Meeple Cart discussion forums. This is a space for our trading community to chat about board games, organize meetups, and help each other out.\n\n**Some guidelines:**\n- Be respectful and friendly\n- Keep discussions relevant to board gaming and trading\n- Use listing-specific discussions for questions about particular items\n- Have fun and share your passion for games!\n\nFeel free to introduce yourself below. What got you into board gaming?",
    daysAgo: 30,
    pinned: true,
    replies: [
      {
        authorEmail: 'demo-lisa@meeplecart.test',
        content:
          "Hi everyone! I'm Lisa and I just joined last month. Got into board games during lockdown and now I'm hooked! Mainly love co-op games.",
        hoursAfterThread: 2,
      },
      {
        authorEmail: 'demo-maya@meeplecart.test',
        content:
          "Hello! Maya here from Tauranga. Started with Catan and now branching out. This community seems amazing!",
        hoursAfterThread: 5,
      },
      {
        authorEmail: 'demo-alex@meeplecart.test',
        content:
          "Been in the hobby for years. Found Meeple Cart through a friend and it's been great for trading games I don't play anymore. Welcome to all the newcomers!",
        hoursAfterThread: 8,
      },
    ],
  },
  {
    authorEmail: 'demo-james@meeplecart.test',
    title: 'Heavy Euro Enthusiasts - Auckland Meetup?',
    content:
      "Anyone in the Auckland area interested in a heavy euro game day? I'm thinking we could meet at a cafe or game store and play some meaty games.\n\nI can bring:\n- Brass: Birmingham\n- Gaia Project\n- Food Chain Magnate\n- A Feast for Odin\n\nLooking for 3-4 people who enjoy 3+ hour games. Maybe a Saturday in December?",
    daysAgo: 7,
    replies: [
      {
        authorEmail: 'demo-bella@meeplecart.test',
        content:
          "I'm in Auckland! I love heavy euros. Brass: Birmingham is one of my favorites. I could host if needed - have a big dining table.",
        hoursAfterThread: 3,
      },
      {
        authorEmail: 'demo-alex@meeplecart.test',
        content:
          "Not in Auckland but just want to say Food Chain Magnate is amazing. You all are in for a treat!",
        hoursAfterThread: 6,
      },
      {
        authorEmail: 'demo-james@meeplecart.test',
        content:
          "@Bella that would be fantastic! I'll DM you to coordinate. Anyone else interested?",
        hoursAfterThread: 12,
      },
    ],
  },
  {
    authorEmail: 'demo-sarah@meeplecart.test',
    title: 'Best gateway games to introduce new players?',
    content:
      "I'm hosting a game night next week with some friends who have never played modern board games. Looking for recommendations!\n\nWhat are your go-to games for introducing people to the hobby? I'm thinking Ticket to Ride and Splendor, but would love more ideas.",
    daysAgo: 3,
    replies: [
      {
        authorEmail: 'demo-kiran@meeplecart.test',
        content:
          "Great choices! I'd also recommend:\n- Azul (beautiful and simple)\n- Carcassonne (tile laying is intuitive)\n- Sushi Go (quick card game)\n- Codenames (great for larger groups)\n\nThe key is keeping rules simple and game time under 45 mins for the first game.",
        hoursAfterThread: 1,
      },
      {
        authorEmail: 'demo-bella@meeplecart.test',
        content:
          "I second Azul! It's gorgeous and people get it immediately. Also, Pandemic is great if they like co-op - you can help them without it feeling bad.",
        hoursAfterThread: 4,
      },
      {
        authorEmail: 'demo-maya@meeplecart.test',
        content:
          "Just went through this myself! Ticket to Ride was perfect for my group. Also King of Tokyo was a hit - simple but exciting.",
        hoursAfterThread: 7,
      },
      {
        authorEmail: 'demo-sarah@meeplecart.test',
        content:
          "Thanks everyone! I'll grab Azul and maybe Pandemic. Have both in my collection already.",
        hoursAfterThread: 24,
      },
    ],
  },
  {
    authorEmail: 'demo-tom@meeplecart.test',
    title: 'Trading etiquette question',
    content:
      "Quick question for the community - what's the proper etiquette if you change your mind about a trade before confirming?\n\nI proposed a trade yesterday but realized I actually want to keep the game. Haven't heard back from the other person yet. Should I wait or cancel now?",
    daysAgo: 1,
    replies: [
      {
        authorEmail: 'demo-kiran@meeplecart.test',
        content:
          "It's totally fine to change your mind before confirmation! Just send them a polite message explaining. We've all been there - sometimes you realize you still want to play a game.\n\nOnce confirmed is different - then you should honor it unless there's a real problem.",
        hoursAfterThread: 0.5,
      },
      {
        authorEmail: 'demo-alex@meeplecart.test',
        content:
          "Agreed with Kiran. Better to cancel early than to regret it later. Just be honest and apologize for any inconvenience.",
        hoursAfterThread: 2,
      },
      {
        authorEmail: 'demo-tom@meeplecart.test',
        content: 'Thanks! That makes me feel better. Will message them now.',
        hoursAfterThread: 3,
      },
    ],
  },

  // Listing-specific discussions
  {
    authorEmail: 'demo-maya@meeplecart.test',
    title: 'Question about Carcassonne',
    content:
      "Hi Bella! I'm interested in the Carcassonne in your family games listing. You mentioned it includes Inns & Cathedrals - does it have the big meeple too? Thanks!",
    daysAgo: 4,
    listingTitle: 'Auckland family night sale - Big collection clearout',
    replies: [
      {
        authorEmail: 'demo-bella@meeplecart.test',
        content: 'Yes it does! All expansion components are included. Happy to send photos if helpful.',
        hoursAfterThread: 2,
      },
      {
        authorEmail: 'demo-maya@meeplecart.test',
        content: "That's perfect! I'll send you a message to work out details.",
        hoursAfterThread: 3,
      },
    ],
  },
  {
    authorEmail: 'demo-alex@meeplecart.test',
    title: 'Bundle trade possibility?',
    content:
      "Hey Kiran! I'm really interested in Sleeping Gods and Destinies from your want list. I have both! Would you be interested in trading some of your strategy collection for them? Let me know what you think would be fair.",
    daysAgo: 6,
    listingTitle: 'Christchurch wishlist - narrative co-ops wanted',
    replies: [
      {
        authorEmail: 'demo-kiran@meeplecart.test',
        content:
          "Oh wow, that would be amazing! I'd definitely be interested. Those are high on my list. Let me DM you and we can work out the details. Which games of mine caught your eye?",
        hoursAfterThread: 1,
      },
      {
        authorEmail: 'demo-alex@meeplecart.test',
        content:
          "I was thinking maybe Brass: Birmingham or Food Chain Magnate? I know those are valuable so happy to discuss what's fair. DMing you now!",
        hoursAfterThread: 2,
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

const createVouch = async (
  seed: SeedVouch,
  userRecords: Map<string, RecordModel>,
  userPassword: string
): Promise<RecordModel | null> => {
  const pb = new PocketBase(baseUrl);
  const voucherRecord = userRecords.get(seed.voucherEmail);
  const voucheeRecord = userRecords.get(seed.voucheeEmail);

  if (!voucherRecord || !voucheeRecord) {
    console.warn(`⚠ Skipping vouch: missing user(s)`);
    return null;
  }

  const createdDate = new Date();
  createdDate.setDate(createdDate.getDate() - seed.daysAgo);

  try {
    // Authenticate as the voucher (required by createRule)
    await pb.collection('users').authWithPassword(seed.voucherEmail, userPassword);

    const vouch = await pb.collection('vouches').create({
      voucher: voucherRecord.id,
      vouchee: voucheeRecord.id,
      message: seed.message,
      created: createdDate.toISOString(),
    });

    pb.authStore.clear();
    return vouch;
  } catch (error: any) {
    pb.authStore.clear();
    console.warn(`⚠ Failed to create vouch: ${error}`);
    if (error.response?.data) {
      console.warn(`  Details: ${JSON.stringify(error.response.data)}`);
    }
    return null;
  }
};

const createDiscussionThread = async (
  seed: SeedDiscussionThread,
  userRecords: Map<string, RecordModel>,
  listingRecords: RecordModel[],
  userPassword: string
): Promise<RecordModel | null> => {
  const pb = new PocketBase(baseUrl);
  const authorRecord = userRecords.get(seed.authorEmail);

  if (!authorRecord) {
    console.warn(`⚠ Skipping discussion: missing author ${seed.authorEmail}`);
    return null;
  }

  const threadDate = new Date();
  threadDate.setDate(threadDate.getDate() - seed.daysAgo);

  // Find listing if specified
  let listingId: string | null = null;
  if (seed.listingTitle) {
    const listing = listingRecords.find((l) => l.title === seed.listingTitle);
    if (listing) {
      listingId = listing.id;
    } else {
      console.warn(`⚠ Could not find listing: ${seed.listingTitle}`);
    }
  }

  try {
    // Authenticate as the author (required by createRule)
    await pb.collection('users').authWithPassword(seed.authorEmail, userPassword);

    const thread = await pb.collection('discussion_threads').create({
      author: authorRecord.id,
      title: seed.title,
      content: seed.content,
      listing: listingId,
      pinned: seed.pinned ?? false,
      locked: false,
      view_count: Math.floor(Math.random() * 50) + 5,
      reply_count: seed.replies.length,
      last_reply_at: seed.replies.length > 0 ? null : threadDate.toISOString(),
    });

    try {
      // Update created timestamp
      await pb.collection('discussion_threads').update(thread.id, {
        created: threadDate.toISOString(),
      });
    } catch (updateError: any) {
      console.warn(`    ⚠ Could not update created timestamp: ${updateError}`);
      // Continue anyway - not critical
    }

    // Create replies
    let lastReplyDate = threadDate;
    for (const replySeed of seed.replies) {
      const replyAuthorRecord = userRecords.get(replySeed.authorEmail);
      if (!replyAuthorRecord) {
        console.warn(`⚠ Skipping reply: missing author ${replySeed.authorEmail}`);
        continue;
      }

      const replyDate = new Date(threadDate.getTime() + replySeed.hoursAfterThread * 60 * 60 * 1000);
      lastReplyDate = replyDate;

      // Authenticate as reply author
      await pb.collection('users').authWithPassword(replySeed.authorEmail, userPassword);

      const reply = await pb.collection('discussion_replies').create({
        thread: thread.id,
        author: replyAuthorRecord.id,
        content: replySeed.content,
      });

      try {
        // Update created timestamp
        await pb.collection('discussion_replies').update(reply.id, {
          created: replyDate.toISOString(),
        });
      } catch (updateError: any) {
        console.warn(`    ⚠ Could not update reply created timestamp: ${updateError}`);
        // Continue anyway
      }
    }

    // Update last_reply_at if there were replies
    if (seed.replies.length > 0) {
      await pb.collection('discussion_threads').update(thread.id, {
        last_reply_at: lastReplyDate.toISOString(),
      });
    }

    pb.authStore.clear();
    return thread;
  } catch (error: any) {
    pb.authStore.clear();
    console.warn(`⚠ Failed to create discussion: ${error}`);
    if (error.response?.data) {
      console.warn(`  Details: ${JSON.stringify(error.response.data)}`);
    }
    return null;
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

  console.log('\n=== Creating Vouches ===\n');
  const vouchRecords: RecordModel[] = [];
  const demoPassword = 'TradeDemo2024!'; // All demo users use the same password
  for (const vouch of demoVouches) {
    const record = await createVouch(vouch, userRecords, demoPassword);
    if (record) {
      vouchRecords.push(record);
      const voucherName = userRecords.get(vouch.voucherEmail)?.display_name;
      const voucheeName = userRecords.get(vouch.voucheeEmail)?.display_name;
      console.log(`✓ ${voucherName} vouched for ${voucheeName} (${vouch.daysAgo} days ago)`);
    }
  }

  console.log('\n=== Creating Discussions ===\n');
  const discussionRecords: RecordModel[] = [];
  for (const discussion of demoDiscussions) {
    const record = await createDiscussionThread(discussion, userRecords, listingRecords, demoPassword);
    if (record) {
      discussionRecords.push(record);
      const authorName = userRecords.get(discussion.authorEmail)?.display_name;
      const typeLabel = discussion.listingTitle ? 'listing discussion' : 'general discussion';
      console.log(
        `✓ "${discussion.title}" by ${authorName} (${typeLabel}, ${discussion.replies.length} replies)`
      );
    } else {
      console.log(`✗ Failed to create: "${discussion.title}"`);
    }
  }

  console.log('\n=== Summary ===\n');
  console.log(`✓ ${userRecords.size} demo users ensured`);
  console.log(`✓ ${listingRecords.length} listings created`);
  console.log(`✓ ${vouchRecords.length} vouches created`);
  console.log(`✓ ${discussionRecords.length} discussion threads created`);
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
