import { error, redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { redirectToLogin } from '$lib/utils/auth-redirect';
import type { MessageItem } from '$lib/types/message';
import { pb, currentUser } from '$lib/pocketbase';
import { get } from 'svelte/store';

export const load: PageLoad = async ({ params, url }) => {
  const user = get(currentUser);

  if (!user) {
    redirectToLogin(url.pathname);
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
    const otherUserExpand = otherUser?.expand;
    const otherUserData = otherUserExpand
      ? (otherUserExpand.sender?.id === otherUserId
          ? otherUserExpand.sender
          : otherUserExpand.recipient)
      : null;

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

    // Build thumbnail URL if listing has photos
    const thumbnailUrl = listing && Array.isArray(listing.photos) && listing.photos.length > 0
      ? `http://127.0.0.1:8090/api/files/${listing.collectionName}/${listing.id}/${listing.photos[0]}?thumb=100x100`
      : null;

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
            thumbnail: thumbnailUrl,
            href: `/listings/${listing.id}`,
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
