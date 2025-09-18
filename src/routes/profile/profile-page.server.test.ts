import { describe, expect, it, vi, beforeEach } from 'vitest';
import { load } from './+page.server';

const buildLocals = () => {
  const getOne = vi.fn().mockResolvedValue({ id: 'user123', display_name: 'Chris' });
  const getList = vi.fn().mockResolvedValue({
    items: [
      {
        id: 'listing1',
        title: 'Gloomhaven',
        listing_type: 'trade',
        status: 'active',
        created: '2024-01-01 12:00:00Z',
        views: 5,
      },
    ],
  });

  const pb = {
    collection: (name: string) => {
      if (name === 'users') {
        return { getOne };
      }

      if (name === 'listings') {
        return { getList };
      }

      throw new Error(`Unexpected collection ${name}`);
    },
  };

  const locals = {
    user: { id: 'user123' },
    pb,
  };

  return { locals, getOne, getList };
};

describe('profile load', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the profile and listings for the user', async () => {
    const { locals, getOne, getList } = buildLocals();

    const result = await load({ locals } as never);

    expect(getOne).toHaveBeenCalledWith('user123');
    expect(getList).toHaveBeenCalledWith(1, 50, {
      filter: 'owner = "user123"',
      sort: '-created',
      fields: 'id,title,listing_type,status,created,views',
    });

    expect(result.profile).toMatchObject({ id: 'user123' });
    expect(result.listings).toHaveLength(1);
    expect(result.listings[0]).toMatchObject({
      id: 'listing1',
      title: 'Gloomhaven',
      listingType: 'trade',
      status: 'active',
    });
  });

  it('returns no listings when the query fails', async () => {
    const getOne = vi.fn().mockResolvedValue({ id: 'user123', display_name: 'Chris' });
    const getList = vi.fn().mockRejectedValue(new Error('boom'));

    const locals = {
      user: { id: 'user123' },
      pb: {
        collection: (name: string) => {
          if (name === 'users') {
            return { getOne };
          }

          if (name === 'listings') {
            return { getList };
          }

          throw new Error(`Unexpected collection ${name}`);
        },
      },
    };

    const result = await load({ locals } as never);

    expect(result.listings).toEqual([]);
  });
});
