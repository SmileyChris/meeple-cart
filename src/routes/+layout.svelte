<script lang="ts">
  import '../app.css';
  import NotificationBell from '$lib/components/NotificationBell.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import { currentUser, pb } from '$lib/pocketbase';
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

  // Determine if we're in a feature section (focused experience, no main nav)
  let isFeatureSection = $derived(
    currentPath.startsWith('/cascades') ||
      currentPath.startsWith('/trade-parties') ||
      currentPath.startsWith('/group-buys')
  );

  // Determine if we're on an auth page (minimal header, no nav)
  let isAuthSection = $derived(
    currentPath.startsWith('/login') || currentPath.startsWith('/register')
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
</script>

<div class="flex min-h-screen flex-col bg-surface-body text-primary transition-colors">
  {#if isAuthSection}
    <!-- Auth Section Header (minimal) -->
    <header class="bg-[color:var(--surface-header)] backdrop-blur transition-colors">
      <div class="mx-auto flex max-w-5xl items-center justify-center px-4 py-4">
        <a class="flex items-center gap-3 transition-opacity hover:opacity-80" href="/">
          <img src="/logo.png" alt="Meeple Cart" class="h-8" />
          <span class="text-lg font-semibold" style="font-family: var(--font-heading)">
            Meeple Cart
          </span>
        </a>
      </div>
    </header>
  {:else if isFeatureSection}
    <!-- Community Section Header -->
    <header class="bg-[color:var(--surface-header)] backdrop-blur transition-colors">
      <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <a class="flex items-center gap-3 transition-opacity hover:opacity-80" href="/community">
          <img src="/logo.png" alt="Meeple Cart" class="h-8" />
          <span class="text-lg font-semibold" style="font-family: var(--font-heading)">
            Meeple Cart Community
          </span>
        </a>

        <nav class="flex items-center gap-3 text-sm">
          <a class="text-muted hover:text-accent transition" href="/">
            Back to Main
          </a>
          {#if !$currentUser}
            <a class="btn-ghost" href="/login">Log in</a>
            <a class="btn-primary" href="/register">Create account</a>
          {/if}
        </nav>
      </div>
    </header>
  {:else}
    <!-- Standard Header -->
    <header
      class="bg-[color:var(--surface-header)] backdrop-blur transition-colors"
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
        class="transition-colors"
        style="background-color: var(--surface-nav)"
      >
        <div class="mx-auto max-w-5xl px-4">
          <div class="flex items-center justify-center gap-2 overflow-x-auto py-3">
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
                href="/trade-parties"
                class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition whitespace-nowrap {currentPath.startsWith(
                  '/trade-parties'
                )
                  ? 'text-secondary'
                  : 'text-muted hover:text-secondary'}"
                style={currentPath.startsWith('/trade-parties')
                  ? 'background-color: var(--accent-soft); color: var(--accent-strong)'
                  : ''}
              >
                My Trade Parties
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
            <div class="flex items-center gap-2">
              <a
                href="/"
                class="flex items-center gap-2 rounded-lg px-4 py-2.5 text-base transition whitespace-nowrap {currentPath ===
                '/'
                  ? 'bg-emerald-500 text-white font-semibold'
                  : 'font-medium text-muted hover:text-accent'}"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Activity
              </a>

              <a
                href="/games"
                class="flex items-center gap-2 rounded-lg px-4 py-2.5 text-base transition whitespace-nowrap {currentPath ===
                '/games'
                  ? 'bg-emerald-500 text-white font-semibold'
                  : 'font-medium text-muted hover:text-accent'}"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                href="/discussions"
                class="flex items-center gap-2 rounded-lg px-4 py-2.5 text-base transition whitespace-nowrap {currentPath.startsWith(
                  '/discussions'
                )
                  ? 'bg-emerald-500 text-white font-semibold'
                  : 'font-medium text-muted hover:text-accent'}"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                Discussions
              </a>

              <a
                href="/community"
                class="flex items-center gap-2 rounded-lg px-4 py-2.5 text-base transition whitespace-nowrap {currentPath.startsWith(
                  '/community'
                ) || isFeatureSection
                  ? 'bg-emerald-500 text-white font-semibold'
                  : 'font-medium text-muted hover:text-accent'}"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                Community
              </a>
            </div>
          {/if}
        </div>
      </div>
    </nav>
  </header>
  {/if}

  <div class="flex-1 pb-12">
    {@render children()}
  </div>

  <Footer />
</div>
