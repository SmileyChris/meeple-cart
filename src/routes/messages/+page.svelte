<script lang="ts">
  import type { PageData } from './$types';
  import MessageThreadList from '$lib/components/MessageThreadList.svelte';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Messages · Meeple Cart</title>
  <meta name="description" content="Your message inbox for board game trades and conversations." />
</svelte:head>

<main class="bg-surface-body px-6 py-12 text-primary transition-colors sm:px-8">
  <div class="mx-auto max-w-5xl space-y-8">
    <!-- Header -->
    <header>
      <h1 class="text-3xl font-semibold tracking-tight text-primary">Messages</h1>
      {#if data.unreadTotal > 0}
        <p class="mt-2 text-sm text-muted">
          {data.unreadTotal} unread {data.unreadTotal === 1 ? 'message' : 'messages'}
        </p>
      {:else}
        <p class="mt-2 text-sm text-muted">Your message inbox for trades and conversations.</p>
      {/if}
    </header>

    <!-- Thread List -->
    <MessageThreadList threads={data.threads} />
  </div>
</main>
