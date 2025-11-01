import type { PageLoad } from './$types';
import type { MessageThread } from '$lib/types/message';
import { pb, currentUser } from '$lib/pocketbase';
import { redirectToLogin } from '$lib/utils/auth-redirect';
import { get } from 'svelte/store';

export const load: PageLoad = async ({ url }) => {
  const user = get(currentUser);

  if (!user) {
    redirectToLogin(url.pathname);
  }

  try {
    // Fetch all messages where user is participant (not public comments)
    const messagesResult = await pb.collection('messages').getList(1, 200, {
      filter: `(sender = "${user.id}" || recipient = "${user.id}") && is_public = false`,
      expand: 'sender,recipient,listing',
      sort: '-created',
    });

    // Group messages by thread_id
    const threadMap = new Map<string, MessageThread>();

    for (const message of messagesResult.items) {
      const threadId = message.thread_id;
      const isSender = message.sender === user.id;
      const otherUser = isSender ? message.expand?.recipient : message.expand?.sender;
      const listing = message.expand?.listing;

      if (!threadMap.has(threadId)) {
        threadMap.set(threadId, {
          threadId,
          listingId: message.listing,
          listingTitle: listing?.title || 'Unknown Listing',
          listingThumbnail:
            listing && listing.photos && listing.photos.length > 0
              ? pb.files.getUrl(listing, listing.photos[0], { thumb: '100x100' })
              : undefined,
          otherUser: {
            id: otherUser?.id || '',
            name: otherUser?.display_name || 'Unknown User',
          },
          lastMessage: {
            content: message.content,
            timestamp: message.created,
            isRead: isSender || message.read,
          },
          unreadCount: 0,
          messageCount: 0,
        });
      }

      const thread = threadMap.get(threadId)!;
      thread.messageCount++;

      // Count unread messages (messages we received that haven't been read)
      if (!isSender && !message.read) {
        thread.unreadCount++;
      }

      // Keep the most recent message as lastMessage
      if (new Date(message.created) > new Date(thread.lastMessage.timestamp)) {
        thread.lastMessage = {
          content: message.content,
          timestamp: message.created,
          isRead: isSender || message.read,
        };
      }
    }

    const threads = Array.from(threadMap.values()).sort(
      (a, b) =>
        new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
    );

    const unreadTotal = threads.reduce((sum, thread) => sum + thread.unreadCount, 0);

    return {
      threads,
      unreadTotal,
    };
  } catch (err) {
    console.error('Failed to load messages', err);
    return {
      threads: [],
      unreadTotal: 0,
    };
  }
};
