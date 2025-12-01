import type { PageLoad } from './$types';
import { pb, currentUser } from '$lib/pocketbase';
import { get } from 'svelte/store';
import type {
  DiscussionThreadRecord,
  DiscussionReplyRecord,
  DiscussionReactionRecord,
  DiscussionReactionCounts,
} from '$lib/types/pocketbase';
import { isSubscribed } from '$lib/utils/discussions';
import { error } from '@sveltejs/kit';

export const load: PageLoad = async ({ params }) => {
  const { id } = params;
  const user = get(currentUser);

  try {
    // Fetch thread with author, listing, and category relations
    const thread = await pb.collection('discussion_threads').getOne<DiscussionThreadRecord>(id, {
      expand: 'author,listing,listing.owner,category',
    });

    // Fetch all replies for this thread
    const replies = await pb
      .collection('discussion_replies')
      .getList<DiscussionReplyRecord>(1, 200, {
        filter: `thread = "${id}"`,
        sort: 'id',
        expand: 'author,quoted_reply.author',
      });

    // Fetch all reactions for this thread and its replies
    const reactions = await pb
      .collection('discussion_reactions')
      .getFullList<DiscussionReactionRecord>({
        filter: `thread = "${id}" || reply.thread = "${id}"`,
        expand: 'user',
      });

    // Aggregate thread reactions
    const threadReactions: DiscussionReactionCounts = {
      '❤️': 0,
      '👍': 0,
      '🔥': 0,
      '😂': 0,
      '🤔': 0,
      '👀': 0,
    };
    const userThreadReaction = user
      ? reactions.find((r) => r.thread === id && r.user === user.id)?.emoji
      : undefined;

    reactions
      .filter((r) => r.thread === id)
      .forEach((r) => {
        threadReactions[r.emoji]++;
      });

    // Aggregate reply reactions
    const replyReactions = new Map<string, DiscussionReactionCounts>();
    const userReplyReactions = new Map<string, string>();

    replies.items.forEach((reply) => {
      replyReactions.set(reply.id, {
        '❤️': 0,
        '👍': 0,
        '🔥': 0,
        '😂': 0,
        '🤔': 0,
        '👀': 0,
      });
    });

    reactions
      .filter((r) => r.reply)
      .forEach((r) => {
        const counts = replyReactions.get(r.reply!);
        if (counts) {
          counts[r.emoji]++;
        }
        if (user && r.user === user.id) {
          userReplyReactions.set(r.reply!, r.emoji);
        }
      });

    // Check if current user is subscribed
    let userIsSubscribed = false;
    if (user) {
      userIsSubscribed = await isSubscribed(user.id, id);
    }

    // Increment view count (fire and forget, don't await)
    pb.collection('discussion_threads')
      .update(id, {
        view_count: thread.view_count + 1,
      })
      .catch((err) => console.error('Failed to increment view count:', err));

    return {
      thread,
      replies: replies.items,
      userIsSubscribed,
      threadReactions,
      userThreadReaction,
      replyReactions,
      userReplyReactions,
    };
  } catch (err: any) {
    console.error('Failed to load discussion thread:', err);
    throw error(err.status || 500, err.message || 'Failed to load discussion');
  }
};
