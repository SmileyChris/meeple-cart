import type { PageLoad } from './$types';
import { pb } from '$lib/pocketbase';
import type { DiscussionThreadRecord } from '$lib/types/pocketbase';

export const load: PageLoad = async () => {
  try {
    // Fetch threads sorted by last reply (most recent first), then by pinned
    const threads = await pb
      .collection('discussion_threads')
      .getList<DiscussionThreadRecord>(1, 50, {
        sort: '-pinned,-last_reply_at,-created',
        expand: 'author',
      });

    return {
      threads: threads.items,
    };
  } catch (err) {
    console.error('Failed to load discussions', err);
    return {
      threads: [],
    };
  }
};
