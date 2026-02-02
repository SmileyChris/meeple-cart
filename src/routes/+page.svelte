<script lang="ts">
  import type { PageData } from './$types';
  import OfferCard from '$lib/components/OfferCard.svelte';
  import ChatCard from '$lib/components/ChatCard.svelte';
  import CascadeCard from '$lib/components/CascadeCard.svelte';
  import RegionSelector from '$lib/components/RegionSelector.svelte';
  import { goto, invalidate } from '$app/navigation';
  import { page } from '$app/stores';
  import { getTimeGroup } from '$lib/utils/time';
  import { currentUser } from '$lib/pocketbase';
  import { NORTH_ISLAND_REGIONS, SOUTH_ISLAND_REGIONS } from '$lib/constants/regions';
  import { browser } from '$app/environment';
  import {
    saveRegionFilterState,
    saveCanPostState,
    saveGuestRegions,
    getGuestRegions,
  } from '$lib/utils/filters';

  let { data }: { data: PageData } = $props();

  // Sync URL with applied filters (from page.ts localStorage reading)
  $effect(() => {
    if (!browser) return;

    const url = new URL($page.url);
    let needsUpdate = false;

    // Sync region filter
    const hasRegionParams = url.searchParams.has('region');
    if (data.myRegionsFilter && !hasRegionParams) {
      const regions = $currentUser?.preferred_regions ?? guestRegions;
      regions.forEach((r) => url.searchParams.append('region', r));
      needsUpdate = true;
    }

    // Sync canPost filter (only when region filter is active)
    if (data.canPostFilter && data.myRegionsFilter && !url.searchParams.has('canPost')) {
      url.searchParams.set('canPost', 'true');
      needsUpdate = true;
    }

    // Sync openToTrades filter
    if (data.openToTradesFilter && !url.searchParams.has('openToTrades')) {
      url.searchParams.set('openToTrades', 'true');
      needsUpdate = true;
    }

    if (needsUpdate) {
      history.replaceState(history.state, '', url.toString());
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

  // Group activity items by time period
  let groupedActivity = $derived.by(() => {
    const groups: Record<TimeGroup, typeof data.activity> = {
      today: [],
      yesterday: [],
      'this-week': [],
      older: [],
    };

    data.activity.forEach((item) => {
      const group = getTimeGroup(item.created);
      groups[group].push(item);
    });

    return groups;
  });

  // Determine which groups have items (in order)
  let groupsToShow = $derived(
    (['today', 'yesterday', 'this-week', 'older'] as const).filter(
      (group) => groupedActivity[group].length > 0
    )
  );

  function clearAllFilters() {
    // Use window.location.href to get actual URL (history.replaceState doesn't update $page.url)
    const url = new URL(browser ? window.location.href : $page.url);
    url.searchParams.delete('region');
    url.searchParams.delete('canPost');
    url.searchParams.delete('openToTrades');
    url.searchParams.delete('page');
    if (browser) {
      saveRegionFilterState(false);
      // Don't clear canPost from storage - keep it for when region filter is re-enabled
    }
    goto(url, { replaceState: true, invalidateAll: true });
  }

  function toggleCanPost() {
    const url = new URL(browser ? window.location.href : $page.url);
    if (data.canPostFilter) {
      url.searchParams.delete('canPost');
      if (browser) saveCanPostState(false);
    } else {
      url.searchParams.set('canPost', 'true');
      if (browser) saveCanPostState(true);
    }
    url.searchParams.delete('page');
    goto(url, { replaceState: true, invalidateAll: true });
  }

  function toggleOpenToTrades() {
    const url = new URL(browser ? window.location.href : $page.url);
    if (data.openToTradesFilter) {
      url.searchParams.delete('openToTrades');
    } else {
      url.searchParams.set('openToTrades', 'true');
    }
    url.searchParams.delete('page');
    goto(url, { replaceState: true, invalidateAll: true });
  }

  function toggleMyRegions() {
    const url = new URL(browser ? window.location.href : $page.url);
    const regionsToUse = $currentUser?.preferred_regions || guestRegions;

    if (data.myRegionsFilter) {
      // Remove all region params
      url.searchParams.delete('region');
      url.searchParams.delete('canPost');
      if (browser) {
        saveRegionFilterState(false);
      }
    } else {
      // Add region params for each preferred region
      url.searchParams.delete('region');
      regionsToUse.forEach((region) => {
        url.searchParams.append('region', region);
      });
      if (browser) {
        saveRegionFilterState(true);
        // Restore canPost if it was stored
        const storedCanPost = localStorage.getItem('preferredCanPost');
        if (storedCanPost === 'true') {
          url.searchParams.set('canPost', 'true');
        }
      }
    }
    url.searchParams.delete('page');
    goto(url, { replaceState: true, invalidateAll: true });
  }

  function loadMore() {
    const url = new URL($page.url);
    url.searchParams.set('page', String(data.currentPage + 1));
    goto(url, { keepFocus: true });
  }

  async function toggleGuestRegion(regionValue: string) {
    const wasEmpty = guestRegions.length === 0;
    const allRegions = [...NORTH_ISLAND_REGIONS, ...SOUTH_ISLAND_REGIONS].map((r) => r.value);

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

<main class="bg-surface-body px-6 py-8 text-primary transition-colors sm:px-8">
  <div class="mx-auto max-w-5xl space-y-8">
    <!-- Secondary Nav Tabs -->
    <div class="flex flex-wrap items-center gap-2 border-b border-subtle">
      <!-- All Tab -->
      <button
        onclick={clearAllFilters}
        class="border-b-2 px-4 py-2 text-sm font-medium transition {!data.myRegionsFilter &&
        !data.openToTradesFilter &&
        !data.canPostFilter
          ? 'border-accent text-accent'
          : 'border-transparent text-secondary hover:text-primary'}"
      >
        All
      </button>

      <!-- Region Tab -->
      {#if $currentUser}
        {#if data.hasPreferredRegions}
          <button
            onclick={toggleMyRegions}
            class="border-b-2 px-4 py-2 text-sm font-medium transition {data.myRegionsFilter
              ? 'border-accent text-accent'
              : 'border-transparent text-secondary hover:text-primary'}"
          >
            📍 My Regions
          </button>
        {:else}
          <a
            href="/profile"
            class="border-b-2 border-transparent px-4 py-2 text-sm font-medium text-muted transition hover:text-primary"
          >
            📍 Set up regions
          </a>
        {/if}
      {:else}
        <!-- Non-logged-in user: Region selector -->
        <div class="relative" bind:this={regionSelectorRef}>
          <button
            onclick={() => {
              if (guestRegions.length > 0) {
                toggleMyRegions();
              } else {
                showRegionSelector = !showRegionSelector;
              }
            }}
            class="border-b-2 px-4 py-2 text-sm font-medium transition {data.myRegionsFilter
              ? 'border-accent text-accent'
              : 'border-transparent text-secondary hover:text-primary'}"
          >
            📍 {guestRegions.length > 0
              ? guestRegions.length === 1
                ? NORTH_ISLAND_REGIONS.find((r) => r.value === guestRegions[0])?.label ||
                  SOUTH_ISLAND_REGIONS.find((r) => r.value === guestRegions[0])?.label
                : `${guestRegions.length} regions`
              : 'Filter by region'}
          </button>

          <!-- Edit regions button when regions are selected -->
          {#if guestRegions.length > 0}
            <button
              onclick={(e) => {
                e.stopPropagation();
                showRegionSelector = !showRegionSelector;
              }}
              class="ml-1 text-muted transition hover:text-primary"
              title="Edit regions"
            >
              ⚙️
            </button>
          {/if}

          <RegionSelector
            bind:guestRegions
            bind:showRegionSelector
            onToggleRegion={toggleGuestRegion}
            onClear={clearGuestRegions}
          />
        </div>
      {/if}

      <!-- Can Post Tab (only when region filter is active) -->
      {#if data.myRegionsFilter && (($currentUser && data.hasPreferredRegions) || (!$currentUser && guestRegions.length > 0))}
        <button
          onclick={toggleCanPost}
          class="border-b-2 px-4 py-2 text-sm font-medium transition {data.canPostFilter
            ? 'border-accent text-accent'
            : 'border-transparent text-secondary hover:text-primary'}"
        >
          + Can Post
        </button>
      {/if}

      <!-- Open to Trades Tab (right side) -->
      <button
        onclick={toggleOpenToTrades}
        class="ml-auto border-b-2 px-4 py-2 text-sm font-medium transition {data.openToTradesFilter
          ? 'border-accent text-accent'
          : 'border-transparent text-secondary hover:text-primary'}"
      >
        🔄 Open to Trades
      </button>
    </div>

    <!-- Timeline View -->
    {#if data.activity.length === 0}
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

            <!-- Activity grid -->
            <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {#each groupedActivity[group] as item (item.id)}
                {#if item.itemType === 'offer'}
                  <OfferCard offer={item} userPreferredRegions={data.userPreferredRegions} />
                {:else if item.itemType === 'discussion'}
                  <ChatCard thread={item} />
                {:else if item.itemType === 'cascade'}
                  <CascadeCard cascade={item} />
                {/if}
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
    {#if data.activity.length > 0}
      <p class="text-center text-sm text-muted">
        Page {data.currentPage} of {data.totalPages}
      </p>
    {/if}
  </div>
</main>
