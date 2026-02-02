<script lang="ts">
  import type { PageData } from './$types';
  import GameCard from '$lib/components/GameCard.svelte';
  import RegionSelector from '$lib/components/RegionSelector.svelte';
  import { NORTH_ISLAND_REGIONS, SOUTH_ISLAND_REGIONS, REGION_LABELS } from '$lib/constants/regions';
  import { goto, invalidate } from '$app/navigation';
  import { page } from '$app/stores';
  import { currentUser } from '$lib/pocketbase';
  import { browser } from '$app/environment';
  import {
    applyStoredFilters,
    saveRegionFilterState,
    saveCanPostState,
    saveGuestRegions,
    getGuestRegions,
    saveConditionPreference,
    saveLastCondition,
    getLastCondition,
  } from '$lib/utils/filters';

  let { data }: { data: PageData } = $props();

  // Apply saved preferences on mount if no params in URL
  $effect(() => {
    if (!browser) return;

    const newUrl = applyStoredFilters($page.url, $currentUser);
    if (newUrl) {
      goto(newUrl, { replaceState: true });
    }
  });

  // Load preferred regions from localStorage for non-logged-in users
  let guestRegions = $state<string[]>(browser ? getGuestRegions() : []);
  let showRegionSelector = $state(false);
  let regionSelectorRef: HTMLDivElement | null = $state(null);

  // Close dropdown when clicking outside
  $effect(() => {
    if (!browser || !showRegionSelector) return;

    function handleClickOutside(event: MouseEvent) {
      if (regionSelectorRef && !regionSelectorRef.contains(event.target as Node)) {
        showRegionSelector = false;

        // If closing with no regions selected, turn off the filter
        if (guestRegions.length === 0 && data.myRegionsFilter) {
          toggleMyRegions();
        }
      }
    }

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  });

  const conditionOptions = [
    { value: 'mint', label: 'Mint', level: 4 },
    { value: 'excellent', label: 'Excellent', level: 3 },
    { value: 'good', label: 'Good', level: 2 },
    { value: 'fair', label: 'Fair', level: 1 },
    { value: 'poor', label: 'Well loved', level: 0 },
  ];

  // Find the current condition level from URL
  const currentConditionValue = data.filters.condition || '';
  const currentConditionIndex = conditionOptions.findIndex(c => c.value === currentConditionValue);

  // Load last used condition from localStorage for defaults (non-reactive)
  let lastCondition = 4;

  if (browser) {
    const storedCondition = getLastCondition();
    if (storedCondition) {
      const idx = conditionOptions.findIndex(c => c.value === storedCondition);
      if (idx >= 0) lastCondition = idx;
    }
  }

  let minConditionLevel = $state(currentConditionIndex >= 0 ? currentConditionIndex : 4); // Default to "any" (well loved)
  let tempConditionLevel = $state(currentConditionIndex >= 0 ? currentConditionIndex : 4); // Temporary value for slider
  let showConditionFilter = $state(false);
  let conditionFilterRef: HTMLDivElement | null = $state(null);
  let searchValue = $state(data.filters.search ?? '');
  let searchTimeout: ReturnType<typeof setTimeout> | null = $state(null);

  // Close condition filter dropdown when clicking outside
  $effect(() => {
    if (!browser || !showConditionFilter) return;

    function handleClickOutside(event: MouseEvent) {
      if (conditionFilterRef && !conditionFilterRef.contains(event.target as Node)) {
        showConditionFilter = false;
      }
    }

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  });

  function toggleMyRegions() {
    const url = new URL($page.url);
    const regionsToUse = $currentUser?.preferred_regions || guestRegions;

    if (data.myRegionsFilter) {
      // Remove all region params
      url.searchParams.delete('region');
      if (browser) {
        saveRegionFilterState(false);
      }
    } else {
      // Add region params for each preferred region
      url.searchParams.delete('region');
      regionsToUse.forEach(region => {
        url.searchParams.append('region', region);
      });
      if (browser) {
        saveRegionFilterState(true);
      }
    }
    url.searchParams.delete('page');
    // eslint-disable-next-line svelte/no-navigation-without-resolve
    goto(url, { replaceState: true });
  }

  async function toggleGuestRegion(regionValue: string) {
    const wasEmpty = guestRegions.length === 0;
    const allRegions = [...NORTH_ISLAND_REGIONS, ...SOUTH_ISLAND_REGIONS].map(r => r.value);

    if (guestRegions.includes(regionValue)) {
      guestRegions = guestRegions.filter((r) => r !== regionValue);
    } else {
      guestRegions = [...guestRegions, regionValue];
    }

    // If all regions are selected, clear them all
    if (guestRegions.length === allRegions.length) {
      guestRegions = [];
    }

    // Save to localStorage
    if (browser) {
      saveGuestRegions(guestRegions);
    }

    // If regions are now empty, turn off the filter
    if (guestRegions.length === 0 && data.myRegionsFilter) {
      toggleMyRegions();
      return;
    }

    // If this was the first region selected, close dropdown and enable filter
    if (wasEmpty && guestRegions.length === 1) {
      showRegionSelector = false;
      // Enable the filter for the first region
      if (!data.myRegionsFilter) {
        toggleMyRegions();
      } else {
        // Filter already on, just invalidate to reload data
        await invalidate('app:games');
      }
    } else {
      // Invalidate to recalculate with new regions
      await invalidate('app:games');
    }
  }

  function clearGuestRegions() {
    guestRegions = [];
    if (browser) {
      saveGuestRegions([]);
    }

    // Turn off the filter if it's on
    if (data.myRegionsFilter) {
      toggleMyRegions();
    }
  }

  function updateConditionFilter(level: number) {
    const url = new URL($page.url);
    const condition = conditionOptions[level];

    if (level === 4) {
      // "Any condition" - remove filter
      url.searchParams.delete('condition');
      if (browser) {
        saveConditionPreference(null);
      }
    } else {
      url.searchParams.set('condition', condition.value);
      if (browser) {
        saveConditionPreference(condition.value);
      }
    }

    url.searchParams.delete('page');
    // eslint-disable-next-line svelte/no-navigation-without-resolve
    goto(url);
  }

  function loadMore() {
    const url = new URL($page.url);
    url.searchParams.set('page', String(data.pagination.page + 1));
    // eslint-disable-next-line svelte/no-navigation-without-resolve
    goto(url, { keepFocus: true });
  }

  function handleSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    searchValue = target.value;

    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timeout for debounced search
    searchTimeout = setTimeout(() => {
      const url = new URL($page.url);

      if (searchValue.trim()) {
        url.searchParams.set('search', searchValue.trim());
      } else {
        url.searchParams.delete('search');
      }

      url.searchParams.delete('page'); // Reset to page 1 when searching
      // eslint-disable-next-line svelte/no-navigation-without-resolve
      goto(url);
    }, 500); // 500ms debounce
  }

  function toggleCanPost() {
    const url = new URL($page.url);
    if (data.canPostFilter) {
      url.searchParams.delete('canPost');
      if (browser) {
        saveCanPostState(false);
      }
    } else {
      url.searchParams.set('canPost', 'true');
      if (browser) {
        saveCanPostState(true);
      }
    }
    url.searchParams.delete('page');
    // eslint-disable-next-line svelte/no-navigation-without-resolve
    goto(url, { replaceState: true });
  }
</script>

<svelte:head>
  <title>Games · Meeple Cart</title>
  <meta
    name="description"
    content="Browse active board game listings from Meeple Cart members across New Zealand."
  />
</svelte:head>

<main class="bg-surface-body px-6 py-8 text-primary transition-colors sm:px-8">
  <div class="mx-auto max-w-5xl space-y-6">
    <!-- Search Bar -->
    <div class="space-y-6">
      <div class="relative">
        <input
          class="w-full rounded-xl border border-subtle bg-surface-card px-4 py-3.5 pl-11 text-base text-primary shadow-sm transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
          id="search"
          type="text"
          placeholder="Search for a game..."
          value={searchValue}
          oninput={handleSearchInput}
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

      <!-- Filter Controls -->
      <div class="flex flex-wrap items-center justify-center gap-8">
        <!-- Region Filters -->
        <div class="flex flex-wrap items-center justify-center gap-3 text-sm">
          {#if $currentUser}
            <!-- Logged-in user: My Regions filter -->
            {#if data.hasPreferredRegions}
              <label
                class={`btn-filter flex cursor-pointer items-center gap-2 px-4 py-2 font-medium ${data.myRegionsFilter ? 'active' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={data.myRegionsFilter}
                  onchange={toggleMyRegions}
                  class="h-4 w-4 rounded border-subtle accent-[var(--accent)]"
                />
                <span>📍</span>
                <span>My Region(s)</span>
              </label>
            {:else}
              <a
                href="/profile"
                class="btn-ghost px-4 py-2 text-sm font-medium text-muted hover:text-primary"
              >
                📍 Configure my regions
              </a>
            {/if}
          {:else}
            <!-- Non-logged-in user: Region selector with checkbox and dropdown -->
            <div class="relative flex items-center gap-2" bind:this={regionSelectorRef}>
              <span class="text-lg">📍</span>
              <div
                class={`btn-filter flex items-center overflow-hidden px-4 py-2 text-sm ${showRegionSelector ? 'open' : data.myRegionsFilter ? 'active' : ''}`}
              >
                {#if guestRegions.length > 0}
                  <label class="flex cursor-pointer items-center gap-2 font-medium">
                    <input
                      type="checkbox"
                      checked={data.myRegionsFilter}
                      onchange={toggleMyRegions}
                      class="h-4 w-4 rounded border-subtle accent-[var(--accent)]"
                    />
                    <span
                      >in {guestRegions.length === 1
                        ? NORTH_ISLAND_REGIONS.find((r) => r.value === guestRegions[0])?.label ||
                          SOUTH_ISLAND_REGIONS.find((r) => r.value === guestRegions[0])?.label
                        : `${guestRegions.length} regions`}</span
                    >
                  </label>
                  <div class="mx-3 h-4 w-px bg-subtle"></div>
                {/if}

                <button
                  onclick={() => (showRegionSelector = !showRegionSelector)}
                  class="group font-medium"
                >
                  {#if guestRegions.length > 0}
                    <span
                      class={`inline-block transition-transform ${showRegionSelector ? 'scale-125 rotate-45' : ''} group-hover:scale-125 group-hover:rotate-45`}
                      >⚙️</span
                    >
                  {:else}
                    <span>Filter by region</span>
                  {/if}
                </button>
              </div>

              <RegionSelector
                bind:guestRegions
                bind:showRegionSelector
                onToggleRegion={toggleGuestRegion}
                onClear={clearGuestRegions}
              />
            </div>
          {/if}

          <!-- Can Post filter (only show when regions are selected) -->
          {#if ($currentUser && data.hasPreferredRegions) || (!$currentUser && guestRegions.length > 0)}
            <label
              class={`btn-filter flex items-center gap-2 px-4 py-2 text-sm font-medium ${!data.myRegionsFilter ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${data.canPostFilter && data.myRegionsFilter ? 'active' : ''}`}
            >
              <input
                type="checkbox"
                checked={data.canPostFilter}
                disabled={!data.myRegionsFilter}
                onchange={toggleCanPost}
                class="h-4 w-4 rounded border-subtle accent-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
              />
              <span>Or Can Post</span>
            </label>
          {/if}
        </div>

        <!-- Condition Filter -->
        <div class="flex flex-wrap items-center justify-center gap-3 text-sm">
          <div class="relative flex items-center gap-2" bind:this={conditionFilterRef}>
            <span class="text-lg">⭐</span>
            {#if minConditionLevel < 4}
              <button
                type="button"
                onclick={() => {
                  tempConditionLevel = minConditionLevel;
                  showConditionFilter = !showConditionFilter;
                }}
                class={`btn-filter flex cursor-pointer items-center gap-2 px-4 py-2 font-medium ${showConditionFilter ? 'open' : 'active'}`}
              >
                <input
                  type="checkbox"
                  checked={true}
                  readonly
                  class="pointer-events-none h-4 w-4 rounded border-subtle accent-[var(--accent)]"
                />
                <span>
                  {#if minConditionLevel === 0}
                    Only mint condition
                  {:else}
                    At least {conditionOptions[minConditionLevel].label.toLowerCase()} condition
                  {/if}
                </span>
              </button>
            {:else}
              <button
                type="button"
                onclick={() => {
                  // Use last selected condition as default when opening
                  tempConditionLevel = minConditionLevel < 4 ? minConditionLevel : lastCondition;
                  showConditionFilter = !showConditionFilter;
                }}
                class={`btn-filter px-4 py-2 font-medium ${showConditionFilter ? 'open' : ''}`}
              >
                Any condition
              </button>
            {/if}

            {#if showConditionFilter}
              <div
                class="absolute left-0 top-full z-10 mt-2 w-80 rounded-lg border border-subtle bg-surface-card p-4 shadow-lg"
              >
                <div class="mb-3 flex items-center justify-between">
                  <h3 class="text-sm font-semibold text-primary">Minimum condition</h3>
                  {#if tempConditionLevel < 4}
                    <button
                      type="button"
                      onclick={(e) => {
                        e.stopPropagation();
                        tempConditionLevel = 4;
                        minConditionLevel = 4;
                        updateConditionFilter(4);
                        showConditionFilter = false;
                      }}
                      class="text-xs text-muted hover:text-accent"
                    >
                      Clear
                    </button>
                  {/if}
                </div>

                <div class="space-y-4">
                  <div class="text-center">
                    <span class="text-lg font-semibold text-primary">
                      {#if tempConditionLevel === 0}
                        Only mint condition
                      {:else if tempConditionLevel === 4}
                        Any condition
                      {:else}
                        At least {conditionOptions[tempConditionLevel].label.toLowerCase()} condition
                      {/if}
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="4"
                    step="1"
                    bind:value={tempConditionLevel}
                    class="h-2 w-full cursor-pointer appearance-none rounded-lg accent-[var(--accent)]"
                    style="background: linear-gradient(to right, var(--accent) 0%, var(--accent) {tempConditionLevel * 25}%, var(--surface-card-alt) {tempConditionLevel * 25}%, var(--surface-card-alt) 100%);"
                  />

                  <button
                    type="button"
                    onclick={() => {
                      minConditionLevel = tempConditionLevel;
                      updateConditionFilter(tempConditionLevel);
                      showConditionFilter = false;

                      // Save last used condition to localStorage
                      if (browser && tempConditionLevel < 4) {
                        saveLastCondition(conditionOptions[tempConditionLevel].value);
                      }
                    }}
                    class="btn-primary w-full px-4 py-2 text-sm font-medium"
                  >
                    {tempConditionLevel === 4 ? 'Clear' : 'Apply'}
                  </button>
                </div>
              </div>
            {/if}
          </div>
        </div>
      </div>

    </div>

    <!-- Results -->
    {#if data.activities.length === 0}
      <div
        class="mx-auto max-w-md rounded-2xl border-2 border-dashed border-subtle bg-surface-card p-12 text-center transition-colors"
      >
        <div class="mb-4 text-6xl opacity-20">📭</div>
        <p class="text-lg text-muted">
          {#if data.loadError}
            We couldn't reach the games service. Try refreshing once PocketBase is running.
          {:else}
            No games match your filters yet. Check back soon!
          {/if}
        </p>
      </div>
    {:else}
      <div>
        <div class="mb-6">
          <h2 class="text-2xl font-semibold text-primary">Available games</h2>
          <p class="text-sm text-muted">
            {data.activities.length}
            {data.activities.length === 1 ? 'game' : 'games'}
          </p>
        </div>

        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {#each data.activities as game (game.id)}
            <GameCard {game} />
          {/each}
        </div>
      </div>
    {/if}

    <!-- Load More Button -->
    {#if data.pagination.page < data.pagination.totalPages}
      <div class="flex justify-center pt-8">
        <button onclick={loadMore} class="btn-primary px-6 py-3 font-medium"> Load More </button>
      </div>
    {/if}

    <!-- Pagination Info -->
    {#if data.activities.length > 0}
      <p class="text-center text-sm text-muted">
        Page {data.pagination.page} of {data.pagination.totalPages}
      </p>
    {/if}
  </div>
</main>
