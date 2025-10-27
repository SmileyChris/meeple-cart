<script lang="ts">
  import '../app.css';
  import NotificationBell from '$lib/components/NotificationBell.svelte';
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';
  import { currentUser, pb } from '$lib/pocketbase';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  let unreadNotifications = $state(0);
  let currentPath = $derived($page.url.pathname);

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

    <!-- Main Navigation Bar -->
    <nav class="bg-slate-900/50 border-t border-slate-800">
      <div class="mx-auto max-w-5xl px-4">
        <div class="flex items-center gap-1 overflow-x-auto py-2">
          <a
            href="/"
            class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition whitespace-nowrap {currentPath ===
            '/'
              ? 'bg-emerald-500/10 text-emerald-300'
              : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'}"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Activity Feed
          </a>

          <a
            href="/browse"
            class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition whitespace-nowrap {currentPath ===
            '/browse'
              ? 'bg-emerald-500/10 text-emerald-300'
              : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'}"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            Browse Games
          </a>

          <a
            href="/wanted"
            class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition whitespace-nowrap {currentPath ===
            '/wanted'
              ? 'bg-emerald-500/10 text-emerald-300'
              : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'}"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            Wanted
          </a>

          {#if $currentUser}
            <a
              href="/my-listings"
              class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition whitespace-nowrap {currentPath ===
              '/my-listings'
                ? 'bg-emerald-500/10 text-emerald-300'
                : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'}"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              My Listings
            </a>

            <a
              href="/watchlist"
              class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition whitespace-nowrap {currentPath ===
              '/watchlist'
                ? 'bg-emerald-500/10 text-emerald-300'
                : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'}"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
              Watchlist
            </a>
          {/if}
        </div>
      </div>
    </nav>
  </header>

  <slot />
</div>
