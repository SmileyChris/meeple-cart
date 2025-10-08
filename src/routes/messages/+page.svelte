<script lang="ts">
  import type { PageData } from './$types';
  import MessageThreadList from '$lib/components/MessageThreadList.svelte';

  export let data: PageData;
</script>

<svelte:head>
  <title>Messages · Meeple Cart</title>
  <meta name="description" content="Your message inbox for board game trades and conversations." />
</svelte:head>

<main class="min-h-screen bg-slate-950">
  <div class="mx-auto max-w-4xl">
    <!-- Header -->
    <div class="border-b border-slate-800 bg-slate-950/80 px-6 py-6 backdrop-blur">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-slate-100">Messages</h1>
          {#if data.unreadTotal > 0}
            <p class="mt-1 text-sm text-slate-400">
              {data.unreadTotal} unread {data.unreadTotal === 1 ? 'message' : 'messages'}
            </p>
          {/if}
        </div>
      </div>
    </div>

    <!-- Thread List -->
    <MessageThreadList threads={data.threads} />
  </div>
</main>
