import http from 'node:http';
import { URL } from 'node:url';

type MockPocketBaseServerOptions = {
  port?: number;
  host?: string;
};

type MockListingRecord = {
  collectionId: string;
  collectionName: string;
  created: string;
  expand: {
    owner: {
      collectionId: string;
      collectionName: string;
      created: string;
      display_name: string;
      id: string;
      updated: string;
    };
  };
  id: string;
  listing_type: string;
  location: string;
  owner: string;
  photos: string[];
  status: string;
  summary: string;
  title: string;
  updated: string;
};

type MockDatasetName = 'default' | 'empty' | 'want_focus';

const defaultHost = '127.0.0.1';
const defaultPort = 18_090;

const createDefaultListings = (now: string): MockListingRecord[] => [
  {
    collectionId: 'listings',
    collectionName: 'listings',
    created: now,
    expand: {
      owner: {
        collectionId: 'users',
        collectionName: 'users',
        created: now,
        display_name: 'Mock Trader',
        id: 'mock-user-1',
        updated: now,
      },
    },
    id: 'mock-listing-1',
    listing_type: 'sell',
    location: 'Wellington, NZ',
    owner: 'mock-user-1',
    photos: [],
    status: 'active',
    summary: 'Lightly played copy, all components sleeved.',
    title: 'Ticket to Ride',
    updated: now,
  },
  {
    collectionId: 'listings',
    collectionName: 'listings',
    created: now,
    expand: {
      owner: {
        collectionId: 'users',
        collectionName: 'users',
        created: now,
        display_name: 'Auckland Board Gamer',
        id: 'mock-user-2',
        updated: now,
      },
    },
    id: 'mock-listing-2',
    listing_type: 'trade',
    location: 'Auckland, NZ',
    owner: 'mock-user-2',
    photos: [],
    status: 'active',
    summary: 'Looking to trade for co-ops or party games.',
    title: 'Wingspan',
    updated: now,
  },
  {
    collectionId: 'listings',
    collectionName: 'listings',
    created: now,
    expand: {
      owner: {
        collectionId: 'users',
        collectionName: 'users',
        created: now,
        display_name: 'Christchurch Collector',
        id: 'mock-user-3',
        updated: now,
      },
    },
    id: 'mock-listing-3',
    listing_type: 'want',
    location: 'Christchurch, NZ',
    owner: 'mock-user-3',
    photos: [],
    status: 'active',
    summary: 'WTB: Looking to buy Gloomhaven in good condition.',
    title: 'Want to buy Gloomhaven',
    updated: now,
  },
];

const mockDatasets: Record<MockDatasetName, MockListingRecord[]> = {
  default: createDefaultListings(new Date().toISOString()),
  empty: [],
  want_focus: (() => {
    const now = new Date().toISOString();
    return [
      {
        collectionId: 'listings',
        collectionName: 'listings',
        created: now,
        expand: {
          owner: {
            collectionId: 'users',
            collectionName: 'users',
            created: now,
            display_name: 'WTB Superfan',
            id: 'mock-user-4',
            updated: now,
          },
        },
        id: 'mock-listing-4',
        listing_type: 'want',
        location: 'Wellington, NZ',
        owner: 'mock-user-4',
        photos: [],
        status: 'active',
        summary: 'WTB: Keen to buy Heat: Pedal to the Metal, ideally pickup in Wellington.',
        title: 'Want to buy Heat: Pedal to the Metal',
        updated: now,
      },
    ];
  })(),
};

let activeDataset: MockDatasetName = 'default';
let customListings: MockListingRecord[] | null = null;

const buildListingsResponse = () => {
  const listings = customListings ?? mockDatasets[activeDataset] ?? [];
  return {
    page: 1,
    perPage: 24,
    totalItems: listings.length,
    totalPages: 1,
    items: listings,
  };
};

const handleConfigUpdate = async (
  req: http.IncomingMessage,
  res: http.ServerResponse<http.IncomingMessage>
) => {
  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
  });

  await new Promise<void>((resolve) => req.on('end', () => resolve()));

  try {
    const payload = body
      ? (JSON.parse(body) as {
          dataset?: MockDatasetName;
          listings?: MockListingRecord[];
          reset?: boolean;
        })
      : {};

    if (payload.reset) {
      activeDataset = 'default';
      customListings = null;
    }

    if (payload.dataset) {
      if (!(payload.dataset in mockDatasets)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Unknown dataset: ${payload.dataset}` }));
        return;
      }
      activeDataset = payload.dataset;
      customListings = null;
    }

    if (payload.listings) {
      customListings = payload.listings;
    }

    res.writeHead(204);
    res.end();
  } catch (error) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({ error: 'Invalid mock configuration payload', details: String(error) })
    );
  }
};

export const startMockPocketBase = async (
  options: MockPocketBaseServerOptions = {}
): Promise<http.Server> => {
  const host = options.host ?? defaultHost;
  const port = options.port ?? defaultPort;

  const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/__mock__/config') {
      void handleConfigUpdate(req, res);
      return;
    }

    if (req.method === 'GET' && req.url?.startsWith('/api/collections/listings/records')) {
      const requestUrl = new URL(req.url, `http://${host}:${port}`);
      const filter = requestUrl.searchParams.get('filter') ?? '';

      if (filter.includes('SimulateOffline')) {
        res.writeHead(503, {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        });
        res.end(
          JSON.stringify({
            code: 503,
            message: 'Listings service temporarily unavailable',
            data: {},
          })
        );
        return;
      }

      const payload = buildListingsResponse();
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      });
      res.end(JSON.stringify(payload));
      return;
    }

    res.statusCode = 404;
    res.end(
      JSON.stringify({ code: 404, message: "The requested resource wasn't found.", data: {} })
    );
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      server.off('error', reject);
      resolve();
    });
  });

  return server;
};

export const MOCK_POCKETBASE_HOST = defaultHost;
export const MOCK_POCKETBASE_PORT = defaultPort;
export const MOCK_POCKETBASE_URL = `http://${defaultHost}:${defaultPort}`;
