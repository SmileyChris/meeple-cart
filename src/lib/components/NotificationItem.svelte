<script lang="ts">
  import type { NotificationItem } from '$lib/types/notification';
  import { NOTIFICATION_ICONS, NOTIFICATION_COLORS } from '$lib/types/notification';
  import { formatRelativeTime } from '$lib/utils/time';
  import { enhance } from '$app/forms';

  let { notification }: { notification: NotificationItem } = $props();

  let colors = $derived(NOTIFICATION_COLORS[notification.type]);
  let icon = $derived(NOTIFICATION_ICONS[notification.type]);
</script>

<div
  class="flex gap-4 rounded-xl border border-subtle bg-surface-card p-4 transition hover:bg-surface-card-alt {notification.read
    ? 'opacity-70'
    : ''}"
>
  <!-- Icon -->
  <div class="flex-shrink-0">
    <div
      class="flex h-12 w-12 items-center justify-center rounded-full border-2 {colors.border} {colors.bg} text-2xl"
    >
      {icon}
    </div>
  </div>

  <!-- Content -->
  <div class="min-w-0 flex-1 space-y-2">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0 flex-1">
        <h3 class="font-semibold text-primary {notification.read ? '' : 'font-bold'}">
          {notification.title}
        </h3>
        {#if notification.message}
          <p class="mt-1 text-sm text-muted">{notification.message}</p>
        {/if}
        {#if notification.listingTitle}
          <p class="mt-1 text-sm text-muted">
            Re: <span class="text-secondary">{notification.listingTitle}</span>
          </p>
        {/if}
      </div>

      <span class="flex-shrink-0 text-xs text-muted">
        {formatRelativeTime(notification.timestamp)}
      </span>
    </div>

    <!-- Actions -->
    <!-- eslint-disable svelte/no-navigation-without-resolve -->
    <div class="flex items-center gap-2">
      {#if notification.link}
        <a href={notification.link} class="btn-secondary px-3 py-1 text-sm font-medium"> View </a>
      {/if}

      {#if !notification.read}
        <form method="POST" action="?/mark_read" use:enhance>
          <input type="hidden" name="id" value={notification.id} />
          <button
            type="submit"
            class="btn-ghost px-3 py-1 text-sm hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
          >
            Mark read
          </button>
        </form>
      {/if}

      <form method="POST" action="?/delete" use:enhance>
        <input type="hidden" name="id" value={notification.id} />
        <button
          type="submit"
          class="btn-ghost px-3 py-1 text-sm hover:border-rose-500 hover:text-rose-300"
        >
          Delete
        </button>
      </form>
    </div>
  </div>

  <!-- Thumbnail -->
  {#if notification.listingThumbnail}
    <div class="flex-shrink-0">
      <img
        src={notification.listingThumbnail}
        alt={notification.listingTitle || 'Listing'}
        class="h-16 w-16 rounded-lg object-cover"
      />
    </div>
  {/if}
</div>
