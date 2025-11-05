<script lang="ts">
  import type { PageData } from './$types';
  import ListingCard from '$lib/components/ListingCard.svelte';
  import RegionSelector from '$lib/components/RegionSelector.svelte';
  import { goto, invalidate } from '$app/navigation';
  import { page } from '$app/stores';
  import { getTimeGroup } from '$lib/utils/time';
  import { currentUser } from '$lib/pocketbase';
  import { NORTH_ISLAND_REGIONS, SOUTH_ISLAND_REGIONS } from '$lib/constants/regions';
  import { browser } from '$app/environment';
  import {
    applyStoredFilters,
    saveListingTypePreferences,
    saveRegionFilterState,
    saveCanPostState,
    saveGuestRegions,
    getGuestRegions,
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

  const listingTypes = [
    { value: 'sell', label: 'Sell', icon: '💰' },
    { value: 'trade', label: 'Trade', icon: '🔄' },
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

  function toggleListingType(type: string) {
    const url = new URL($page.url);
    const currentTypes = data.selectedTypes;

    let newTypes: string[];
    if (currentTypes.includes(type)) {
      newTypes = currentTypes.filter((t) => t !== type);
    } else {
      newTypes = [...currentTypes, type];
    }

    // If deselecting the last one, select all three instead
    if (newTypes.length === 0 || newTypes.length === 3) {
      // All selected - remove all type params
      url.searchParams.delete('sell');
      url.searchParams.delete('trade');
      url.searchParams.delete('want');

      // Remove from localStorage (default state)
      if (browser) {
        saveListingTypePreferences([]);
      }
    } else {
      // Set individual params for disabled types
      ['sell', 'trade', 'want'].forEach((t) => {
        if (newTypes.includes(t)) {
          url.searchParams.delete(t);
        } else {
          url.searchParams.set(t, 'false');
        }
      });

      // Save to localStorage
      if (browser) {
        saveListingTypePreferences(newTypes);
      }
    }

    url.searchParams.delete('page'); // Reset to page 1 when filtering
    // eslint-disable-next-line svelte/no-navigation-without-resolve
    goto(url);
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

  function loadMore() {
    const url = new URL($page.url);
    url.searchParams.set('page', String(data.currentPage + 1));
    // eslint-disable-next-line svelte/no-navigation-without-resolve
    goto(url, { keepFocus: true });
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
        await invalidate('app:listings');
      }
    } else {
      // Invalidate to recalculate with new regions
      await invalidate('app:listings');
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
    <!-- Filter Controls -->
    <div class="flex flex-wrap items-center justify-center gap-8">
      <!-- Listing Type Checkboxes -->
      <div class="flex flex-wrap justify-center gap-4">
        {#each listingTypes as type (type.value)}
          <button
            type="button"
            class={`btn-ghost flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all ${data.selectedTypes.includes(type.value) ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]' : ''}`}
            onclick={() => toggleListingType(type.value)}
          >
            <input
              type="checkbox"
              checked={data.selectedTypes.includes(type.value)}
              readonly
              class="pointer-events-none h-4 w-4 rounded border-subtle accent-[var(--accent)]"
            />
            <span>{type.icon}</span>
            <span>{type.label}</span>
          </button>
        {/each}
      </div>

      <!-- Region Filters -->
      <div class="flex flex-wrap items-center justify-center gap-3 text-sm">
        {#if $currentUser}
          <!-- Logged-in user: My Regions filter -->
          {#if data.hasPreferredRegions}
            <label
              class={`btn-ghost flex cursor-pointer items-center gap-2 px-4 py-2 font-medium transition-all ${data.myRegionsFilter ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]' : ''}`}
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
              class={`btn-ghost flex items-center overflow-hidden px-4 py-2 text-sm transition-all ${data.myRegionsFilter || showRegionSelector ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]' : ''}`}
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
            class={`btn-ghost flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all ${data.canPostFilter && data.myRegionsFilter ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]' : ''} ${!data.myRegionsFilter ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
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
