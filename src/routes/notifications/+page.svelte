<script lang="ts">
  import type { PageData } from './$types';
  import NotificationItem from '$lib/components/NotificationItem.svelte';
  import { pb } from '$lib/pocketbase';

  export let data: PageData;

  let notifications = data.notifications;
  let unreadCount = data.unreadCount;

  $: hasUnread = unreadCount > 0;

  async function handleMarkAllRead() {
    try {
      // Mark all unread notifications as read
      const unreadNotifications = notifications.filter((n) => !n.read);

      for (const notification of unreadNotifications) {
        await pb.collection('notifications').update(notification.id, {
          read: true,
        });
      }

      // Update local state
      notifications = notifications.map((n) => ({ ...n, read: true }));
      unreadCount = 0;
    } catch (err) {
      console.error('Failed to mark all notifications as read', err);
    }
  }
</script>

<svelte:head>
  <title>Notifications · Meeple Cart</title>
  <meta name="description" content="Your notifications from Meeple Cart" />
</svelte:head>

<main class="min-h-screen bg-surface-body px-6 py-12 text-primary transition-colors">
  <div class="mx-auto max-w-4xl space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-primary">Notifications</h1>
        {#if hasUnread}
          <p class="mt-1 text-sm text-muted">
            {data.unreadCount} unread {data.unreadCount === 1 ? 'notification' : 'notifications'}
          </p>
        {/if}
      </div>

      <!-- eslint-disable svelte/no-navigation-without-resolve -->
      <div class="flex gap-2">
        {#if hasUnread}
          <button on:click={handleMarkAllRead} class="btn-primary px-4 py-2 text-sm font-medium">
            Mark all read
          </button>
        {/if}

        <a href="/notifications/preferences" class="btn-ghost px-4 py-2 text-sm">
          ⚙️ Preferences
        </a>
      </div>
      <!-- eslint-enable svelte/no-navigation-without-resolve -->
    </div>

    <!-- Notifications List -->
    {#if notifications.length === 0}
      <div
        class="rounded-2xl border-2 border-dashed border-subtle bg-surface-card p-12 text-center transition-colors"
      >
        <div class="mb-4 text-6xl opacity-20">🔔</div>
        <h2 class="text-xl font-semibold text-secondary">No notifications yet</h2>
        <p class="mt-2 text-muted">
          We'll notify you about new listings in your watched regions and other important updates.
        </p>
        <!-- eslint-disable svelte/no-navigation-without-resolve -->
        <a
          href="/notifications/preferences"
          class="btn-primary mt-6 inline-block px-6 py-2 font-medium"
        >
          Set up preferences
        </a>
        <!-- eslint-enable svelte/no-navigation-without-resolve -->
      </div>
    {:else}
      <div class="space-y-3">
        {#each notifications as notification (notification.id)}
          <NotificationItem {notification} />
        {/each}
      </div>
    {/if}
  </div>
</main>
