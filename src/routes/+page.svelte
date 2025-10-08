<script lang="ts">
  import type { PageData } from './$types';
  import ListingCard from '$lib/components/ListingCard.svelte';

  export let data: PageData;

  const listingTypeOptions = [
    { label: 'All listing types', value: '' },
    { label: 'Trade', value: 'trade' },
    { label: 'Sell', value: 'sell' },
    { label: 'Want to Buy', value: 'want' },
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
</script>

<svelte:head>
  <title>Meeple Cart · Trade and discover board games across Aotearoa</title>
  <meta
    name="description"
    content="Browse active board game listings from Meeple Cart members across New Zealand and find your next trade."
  />
</svelte:head>

<main class="space-y-10 bg-slate-950 pb-16">
  <!-- eslint-disable svelte/no-navigation-without-resolve -->
  <section class="px-6 pt-16 text-slate-100 sm:px-8">
    <div class="mx-auto max-w-5xl space-y-6">
      <div class="space-y-4">
        <h1 class="text-4xl font-semibold tracking-tight sm:text-5xl">
          Trade board games across Aotearoa
        </h1>
        <p class="max-w-2xl text-base text-slate-300 sm:text-lg">
          Discover active listings from trusted Meeple Cart members, filter by location or listing
          type, and organise trades without the Facebook shuffle.
        </p>
      </div>
      <div class="flex flex-wrap gap-4">
        <a
          class="rounded-full bg-emerald-500 px-6 py-3 font-semibold text-slate-900 transition hover:bg-emerald-400"
          href="/activity"
        >
          ⚡ Recent Activity
        </a>
        <a
          class="rounded-full border border-slate-700 px-6 py-3 text-sm text-slate-300 transition hover:border-emerald-500 hover:text-emerald-300"
          href="/spec/prd.md"
          target="_blank"
          rel="external noopener"
        >
          Product spec
        </a>
        <a
          class="rounded-full border border-slate-700 px-6 py-3 text-sm text-slate-300 transition hover:border-emerald-500 hover:text-emerald-300"
          href="/spec/tech.md"
          target="_blank"
          rel="external noopener"
        >
          Technical plan
        </a>
      </div>
    </div>
  </section>

  <section class="px-6 sm:px-8">
    <div class="mx-auto max-w-5xl space-y-8">
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
            <label class="block text-sm font-medium text-slate-200" for="condition">Condition</label
            >
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

      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-2xl font-semibold text-slate-100">Active listings</h2>
          <p class="text-sm text-slate-400">
            {data.pagination.totalItems}
            {data.pagination.totalItems === 1 ? 'result' : 'results'}
          </p>
        </div>
        <p class="text-sm text-slate-400">
          Whether you are trading, selling, or looking for a wanted post, use the filters to narrow
          the feed.
        </p>
      </div>

      {#if data.listings.length > 0}
        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {#each data.listings as listing (listing.id)}
            <ListingCard {listing} />
          {/each}
        </div>
      {:else}
        <div
          class="rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-10 text-center text-slate-400"
        >
          {#if data.loadError}
            <p>
              We couldn't reach the listings service. Try refreshing once PocketBase is running.
            </p>
          {:else}
            <p>
              No active listings match your filters yet. Check back soon or create the first one.
            </p>
          {/if}
        </div>
      {/if}

      {#if data.pagination.totalPages > 1}
        <nav
          class="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-300"
        >
          <div>
            Page {data.pagination.page} of {data.pagination.totalPages}
          </div>
          <div class="flex items-center gap-3">
            {#if previousHref}
              <a
                class="rounded-lg border border-slate-700 px-3 py-1.5 transition hover:border-emerald-500 hover:text-emerald-300"
                href={previousHref}
              >
                Previous
              </a>
            {:else}
              <span class="rounded-lg border border-slate-800 px-3 py-1.5 text-slate-600"
                >Previous</span
              >
            {/if}
            {#if nextHref}
              <a
                class="rounded-lg border border-slate-700 px-3 py-1.5 transition hover:border-emerald-500 hover:text-emerald-300"
                href={nextHref}
              >
                Next
              </a>
            {:else}
              <span class="rounded-lg border border-slate-800 px-3 py-1.5 text-slate-600">Next</span
              >
            {/if}
          </div>
        </nav>
      {/if}
    </div>
  </section>
  <!-- eslint-enable svelte/no-navigation-without-resolve -->
</main>
