import { describe, expect, it, vi, beforeEach } from 'vitest';
import { load } from './+page.server';

const baseRecord = {
  id: 'listing123',
  collectionId: 'w3c43ufqz9ejshk',
  collectionName: 'listings',
  created: '2024-01-01 12:00:00Z',
  updated: '2024-01-01 12:00:00Z',
  owner: 'user123',
  title: 'Test listing',
  listing_type: 'trade',
  status: 'active' as const,
  summary: 'Summary',
  location: 'Wellington',
  shipping_available: true,
  prefer_bundle: false,
  views: 0,
  photos: ['photo.jpg'],
  expand: {
    owner: {
      id: 'user123',
      collectionId: 'fhggsowykv3hz86',
      collectionName: 'users',
      created: '2024-01-01 12:00:00Z',
      updated: '2024-01-01 12:00:00Z',
      display_name: 'Chris',
      trade_count: 4,
      vouch_count: 2,
      joined_date: '2023-01-01 12:00:00Z',
      preferred_contact: 'platform',
    },
    'games(listing)': [
      {
        id: 'game1',
        collectionId: 'u0l5t5dn4gwl0sb',
        collectionName: 'games',
        created: '2024-01-01 12:00:00Z',
        updated: '2024-01-01 12:00:00Z',
        listing: 'listing123',
        title: 'Gloomhaven',
        condition: 'excellent',
        status: 'available',
      },
    ],
  },
};

describe('listings/[id] load', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns listing details with owner, games, and photo sources', async () => {
    const getOne = vi.fn().mockResolvedValue({ ...baseRecord });
    const getUrl = vi.fn(
      (_, file, options) =>
        new URL(
          options?.thumb
            ? `https://files.example.com/thumb-${file}`
            : `https://files.example.com/${file}`
        )
    );

    const locals = {
      pb: {
        collection: vi.fn().mockReturnValue({ getOne }),
        files: {
          getUrl,
        },
      },
    };

    const result = await load({
      params: { id: 'listing123' },
      locals: locals as never,
    });

    expect(getOne).toHaveBeenCalledWith('listing123', {
      expand: 'owner,games(listing)',
    });
    expect(getUrl).toHaveBeenCalledWith(expect.objectContaining({ id: 'listing123' }), 'photo.jpg');
    expect(getUrl).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'listing123' }),
      'photo.jpg',
      {
        thumb: '400x300',
      }
    );
    expect(result.listing).toMatchObject({ id: 'listing123', title: 'Test listing' });
    expect(result.owner).toMatchObject({ id: 'user123', display_name: 'Chris' });
    expect(result.games).toHaveLength(1);
    expect(result.photos).toEqual([
      {
        id: 'photo.jpg',
        full: 'https://files.example.com/photo.jpg',
        thumb: 'https://files.example.com/thumb-photo.jpg',
      },
    ]);
  });

  it('throws 404 when listing is missing', async () => {
    const getOne = vi.fn().mockRejectedValue(new Error('not found'));
    const locals = {
      pb: {
        collection: vi.fn().mockReturnValue({ getOne }),
        files: {
          getUrl: vi.fn(),
        },
      },
    };

    await expect(
      load({
        params: { id: 'missing' },
        locals: locals as never,
      })
    ).rejects.toMatchObject({ status: 404 });
  });

  it('normalises bundle listing types to sell', async () => {
    const getOne = vi.fn().mockResolvedValue({
      ...baseRecord,
      listing_type: 'bundle',
    });
    const locals = {
      pb: {
        collection: vi.fn().mockReturnValue({ getOne }),
        files: {
          getUrl: vi.fn(
            () => new URL('https://files.example.com/photo.jpg')
          ),
        },
      },
    };

    const result = await load({
      params: { id: 'listing123' },
      locals: locals as never,
    });

    expect(result.listing.listing_type).toBe('sell');
  });
});
