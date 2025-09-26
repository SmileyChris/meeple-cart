<script lang="ts">
  import type { PageData } from './$types';
  import '../app.css';
  import NotificationBell from '$lib/components/NotificationBell.svelte';
  import { page } from '$app/stores';

  export let data: PageData;

  $: currentPath = $page.url.pathname;
</script>

<div class="min-h-screen bg-slate-950 text-slate-100">
  <header class="bg-slate-950/80 backdrop-blur border-b border-slate-800">
    <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
      <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
      <a class="text-lg font-semibold hover:text-emerald-300" href="/">Meeple Cart</a>
      <!-- eslint-disable svelte/no-navigation-without-resolve -->
      <nav class="flex items-center gap-3 text-sm">
        <a
          class="rounded-full border border-slate-700 px-3 py-1.5 transition hover:border-emerald-500 hover:text-emerald-300"
          href="/activity"
        >
          Activity
        </a>
        <a
          class="rounded-full border border-slate-700 px-3 py-1.5 transition hover:border-emerald-500 hover:text-emerald-300"
          href="/cascades"
        >
          🎁 Gift Cascades
        </a>
        {#if data.user}
          <NotificationBell unreadCount={data.unreadNotifications} />
          <a
            class="rounded-full border border-slate-700 px-3 py-1.5 transition hover:border-emerald-500 hover:text-emerald-300"
            href="/watchlist"
          >
            ⭐ Watchlist
          </a>
          <a
            class="rounded-full border border-slate-700 px-3 py-1.5 transition hover:border-emerald-500 hover:text-emerald-300"
            href="/messages"
          >
            💬 Messages
          </a>
          <a
            class="rounded-full border border-slate-700 px-3 py-1.5 transition hover:border-emerald-500 hover:text-emerald-300"
            href="/profile"
          >
            {data.user.display_name ?? 'Profile'}
          </a>
          <a
            class="rounded-full border border-emerald-500 bg-emerald-500/10 px-3 py-1.5 text-emerald-200 transition hover:bg-emerald-500/20"
            href="/listings/new"
          >
            New listing
          </a>
          <form method="post" action="/logout">
            <button
              class="rounded-full border border-slate-700 px-3 py-1.5 transition hover:border-rose-500 hover:text-rose-200"
              type="submit"
            >
              Log out
            </button>
          </form>
        {:else}
          <a
            class="rounded-full border border-slate-700 px-3 py-1.5 transition hover:border-emerald-500 hover:text-emerald-300"
            href="/login"
          >
            Log in
          </a>
          <a
            class="rounded-full border border-emerald-500 bg-emerald-500/10 px-3 py-1.5 text-emerald-200 transition hover:bg-emerald-500/20"
            href="/register"
          >
            Create account
          </a>
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
            class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition whitespace-nowrap {currentPath === '/'
              ? 'bg-emerald-500/10 text-emerald-300'
              : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'}"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Activity Feed
          </a>
          
          <a
            href="/browse"
            class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition whitespace-nowrap {currentPath === '/browse'
              ? 'bg-emerald-500/10 text-emerald-300'
              : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'}"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Browse Games
          </a>
          
          <a
            href="/wanted"
            class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition whitespace-nowrap {currentPath === '/wanted'
              ? 'bg-emerald-500/10 text-emerald-300'
              : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'}"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Wanted
          </a>
          
          {#if data.user}
            <a
              href="/my-listings"
              class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition whitespace-nowrap {currentPath === '/my-listings'
                ? 'bg-emerald-500/10 text-emerald-300'
                : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'}"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              My Listings
            </a>
            
            <a
              href="/watchlist"
              class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition whitespace-nowrap {currentPath === '/watchlist'
                ? 'bg-emerald-500/10 text-emerald-300'
                : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'}"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
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
