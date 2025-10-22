<script lang="ts">
  import type { PageData, ActionData } from './$types';
  import MessageThread from '$lib/components/MessageThread.svelte';
  import MessageInput from '$lib/components/MessageInput.svelte';
  import { invalidateAll } from '$app/navigation';

  export let data: PageData;
  export let form: ActionData;

  let sending = false;

  async function handleSend(event: CustomEvent<{ content: string }>) {
    if (!data.otherUser || !data.listing) return;

    sending = true;
    const formData = new FormData();
    formData.append('content', event.detail.content);
    formData.append('listingId', data.listing.id);
    formData.append('recipientId', data.otherUser.id);

    try {
      const response = await fetch('?/send', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        await invalidateAll();
      }
    } catch (error) {
      console.error('Failed to send message', error);
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
  <div class="flex-shrink-0 border-b border-subtle bg-surface-panel transition-colors backdrop-blur">
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
          <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-card-alt text-xl">
            🎲
          </div>
        {/if}

        <div class="min-w-0 flex-1">
          <h1 class="truncate text-lg font-semibold text-primary">
            {data.otherUser?.name || 'Unknown User'}
          </h1>
          {#if data.listing}
            <a
              href={data.listing.href}
              class="truncate text-sm text-muted hover:text-emerald-400"
            >
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
      <MessageThread messages={data.messages} loading={false} />
    </div>
  </div>

  <!-- Input -->
  <div class="flex-shrink-0 border-t border-subtle bg-surface-panel transition-colors backdrop-blur">
    <div class="mx-auto max-w-4xl px-4 py-4">
      {#if form?.error}
        <div class="mb-3 rounded-lg bg-rose-500/10 px-4 py-2 text-sm text-rose-400">
          {form.error}
        </div>
      {/if}
      <MessageInput on:send={handleSend} disabled={sending} />
    </div>
  </div>
</main>
