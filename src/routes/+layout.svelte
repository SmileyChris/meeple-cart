<script lang="ts">
  import '../app.css';
  import NotificationBell from '$lib/components/NotificationBell.svelte';
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import { currentUser, pb } from '$lib/pocketbase';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  let { children } = $props();

  let unreadNotifications = $state(0);
  let currentPath = $derived($page.url.pathname);

  // Determine if we're in a profile-related section
  let isProfileSection = $derived(
    currentPath.startsWith('/profile') ||
      currentPath.startsWith('/trades') ||
      currentPath.startsWith('/watchlist') ||
      currentPath.startsWith('/messages') ||
      currentPath.startsWith('/notifications') ||
      currentPath.startsWith('/logout') ||
      currentPath.startsWith('/users/')
  );

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

<div class="flex min-h-screen flex-col bg-surface-body text-primary transition-colors">
  <header
    class="border-b border-subtle bg-[color:var(--surface-header)] backdrop-blur transition-colors"
  >
    <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
      <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
      <a class="flex items-center gap-3 transition-opacity hover:opacity-80" href="/">
        <img src="/logo.png" alt="Meeple Cart" class="h-8" />
        <span class="text-lg font-semibold" style="font-family: var(--font-heading)">
          Meeple Cart
        </span>
      </a>
      <!-- eslint-disable svelte/no-navigation-without-resolve -->
      <nav class="flex items-center gap-3 text-sm">
        <ThemeToggle />
        {#if $currentUser}
          <NotificationBell unreadCount={unreadNotifications} {currentPath} />
          <a class="btn-primary" href="/listings/new"> New listing </a>
        {:else}
          <a class="btn-ghost" href="/login"> Log in </a>
          <a class="btn-primary" href="/register"> Create account </a>
        {/if}
      </nav>
      <!-- eslint-enable svelte/no-navigation-without-resolve -->
    </div>

    <!-- Main Navigation Bar -->
    <nav
      class="border-t transition-colors"
      style="background-color: var(--surface-nav); border-color: var(--border-nav)"
    >
      <div class="mx-auto max-w-5xl px-4">
        <div class="flex items-center justify-between gap-1 overflow-x-auto py-2">
          {#if isProfileSection}
            <!-- Profile Section Navigation -->
            <div class="flex items-center gap-1">
              <a
                href="/"
                class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition whitespace-nowrap text-muted hover:text-secondary"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Activity Feed
              </a>
            </div>

            <div class="flex items-center gap-1">
              <a
                href="/profile"
                class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition whitespace-nowrap {currentPath.startsWith(
                  '/profile'
                )
                  ? 'text-secondary'
                  : 'text-muted hover:text-secondary'}"
                style={currentPath.startsWith('/profile')
                  ? 'background-color: var(--accent-soft); color: var(--accent-strong)'
                  : ''}
              >
                Profile
              </a>

              <a
                href="/trades"
                class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition whitespace-nowrap {currentPath.startsWith(
                  '/trades'
                )
                  ? 'text-secondary'
                  : 'text-muted hover:text-secondary'}"
                style={currentPath.startsWith('/trades')
                  ? 'background-color: var(--accent-soft); color: var(--accent-strong)'
                  : ''}
              >
                My Trades
              </a>

              <a
                href="/watchlist"
                class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition whitespace-nowrap {currentPath.startsWith(
                  '/watchlist'
                )
                  ? 'text-secondary'
                  : 'text-muted hover:text-secondary'}"
                style={currentPath.startsWith('/watchlist')
                  ? 'background-color: var(--accent-soft); color: var(--accent-strong)'
                  : ''}
              >
                Watchlist
              </a>

              <a
                href="/messages"
                class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition whitespace-nowrap {currentPath.startsWith(
                  '/messages'
                )
                  ? 'text-secondary'
                  : 'text-muted hover:text-secondary'}"
                style={currentPath.startsWith('/messages')
                  ? 'background-color: var(--accent-soft); color: var(--accent-strong)'
                  : ''}
              >
                Messages
              </a>

              <a
                href="/logout"
                class="ml-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition whitespace-nowrap {currentPath.startsWith(
                  '/logout'
                )
                  ? 'text-secondary'
                  : 'text-muted hover:text-secondary'}"
                style={currentPath.startsWith('/logout')
                  ? 'background-color: var(--accent-soft); color: var(--accent-strong)'
                  : ''}
              >
                Log out
              </a>
            </div>
          {:else}
            <!-- Standard Navigation -->
            <div class="flex items-center gap-1">
              <a
                href="/"
                class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition whitespace-nowrap {currentPath ===
                '/'
                  ? 'text-secondary'
                  : 'text-muted hover:text-secondary'}"
                style={currentPath === '/'
                  ? 'background-color: var(--accent-soft); color: var(--accent-strong)'
                  : ''}
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
                href="/games"
                class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition whitespace-nowrap {currentPath ===
                '/games'
                  ? 'text-secondary'
                  : 'text-muted hover:text-secondary'}"
                style={currentPath === '/games'
                  ? 'background-color: var(--accent-soft); color: var(--accent-strong)'
                  : ''}
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                Games
              </a>

              <a
                href="/cascades"
                class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition whitespace-nowrap {currentPath.startsWith(
                  '/cascades'
                )
                  ? 'text-secondary'
                  : 'text-muted hover:text-secondary'}"
                style={currentPath.startsWith('/cascades')
                  ? 'background-color: var(--accent-soft); color: var(--accent-strong)'
                  : ''}
              >
                🎁 Gift Cascades
              </a>

              <a
                href="/discussions"
                class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition whitespace-nowrap {currentPath.startsWith(
                  '/discussions'
                )
                  ? 'text-secondary'
                  : 'text-muted hover:text-secondary'}"
                style={currentPath.startsWith('/discussions')
                  ? 'background-color: var(--accent-soft); color: var(--accent-strong)'
                  : ''}
              >
                💬 Discussions
              </a>

              <a
                href="/group-buys"
                class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition whitespace-nowrap opacity-40 cursor-default {currentPath.startsWith(
                  '/group-buys'
                )
                  ? 'text-secondary'
                  : 'text-muted'}"
                style={currentPath.startsWith('/group-buys')
                  ? 'background-color: var(--accent-soft); color: var(--accent-strong)'
                  : ''}
              >
                🛒 Group Buys
              </a>

              <a
                href="/trade-parties"
                class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition whitespace-nowrap opacity-40 cursor-default {currentPath.startsWith(
                  '/trade-parties'
                )
                  ? 'text-secondary'
                  : 'text-muted'}"
                style={currentPath.startsWith('/trade-parties')
                  ? 'background-color: var(--accent-soft); color: var(--accent-strong)'
                  : ''}
              >
                🎉 Trade Parties
              </a>
            </div>

            {#if $currentUser}
              <div class="flex items-center gap-1">
                <a
                  href="/profile"
                  class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition whitespace-nowrap text-muted hover:text-secondary"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  {$currentUser.display_name ?? 'Profile'}
                </a>
              </div>
            {/if}
          {/if}
        </div>
      </div>
    </nav>
  </header>

  <div class="flex-1 pb-12">
    {@render children()}
  </div>

  <Footer />
</div>
