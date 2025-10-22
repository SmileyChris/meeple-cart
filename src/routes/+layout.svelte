<script lang="ts">
  import '../app.css';
  import NotificationBell from '$lib/components/NotificationBell.svelte';
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';
  import { currentUser, pb } from '$lib/pocketbase';
  import { goto } from '$app/navigation';

  let unreadNotifications = $state(0);

  // Fetch unread notifications count
  async function fetchUnreadCount() {
    if (!$currentUser) {
      unreadNotifications = 0;
      return;
    }

    try {
      const result = await pb.collection('notifications').getList(1, 1, {
        filter: `user = "${$currentUser.id}" && read = false`,
      });
      unreadNotifications = result.totalItems;
    } catch (error) {
      console.error('Failed to fetch unread notifications count', error);
    }
  }

  // Fetch on mount and when user changes
  $effect(() => {
    if ($currentUser) {
      fetchUnreadCount();
    } else {
      unreadNotifications = 0;
    }
  });

  // Handle logout
  function handleLogout() {
    currentUser.logout();
    goto('/');
  }
</script>

<div class="min-h-screen bg-surface-body text-primary transition-colors">
  <header
    class="border-b border-subtle bg-[color:var(--surface-header)] backdrop-blur transition-colors"
  >
    <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
      <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
      <a class="text-lg font-semibold transition-colors hover:text-[var(--accent)]" href="/">
        Meeple Cart
      </a>
      <!-- eslint-disable svelte/no-navigation-without-resolve -->
      <nav class="flex items-center gap-3 text-sm">
        <a class="btn-ghost" href="/activity"> Activity </a>
        <a class="btn-ghost" href="/cascades"> 🎁 Gift Cascades </a>
        <ThemeToggle />
        {#if $currentUser}
          <NotificationBell unreadCount={unreadNotifications} />
          <a class="btn-ghost" href="/trades"> 🤝 My Trades </a>
          <a class="btn-ghost" href="/watchlist"> ⭐ Watchlist </a>
          <a class="btn-ghost" href="/messages"> 💬 Messages </a>
          <a class="btn-ghost" href="/profile">
            {$currentUser.display_name ?? 'Profile'}
          </a>
          <a class="btn-primary" href="/listings/new"> New listing </a>
          <button class="btn-ghost" type="button" onclick={handleLogout}> Log out </button>
        {:else}
          <a class="btn-ghost" href="/login"> Log in </a>
          <a class="btn-primary" href="/register"> Create account </a>
        {/if}
      </nav>
      <!-- eslint-enable svelte/no-navigation-without-resolve -->
    </div>
  </header>

  <slot />
</div>
