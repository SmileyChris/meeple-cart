import { pb } from '$lib/pocketbase';
import type { UserRecord, DiscussionSubscriptionRecord } from '$lib/types/pocketbase';

/**
 * Auto-subscribe user to a discussion thread
 * Returns true if newly subscribed, false if already subscribed
 */
export async function subscribeToThread(userId: string, threadId: string): Promise<boolean> {
  try {
    // Check if already subscribed
    const existing = await pb.collection('discussion_subscriptions').getFullList({
      filter: `user = "${userId}" && thread = "${threadId}"`,
    });

    if (existing.length > 0) {
      return false; // Already subscribed
    }

    // Create subscription
    await pb.collection('discussion_subscriptions').create({
      user: userId,
      thread: threadId,
    });

    return true;
  } catch (err) {
    console.error('Failed to subscribe to thread:', err);
    throw err;
  }
}

/**
 * Unsubscribe user from a thread
 */
export async function unsubscribeFromThread(userId: string, threadId: string): Promise<void> {
  try {
    const subs = await pb.collection('discussion_subscriptions').getFullList({
      filter: `user = "${userId}" && thread = "${threadId}"`,
    });

    for (const sub of subs) {
      await pb.collection('discussion_subscriptions').delete(sub.id);
    }
  } catch (err) {
    console.error('Failed to unsubscribe from thread:', err);
    throw err;
  }
}

/**
 * Check if user is subscribed to a thread
 */
export async function isSubscribed(userId: string, threadId: string): Promise<boolean> {
  try {
    const subs = await pb.collection('discussion_subscriptions').getFullList({
      filter: `user = "${userId}" && thread = "${threadId}"`,
    });

    return subs.length > 0;
  } catch (err) {
    console.error('Failed to check subscription status:', err);
    return false;
  }
}

/**
 * Get all subscribers for a thread (for sending notifications)
 */
export async function getThreadSubscribers(threadId: string): Promise<UserRecord[]> {
  try {
    const subs = await pb
      .collection('discussion_subscriptions')
      .getFullList<DiscussionSubscriptionRecord>({
        filter: `thread = "${threadId}"`,
        expand: 'user',
      });

    return subs.map((sub) => sub.expand?.user).filter((user): user is UserRecord => !!user);
  } catch (err) {
    console.error('Failed to get thread subscribers:', err);
    return [];
  }
}

/**
 * Send notification to all thread subscribers except the actor
 * Used when someone replies to a thread
 */
export async function notifyThreadSubscribers(
  threadId: string,
  threadTitle: string,
  actorUserId: string,
  actorName: string,
  replyPreview: string
): Promise<void> {
  try {
    const subscribers = await getThreadSubscribers(threadId);

    // Filter out the actor (person who replied)
    const notifyUsers = subscribers.filter((user) => user.id !== actorUserId);

    // Create notifications for each subscriber
    for (const user of notifyUsers) {
      await pb.collection('notifications').create({
        user: user.id,
        type: 'discussion_reply',
        title: `New reply in "${threadTitle}"`,
        message: `${actorName} replied: ${replyPreview.substring(0, 100)}${replyPreview.length > 100 ? '...' : ''}`,
        link: `/chat/${threadId}`,
        read: false,
      });
    }
  } catch (err) {
    console.error('Failed to notify thread subscribers:', err);
    // Don't throw - notification failure shouldn't block the reply
  }
}

/**
 * Extract @username mentions from markdown content
 * Returns array of mentioned usernames (without the @)
 */
export function extractMentions(content: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]);
  }

  // Return unique mentions
  return [...new Set(mentions)];
}

/**
 * Send mention notifications to users mentioned in content
 */
export async function notifyMentionedUsers(
  content: string,
  threadId: string,
  threadTitle: string,
  actorUserId: string,
  actorName: string
): Promise<void> {
  try {
    const usernames = extractMentions(content);

    if (usernames.length === 0) {
      return;
    }

    // Look up users by username
    for (const username of usernames) {
      try {
        const users = await pb.collection('users').getFullList({
          filter: `username = "${username}"`,
        });

        if (users.length === 0) {
          continue; // Username not found
        }

        const user = users[0];

        // Don't notify yourself
        if (user.id === actorUserId) {
          continue;
        }

        // Create mention notification
        await pb.collection('notifications').create({
          user: user.id,
          type: 'discussion_mention',
          title: `${actorName} mentioned you`,
          message: `In discussion "${threadTitle}"`,
          link: `/chat/${threadId}`,
          read: false,
        });
      } catch (err) {
        console.error(`Failed to notify user ${username}:`, err);
        // Continue with other mentions
      }
    }
  } catch (err) {
    console.error('Failed to notify mentioned users:', err);
    // Don't throw - notification failure shouldn't block the reply
  }
}

/**
 * Update thread metadata after reply
 * - Increment reply_count
 * - Set last_reply_at to now
 */
export async function updateThreadAfterReply(threadId: string): Promise<void> {
  try {
    const thread = await pb.collection('discussion_threads').getOne(threadId);

    await pb.collection('discussion_threads').update(threadId, {
      reply_count: thread.reply_count + 1,
      last_reply_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Failed to update thread after reply:', err);
    throw err;
  }
}
