import { error, redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import type { MessageItem } from '$lib/types/message';
import { pb, currentUser } from '$lib/pocketbase';
import { get } from 'svelte/store';

export const load: PageLoad = async ({ params }) => {
  const user = get(currentUser);

  if (!user) {
    throw redirect(302, '/login');
  }

  const { threadId } = params;

  try {
    // Fetch all messages in this thread
    const messagesResult = await pb.collection('messages').getFullList({
      filter: `thread_id = "${threadId}"`,
      expand: 'sender,recipient,listing',
      sort: 'created',
    });

    if (messagesResult.length === 0) {
      throw error(404, 'Thread not found');
    }

    // Get the first message to determine thread participants and listing
    const firstMessage = messagesResult[0];
    const listing = firstMessage.expand?.listing;

    // Determine the other participant
    const otherUserId =
      firstMessage.sender === user.id ? firstMessage.recipient : firstMessage.sender;
    const otherUser = messagesResult.find(
      (m) => m.expand?.sender?.id === otherUserId || m.expand?.recipient?.id === otherUserId
    );
    const otherUserData =
      otherUser?.expand?.sender?.id === otherUserId
        ? otherUser.expand.sender
        : otherUser?.expand?.recipient;

    // Map messages to MessageItem format
    const messages: MessageItem[] = messagesResult.map((message) => ({
      id: message.id,
      content: message.content,
      senderName: message.expand?.sender?.display_name || 'Unknown',
      senderId: message.sender,
      recipientName: message.expand?.recipient?.display_name,
      recipientId: message.recipient,
      timestamp: message.created,
      isPublic: message.is_public,
      isRead: message.read,
      isOwnMessage: message.sender === user.id,
    }));

    // Mark unread messages as read
    const unreadMessages = messagesResult.filter((m) => m.recipient === user.id && !m.read);
    for (const message of unreadMessages) {
      await pb.collection('messages').update(message.id, { read: true });
    }

    return {
      messages,
      otherUser: otherUserData
        ? {
            id: otherUserData.id,
            name: otherUserData.display_name,
          }
        : null,
      listing: listing
        ? {
            id: listing.id,
            title: listing.title,
          }
        : null,
      threadId,
    };
  } catch (err: any) {
    console.error(`Failed to load thread ${threadId}`, err);
    if (err.status === 404) {
      throw err;
    }
    throw error(500, 'Failed to load messages');
  }
};
