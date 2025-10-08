<script lang="ts">
  import type { PageData } from './$types';
  import { enhance } from '$app/forms';

  export let data: PageData;

  const watchedListings = data.watchedListings;

  const typeLabels: Record<string, string> = {
    trade: 'Trade',
    sell: 'Sell',
    want: 'Want to Buy',
  };

  const statusLabels: Record<string, string> = {
    active: 'Active',
    pending: 'Pending',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  const formatRelativeTime = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };
</script>

<svelte:head>
  <title>Watchlist · Meeple Cart</title>
  <meta name="description" content="Your watched listings on Meeple Cart" />
</svelte:head>

<main class="min-h-screen bg-slate-950 px-6 py-12">
  <div class="mx-auto max-w-6xl space-y-6">
    <!-- Header -->
    <div class="space-y-2">
      <h1 class="text-3xl font-bold text-slate-100">Watchlist</h1>
      <p class="text-slate-400">Listings you're watching. You'll be notified when prices drop.</p>
    </div>

    <!-- Listings -->
    {#if watchedListings.length === 0}
      <div
        class="rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/40 p-12 text-center"
      >
        <div class="mb-4 text-6xl opacity-20">⭐</div>
        <h2 class="text-xl font-semibold text-slate-300">No watched listings yet</h2>
        <p class="mt-2 text-slate-400">
          Browse listings and click the star icon to add them to your watchlist.
        </p>
        <!-- eslint-disable svelte/no-navigation-without-resolve -->
        <a
          href="/"
          class="mt-6 inline-block rounded-lg border border-emerald-500 bg-emerald-500/10 px-6 py-2 font-medium text-emerald-200 transition hover:bg-emerald-500/20"
        >
          Browse listings
        </a>
        <!-- eslint-enable svelte/no-navigation-without-resolve -->
      </div>
    {:else}
      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {#each watchedListings as item (item.watchlistId)}
          <div
            class="group flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 shadow transition hover:border-emerald-500/80 hover:shadow-lg"
          >
            <!-- Cover Image -->
            <!-- eslint-disable svelte/no-navigation-without-resolve -->
            {#if item.coverImage}
              <a href={`/listings/${item.listingId}`}>
                <img alt={item.title} class="h-48 w-full object-cover" src={item.coverImage} />
              </a>
            {:else}
              <a
                href={`/listings/${item.listingId}`}
                class="flex h-48 items-center justify-center bg-slate-800 text-6xl opacity-20"
              >
                🎲
              </a>
            {/if}

            <div class="flex flex-1 flex-col p-4">
              <!-- Title -->
              <a href={`/listings/${item.listingId}`} class="group-hover:text-emerald-300">
                <h3 class="text-lg font-semibold text-slate-100">{item.title}</h3>
              </a>

              <!-- Metadata -->
              <div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span
                  class="rounded-full border border-emerald-600 px-2 py-0.5 uppercase text-emerald-200"
                >
                  {typeLabels[item.listingType] ?? item.listingType}
                </span>
                <span class="rounded-full border border-slate-700 px-2 py-0.5">
                  {statusLabels[item.status] ?? item.status}
                </span>
                {#if item.location}
                  <span>{item.location}</span>
                {/if}
              </div>

              <!-- Game count & owner -->
              <div class="mt-3 text-sm text-slate-400">
                {item.gameCount}
                {item.gameCount === 1 ? 'game' : 'games'}
                {#if item.ownerName}
                  · by {item.ownerName}
                {/if}
              </div>

              <!-- Watched date -->
              <div class="mt-2 text-xs text-slate-500">
                Watching since {formatRelativeTime(item.watchedAt)}
              </div>

              <!-- Actions -->
              <div class="mt-4 flex gap-2 border-t border-slate-800 pt-3">
                <a
                  href={`/listings/${item.listingId}`}
                  class="flex-1 rounded-lg border border-slate-700 px-3 py-2 text-center text-sm text-slate-200 transition hover:border-emerald-500 hover:text-emerald-300"
                >
                  View listing
                </a>
                <!-- eslint-enable svelte/no-navigation-without-resolve -->
                <form method="POST" action="?/remove" use:enhance class="flex-shrink-0">
                  <input type="hidden" name="watchlist_id" value={item.watchlistId} />
                  <button
                    type="submit"
                    class="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-400 transition hover:border-rose-500 hover:text-rose-300"
                    title="Remove from watchlist"
                  >
                    ✕
                  </button>
                </form>
              </div>
            </div>
          </div>
        {/each}
      </div>

      <!-- Stats -->
      <div class="rounded-lg border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-400">
        <p>
          Watching {watchedListings.length}
          {watchedListings.length === 1 ? 'listing' : 'listings'}
        </p>
      </div>
    {/if}
  </div>
</main>
