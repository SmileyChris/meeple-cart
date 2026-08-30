<script lang="ts">
  import { onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { pb, currentUser } from '$lib/pocketbase';
  import type { PageData } from './$types';
  import {
    NORTH_ISLAND_REGIONS,
    SOUTH_ISLAND_REGIONS,
    getIslandRegions,
  } from '$lib/constants/regions';
  import BggSearch from '$lib/components/BggSearch.svelte';
  import type { BggSearchItem } from '$lib/types/bgg';

  // Form state (for validation errors)
  interface FormState {
    message?: string;
    fieldErrors?: Record<string, string>;
  }

  let { data }: { data: PageData } = $props();
  let formState = $state<FormState>({});
  let isSubmitting = $state(false);

  type ItemType = 'board_game' | 'other';
  type ListingType = 'trade' | 'sell' | 'want';

  interface GameEntry {
    itemType: ItemType;
    title: string;
    condition: string;
    price?: number;
    trade_value?: number;
    notes: string;
    bgg_id: string;
    can_post: boolean;
  }

  // Listing State
  let listingType = $state<ListingType>('trade');
  let listingTitle = $state('');
  let summary = $state('');
  let location = $state(currentUser ? $currentUser?.location || '' : '');
  let selectedRegions = $state<string[]>([]);
  let photoFiles = $state<File[]>([]);

  // Items State
  let games = $state<GameEntry[]>([
    {
      itemType: 'board_game',
      title: '',
      condition: data.defaults.condition,
      notes: '',
      bgg_id: '',
      can_post: false,
    },
  ]);

  // Derived state for simple/complex mode
  // If there is only 1 item, we are in "Simple Mode"
  let isSimpleMode = $derived(games.length === 1);

  // Auto-fill Listing Title in Simple Mode
  $effect(() => {
    if (isSimpleMode && games[0].title) {
      listingTitle = games[0].title;
    }
  });

  // Island selection logic
  let northIslandChecked = $derived(
    NORTH_ISLAND_REGIONS.every((r) => selectedRegions.includes(r.value))
  );
  let southIslandChecked = $derived(
    SOUTH_ISLAND_REGIONS.every((r) => selectedRegions.includes(r.value))
  );

  function toggleIsland(island: 'north_island' | 'south_island') {
    const islandRegionValues = getIslandRegions(island);
    const allSelected = island === 'north_island' ? northIslandChecked : southIslandChecked;

    if (allSelected) {
      selectedRegions = selectedRegions.filter((r) => !islandRegionValues.includes(r));
    } else {
      const newRegions = islandRegionValues.filter((r) => !selectedRegions.includes(r));
      selectedRegions = [...selectedRegions, ...newRegions];
    }
  }

  function toggleRegion(regionValue: string) {
    if (selectedRegions.includes(regionValue)) {
      selectedRegions = selectedRegions.filter((r) => r !== regionValue);
    } else {
      selectedRegions = [...selectedRegions, regionValue];
    }
  }

  // Helper to get region labels
  function getRegionLabel(value: string) {
    const north = NORTH_ISLAND_REGIONS.find((r) => r.value === value);
    if (north) return north.label;
    const south = SOUTH_ISLAND_REGIONS.find((r) => r.value === value);
    if (south) return south.label;
    return value;
  }

  let photoPreviews = $state<Array<{ name: string; url: string; size: string }>>([]);

  const resetPreviews = () => {
    for (const preview of photoPreviews) {
      URL.revokeObjectURL(preview.url);
    }
    photoPreviews = [];
  };

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
  };

  const handlePhotoChange = (event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    photoFiles = files;

    resetPreviews();

    photoPreviews = files.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
      size: formatSize(file.size),
    }));
  };

  const addGame = () => {
    games = [
      ...games,
      {
        itemType: 'board_game',
        title: '',
        condition: data.defaults.condition,
        notes: '',
        bgg_id: '',
        can_post: false,
      },
    ];
  };

  function handleBggSelect(index: number, game: BggSearchItem) {
    games[index].title = game.name.value;
    games[index].bgg_id = String(game.id);
  }

  function setItemType(index: number, type: ItemType) {
    games[index].itemType = type;
    if (type === 'other') {
      games[index].bgg_id = '';
    }
  }

  const removeGame = (index: number) => {
    games = games.filter((_, i) => i !== index);
  };

  async function handleSubmit(event: Event) {
    event.preventDefault();
    isSubmitting = true;
    formState = {};

    let listingId = '';

    try {
      if (!$currentUser) throw new Error('You must be logged in');

      // Append selected regions to summary if present, to ensure they are not lost
      // Note: Listing schema might have a 'regions' JSON field in newer migrations (1731900008_add_listing_regions.js)
      // We will attempt to send it as structured data if the schema supports it (which it likely does given the migration file)
      // AND append to summary as a fallback/display helper.
      let finalSummary = summary;
      if (selectedRegions.length > 0) {
         const regionNames = selectedRegions.map(getRegionLabel).join(', ');
         if (!finalSummary.includes('Pickup available in:')) {
            finalSummary = finalSummary
               ? `${finalSummary}\n\nPickup available in: ${regionNames}`
               : `Pickup available in: ${regionNames}`;
         }
      }

      // Check shipping available upfront
      const anyCanPost = games.some(g => g.can_post);

      // 1. Create Listing
      const listingData = new FormData();
      listingData.append('title', listingTitle);
      listingData.append('listing_type', listingType);
      listingData.append('status', 'active');
      listingData.append('owner', $currentUser.id);
      listingData.append('summary', finalSummary);
      listingData.append('location', location);
      listingData.append('views', '0');
      if (anyCanPost) {
        listingData.append('shipping_available', 'true');
      }

      // Add regions as structured data (JSON string for FormData)
      if (selectedRegions.length > 0) {
         // FormData handles arrays by appending multiple values with the same key
         for (const region of selectedRegions) {
             listingData.append('regions', region);
         }
      }

      // Photos
      for (const file of photoFiles) {
        listingData.append('photos', file);
      }

      const listing = await pb.collection('listings').create(listingData);
      listingId = listing.id;

      // 2. Create Items
      for (const game of games) {
        await pb.collection('items').create({
          listing: listing.id,
          title: game.title,
          condition: game.condition,
          bgg_id: game.bgg_id ? parseInt(game.bgg_id) : null,
          price: game.price,
          trade_value: game.trade_value,
          notes: game.notes,
          status: 'available',
        });
      }

      await goto(`/listings/${listing.id}`);

    } catch (err: any) {
      console.error('Error creating listing:', err);
      formState = {
        message: err.message || 'Failed to create listing',
        fieldErrors: err.data?.data
      };

      // Attempt cleanup if listing was created but items failed
      if (listingId) {
         try {
            await pb.collection('listings').delete(listingId);
         } catch (deleteErr) {
            console.error('Failed to cleanup listing after error:', deleteErr);
         }
      }

      isSubmitting = false;
    }
  }

  onDestroy(() => {
    resetPreviews();
  });
</script>

<svelte:head>
  <title>Create listing · Meeple Cart</title>
</svelte:head>

<main class="bg-surface-body transition-colors px-6 py-12 text-primary sm:px-8">
  <div class="mx-auto max-w-4xl space-y-10">
    <header class="space-y-3">
      <h1 class="text-3xl font-semibold tracking-tight">Create a new listing</h1>
      <p class="text-sm text-muted">
        {isSimpleMode
          ? 'Quickly list an item for trade or sale.'
          : 'List multiple items together as a collection or bundle.'}
      </p>
    </header>

    {#if formState.message}
      <div class="rounded-lg border border-rose-500 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
        {formState.message}
      </div>
    {/if}

    <form class="space-y-10" onsubmit={handleSubmit}>

      <!-- STEP 1: WHAT ARE YOU LISTING? (Items First) -->
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <h2 class="text-xl font-semibold text-primary">Items</h2>
            <p class="text-sm text-muted">Add the items you want to list.</p>
          </div>
          <button
            class="rounded-lg border border-emerald-500 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/10"
            type="button"
            onclick={addGame}
          >
            + Add another item
          </button>
        </div>

        {#each games as game, index (index)}
          <section
            class="space-y-6 rounded-xl border border-subtle bg-surface-card transition-colors p-6 relative"
          >
            {#if games.length > 1}
              <button
                class="absolute top-4 right-4 text-sm text-rose-400 transition hover:text-rose-300"
                type="button"
                onclick={() => removeGame(index)}
              >
                Remove
              </button>
            {/if}

            <h3 class="text-lg font-medium text-primary mb-4">Item {index + 1}</h3>

            <!-- Item Type Selector -->
            <div class="flex gap-2 mb-4">
              <button
                type="button"
                class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition {game.itemType === 'board_game'
                  ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500'
                  : 'bg-surface-body text-secondary hover:bg-surface-card-alt'}"
                onclick={() => setItemType(index, 'board_game')}
              >
                <span>🎲</span> Board Game
              </button>
              <button
                type="button"
                class="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition {game.itemType === 'other'
                  ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500'
                  : 'bg-surface-body text-secondary hover:bg-surface-card-alt'}"
                onclick={() => setItemType(index, 'other')}
              >
                <span>📦</span> Other
              </button>
            </div>

            <div class="grid gap-6 sm:grid-cols-2">
              <!-- Title / BGG Search -->
              <div class="sm:col-span-2">
                {#if game.itemType === 'board_game'}
                  <label class="block text-sm font-medium text-secondary">Game Title</label>
                  {#if !game.bgg_id}
                    <div class="mt-2">
                      <BggSearch
                        placeholder="Search for a board game..."
                        onSelect={(bggGame) => handleBggSelect(index, bggGame)}
                      />
                    </div>
                  {:else}
                    <div class="mt-2 flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm">
                      <span class="text-emerald-300">✓</span>
                      <span class="font-medium text-primary">{game.title}</span>
                      <span class="text-muted">(BGG #{game.bgg_id})</span>
                      <button
                        type="button"
                        class="ml-auto text-muted hover:text-primary"
                        onclick={() => {
                          games[index].title = '';
                          games[index].bgg_id = '';
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  {/if}
                {:else}
                  <label class="block text-sm font-medium text-secondary" for="game_{index}_title">Item Title</label>
                  <input
                    class="mt-2 w-full rounded-lg border border-subtle bg-surface-body transition-colors px-3 py-2 text-primary focus:border-[var(--accent)]"
                    id="game_{index}_title"
                    placeholder="Enter item name"
                    required
                    maxlength="200"
                    bind:value={game.title}
                  />
                {/if}
              </div>

              <!-- Condition -->
              <div>
                <label class="block text-sm font-medium text-secondary" for="game_{index}_condition">Condition</label>
                <select
                  class="mt-2 w-full rounded-lg border border-subtle bg-surface-body transition-colors px-3 py-2 text-primary focus:border-[var(--accent)]"
                  id="game_{index}_condition"
                  bind:value={game.condition}
                >
                  {#each data.conditionOptions as option}
                    <option value={option}>{option.charAt(0).toUpperCase() + option.slice(1)}</option>
                  {/each}
                </select>
              </div>

              <!-- Price / Trade Value -->
              <div class="grid grid-cols-2 gap-4">
                 <div>
                    <label class="block text-sm font-medium text-secondary" for="game_{index}_price">Price ($)</label>
                    <input
                      type="number"
                      min="0"
                      class="mt-2 w-full rounded-lg border border-subtle bg-surface-body transition-colors px-3 py-2 text-primary focus:border-[var(--accent)]"
                      id="game_{index}_price"
                      placeholder="Optional"
                      bind:value={game.price}
                    />
                 </div>
                 <div>
                    <label class="block text-sm font-medium text-secondary" for="game_{index}_trade_value">Trade Value ($)</label>
                    <input
                      type="number"
                      min="0"
                      class="mt-2 w-full rounded-lg border border-subtle bg-surface-body transition-colors px-3 py-2 text-primary focus:border-[var(--accent)]"
                      id="game_{index}_trade_value"
                      placeholder="Optional"
                      bind:value={game.trade_value}
                    />
                 </div>
              </div>

              <!-- Notes -->
              <div class="sm:col-span-2">
                <label class="block text-sm font-medium text-secondary" for="game_{index}_notes">Notes</label>
                <textarea
                  class="mt-2 min-h-[80px] w-full rounded-lg border border-subtle bg-surface-body transition-colors px-3 py-2 text-primary focus:border-[var(--accent)]"
                  id="game_{index}_notes"
                  maxlength="2000"
                  placeholder="Condition details, missing components, expansions included..."
                  bind:value={game.notes}
                ></textarea>
              </div>

              <!-- Postage -->
              <div class="sm:col-span-2">
                <label class="flex items-center gap-2 text-sm text-secondary">
                  <input
                    class="h-4 w-4 rounded border border-subtle bg-surface-body transition-colors"
                    type="checkbox"
                    bind:checked={game.can_post}
                  />
                  📬 Can post (available for courier/postal delivery)
                </label>
              </div>
            </div>
          </section>
        {/each}
      </div>


      <!-- STEP 2: PHOTOS (Applies to the listing) -->
      <section class="space-y-6 rounded-xl border border-subtle bg-surface-card transition-colors p-6">
        <div class="space-y-2">
          <h2 class="text-xl font-semibold text-primary">Photos</h2>
          <p class="text-sm text-muted">Upload photos of your items.</p>
        </div>

        <div class="space-y-3">
          <label class="block text-sm font-medium text-secondary" for="photos-input">
             Select photos
          </label>
          <input
            id="photos-input"
            class="w-full cursor-pointer rounded-lg border border-dashed border-subtle bg-surface-body transition-colors px-3 py-8 text-sm text-secondary focus:border-[var(--accent)]"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            onchange={handlePhotoChange}
          />
        </div>

        {#if photoPreviews.length > 0}
          <div class="grid gap-4 sm:grid-cols-3">
            {#each photoPreviews as preview (preview.url)}
              <figure class="overflow-hidden rounded-lg border border-subtle bg-surface-card transition-colors">
                <img
                  alt={`Preview of ${preview.name}`}
                  class="h-40 w-full object-cover"
                  src={preview.url}
                />
              </figure>
            {/each}
          </div>
        {/if}
      </section>

      <!-- STEP 3: LISTING DETAILS -->
      <section class="space-y-6 rounded-xl border border-subtle bg-surface-card transition-colors p-6">
        <div class="space-y-2">
          <h2 class="text-xl font-semibold text-primary">Listing Settings</h2>
          <p class="text-sm text-muted">Finalize your listing details.</p>
        </div>

        <div class="grid gap-6 sm:grid-cols-2">

          <!-- Listing Type -->
          <div class="sm:col-span-2">
             <label class="block text-sm font-medium text-secondary">I want to...</label>
             <div class="mt-2 flex gap-4">
                <label class="flex items-center gap-2">
                   <input type="radio" name="listingType" value="trade" bind:group={listingType} class="text-emerald-500 focus:ring-emerald-500"/>
                   <span class="text-primary">Trade</span>
                </label>
                <label class="flex items-center gap-2">
                   <input type="radio" name="listingType" value="sell" bind:group={listingType} class="text-emerald-500 focus:ring-emerald-500"/>
                   <span class="text-primary">Sell</span>
                </label>
                <label class="flex items-center gap-2">
                   <input type="radio" name="listingType" value="want" bind:group={listingType} class="text-emerald-500 focus:ring-emerald-500"/>
                   <span class="text-primary">Buy (Want)</span>
                </label>
             </div>
          </div>

          <!-- Title -->
          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-secondary" for="title">Listing Title</label>
            <input
              class="mt-2 w-full rounded-lg border border-subtle bg-surface-body transition-colors px-3 py-2 text-primary focus:border-[var(--accent)]"
              id="title"
              placeholder="Eg: Gloomhaven + Expansions"
              required
              maxlength="120"
              bind:value={listingTitle}
            />
            {#if isSimpleMode}
                <p class="mt-1 text-xs text-muted">Auto-filled from item title, but you can change it.</p>
            {/if}
          </div>

          <!-- Location -->
          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-secondary" for="location">Location / Pickup Area</label>
            <input
              class="mt-2 w-full rounded-lg border border-subtle bg-surface-body transition-colors px-3 py-2 text-primary focus:border-[var(--accent)]"
              id="location"
              placeholder="Eg: Auckland CBD"
              maxlength="120"
              bind:value={location}
            />
          </div>

          <!-- Pickup Regions Checkboxes (Optional visual helper, not strictly required if users type location) -->
          <div class="sm:col-span-2">
            <details class="text-sm">
                <summary class="cursor-pointer text-emerald-500 font-medium select-none">Select pickup regions (optional)</summary>
                <div class="mt-4 space-y-4 pl-2 border-l-2 border-subtle">
                    <!-- North Island -->
                    <div class="space-y-2">
                        <label class="flex items-center gap-2 font-medium text-primary">
                        <input
                            type="checkbox"
                            checked={northIslandChecked}
                            onchange={() => toggleIsland('north_island')}
                        />
                        North Island
                        </label>
                        <div class="ml-6 grid gap-2 sm:grid-cols-2">
                        {#each NORTH_ISLAND_REGIONS as region (region.value)}
                            <label class="flex items-center gap-2 text-secondary">
                            <input
                                type="checkbox"
                                value={region.value}
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
                        <label class="flex items-center gap-2 font-medium text-primary">
                        <input
                            type="checkbox"
                            checked={southIslandChecked}
                            onchange={() => toggleIsland('south_island')}
                        />
                        South Island
                        </label>
                        <div class="ml-6 grid gap-2 sm:grid-cols-2">
                        {#each SOUTH_ISLAND_REGIONS as region (region.value)}
                            <label class="flex items-center gap-2 text-secondary">
                            <input
                                type="checkbox"
                                value={region.value}
                                checked={selectedRegions.includes(region.value)}
                                onchange={() => toggleRegion(region.value)}
                            />
                            {region.label}
                            </label>
                        {/each}
                        </div>
                    </div>
                </div>
            </details>
          </div>

          <!-- Summary -->
          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-secondary" for="summary">Description / Summary</label>
            <textarea
              class="mt-2 min-h-[140px] w-full rounded-lg border border-subtle bg-surface-body transition-colors px-3 py-2 text-primary focus:border-[var(--accent)]"
              id="summary"
              maxlength="2000"
              placeholder="Any other details about this listing..."
              bind:value={summary}
            ></textarea>
          </div>
        </div>
      </section>

      <div class="flex items-center justify-end gap-4 pb-10">
        <a
          class="rounded-lg border border-subtle px-4 py-2 text-sm text-secondary transition hover:border-emerald-500 hover:text-emerald-300"
          href="/"
        >
          Cancel
        </a>
        <button
          class="rounded-lg bg-emerald-500 px-6 py-2 font-semibold text-[var(--accent-contrast)] transition hover:bg-emerald-400 disabled:opacity-50"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Publishing...' : 'Publish Listing'}
        </button>
      </div>
    </form>
  </div>
</main>
