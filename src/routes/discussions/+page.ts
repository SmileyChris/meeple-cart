import type { PageLoad } from './$types';
import { pb } from '$lib/pocketbase';
import type { DiscussionThreadRecord, DiscussionCategoryRecord } from '$lib/types/pocketbase';

export const load: PageLoad = async ({ url }) => {
  const page = parseInt(url.searchParams.get('page') ?? '1', 10);
  const tab = url.searchParams.get('tab') ?? 'latest';
  const categorySlug = url.searchParams.get('category');
  const tags = url.searchParams.getAll('tag');
  const search = url.searchParams.get('search');

  let filter = '';
  let sort = '-pinned,-created'; // Pinned threads first, then newest

  // Tab logic
  if (tab === 'top') {
    sort = '-pinned,-reply_count';
  } else if (tab === 'wanted') {
    filter = 'thread_type = "wanted"';
  } else if (tab === 'unanswered') {
    filter = 'reply_count = 0';
  }

  // Category filter
  if (categorySlug) {
    const categoryFilter = `category.slug = "${categorySlug}"`;
    filter = filter ? `${filter} && ${categoryFilter}` : categoryFilter;
  }

  // Tag filters (supports multiple tags with AND logic)
  if (tags.length > 0) {
    const tagFilters = tags.map(tag => `tags ~ "${tag}"`).join(' && ');
    filter = filter ? `${filter} && ${tagFilters}` : tagFilters;
  }

  // Search filter
  if (search) {
    const searchFilter = `(title ~ "${search}" || content ~ "${search}")`;
    filter = filter ? `${filter} && ${searchFilter}` : searchFilter;
  }

  try {
    // Load threads
    const threads = await pb
      .collection('discussion_threads')
      .getList<DiscussionThreadRecord>(page, 20, {
        filter: filter || undefined,
        sort,
        expand: 'author,category',
      });

    // Load all categories
    const categories = await pb
      .collection('discussion_categories')
      .getFullList<DiscussionCategoryRecord>({
        filter: 'enabled = true',
        sort: 'order',
      });

    return {
      threads,
      categories,
      currentTab: tab,
      currentCategory: categorySlug,
      currentTags: tags,
      currentSearch: search,
    };
  } catch (err) {
    console.error('Failed to load discussions', err);
    return {
      threads: { items: [], page: 1, perPage: 20, totalItems: 0, totalPages: 0 },
      categories: [],
      currentTab: tab,
      currentCategory: categorySlug,
      currentTags: tags,
      currentSearch: search,
    };
  }
};
