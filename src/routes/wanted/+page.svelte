<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;

  function getTimeAgo(date: string): string {
    const now = new Date();
    const then = new Date(date);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 30 * 86400) return `${Math.floor(seconds / 86400)}d ago`;
    return 'Over a month ago';
  }

  function getFreshnessColor(date: string): string {
    const now = new Date();
    const then = new Date(date);
    const days = Math.floor((now.getTime() - then.getTime()) / (1000 * 86400));

    if (days < 7) return 'text-emerald-400 bg-emerald-500/10';
    if (days < 14) return 'text-yellow-400 bg-yellow-500/10';
    if (days < 30) return 'text-orange-400 bg-orange-500/10';
    return 'text-red-400 bg-red-500/10';
  }

  // Sort wanted listings by activity (most recent comment or creation)
  const sortedWantedListings = [...data.listings].sort((a, b) => {
    const aDate = new Date(a.updated || a.created).getTime();
    const bDate = new Date(b.updated || b.created).getTime();
    return bDate - aDate;
  });
</script>

<svelte:head>
  <title>Wanted Games · Meeple Cart</title>
  <meta
    name="description"
    content="Games that people are looking for in the Meeple Cart community"
  />
</svelte:head>

<main class="mx-auto max-w-5xl px-4 py-8">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="text-2xl font-semibold text-slate-100 mb-2">Wanted Games</h1>
    <p class="text-slate-400">
      Help fellow gamers find the games they're looking for. These listings will expire after 30
      days of inactivity.
    </p>

    <!-- Quick Stats -->
    <div class="grid grid-cols-4 gap-4 mt-6">
      <div class="bg-slate-900/60 rounded-lg border border-slate-800 p-3">
        <div class="text-xl font-semibold text-purple-400">
          {data.listings.length}
        </div>
        <div class="text-xs text-slate-500 mt-1">Active Wants</div>
      </div>
      <div class="bg-slate-900/60 rounded-lg border border-slate-800 p-3">
        <div class="text-xl font-semibold text-emerald-400">
          {data.listings.filter((l) => {
            const days = Math.floor(
              (new Date().getTime() - new Date(l.created).getTime()) / (1000 * 86400)
            );
            return days < 7;
          }).length}
        </div>
        <div class="text-xs text-slate-500 mt-1">Fresh (&lt; 7 days)</div>
      </div>
      <div class="bg-slate-900/60 rounded-lg border border-slate-800 p-3">
        <div class="text-xl font-semibold text-yellow-400">
          {data.listings.filter((l) => {
            const days = Math.floor(
              (new Date().getTime() - new Date(l.created).getTime()) / (1000 * 86400)
            );
            return days >= 7 && days < 14;
          }).length}
        </div>
        <div class="text-xs text-slate-500 mt-1">Active (7-14 days)</div>
      </div>
      <div class="bg-slate-900/60 rounded-lg border border-slate-800 p-3">
        <div class="text-xl font-semibold text-orange-400">
          {data.listings.filter((l) => {
            const days = Math.floor(
              (new Date().getTime() - new Date(l.created).getTime()) / (1000 * 86400)
            );
            return days >= 14;
          }).length}
        </div>
        <div class="text-xs text-slate-500 mt-1">Expiring Soon</div>
      </div>
    </div>
  </div>

  <!-- Create Want Button -->
  <div
    class="mb-6 rounded-lg bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20 p-6"
  >
    <div class="flex items-center justify-between">
      <div>
        <h3 class="font-semibold text-purple-300 mb-1">Looking for a specific game?</h3>
        <p class="text-sm text-slate-400">
          Create a wanted listing and let the community know what you're searching for.
        </p>
      </div>
      <a
        href="/listings/new?type=want"
        class="rounded-lg bg-purple-500 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-400 transition"
      >
        Create Wanted Listing
      </a>
    </div>
  </div>

  <!-- Wanted Listings -->
  <div class="space-y-4">
    {#each sortedWantedListings as listing}
      {@const daysSinceCreated = Math.floor(
        (new Date().getTime() - new Date(listing.created).getTime()) / (1000 * 86400)
      )}
      {@const freshnessClass = getFreshnessColor(listing.created)}

      <div
        class="bg-slate-900/40 rounded-xl border border-slate-800 p-5 hover:border-slate-700 transition"
      >
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-semibold"
            >
              {listing.expand?.user?.display_name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <div class="text-sm font-medium text-slate-200">
                {listing.expand?.user?.display_name || 'Anonymous'} is looking for:
              </div>
              <div class="text-xs text-slate-500">
                {listing.location || 'Any location'} · {getTimeAgo(listing.created)}
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <!-- Freshness indicator -->
            <span
              class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium {freshnessClass}"
            >
              {daysSinceCreated < 7
                ? 'Fresh'
                : daysSinceCreated < 14
                  ? 'Active'
                  : daysSinceCreated < 30
                    ? 'Expiring Soon'
                    : 'Expired'}
            </span>

            <!-- Priority/Urgency badge -->
            {#if listing.urgent}
              <span
                class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-red-500/10 text-red-400"
              >
                Urgent
              </span>
            {/if}
          </div>
        </div>

        <h3 class="font-semibold text-slate-100 text-lg mb-2">
          <a href="/listings/{listing.id}" class="hover:text-purple-300 transition">
            {listing.title}
          </a>
        </h3>

        {#if listing.description}
          <p class="text-sm text-slate-400 mb-4">
            {listing.description}
          </p>
        {/if}

        <!-- Willing to pay/trade info -->
        {#if listing.max_price}
          <div
            class="inline-flex items-center gap-2 rounded-lg bg-slate-800/50 px-3 py-1.5 text-sm mb-3"
          >
            <svg
              class="w-4 h-4 text-emerald-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span class="text-slate-300"
              >Willing to pay up to <strong class="text-emerald-400">${listing.max_price}</strong
              ></span
            >
          </div>
        {/if}

        <div class="flex items-center justify-between mt-4">
          <div class="flex items-center gap-4 text-sm">
            <!-- Response count -->
            <button class="text-slate-500 hover:text-slate-300 transition flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span>{listing.response_count || 0} responses</span>
            </button>

            <!-- Watch button -->
            <button class="text-slate-500 hover:text-slate-300 transition flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span>Watch</span>
            </button>
          </div>

          <a
            href="/listings/{listing.id}#respond"
            class="inline-flex items-center gap-2 rounded-lg bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 text-sm font-medium text-purple-300 hover:bg-purple-500/20 transition"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            I have this game
          </a>
        </div>

        <!-- Expiration warning -->
        {#if daysSinceCreated > 20}
          <div class="mt-3 rounded-lg bg-orange-500/10 border border-orange-500/20 p-3">
            <p class="text-xs text-orange-300">
              ⚠️ This listing will expire in {30 - daysSinceCreated} days unless the owner adds a comment
              or updates it.
            </p>
          </div>
        {/if}
      </div>
    {/each}

    {#if data.listings.length === 0}
      <div class="text-center py-16">
        <svg
          class="w-16 h-16 mx-auto text-slate-700 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <h3 class="text-lg font-semibold text-slate-300 mb-2">No wanted listings yet</h3>
        <p class="text-sm text-slate-500 mb-4">Be the first to create a wanted listing!</p>
        <a
          href="/listings/new?type=want"
          class="inline-flex items-center gap-2 rounded-lg bg-purple-500 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-400 transition"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Create Wanted Listing
        </a>
      </div>
    {/if}
  </div>

  <!-- Load More -->
  {#if data.pagination.totalPages > 1}
    <div class="mt-8 text-center">
      <button
        class="rounded-lg border border-slate-700 px-6 py-2 text-sm text-slate-300 hover:border-purple-500 hover:text-purple-300 transition"
      >
        Load More Wanted Listings
      </button>
    </div>
  {/if}
</main>
