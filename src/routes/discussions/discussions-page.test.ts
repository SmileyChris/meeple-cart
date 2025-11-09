import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as pocketbaseModule from '$lib/pocketbase';

vi.mock('$lib/pocketbase', () => ({
  pb: {
    collection: vi.fn(),
  },
}));

describe('discussions page load', () => {
  const threadsCollection = { getList: vi.fn() };
  const categoriesCollection = { getFullList: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(pocketbaseModule.pb.collection).mockImplementation((name: string) => {
      switch (name) {
        case 'discussion_threads':
          return threadsCollection as any;
        case 'discussion_categories':
          return categoriesCollection as any;
        default:
          throw new Error(`Unexpected collection ${name}`);
      }
    });
  });

  it('loads threads and categories with default parameters', async () => {
    const { load } = await import('./+page.ts');

    const mockThreads = {
      items: [
        {
          id: 'thread-1',
          title: 'How to trade safely?',
          reply_count: 5,
          pinned: false,
        },
      ],
      page: 1,
      perPage: 20,
      totalItems: 1,
      totalPages: 1,
    };

    const mockCategories = [
      { id: 'cat-1', name: 'General', slug: 'general', order: 1, enabled: true },
      { id: 'cat-2', name: 'Trading Tips', slug: 'trading-tips', order: 2, enabled: true },
    ];

    threadsCollection.getList.mockResolvedValue(mockThreads);
    categoriesCollection.getFullList.mockResolvedValue(mockCategories);

    const url = {
      searchParams: new URLSearchParams(),
    };

    const result = await load({ url } as any);

    expect(threadsCollection.getList).toHaveBeenCalledWith(1, 20, {
      filter: undefined,
      sort: '-pinned,-created',
      expand: 'author,category',
    });
    expect(categoriesCollection.getFullList).toHaveBeenCalledWith({
      filter: 'enabled = true',
      sort: 'order',
    });
    expect(result.threads).toEqual(mockThreads);
    expect(result.categories).toEqual(mockCategories);
    expect(result.currentTab).toBe('latest');
  });

  it('filters by category when category slug is provided', async () => {
    const { load } = await import('./+page.ts');

    threadsCollection.getList.mockResolvedValue({
      items: [],
      page: 1,
      perPage: 20,
      totalItems: 0,
      totalPages: 0,
    });
    categoriesCollection.getFullList.mockResolvedValue([]);

    const url = {
      searchParams: new URLSearchParams('category=general'),
    };

    await load({ url } as any);

    expect(threadsCollection.getList).toHaveBeenCalledWith(1, 20, {
      filter: 'category.slug = "general"',
      sort: '-pinned,-created',
      expand: 'author,category',
    });
  });

  it('filters by multiple tags with AND logic', async () => {
    const { load } = await import('./+page.ts');

    threadsCollection.getList.mockResolvedValue({
      items: [],
      page: 1,
      perPage: 20,
      totalItems: 0,
      totalPages: 0,
    });
    categoriesCollection.getFullList.mockResolvedValue([]);

    const url = {
      searchParams: new URLSearchParams('tag=beginner&tag=trading'),
    };

    await load({ url } as any);

    expect(threadsCollection.getList).toHaveBeenCalledWith(1, 20, {
      filter: 'tags ~ "beginner" && tags ~ "trading"',
      sort: '-pinned,-created',
      expand: 'author,category',
    });
  });

  it('changes sort order for top tab', async () => {
    const { load } = await import('./+page.ts');

    threadsCollection.getList.mockResolvedValue({
      items: [],
      page: 1,
      perPage: 20,
      totalItems: 0,
      totalPages: 0,
    });
    categoriesCollection.getFullList.mockResolvedValue([]);

    const url = {
      searchParams: new URLSearchParams('tab=top'),
    };

    await load({ url } as any);

    expect(threadsCollection.getList).toHaveBeenCalledWith(1, 20, {
      filter: undefined,
      sort: '-pinned,-reply_count',
      expand: 'author,category',
    });
  });

  it('filters for wanted threads when tab is wanted', async () => {
    const { load } = await import('./+page.ts');

    threadsCollection.getList.mockResolvedValue({
      items: [],
      page: 1,
      perPage: 20,
      totalItems: 0,
      totalPages: 0,
    });
    categoriesCollection.getFullList.mockResolvedValue([]);

    const url = {
      searchParams: new URLSearchParams('tab=wanted'),
    };

    await load({ url } as any);

    expect(threadsCollection.getList).toHaveBeenCalledWith(1, 20, {
      filter: 'thread_type = "wanted"',
      sort: '-pinned,-created',
      expand: 'author,category',
    });
  });

  it('searches in title and content when search param is provided', async () => {
    const { load } = await import('./+page.ts');

    threadsCollection.getList.mockResolvedValue({
      items: [],
      page: 1,
      perPage: 20,
      totalItems: 0,
      totalPages: 0,
    });
    categoriesCollection.getFullList.mockResolvedValue([]);

    const url = {
      searchParams: new URLSearchParams('search=gloomhaven'),
    };

    await load({ url } as any);

    expect(threadsCollection.getList).toHaveBeenCalledWith(1, 20, {
      filter: '(title ~ "gloomhaven" || content ~ "gloomhaven")',
      sort: '-pinned,-created',
      expand: 'author,category',
    });
  });

  it('returns empty data when loading fails', async () => {
    const { load } = await import('./+page.ts');

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    threadsCollection.getList.mockRejectedValue(new Error('Database error'));

    const url = {
      searchParams: new URLSearchParams(),
    };

    const result = await load({ url } as any);

    expect(consoleSpy).toHaveBeenCalledWith('Failed to load discussions', expect.any(Error));
    expect(result.threads).toEqual({ items: [], page: 1, perPage: 20, totalItems: 0, totalPages: 0 });
    expect(result.categories).toEqual([]);
    consoleSpy.mockRestore();
  });
});
