<script lang="ts">
  let {
    unreadCount = 0,
    href = '/notifications',
    currentPath = '',
  }: { unreadCount?: number; href?: string; currentPath?: string } = $props();

  let isActive = $derived(currentPath.startsWith('/notifications'));
</script>

<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
<a
  {href}
  class="btn-ghost relative {isActive ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]' : ''}"
  aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
>
  <span class="flex items-center gap-2">
    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
    {#if unreadCount > 0}
      <span
        class="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[var(--accent)] px-1.5 text-xs font-bold text-[var(--accent-contrast)] shadow-elevated"
      >
        {unreadCount > 99 ? '99+' : unreadCount}
      </span>
    {/if}
  </span>
</a>
