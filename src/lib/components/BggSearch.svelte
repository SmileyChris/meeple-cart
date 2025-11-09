<script lang="ts">
  import { searchGames, parseSearchResponse } from '$lib/bgg';
  import type { BggSearchItem } from '$lib/types/bgg';

  interface Props {
    onSelect?: (game: BggSearchItem) => void;
    placeholder?: string;
  }

  let { onSelect, placeholder = 'Search BoardGameGeek...' }: Props = $props();

  let query = $state('');
  let results = $state<BggSearchItem[]>([]);
  let isSearching = $state(false);
  let error = $state('');
  let showDropdown = $state(false);
  let selectedIndex = $state(-1);

  let searchTimeout: ReturnType<typeof setTimeout> | null = null;

  // Debounced search
  async function handleInput() {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (query.trim().length < 2) {
      results = [];
      showDropdown = false;
      return;
    }

    searchTimeout = setTimeout(async () => {
      await performSearch();
    }, 300);
  }

  async function performSearch() {
    if (!query.trim()) return;

    isSearching = true;
    error = '';

    try {
      const xml = await searchGames(query.trim());
      const response = parseSearchResponse(xml);
      results = response.items;
      showDropdown = true;
      selectedIndex = -1;
    } catch (err: any) {
      console.error('BGG search failed:', err);
      error = err.message || 'Search failed. Please try again.';
      results = [];
    } finally {
      isSearching = false;
    }
  }

  function handleSelect(game: BggSearchItem) {
    if (onSelect) {
      onSelect(game);
    }
    query = game.name.value;
    showDropdown = false;
    results = [];
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!showDropdown || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        showDropdown = false;
        break;
    }
  }

  function handleBlur() {
    // Delay to allow click events to fire
    setTimeout(() => {
      showDropdown = false;
    }, 200);
  }
</script>

<div class="relative">
  <input
    type="text"
    bind:value={query}
    oninput={handleInput}
    onkeydown={handleKeydown}
    onblur={handleBlur}
    onfocus={() => {
      if (results.length > 0) showDropdown = true;
    }}
    {placeholder}
    class="w-full rounded-lg border border-subtle bg-surface-body px-4 py-2 text-primary placeholder-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
  />

  {#if isSearching}
    <div class="absolute right-3 top-3">
      <div
        class="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent"
      ></div>
    </div>
  {/if}

  {#if error}
    <p class="mt-1 text-xs text-red-400">{error}</p>
  {/if}

  {#if showDropdown && results.length > 0}
    <div
      class="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-subtle bg-surface-card shadow-lg"
    >
      {#each results as game, index}
        <button
          type="button"
          onclick={() => handleSelect(game)}
          class="w-full px-4 py-2 text-left transition hover:bg-surface-body {selectedIndex ===
          index
            ? 'bg-surface-body'
            : ''}"
        >
          <div class="font-medium text-primary">{game.name.value}</div>
          {#if game.yearpublished}
            <div class="text-xs text-muted">({game.yearpublished.value})</div>
          {/if}
        </button>
      {/each}
    </div>
  {/if}

  {#if showDropdown && results.length === 0 && query.trim().length >= 2 && !isSearching}
    <div
      class="absolute z-10 mt-1 w-full rounded-lg border border-subtle bg-surface-card p-4 shadow-lg"
    >
      <p class="text-sm text-muted">No games found. Try a different search.</p>
    </div>
  {/if}
</div>
