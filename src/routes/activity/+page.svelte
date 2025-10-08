<script lang="ts">
  import type { PageData } from './$types';
  import ActivityTimeline from '$lib/components/ActivityTimeline.svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  export let data: PageData;

  const filters = [
    { value: null, label: 'All', icon: '🎲' },
    { value: 'trade', label: 'Trade', icon: '🔄' },
    { value: 'sell', label: 'Sell', icon: '💰' },
    { value: 'want', label: 'Want', icon: '🔍' },
  ];

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

  function loadMore() {
    const url = new URL($page.url);
    url.searchParams.set('page', String(data.currentPage + 1));
    // eslint-disable-next-line svelte/no-navigation-without-resolve
    goto(url, { keepFocus: true });
  }
</script>

<svelte:head>
  <title>Recent Activity · Meeple Cart</title>
  <meta
    name="description"
    content="See the latest board game listings and activity from Meeple Cart members across New Zealand."
  />
</svelte:head>

<main class="min-h-screen bg-slate-950 px-6 py-16 sm:px-8">
  <div class="mx-auto max-w-4xl space-y-8">
    <!-- Filter Buttons -->
    <div class="flex flex-wrap justify-center gap-3">
      {#each filters as filter (filter.label)}
        <button
          on:click={() => setFilter(filter.value)}
          class="rounded-full border px-4 py-2 text-sm font-medium transition {data.currentFilter ===
          filter.value
            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-200'
            : 'border-slate-700 text-slate-300 hover:border-emerald-500 hover:text-emerald-300'}"
        >
          <span class="mr-1.5">{filter.icon}</span>
          {filter.label}
        </button>
      {/each}
    </div>

    <ActivityTimeline activities={data.activities} />

    <!-- Load More Button -->
    {#if data.hasMore}
      <div class="flex justify-center pt-8">
        <button
          on:click={loadMore}
          class="rounded-full border border-emerald-500 bg-emerald-500/10 px-6 py-3 font-medium text-emerald-200 transition hover:bg-emerald-500/20"
        >
          Load More
        </button>
      </div>
    {/if}

    <!-- Pagination Info -->
    {#if data.activities.length > 0}
      <p class="text-center text-sm text-slate-500">
        Page {data.currentPage} of {data.totalPages}
      </p>
    {/if}
  </div>
</main>
