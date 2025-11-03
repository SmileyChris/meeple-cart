<script lang="ts">
  import type { PageData } from './$types';
  import MessageThread from '$lib/components/MessageThread.svelte';
  import MessageInput from '$lib/components/MessageInput.svelte';
  import Alert from '$lib/components/Alert.svelte';
  import { pb, currentUser } from '$lib/pocketbase';

  let { data }: { data: PageData } = $props();

  let sending = $state(false);
  let messages = $state(data.messages);
  let error = $state<string | null>(null);

  async function handleSend(event: CustomEvent<{ content: string }>) {
    if (!data.otherUser || !data.listing) return;

    sending = true;
    error = null;

    try {
      // Create the message
      const newMessage = await pb.collection('messages').create({
        listing: data.listing.id,
        thread_id: data.threadId,
        sender: $currentUser!.id,
        recipient: data.otherUser.id,
        content: event.detail.content,
        is_public: false,
        read: false,
      });

      // Add to messages array
      messages = [
        ...messages,
        {
          id: newMessage.id,
          content: newMessage.content,
          senderName: $currentUser!.display_name,
          senderId: $currentUser!.id,
          recipientName: data.otherUser.name,
          recipientId: data.otherUser.id,
          timestamp: newMessage.created,
          isPublic: false,
          isRead: false,
          isOwnMessage: true,
        },
      ];

      // Send notification to recipient
      await pb.collection('notifications').create({
        user: data.otherUser.id,
        type: 'new_message',
        title: 'New message',
        message: `${$currentUser!.display_name} sent you a message about "${data.listing.title}"`,
        link: `/messages/${data.threadId}`,
        read: false,
      });
    } catch (err) {
      console.error('Failed to send message', err);
      error = 'Failed to send message. Please try again.';
    } finally {
      sending = false;
    }
  }
</script>

<svelte:head>
  <title>{data.otherUser?.name || 'Message'} · Messages · Meeple Cart</title>
</svelte:head>

<main class="flex h-screen flex-col bg-surface-body transition-colors">
  <!-- Header -->
  <!-- eslint-disable svelte/no-navigation-without-resolve -->
  <div
    class="flex-shrink-0 border-b border-subtle bg-surface-panel transition-colors backdrop-blur"
  >
    <div class="mx-auto flex max-w-4xl items-center gap-4 px-4 py-4">
      <a
        href="/messages"
        class="rounded-lg p-2 text-muted transition hover:bg-surface-card-alt hover:text-secondary"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </a>

      <div class="flex flex-1 items-center gap-3">
        {#if data.listing?.thumbnail}
          <a href={data.listing.href}>
            <img
              src={data.listing.thumbnail}
              alt={data.listing.title}
              class="h-12 w-12 rounded-lg object-cover"
            />
          </a>
        {:else}
          <div
            class="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-card-alt text-xl"
          >
            🎲
          </div>
        {/if}

        <div class="min-w-0 flex-1">
          <h1 class="truncate text-lg font-semibold text-primary">
            {data.otherUser?.name || 'Unknown User'}
          </h1>
          {#if data.listing}
            <a href={data.listing.href} class="truncate text-sm text-muted hover:text-emerald-400">
              {data.listing.title}
            </a>
          {/if}
        </div>
      </div>
    </div>
  </div>
  <!-- eslint-enable svelte/no-navigation-without-resolve -->

  <!-- Messages -->
  <div class="flex-1 overflow-hidden">
    <div class="mx-auto h-full max-w-4xl">
      <MessageThread {messages} loading={false} />
    </div>
  </div>

  <!-- Input -->
  <div
    class="flex-shrink-0 border-t border-subtle bg-surface-panel transition-colors backdrop-blur"
  >
    <div class="mx-auto max-w-4xl px-4 py-4">
      {#if error}
        <div class="mb-3">
          <Alert type="error">{error}</Alert>
        </div>
      {/if}
      <MessageInput onsend={handleSend} disabled={sending} />
    </div>
  </div>
</main>
