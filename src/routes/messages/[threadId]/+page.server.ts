import { redirect, fail, error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { ExpandedMessageRecord, MessageItem } from '$lib/types/message';
import type { UserRecord } from '$lib/types/pocketbase';
import type { ListingRecord } from '$lib/types/listing';

export const load: PageServerLoad = async ({ locals, params }) => {
  if (!locals.user) {
    throw redirect(303, '/login');
  }

  const userId = locals.user.id;
  const threadId = params.threadId;

  try {
    // Fetch messages for this thread
    const messages = await locals.pb.collection('messages').getFullList<ExpandedMessageRecord>({
      filter: `thread_id = "${threadId}"`,
      sort: 'created',
      expand: 'sender,recipient,listing',
    });

    if (messages.length === 0) {
      throw error(404, 'Thread not found');
    }

    // Verify user is part of this conversation
    const userInThread = messages.some((msg) => msg.sender === userId || msg.recipient === userId);

    if (!userInThread) {
      throw error(403, 'Not authorized to view this thread');
    }

    // Mark messages as read where user is recipient
    const unreadMessages = messages.filter((msg) => msg.recipient === userId && !msg.read);

    for (const msg of unreadMessages) {
      try {
        await locals.pb.collection('messages').update(msg.id, { read: true });
      } catch (err) {
        console.error('Failed to mark message as read', err);
      }
    }

    // Get listing info from first message
    const firstMessage = messages[0];
    const listing = firstMessage.expand?.listing as ListingRecord | undefined;

    // Determine the other user
    const otherUser = (
      firstMessage.sender === userId ? firstMessage.expand?.recipient : firstMessage.expand?.sender
    ) as UserRecord | undefined;

    // Get listing thumbnail
    const listingThumbnail =
      listing && Array.isArray(listing.photos) && listing.photos.length > 0
        ? locals.pb.files.getUrl(listing, listing.photos[0], { thumb: '200x200' })
        : undefined;

    // Transform messages to MessageItem format
    const messageItems: MessageItem[] = messages.map((msg) => {
      const sender = msg.expand?.sender as UserRecord | undefined;
      const recipient = msg.expand?.recipient as UserRecord | undefined;

      return {
        id: msg.id,
        content: msg.content,
        senderName: sender?.display_name || 'Unknown',
        senderId: msg.sender,
        recipientName: recipient?.display_name,
        recipientId: msg.recipient,
        timestamp: msg.created,
        isPublic: msg.is_public,
        isRead: msg.read ?? false,
        isOwnMessage: msg.sender === userId,
      };
    });

    return {
      messages: messageItems,
      threadId,
      listing: listing
        ? {
            id: listing.id,
            title: listing.title,
            href: `/listings/${listing.id}`,
            thumbnail: listingThumbnail,
          }
        : null,
      otherUser: otherUser
        ? {
            id: otherUser.id,
            name: otherUser.display_name,
          }
        : null,
    };
  } catch (err) {
    if (err instanceof Error && 'status' in err) {
      throw err;
    }
    console.error('Failed to load thread', err);
    throw error(500, 'Failed to load messages');
  }
};

export const actions: Actions = {
  send: async ({ locals, request, params }) => {
    if (!locals.user) {
      return fail(401, { error: 'Not authenticated' });
    }

    const formData = await request.formData();
    const content = formData.get('content')?.toString().trim();
    const listingId = formData.get('listingId')?.toString();
    const recipientId = formData.get('recipientId')?.toString();

    if (!content || !listingId || !recipientId) {
      return fail(400, { error: 'Missing required fields' });
    }

    if (content.length > 4000) {
      return fail(400, { error: 'Message too long' });
    }

    try {
      await locals.pb.collection('messages').create({
        listing: listingId,
        thread_id: params.threadId,
        sender: locals.user.id,
        recipient: recipientId,
        content,
        is_public: false,
        read: false,
      });

      return { success: true };
    } catch (error) {
      console.error('Failed to send message', error);
      return fail(500, { error: 'Failed to send message' });
    }
  },
};
