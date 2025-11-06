import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import { handleGamePriceUpdate } from './price-tracking';
import { createNotification } from './notifications';

vi.mock('./notifications', () => ({
  createNotification: vi.fn(),
}));

describe('price tracking handlers', () => {
  const updateMock = vi.fn();
  const getOneGameMock = vi.fn();
  const getFullListWatchMock = vi.fn();
  const getOneUserMock = vi.fn();

  const pb = {
    collection: vi.fn((name: string) => {
      switch (name) {
        case 'games':
          return {
            update: updateMock,
            getOne: getOneGameMock,
          };
        case 'watchlist':
          return {
            getFullList: getFullListWatchMock,
          };
        case 'users':
          return {
            getOne: getOneUserMock,
          };
        default:
          throw new Error(`Unexpected collection ${name}`);
      }
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('ignores updates when price and trade value do not change', async () => {
    await handleGamePriceUpdate(
      pb as any,
      'game-1',
      {
        price: 200,
        trade_value: 150,
        price_history: [{ price: 200, trade_value: 150, timestamp: '2024-05-01T12:00:00Z' }],
      } as any,
      200,
      150
    );

    expect(updateMock).not.toHaveBeenCalled();
    expect(getFullListWatchMock).not.toHaveBeenCalled();
    expect(createNotification).not.toHaveBeenCalled();
  });

  it('records price-history entry and notifies watchers on price drop', async () => {
    getOneGameMock.mockResolvedValue({
      listing: 'listing-1',
      title: 'Gloomhaven',
    });
    getFullListWatchMock.mockResolvedValue([{ user: 'user-1' }]);
    getOneUserMock.mockResolvedValue({
      notification_prefs: { notify_price_drops: true },
    });

    await handleGamePriceUpdate(
      pb as any,
      'game-1',
      {
        price: 220,
        trade_value: undefined,
        price_history: [
          { price: 260, trade_value: undefined, timestamp: '2024-05-15T12:00:00Z' },
          { price: 220, trade_value: undefined, timestamp: '2024-05-20T12:00:00Z' },
        ],
      } as any,
      180,
      undefined
    );

    expect(updateMock).toHaveBeenCalledWith('game-1', {
      price_history: [
        { price: 260, trade_value: undefined, timestamp: '2024-05-15T12:00:00Z' },
        { price: 220, trade_value: undefined, timestamp: '2024-05-20T12:00:00Z' },
        {
          price: 180,
          trade_value: undefined,
          timestamp: new Date('2024-06-01T12:00:00Z').toISOString(),
        },
      ],
    });
    expect(getFullListWatchMock).toHaveBeenCalledWith({
      filter: 'listing = "listing-1"',
      expand: 'user',
    });
    expect(createNotification).toHaveBeenCalledWith(
      pb,
      'user-1',
      'price_drop',
      'Price drop: Gloomhaven',
      {
        message: 'Price dropped from $220 to $180',
        link: '/listings/listing-1',
        listingId: 'listing-1',
      }
    );
  });

  it('sends trade value notification when trade value decreases', async () => {
    getOneGameMock.mockResolvedValue({
      listing: 'listing-2',
      title: 'Terraforming Mars',
    });
    getFullListWatchMock.mockResolvedValue([{ user: 'user-2' }]);
    getOneUserMock.mockResolvedValue({
      notification_prefs: { notify_price_drops: true },
    });

    await handleGamePriceUpdate(
      pb as any,
      'game-2',
      {
        price: undefined,
        trade_value: 250,
        price_history: [
          { price: undefined, trade_value: 260, timestamp: '2024-05-01T12:00:00Z' },
          { price: undefined, trade_value: 250, timestamp: '2024-05-10T12:00:00Z' },
        ],
      } as any,
      undefined,
      220
    );

    expect(createNotification).toHaveBeenCalledWith(
      pb,
      'user-2',
      'price_drop',
      'Price drop: Terraforming Mars',
      {
        message: 'Trade value dropped from $250 to $220',
        link: '/listings/listing-2',
        listingId: 'listing-2',
      }
    );
  });

  it('skips notifications when watchers have disabled price drop alerts', async () => {
    getOneGameMock.mockResolvedValue({
      listing: 'listing-3',
      title: 'Azul',
    });
    getFullListWatchMock.mockResolvedValue([{ user: 'user-3' }]);
    getOneUserMock.mockResolvedValue({
      notification_prefs: { notify_price_drops: false },
    });

    await handleGamePriceUpdate(
      pb as any,
      'game-3',
      {
        price: 120,
        trade_value: undefined,
        price_history: [{ price: 130, trade_value: undefined, timestamp: '2024-05-01T12:00:00Z' }],
      } as any,
      110,
      undefined
    );

    expect(createNotification).not.toHaveBeenCalled();
  });
});
