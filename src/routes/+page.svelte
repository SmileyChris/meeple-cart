<script lang="ts">
  import type { PageData } from './$types';
  import ListingCard from '$lib/components/ListingCard.svelte';
  import { onMount, onDestroy } from 'svelte';

  export let data: PageData;

  let autoRefreshInterval: ReturnType<typeof setInterval>;
  let lastRefresh = new Date();

  const listingTypeOptions = [
    { label: 'All types', value: '' },
    { label: 'For sale', value: 'sell' },
    { label: 'For trade', value: 'trade' },
    { label: 'Wanted', value: 'want' },
  ];

  const conditionOptions = [
    { label: 'Any condition', value: '' },
    { label: 'Mint', value: 'mint' },
    { label: 'Excellent', value: 'excellent' },
    { label: 'Good', value: 'good' },
    { label: 'Fair', value: 'fair' },
    { label: 'Poor', value: 'poor' },
  ];

  const hasFilters = Boolean(
    data.filters.location ||
      data.filters.type ||
      data.filters.search ||
      data.filters.condition ||
      data.filters.minPrice ||
      data.filters.maxPrice
  );

  const buildPageLink = (pageNumber: number): string => {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const params = new URLSearchParams();

    if (data.filters.search) {
      params.set('search', data.filters.search);
    }

    if (data.filters.type) {
      params.set('type', data.filters.type);
    }

    if (data.filters.location) {
      params.set('location', data.filters.location);
    }

    if (data.filters.condition) {
      params.set('condition', data.filters.condition);
    }

    if (data.filters.minPrice) {
      params.set('minPrice', data.filters.minPrice);
    }

    if (data.filters.maxPrice) {
      params.set('maxPrice', data.filters.maxPrice);
    }

    if (pageNumber > 1) {
      params.set('page', String(pageNumber));
    }

    const query = params.toString();
    return query ? `?${query}` : '';
  };

  const previousHref = data.pagination.page > 1 ? buildPageLink(data.pagination.page - 1) : null;
  const nextHref =
    data.pagination.page < data.pagination.totalPages
      ? buildPageLink(data.pagination.page + 1)
      : null;

  onMount(() => {
    // Auto-refresh feed every 30 seconds for real-time updates
    autoRefreshInterval = setInterval(() => {
      lastRefresh = new Date();
      // In a real app, this would fetch new listings via API
    }, 30000);
  });

  onDestroy(() => {
    if (autoRefreshInterval) {
      clearInterval(autoRefreshInterval);
    }
  });

  function getTimeAgo(date: string): string {
    const now = new Date();
    const then = new Date(date);
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  // Group listings by seller for bulk display
  const listingsBySeller = data.listings.reduce((acc, listing: any) => {
    const sellerId = listing.ownerId || 'unknown';
    if (!acc[sellerId]) {
      acc[sellerId] = {
        user: { display_name: listing.ownerName, id: listing.ownerId },
        listings: []
      };
    }
    acc[sellerId].listings.push(listing);
    return acc;
  }, {} as Record<string, { user: any; listings: typeof data.listings }>);

  // Identify bulk listings (multiple listings from same seller within 1 hour)
  const bulkListings = Object.entries(listingsBySeller).filter(([_, group]) => {
    if (group.listings.length < 2) return false;

    const times = group.listings.map(l => new Date(l.created).getTime()).sort();
    const timeSpan = times[times.length - 1] - times[0];
    return timeSpan < 3600000; // 1 hour in milliseconds
  });
</script>

<svelte:head>
  <title>Activity Feed · Meeple Cart</title>
  <meta
    name="description"
    content="Real-time feed of board game listings and trades happening on Meeple Cart"
  />
</svelte:head>

<main class="mx-auto max-w-5xl px-4 py-8">
  <!-- Feed Header -->
  <div class="mb-8">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-2xl font-semibold text-slate-100">Activity Feed</h1>
        <p class="text-sm text-slate-400 mt-1">
          Real-time updates from the Meeple Cart community
        </p>
      </div>
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-2 text-xs text-slate-500">
          <div class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span>Live</span>
        </div>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-3 gap-4 mb-6">
      <div class="bg-slate-900/60 rounded-lg border border-slate-800 p-4">
        <div class="text-2xl font-semibold text-emerald-400">
          {data.listings.filter(l => l.type === 'sell').length}
        </div>
        <div class="text-xs text-slate-400 mt-1">For Sale</div>
      </div>
      <div class="bg-slate-900/60 rounded-lg border border-slate-800 p-4">
        <div class="text-2xl font-semibold text-blue-400">
          {data.listings.filter(l => l.type === 'trade').length}
        </div>
        <div class="text-xs text-slate-400 mt-1">For Trade</div>
      </div>
      <div class="bg-slate-900/60 rounded-lg border border-slate-800 p-4">
        <div class="text-2xl font-semibold text-purple-400">
          {data.listings.filter(l => l.type === 'want').length}
        </div>
        <div class="text-xs text-slate-400 mt-1">Wanted</div>
      </div>
    </div>
  </div>

  <section class="space-y-8">
    <!-- Filter Section -->
    <form class="grid gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-6" method="GET">
      <!-- Search Bar -->
      <div class="sm:col-span-full">
        <label class="block text-sm font-medium text-slate-200" for="search">
          Search game titles
        </label>
        <input
          class="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
          id="search"
          name="search"
          placeholder="Search for a game..."
          value={data.filters.search ?? ''}
          maxlength="200"
        />
      </div>

      <div class="grid gap-4 sm:grid-cols-3">
        <!-- Location -->
        <div>
          <label class="block text-sm font-medium text-slate-200" for="location">Location</label>
          <input
            class="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
            id="location"
            name="location"
            placeholder="Eg: Wellington"
            value={data.filters.location}
            maxlength="120"
          />
        </div>

        <!-- Listing Type -->
        <div>
          <label class="block text-sm font-medium text-slate-200" for="type">Listing type</label>
          <select
            class="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
            id="type"
            name="type"
            value={data.filters.type}
          >
            {#each listingTypeOptions as option (option.value)}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </div>

        <!-- Condition -->
        <div>
          <label class="block text-sm font-medium text-slate-200" for="condition">Condition</label>
          <select
            class="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
            id="condition"
            name="condition"
            value={data.filters.condition ?? ''}
          >
            {#each conditionOptions as option (option.value)}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </div>
      </div>

      <!-- Price Range -->
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="block text-sm font-medium text-slate-200" for="minPrice">
            Min price (NZD)
          </label>
          <input
            class="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
            id="minPrice"
            name="minPrice"
            type="number"
            min="0"
            step="1"
            placeholder="No minimum"
            value={data.filters.minPrice ?? ''}
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-200" for="maxPrice">
            Max price (NZD)
          </label>
          <input
            class="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
            id="maxPrice"
            name="maxPrice"
            type="number"
            min="0"
            step="1"
            placeholder="No maximum"
            value={data.filters.maxPrice ?? ''}
          />
        </div>
      </div>

      <!-- Actions -->
      <div class="flex flex-wrap gap-3">
        <button
          class="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-900 transition hover:bg-emerald-400"
          type="submit"
        >
          Apply filters
        </button>
        {#if hasFilters}
          <a
            class="rounded-lg border border-slate-700 px-4 py-2 text-slate-200 transition hover:border-emerald-500 hover:text-emerald-300"
            href="/"
          >
            Clear filters
          </a>
        {/if}
      </div>
    </form>

    <!-- Activity Stream -->
    <div class="space-y-6">
      {#if bulkListings.length > 0}
        <!-- Highlight bulk listings -->
        {#each bulkListings as [sellerId, group]}
          <div class="bg-gradient-to-r from-emerald-500/10 to-transparent rounded-xl border border-emerald-500/20 p-6">
            <div class="flex items-start justify-between mb-4">
              <div>
                <h3 class="font-semibold text-emerald-300 flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
                  </svg>
                  Bulk Listing
                </h3>
                <p class="text-sm text-slate-300 mt-1">
                  {group.user?.display_name || 'Someone'} just listed {group.listings.length} games
                </p>
              </div>
              <span class="text-xs text-slate-500">
                {getTimeAgo(group.listings[0].created)}
              </span>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {#each group.listings.slice(0, 6) as listing}
                <a
                  href="/listings/{listing.id}"
                  class="bg-slate-900/60 rounded-lg border border-slate-800 p-3 hover:border-emerald-500 transition"
                >
                  <div class="text-sm font-medium text-slate-200 truncate">
                    {listing.title}
                  </div>
                  <div class="text-xs text-slate-500 mt-1">
                    {listing.type === 'sell' ? `$${listing.price || 'TBD'}` : listing.type}
                  </div>
                </a>
              {/each}
              {#if group.listings.length > 6}
                <a
                  href="/browse?seller={sellerId}"
                  class="bg-slate-900/60 rounded-lg border border-slate-800 p-3 hover:border-emerald-500 transition flex items-center justify-center"
                >
                  <span class="text-sm text-slate-400">
                    +{group.listings.length - 6} more
                  </span>
                </a>
              {/if}
            </div>
          </div>
        {/each}
      {/if}

      <!-- Regular activity items -->
      {#each data.listings as listing (listing.id)}
        <div class="group relative">
          <div class="absolute -left-4 top-4 w-2 h-2 bg-slate-700 rounded-full group-hover:bg-emerald-500 transition"></div>

          <div class="bg-slate-900/40 rounded-xl border border-slate-800 p-5 hover:border-slate-700 transition">
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white font-semibold">
                  {listing.expand?.user?.display_name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <div class="text-sm font-medium text-slate-200">
                    {listing.expand?.user?.display_name || 'Anonymous'}
                  </div>
                  <div class="text-xs text-slate-500">
                    {getTimeAgo(listing.created)} · {listing.location || 'Location not set'}
                  </div>
                </div>
              </div>

              <span class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium {
                listing.type === 'sell' ? 'bg-emerald-500/10 text-emerald-300' :
                listing.type === 'trade' ? 'bg-blue-500/10 text-blue-300' :
                'bg-purple-500/10 text-purple-300'
              }">
                {listing.type === 'sell' ? 'For Sale' :
                 listing.type === 'trade' ? 'For Trade' : 'Wanted'}
              </span>
            </div>

            <h3 class="font-semibold text-slate-100 mb-2">
              <a href="/listings/{listing.id}" class="hover:text-emerald-300 transition">
                {listing.title}
              </a>
            </h3>

            {#if listing.summary}
              <p class="text-sm text-slate-400 line-clamp-2 mb-3">
                {listing.summary}
              </p>
            {/if}

            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4 text-sm text-slate-500">
                {#if listing.type === 'sell' && listing.price}
                  <span class="font-semibold text-emerald-400">${listing.price}</span>
                {/if}
                <button class="hover:text-slate-300 transition flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Comment
                </button>
                <button class="hover:text-slate-300 transition flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  Save
                </button>
              </div>

              <a
                href="/listings/{listing.id}"
                class="text-sm text-emerald-400 hover:text-emerald-300 transition"
              >
                View Details →
              </a>
            </div>
          </div>
        </div>
      {/each}

      {#if data.listings.length === 0}
        <div class="text-center py-16">
          <svg class="w-16 h-16 mx-auto text-slate-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 class="text-lg font-semibold text-slate-300 mb-2">No activity yet</h3>
          <p class="text-sm text-slate-500 mb-4">Be the first to list a game!</p>
          <a
            href="/listings/new"
            class="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-emerald-400 transition"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Create Listing
          </a>
        </div>
      {/if}
    </div>

    <!-- Pagination -->
    {#if data.pagination.totalPages > 1}
      <nav class="flex items-center justify-center gap-2 mt-8">
        {#if previousHref}
          <a
            href={previousHref}
            class="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-emerald-500 hover:text-emerald-300 transition"
          >
            ← Previous
          </a>
        {/if}

        <span class="px-4 py-2 text-sm text-slate-400">
          Page {data.pagination.page} of {data.pagination.totalPages}
        </span>

        {#if nextHref}
          <a
            href={nextHref}
            class="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-emerald-500 hover:text-emerald-300 transition"
          >
            Next →
          </a>
        {/if}
      </nav>
    {/if}
  </section>
</main>