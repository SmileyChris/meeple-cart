<script lang="ts">
  import type { PageData } from './$types';
  import ListingCard from '$lib/components/ListingCard.svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { getTimeGroup } from '$lib/utils/time';

  let { data }: { data: PageData } = $props();

  const filters = [
    { value: null, label: 'All', icon: '🎲' },
    { value: 'trade', label: 'Trade', icon: '🔄' },
    { value: 'sell', label: 'Sell', icon: '💰' },
    { value: 'want', label: 'Want', icon: '🔍' },
  ];

  type TimeGroup = 'today' | 'yesterday' | 'this-week' | 'older';

  const groupLabels: Record<TimeGroup, string> = {
    today: 'Today',
    yesterday: 'Yesterday',
    'this-week': 'This Week',
    older: 'Older',
  };

  const groupIcons: Record<TimeGroup, string> = {
    today: '⚡',
    yesterday: '🕐',
    'this-week': '📅',
    older: '📦',
  };

  // Group listings by time period
  let groupedListings = $derived.by(() => {
    const groups: Record<TimeGroup, typeof data.listings> = {
      today: [],
      yesterday: [],
      'this-week': [],
      older: [],
    };

    data.listings.forEach((listing) => {
      const group = getTimeGroup(listing.created);
      groups[group].push(listing);
    });

    return groups;
  });

  // Determine which groups have items (in order)
  let groupsToShow = $derived(
    (['today', 'yesterday', 'this-week', 'older'] as const).filter(
      (group) => groupedListings[group].length > 0
    )
  );

  function setFilter(type: string | null) {
    const url = new URL($page.url);
    if (type) {
      url.searchParams.set('type', type);
    } else {
      url.searchParams.delete('type');
    }
    url.searchParams.delete('page'); // Reset to page 1 when filtering
    // eslint-disable-next-line svelte/no-navigation-without-resolve
    goto(url, { replaceState: true });
  }

  function toggleCanPost() {
    const url = new URL($page.url);
    if (data.canPostFilter) {
      url.searchParams.delete('canPost');
    } else {
      url.searchParams.set('canPost', 'true');
    }
    url.searchParams.delete('page'); // Reset to page 1 when filtering
    // eslint-disable-next-line svelte/no-navigation-without-resolve
    goto(url, { replaceState: true });
  }

  function loadMore() {
    const url = new URL($page.url);
    url.searchParams.set('page', String(data.currentPage + 1));
    // eslint-disable-next-line svelte/no-navigation-without-resolve
    goto(url, { keepFocus: true });
  }
</script>

<svelte:head>
  <title>Meeple Cart · Trade and discover board games across Aotearoa</title>
  <meta
    name="description"
    content="See the latest board game listings and activity from Meeple Cart members across New Zealand."
  />
</svelte:head>

<main class="bg-surface-body px-6 py-16 text-primary transition-colors sm:px-8">
  <div class="mx-auto max-w-5xl space-y-8">
    <!-- Filter Buttons -->
    <div class="flex flex-col items-center gap-4">
      <div class="flex flex-wrap justify-center gap-3">
        {#each filters as filter (filter.label)}
          <button
            onclick={() => setFilter(filter.value)}
            class={`btn-ghost px-4 py-2 text-sm font-medium ${data.currentFilter === filter.value ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]' : ''}`}
          >
            <span class="mr-1.5">{filter.icon}</span>
            {filter.label}
          </button>
        {/each}
      </div>

      <!-- Can Post Filter -->
      <button
        onclick={toggleCanPost}
        class={`btn-ghost px-4 py-2 text-sm font-medium ${data.canPostFilter ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]' : ''}`}
      >
        <span class="mr-1.5">📮</span>
        Or can post
      </button>
    </div>

    <!-- Timeline View -->
    {#if data.listings.length === 0}
      <div
        class="mx-auto max-w-md rounded-2xl border-2 border-dashed border-subtle bg-surface-card p-12 text-center transition-colors"
      >
        <div class="mb-4 text-6xl opacity-20">📭</div>
        <p class="text-lg text-muted">No recent activity to show. Check back soon!</p>
      </div>
    {:else}
      <div class="space-y-16">
        {#each groupsToShow as group (group)}
          <div class="space-y-8">
            <!-- Group header -->
            <div class="flex items-center gap-4">
              <div class="flex-shrink-0">
                <div
                  class="flex h-12 w-12 items-center justify-center rounded-full bg-surface-card-alt text-2xl transition-colors ring-4 ring-[color:var(--surface-body)]"
                >
                  {groupIcons[group]}
                </div>
              </div>
              <div class="min-w-0 flex-1">
                <h2 class="text-2xl font-bold uppercase tracking-wide text-secondary sm:text-3xl">
                  {groupLabels[group]}
                </h2>
                <div
                  class="mt-1 h-px bg-gradient-to-r from-[color:rgba(148,163,184,0.45)] to-transparent"
                ></div>
              </div>
            </div>

            <!-- Listings grid -->
            <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {#each groupedListings[group] as listing (listing.id)}
                <ListingCard {listing} userPreferredRegions={data.userPreferredRegions} />
              {/each}
            </div>
          </div>
        {/each}
      </div>
    {/if}

    <!-- Load More Button -->
    {#if data.hasMore}
      <div class="flex justify-center pt-8">
        <button onclick={loadMore} class="btn-primary px-6 py-3 font-medium"> Load More </button>
      </div>
    {/if}

    <!-- Pagination Info -->
    {#if data.listings.length > 0}
      <p class="text-center text-sm text-muted">
        Page {data.currentPage} of {data.totalPages}
      </p>
    {/if}
  </div>
</main>
