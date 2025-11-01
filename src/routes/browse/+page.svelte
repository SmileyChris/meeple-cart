<script lang="ts">
  import type { PageData } from './$types';
  import ListingCard from '$lib/components/ListingCard.svelte';
  import {
    NZ_REGIONS,
    NORTH_ISLAND_REGIONS,
    SOUTH_ISLAND_REGIONS,
    REGION_LABELS,
    getIslandRegions,
  } from '$lib/constants/regions';

  let { data }: { data: PageData } = $props();

  let filtersExpanded = $state(false);
  let selectedRegions = $state<string[]>(data.filters.regions ?? []);

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
    (data.filters.regions && data.filters.regions.length > 0) ||
      data.filters.type ||
      data.filters.search ||
      data.filters.condition ||
      data.filters.minPrice ||
      data.filters.maxPrice
  );

  // Island selection logic
  let northIslandChecked = $derived(
    NORTH_ISLAND_REGIONS.every((r) => selectedRegions.includes(r.value))
  );
  let southIslandChecked = $derived(
    SOUTH_ISLAND_REGIONS.every((r) => selectedRegions.includes(r.value))
  );

  function toggleIsland(island: 'north_island' | 'south_island') {
    const islandRegionValues = getIslandRegions(island);
    const allSelected =
      island === 'north_island' ? northIslandChecked : southIslandChecked;

    if (allSelected) {
      // Deselect all regions in this island
      selectedRegions = selectedRegions.filter((r) => !islandRegionValues.includes(r));
    } else {
      // Select all regions in this island
      const newRegions = islandRegionValues.filter((r) => !selectedRegions.includes(r));
      selectedRegions = [...selectedRegions, ...newRegions];
    }
  }

  function toggleRegion(region: string) {
    if (selectedRegions.includes(region)) {
      selectedRegions = selectedRegions.filter((r) => r !== region);
    } else {
      selectedRegions = [...selectedRegions, region];
    }
  }

  function clearFilters() {
    window.location.href = '/browse';
  }

  function removeFilter(filterType: string, value?: string) {
    const params = new URLSearchParams(window.location.search);

    if (filterType === 'region' && value) {
      // Remove specific region
      const regions = params.getAll('regions').filter((r) => r !== value);
      params.delete('regions');
      regions.forEach((r) => params.append('regions', r));
    } else if (filterType === 'search') {
      params.delete('search');
    } else if (filterType === 'type') {
      params.delete('type');
    } else if (filterType === 'condition') {
      params.delete('condition');
    } else if (filterType === 'minPrice') {
      params.delete('minPrice');
    } else if (filterType === 'maxPrice') {
      params.delete('maxPrice');
    }

    const query = params.toString();
    window.location.href = query ? `/browse?${query}` : '/browse';
  }

  const buildPageLink = (pageNumber: number): string => {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const params = new URLSearchParams();

    if (data.filters.search) {
      params.set('search', data.filters.search);
    }

    if (data.filters.type) {
      params.set('type', data.filters.type);
    }

    if (data.filters.regions && data.filters.regions.length > 0) {
      data.filters.regions.forEach((region) => {
        params.append('regions', region);
      });
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
  <title>Browse Games · Meeple Cart</title>
  <meta
    name="description"
    content="Browse active board game listings from Meeple Cart members across New Zealand. Filter by region, condition, price, and more."
  />
</svelte:head>

<main class="space-y-10 bg-surface-body pb-16 transition-colors">
  <!-- eslint-disable svelte/no-navigation-without-resolve -->
  <section class="px-6 pt-16 text-primary sm:px-8">
    <div class="mx-auto max-w-5xl space-y-6">
      <div class="space-y-4">
        <h1 class="text-4xl font-semibold tracking-tight sm:text-5xl">Browse Games</h1>
        <p class="max-w-2xl text-base text-secondary sm:text-lg">
          Search and filter through active listings from Meeple Cart members across New Zealand.
        </p>
      </div>

      <!-- Search Bar (Prominent) -->
      <form method="GET" class="space-y-4">
        <div class="relative">
          <input
            class="w-full rounded-xl border border-subtle bg-surface-card px-4 py-3.5 pl-11 text-base text-primary shadow-sm transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
            id="search"
            name="search"
            placeholder="Search for a game..."
            value={data.filters.search ?? ''}
            maxlength="200"
          />
          <svg
            class="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
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
        </div>

        <!-- Active Filters Display -->
        {#if hasFilters}
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-sm text-muted">Active filters:</span>
            {#if data.filters.search}
              <button
                type="button"
                onclick={() => removeFilter('search')}
                class="inline-flex items-center gap-1.5 rounded-full border border-subtle bg-surface-card px-3 py-1 text-sm text-secondary transition hover:bg-surface-panel"
              >
                <span>Search: "{data.filters.search}"</span>
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            {/if}
            {#if data.filters.type}
              <button
                type="button"
                onclick={() => removeFilter('type')}
                class="inline-flex items-center gap-1.5 rounded-full border border-subtle bg-surface-card px-3 py-1 text-sm text-secondary transition hover:bg-surface-panel"
              >
                <span
                  >{listingTypeOptions.find((o) => o.value === data.filters.type)?.label}</span
                >
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            {/if}
            {#if data.filters.condition}
              <button
                type="button"
                onclick={() => removeFilter('condition')}
                class="inline-flex items-center gap-1.5 rounded-full border border-subtle bg-surface-card px-3 py-1 text-sm text-secondary transition hover:bg-surface-panel"
              >
                <span
                  >{conditionOptions.find((o) => o.value === data.filters.condition)?.label}</span
                >
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            {/if}
            {#if data.filters.regions && data.filters.regions.length > 0}
              {#each data.filters.regions as region (region)}
                <button
                  type="button"
                  onclick={() => removeFilter('region', region)}
                  class="inline-flex items-center gap-1.5 rounded-full border border-subtle bg-surface-card px-3 py-1 text-sm text-secondary transition hover:bg-surface-panel"
                >
                  <span>{REGION_LABELS[region] ?? region}</span>
                  <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              {/each}
            {/if}
            {#if data.filters.minPrice}
              <button
                type="button"
                onclick={() => removeFilter('minPrice')}
                class="inline-flex items-center gap-1.5 rounded-full border border-subtle bg-surface-card px-3 py-1 text-sm text-secondary transition hover:bg-surface-panel"
              >
                <span>Min: ${data.filters.minPrice}</span>
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            {/if}
            {#if data.filters.maxPrice}
              <button
                type="button"
                onclick={() => removeFilter('maxPrice')}
                class="inline-flex items-center gap-1.5 rounded-full border border-subtle bg-surface-card px-3 py-1 text-sm text-secondary transition hover:bg-surface-panel"
              >
                <span>Max: ${data.filters.maxPrice}</span>
                <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            {/if}
            <button
              type="button"
              onclick={clearFilters}
              class="text-sm text-[var(--accent)] hover:underline"
            >
              Clear all
            </button>
          </div>
        {/if}

        <!-- Expandable Filters Section -->
        <div class="rounded-xl border border-subtle bg-surface-panel transition-colors">
          <button
            type="button"
            onclick={() => (filtersExpanded = !filtersExpanded)}
            class="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-surface-card"
          >
            <span class="text-sm font-medium text-secondary">
              {filtersExpanded ? 'Hide filters' : 'Show filters'}
            </span>
            <svg
              class="h-5 w-5 text-muted transition-transform {filtersExpanded ? 'rotate-180' : ''}"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {#if filtersExpanded}
            <div class="space-y-6 border-t border-subtle p-4">
              <!-- Regions -->
              <div>
                <label class="block text-sm font-medium text-secondary">Regions</label>
                <div class="mt-3 space-y-4">
                  <!-- North Island -->
                  <div class="space-y-2">
                    <label class="flex items-center gap-2 text-sm font-medium text-primary">
                      <input
                        type="checkbox"
                        class="h-4 w-4 rounded border border-subtle bg-surface-card transition-colors"
                        checked={northIslandChecked}
                        onchange={() => toggleIsland('north_island')}
                      />
                      North Island
                    </label>
                    <div class="ml-6 grid gap-2 sm:grid-cols-2">
                      {#each NORTH_ISLAND_REGIONS as region (region.value)}
                        <label class="flex items-center gap-2 text-sm text-secondary">
                          <input
                            type="checkbox"
                            name="regions"
                            value={region.value}
                            class="h-4 w-4 rounded border border-subtle bg-surface-card transition-colors"
                            checked={selectedRegions.includes(region.value)}
                            onchange={() => toggleRegion(region.value)}
                          />
                          {region.label}
                        </label>
                      {/each}
                    </div>
                  </div>

                  <!-- South Island -->
                  <div class="space-y-2">
                    <label class="flex items-center gap-2 text-sm font-medium text-primary">
                      <input
                        type="checkbox"
                        class="h-4 w-4 rounded border border-subtle bg-surface-card transition-colors"
                        checked={southIslandChecked}
                        onchange={() => toggleIsland('south_island')}
                      />
                      South Island
                    </label>
                    <div class="ml-6 grid gap-2 sm:grid-cols-2">
                      {#each SOUTH_ISLAND_REGIONS as region (region.value)}
                        <label class="flex items-center gap-2 text-sm text-secondary">
                          <input
                            type="checkbox"
                            name="regions"
                            value={region.value}
                            class="h-4 w-4 rounded border border-subtle bg-surface-card transition-colors"
                            checked={selectedRegions.includes(region.value)}
                            onchange={() => toggleRegion(region.value)}
                          />
                          {region.label}
                        </label>
                      {/each}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Other Filters -->
              <div class="grid gap-4 sm:grid-cols-2">
                <!-- Listing Type -->
                <div>
                  <label class="block text-sm font-medium text-secondary" for="type"
                    >Listing type</label
                  >
                  <select
                    class="mt-2 w-full rounded-lg border border-subtle bg-surface-card px-3 py-2 text-primary transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
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
                  <label class="block text-sm font-medium text-secondary" for="condition"
                    >Condition</label
                  >
                  <select
                    class="mt-2 w-full rounded-lg border border-subtle bg-surface-card px-3 py-2 text-primary transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
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
                  <label class="block text-sm font-medium text-secondary" for="minPrice">
                    Min price (NZD)
                  </label>
                  <input
                    class="mt-2 w-full rounded-lg border border-subtle bg-surface-card px-3 py-2 text-primary transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
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
                  <label class="block text-sm font-medium text-secondary" for="maxPrice">
                    Max price (NZD)
                  </label>
                  <input
                    class="mt-2 w-full rounded-lg border border-subtle bg-surface-card px-3 py-2 text-primary transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
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
                <button class="btn-primary" type="submit"> Apply filters </button>
                {#if hasFilters}
                  <button type="button" onclick={clearFilters} class="btn-ghost">
                    Clear filters
                  </button>
                {/if}
              </div>
            </div>
          {/if}
        </div>
      </form>
    </div>
  </section>

  <section class="px-6 sm:px-8">
    <div class="mx-auto max-w-5xl space-y-8">

      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-2xl font-semibold text-primary">Active listings</h2>
          <p class="text-sm text-muted">
            {data.pagination.totalItems}
            {data.pagination.totalItems === 1 ? 'result' : 'results'}
          </p>
        </div>
        <p class="text-sm text-muted">
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
          class="rounded-xl border border-dashed border-subtle bg-surface-card p-10 text-center text-muted transition-colors"
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
          class="flex items-center justify-between rounded-xl border border-subtle bg-surface-panel px-4 py-3 text-sm text-secondary transition-colors"
        >
          <div>
            Page {data.pagination.page} of {data.pagination.totalPages}
          </div>
          <div class="flex items-center gap-3">
            {#if previousHref}
              <a class="btn-ghost" href={previousHref}> Previous </a>
            {:else}
              <span class="rounded-full border border-subtle px-3 py-1.5 text-muted">Previous</span>
            {/if}
            {#if nextHref}
              <a class="btn-ghost" href={nextHref}> Next </a>
            {:else}
              <span class="rounded-full border border-subtle px-3 py-1.5 text-muted">Next</span>
            {/if}
          </div>
        </nav>
      {/if}
    </div>
  </section>
  <!-- eslint-enable svelte/no-navigation-without-resolve -->
</main>
