import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import type { ExpandedMessageRecord, MessageThread } from '$lib/types/message';
import type { UserRecord } from '$lib/types/pocketbase';
import type { ListingRecord } from '$lib/types/listing';

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(303, '/login');
  }

  const userId = locals.user.id;

  try {
    // Fetch all messages where user is sender or recipient
    const messages = await locals.pb.collection('messages').getFullList<ExpandedMessageRecord>({
      filter: `sender = "${userId}" || recipient = "${userId}"`,
      sort: '-created',
      expand: 'sender,recipient,listing',
    });

    // Group messages by thread
    const threadsMap = new Map<string, MessageThread>();

    for (const msg of messages) {
      const threadId = msg.thread_id;

      if (!threadsMap.has(threadId)) {
        // Determine the other user in the conversation
        const otherUserId = msg.sender === userId ? msg.recipient : msg.sender;
        const otherUser = (msg.sender === userId ? msg.expand?.recipient : msg.expand?.sender) as
          | UserRecord
          | undefined;

        const listing = msg.expand?.listing as ListingRecord | undefined;

        // Get thumbnail from listing
        const thumbnail =
          listing && Array.isArray(listing.photos) && listing.photos.length > 0
            ? locals.pb.files.getUrl(listing, listing.photos[0], { thumb: '100x100' })
            : undefined;

        threadsMap.set(threadId, {
          threadId,
          listingId: msg.listing,
          listingTitle: listing?.title || 'Unknown Listing',
          listingThumbnail: thumbnail,
          otherUser: {
            id: otherUserId || '',
            name: otherUser?.display_name || 'Unknown User',
          },
          lastMessage: {
            content: msg.content,
            timestamp: msg.created,
            isRead: msg.sender === userId ? true : (msg.read ?? false),
          },
          unreadCount: 0,
          messageCount: 1,
        });
      } else {
        // Update thread with newer info if this message is more recent
        const thread = threadsMap.get(threadId)!;
        thread.messageCount++;

        // Count unread messages (where user is recipient and not read)
        if (msg.recipient === userId && !msg.read) {
          thread.unreadCount++;
        }
      }
    }

    const threads = Array.from(threadsMap.values()).sort(
      (a, b) =>
        new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
    );

    return {
      threads,
      unreadTotal: threads.reduce((sum, t) => sum + t.unreadCount, 0),
    };
  } catch (error) {
    console.error('Failed to load messages', error);
    return {
      threads: [],
      unreadTotal: 0,
    };
  }
};
