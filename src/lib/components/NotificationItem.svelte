<script lang="ts">
  import type { NotificationItem } from '$lib/types/notification';
  import { NOTIFICATION_ICONS, NOTIFICATION_COLORS } from '$lib/types/notification';
  import { formatRelativeTime } from '$lib/utils/time';
  import { enhance } from '$app/forms';

  export let notification: NotificationItem;

  const colors = NOTIFICATION_COLORS[notification.type];
  const icon = NOTIFICATION_ICONS[notification.type];
</script>

<div
  class="flex gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 transition hover:bg-slate-900 {notification.read
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
        <h3 class="font-semibold text-slate-100 {notification.read ? '' : 'font-bold'}">
          {notification.title}
        </h3>
        {#if notification.message}
          <p class="mt-1 text-sm text-slate-400">{notification.message}</p>
        {/if}
        {#if notification.listingTitle}
          <p class="mt-1 text-sm text-slate-500">
            Re: <span class="text-slate-400">{notification.listingTitle}</span>
          </p>
        {/if}
      </div>

      <span class="flex-shrink-0 text-xs text-slate-500">
        {formatRelativeTime(notification.timestamp)}
      </span>
    </div>

    <!-- Actions -->
    <!-- eslint-disable svelte/no-navigation-without-resolve -->
    <div class="flex items-center gap-2">
      {#if notification.link}
        <a
          href={notification.link}
          class="rounded-lg bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/20"
        >
          View
        </a>
      {/if}

      {#if !notification.read}
        <form method="POST" action="?/mark_read" use:enhance>
          <input type="hidden" name="id" value={notification.id} />
          <button
            type="submit"
            class="rounded-lg border border-slate-700 px-3 py-1 text-sm text-slate-400 transition hover:border-emerald-500 hover:text-emerald-300"
          >
            Mark read
          </button>
        </form>
      {/if}

      <form method="POST" action="?/delete" use:enhance>
        <input type="hidden" name="id" value={notification.id} />
        <button
          type="submit"
          class="rounded-lg border border-slate-700 px-3 py-1 text-sm text-slate-400 transition hover:border-rose-500 hover:text-rose-300"
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
