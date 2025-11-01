<script lang="ts">
  import type { PageData } from './$types';
  import { pb } from '$lib/pocketbase';

  let { data }: { data: PageData } = $props();

  let watchedListings = $state(data.watchedListings);

  async function removeReaction(reactionId: string) {
    try {
      await pb.collection('reactions').delete(reactionId);
      // Remove from local state
      watchedListings = watchedListings.filter((item) => item.watchlistId !== reactionId);
    } catch (error) {
      console.error('Failed to remove reaction:', error);
      alert('Failed to remove reaction. Please try again.');
    }
  }

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

<main class="min-h-screen bg-surface-body px-6 py-12 text-primary transition-colors">
  <div class="mx-auto max-w-6xl space-y-6">
    <!-- Header -->
    <div class="space-y-2">
      <h1 class="text-3xl font-bold text-primary">Watchlist</h1>
      <p class="text-muted">Listings you've reacted to. React to any listing to add it to your watchlist.</p>
    </div>

    <!-- Listings -->
    {#if watchedListings.length === 0}
      <div
        class="rounded-2xl border-2 border-dashed border-subtle bg-surface-card p-12 text-center transition-colors"
      >
        <div class="mb-4 text-6xl opacity-20">😍</div>
        <h2 class="text-xl font-semibold text-secondary">No reactions yet</h2>
        <p class="mt-2 text-muted">
          React to listings to add them to your watchlist and keep track of what interests you.
        </p>
        <!-- eslint-disable svelte/no-navigation-without-resolve -->
        <a href="/games" class="btn-primary mt-6 inline-block px-6 py-2 font-medium">
          Browse games
        </a>
        <!-- eslint-enable svelte/no-navigation-without-resolve -->
      </div>
    {:else}
      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {#each watchedListings as item (item.watchlistId)}
          <div
            class="group flex flex-col overflow-hidden rounded-xl border border-subtle bg-surface-card shadow-elevated transition hover:border-[var(--accent)] hover:shadow-lg"
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
                class="flex h-48 items-center justify-center bg-surface-card-alt text-6xl opacity-20"
              >
                🎲
              </a>
            {/if}

            <div class="flex flex-1 flex-col p-4">
              <!-- Title -->
              <a href={`/listings/${item.listingId}`} class="transition hover:text-[var(--accent)]">
                <h3 class="text-lg font-semibold text-primary">{item.title}</h3>
              </a>

              <!-- Metadata -->
              <div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                <span
                  class="rounded-full border border-emerald-600 px-2 py-0.5 uppercase text-emerald-200"
                >
                  {typeLabels[item.listingType] ?? item.listingType}
                </span>
                <span
                  class="rounded-full border border-subtle bg-surface-card-alt px-2 py-0.5 text-secondary transition-colors"
                >
                  {statusLabels[item.status] ?? item.status}
                </span>
                {#if item.location}
                  <span>{item.location}</span>
                {/if}
              </div>

              <!-- Game count & owner -->
              <div class="mt-3 text-sm text-muted">
                {item.gameCount}
                {item.gameCount === 1 ? 'game' : 'games'}
                {#if item.ownerName}
                  · by {item.ownerName}
                {/if}
              </div>

              <!-- Reaction info -->
              <div class="mt-2 flex items-center gap-1.5 text-xs text-muted">
                <span class="text-base">{item.reactionEmoji}</span>
                <span>{formatRelativeTime(item.watchedAt)}</span>
              </div>

              <!-- Actions -->
              <div class="mt-4 flex gap-2 border-t border-subtle pt-3">
                <a
                  href={`/listings/${item.listingId}`}
                  class="flex-1 rounded-lg border border-subtle px-3 py-2 text-center text-sm text-secondary transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
                >
                  View listing
                </a>
                <!-- eslint-enable svelte/no-navigation-without-resolve -->
                <button
                  onclick={() => removeReaction(item.watchlistId)}
                  class="btn-ghost px-3 py-2 text-sm hover:border-rose-500 hover:text-rose-300"
                  title="Remove reaction"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        {/each}
      </div>

      <!-- Stats -->
      <div
        class="rounded-lg border border-subtle bg-surface-panel p-4 text-sm text-muted transition-colors"
      >
        <p>
          Watching {watchedListings.length}
          {watchedListings.length === 1 ? 'listing' : 'listings'}
        </p>
      </div>
    {/if}
  </div>
</main>
