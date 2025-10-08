<script lang="ts">
  import type { PageData } from './$types';
  import NotificationItem from '$lib/components/NotificationItem.svelte';
  import { enhance } from '$app/forms';

  export let data: PageData;

  $: hasUnread = data.unreadCount > 0;
</script>

<svelte:head>
  <title>Notifications · Meeple Cart</title>
  <meta name="description" content="Your notifications from Meeple Cart" />
</svelte:head>

<main class="min-h-screen bg-slate-950 px-6 py-12">
  <div class="mx-auto max-w-4xl space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-slate-100">Notifications</h1>
        {#if hasUnread}
          <p class="mt-1 text-sm text-slate-400">
            {data.unreadCount} unread {data.unreadCount === 1 ? 'notification' : 'notifications'}
          </p>
        {/if}
      </div>

      <!-- eslint-disable svelte/no-navigation-without-resolve -->
      <div class="flex gap-2">
        {#if hasUnread}
          <form method="POST" action="?/mark_all_read" use:enhance>
            <button
              type="submit"
              class="rounded-lg border border-emerald-500 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/20"
            >
              Mark all read
            </button>
          </form>
        {/if}

        <a
          href="/notifications/preferences"
          class="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-emerald-500 hover:text-emerald-300"
        >
          ⚙️ Preferences
        </a>
      </div>
      <!-- eslint-enable svelte/no-navigation-without-resolve -->
    </div>

    <!-- Notifications List -->
    {#if data.notifications.length === 0}
      <div
        class="rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/40 p-12 text-center"
      >
        <div class="mb-4 text-6xl opacity-20">🔔</div>
        <h2 class="text-xl font-semibold text-slate-300">No notifications yet</h2>
        <p class="mt-2 text-slate-400">
          We'll notify you about new listings in your watched regions and other important updates.
        </p>
        <!-- eslint-disable svelte/no-navigation-without-resolve -->
        <a
          href="/notifications/preferences"
          class="mt-6 inline-block rounded-lg border border-emerald-500 bg-emerald-500/10 px-6 py-2 font-medium text-emerald-200 transition hover:bg-emerald-500/20"
        >
          Set up preferences
        </a>
        <!-- eslint-enable svelte/no-navigation-without-resolve -->
      </div>
    {:else}
      <div class="space-y-3">
        {#each data.notifications as notification (notification.id)}
          <NotificationItem {notification} />
        {/each}
      </div>
    {/if}
  </div>
</main>
