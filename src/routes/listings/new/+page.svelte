<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { PageData } from './$types';
  import {
    NORTH_ISLAND_REGIONS,
    SOUTH_ISLAND_REGIONS,
    getIslandRegions,
  } from '$lib/constants/regions';
  import BggSearch from '$lib/components/BggSearch.svelte';
  import type { BggSearchItem } from '$lib/types/bgg';
  import { pb, currentUser } from '$lib/pocketbase';
  import { goto } from '$app/navigation';
  import {
    buildListingPayload,
    buildListingFormData,
    buildItemPayloads,
    buildOfferTemplatePayload,
    type ItemCondition,
  } from '$lib/utils/listing-create';

  let { data }: { data: PageData } = $props();

  type ItemType = 'board_game' | 'other';

  interface GameEntry {
    itemType: ItemType;
    title: string;
    condition: ItemCondition;
    notes: string;
    bgg_id: string;
    year: string;
  }

  let title = $state('');
  let summary = $state('');
  let location = $state('');

  let submitting = $state(false);
  let formError = $state<string | null>(null);
  // Set only when a listing was created, a later step failed, and the
  // best-effort cleanup delete of that listing also failed — gives the
  // user a way back to the orphaned listing instead of losing it.
  let orphanedListingId = $state<string | null>(null);

  let selectedRegions = $state<string[]>([]);

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
      // Deselect all regions in this island
      selectedRegions = selectedRegions.filter((r) => !islandRegionValues.includes(r));
    } else {
      // Select all regions in this island
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

  let games = $state<GameEntry[]>([
    {
      itemType: 'board_game',
      title: '',
      condition: data.defaults.condition as ItemCondition,
      notes: '',
      bgg_id: '',
      year: '',
    },
  ]);

  // Offer terms (applies to the single offer covering every item above)
  let cashAmount = $state('');
  let openToLowerOffers = $state(false);
  let openToTradeOffers = $state(false);
  let tradeForItemsText = $state('');
  let canPostOffer = $state(false);
  let offerNotes = $state('');

  let photoFiles = $state<File[]>([]);
  let photoPreviews = $state<Array<{ name: string; url: string; size: string }>>([]);

  const resetPreviews = () => {
    for (const preview of photoPreviews) {
      URL.revokeObjectURL(preview.url);
    }

    photoPreviews = [];
  };

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    if (bytes >= 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${bytes} B`;
  };

  const handlePhotoChange = (event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];

    resetPreviews();

    photoFiles = files;
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
        condition: data.defaults.condition as ItemCondition,
        notes: '',
        bgg_id: '',
        year: '',
      },
    ];
  };

  function handleBggSelect(index: number, game: BggSearchItem) {
    games[index].title = game.name.value;
    games[index].bgg_id = String(game.id);
    games[index].year = game.yearpublished?.value ? String(game.yearpublished.value) : '';
  }

  function setItemType(index: number, type: ItemType) {
    games[index].itemType = type;
    // Clear BGG data when switching to "other"
    if (type === 'other') {
      games[index].bgg_id = '';
    }
  }

  const removeGame = (index: number) => {
    games = games.filter((_, i) => i !== index);
  };

  function errorMessageFor(err: unknown): string {
    const status = (err as { status?: number } | null)?.status;
    if (status === 400) return 'Invalid listing data. Please check the form and try again.';
    if (status === 403) return 'You do not have permission to create this listing.';
    return 'Something went wrong. Please try again later.';
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();

    if (submitting) return;

    const user = $currentUser;
    if (!user) {
      formError = 'You must be logged in to create a listing.';
      return;
    }

    submitting = true;
    formError = null;
    orphanedListingId = null;

    // Step 1: create the listing itself. If this fails there is nothing to
    // clean up yet, so just report the error.
    let listing;
    try {
      const listingPayload = buildListingPayload(
        { title, summary, location, regions: selectedRegions },
        user.id
      );
      const listingFormData = buildListingFormData(listingPayload, photoFiles);
      listing = await pb.collection('listings').create(listingFormData);
    } catch (err) {
      console.error('Failed to create listing:', err);
      formError = errorMessageFor(err);
      submitting = false;
      return;
    }

    // Step 2: create the items and the single offer template covering them.
    // If anything here fails, the listing already exists but is incomplete
    // (no items / no offer), so it must not be left behind silently: attempt
    // a best-effort delete of the listing rather than leaving an orphan the
    // user can't see and can't retry without duplicating.
    try {
      const itemPayloads = buildItemPayloads(
        games.map((game) => ({
          title: game.title,
          condition: game.condition,
          notes: game.notes,
          bggId: game.bgg_id,
          year: game.year,
        })),
        listing.id
      );
      const createdItems = [];
      for (const itemPayload of itemPayloads) {
        const item = await pb.collection('items').create(itemPayload);
        createdItems.push(item);
      }

      const offerTemplatePayload = buildOfferTemplatePayload(
        {
          cashAmount,
          openToLowerOffers,
          openToTradeOffers,
          tradeForItemsText,
          canPost: canPostOffer,
          notes: offerNotes,
        },
        {
          listingId: listing.id,
          ownerId: user.id,
          itemIds: createdItems.map((item) => item.id),
        }
      );
      await pb.collection('offer_templates').create(offerTemplatePayload);

      await goto(`/listings/${listing.id}`);
    } catch (err) {
      console.error('Failed to finish creating listing:', err);

      try {
        // Best-effort only: the listings -> items and listings -> offer_templates
        // relations both cascade-delete in the migrations, but that's a
        // PocketBase implementation detail we should not depend on here —
        // this delete is the actual cleanup, cascade or not.
        await pb.collection('listings').delete(listing.id);
        // Cleanup succeeded: report the original failure and leave every
        // field as the user left it so they can fix and resubmit without
        // creating a second, duplicate listing.
        formError = errorMessageFor(err);
      } catch (cleanupErr) {
        console.error('Failed to clean up incomplete listing:', cleanupErr);
        // Cleanup itself failed: the listing is now stuck half-built. Give
        // the user a way back to it instead of losing track of it.
        formError = `${errorMessageFor(err)} We also couldn't remove the incomplete listing automatically.`;
        orphanedListingId = listing.id;
      }

      submitting = false;
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
        Share the details of the items you want to trade or sell. Listings publish immediately and
        can be edited from your profile afterwards.
      </p>
    </header>

    {#if formError}
      <div class="rounded-lg border border-rose-500 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
        <p>{formError}</p>
        {#if orphanedListingId}
          <p class="mt-2">
            <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
            <a
              class="font-medium underline hover:text-rose-100"
              href={`/listings/${orphanedListingId}/manage`}
            >
              Go to the listing to finish or remove it
            </a>
          </p>
        {/if}
      </div>
    {/if}

    <form class="space-y-10" onsubmit={handleSubmit}>
      <section
        class="space-y-6 rounded-xl border border-subtle bg-surface-card transition-colors p-6"
      >
        <div class="space-y-2">
          <h2 class="text-xl font-semibold text-primary">Listing overview</h2>
          <p class="text-sm text-muted">
            These details describe how your listing appears in the feed.
          </p>
        </div>

        <div class="grid gap-6 sm:grid-cols-2">
          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-secondary" for="title">Listing title</label
            >
            <input
              class="mt-2 w-full rounded-lg border border-subtle bg-surface-body transition-colors px-3 py-2 text-primary focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
              id="title"
              name="title"
              placeholder="Eg: Gloomhaven 2nd edition with inserts"
              required
              maxlength="120"
              bind:value={title}
            />
          </div>

          <!-- Listing type field removed - type now inferred from offer templates -->

          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-secondary">Pickup regions</label>
            <p class="mt-1 text-xs text-muted">
              Select regions where you can meet for pickup (postage options set per-item below)
            </p>
            <div class="mt-3 space-y-4">
              <!-- North Island -->
              <div class="space-y-2">
                <label class="flex items-center gap-2 text-sm font-medium text-primary">
                  <input
                    type="checkbox"
                    class="h-4 w-4 rounded border border-subtle bg-surface-body transition-colors"
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
                        class="h-4 w-4 rounded border border-subtle bg-surface-body transition-colors"
                        name="regions"
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
                <label class="flex items-center gap-2 text-sm font-medium text-primary">
                  <input
                    type="checkbox"
                    class="h-4 w-4 rounded border border-subtle bg-surface-body transition-colors"
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
                        class="h-4 w-4 rounded border border-subtle bg-surface-body transition-colors"
                        name="regions"
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
          </div>

          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-secondary" for="location"
              >Additional location details (optional)</label
            >
            <input
              class="mt-2 w-full rounded-lg border border-subtle bg-surface-body transition-colors px-3 py-2 text-primary focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
              id="location"
              name="location"
              placeholder="Eg: Auckland CBD near Britomart, or West Auckland (Henderson)"
              maxlength="120"
              bind:value={location}
            />
            <p class="mt-1 text-xs text-muted">
              Add more specific pickup details within your selected regions
            </p>
          </div>

          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-secondary" for="summary">Summary</label>
            <textarea
              class="mt-2 min-h-[140px] w-full rounded-lg border border-subtle bg-surface-body transition-colors px-3 py-2 text-primary focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
              id="summary"
              name="summary"
              maxlength="2000"
              placeholder="Describe condition, included expansions, and trade preferences."
              bind:value={summary}
            ></textarea>
          </div>
        </div>

        <!-- Bundle preference fields removed - bundles now managed via offer templates -->
      </section>

      <section
        class="space-y-6 rounded-xl border border-subtle bg-surface-card transition-colors p-6"
      >
        <div class="space-y-2">
          <h2 class="text-xl font-semibold text-primary">Photos</h2>
          <p class="text-sm text-muted">
            Upload up to 6 images (PNG, JPG, WEBP, 5MB maximum each).
          </p>
        </div>

        <div class="space-y-3">
          <label class="block text-sm font-medium text-secondary" for="photos">Upload photos</label>
          <input
            class="w-full cursor-pointer rounded-lg border border-dashed border-subtle bg-surface-body transition-colors px-3 py-8 text-sm text-secondary focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
            id="photos"
            name="photos"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            onchange={handlePhotoChange}
          />
          <p class="text-xs text-muted">
            You'll need to reselect images if the form submission fails.
          </p>
        </div>

        {#if photoPreviews.length > 0}
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {#each photoPreviews as preview (preview.url)}
              <figure
                class="overflow-hidden rounded-lg border border-subtle bg-surface-card transition-colors"
              >
                <img
                  alt={`Preview of ${preview.name}`}
                  class="h-40 w-full object-cover"
                  src={preview.url}
                />
                <figcaption class="px-3 py-2 text-xs text-secondary">
                  <span class="block truncate font-medium text-primary">{preview.name}</span>
                  <span class="text-muted">{preview.size}</span>
                </figcaption>
              </figure>
            {/each}
          </div>
        {/if}
      </section>

      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <div class="space-y-1">
            <h2 class="text-xl font-semibold text-primary">Items</h2>
            <p class="text-sm text-muted">
              Add one or more items to this listing. Board games can be linked to BoardGameGeek for
              additional info.
            </p>
          </div>
          <button
            class="rounded-lg border border-emerald-500 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/10"
            type="button"
            onclick={addGame}
          >
            + Add item
          </button>
        </div>

        {#each games as game, index (index)}
          <section
            class="space-y-6 rounded-xl border border-subtle bg-surface-card transition-colors p-6"
          >
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-medium text-primary">Item {index + 1}</h3>
              {#if games.length > 1}
                <button
                  class="text-sm text-rose-400 transition hover:text-rose-300"
                  type="button"
                  onclick={() => removeGame(index)}
                >
                  Remove
                </button>
              {/if}
            </div>

            <!-- Item type toggle -->
            <div class="flex gap-2">
              <button
                type="button"
                class="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition {game.itemType ===
                'board_game'
                  ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500'
                  : 'bg-surface-body text-secondary hover:bg-surface-card-alt'}"
                onclick={() => setItemType(index, 'board_game')}
              >
                <span>🎲</span>
                <span>Board Game</span>
              </button>
              <button
                type="button"
                class="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition {game.itemType ===
                'other'
                  ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500'
                  : 'bg-surface-body text-secondary hover:bg-surface-card-alt'}"
                onclick={() => setItemType(index, 'other')}
              >
                <span>📦</span>
                <span>Other Item</span>
              </button>
            </div>

            <div class="grid gap-6 sm:grid-cols-2">
              <!-- Title input - different based on item type -->
              <div class="sm:col-span-2">
                {#if game.itemType === 'board_game'}
                  <label class="block text-sm font-medium text-secondary"
                    >Search BoardGameGeek</label
                  >
                  <p class="mt-1 text-xs text-muted">
                    Find your game to auto-fill details and link to BGG
                  </p>
                  <div class="mt-2">
                    <BggSearch
                      placeholder="Search for a board game..."
                      onSelect={(bggGame) => handleBggSelect(index, bggGame)}
                    />
                  </div>
                  <!-- Show selected game info -->
                  {#if game.bgg_id}
                    <div
                      class="mt-2 flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm"
                    >
                      <span class="text-emerald-300">✓</span>
                      <span class="font-medium text-primary">{game.title}</span>
                      <span class="text-muted">(BGG #{game.bgg_id})</span>
                      <button
                        type="button"
                        class="ml-auto text-muted hover:text-primary"
                        onclick={() => {
                          games[index].title = '';
                          games[index].bgg_id = '';
                          games[index].year = '';
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  {/if}
                {:else}
                  <label class="block text-sm font-medium text-secondary" for="game_{index}_title"
                    >Item title</label
                  >
                  <p class="mt-1 text-xs text-muted">
                    Eg: "3D printed Catan tiles" or "Kallax board game shelf"
                  </p>
                  <input
                    class="mt-2 w-full rounded-lg border border-subtle bg-surface-body transition-colors px-3 py-2 text-primary focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
                    id="game_{index}_title"
                    name="game_{index}_title"
                    placeholder="Enter item name"
                    required
                    maxlength="200"
                    bind:value={game.title}
                  />
                {/if}
              </div>

              <div>
                <label class="block text-sm font-medium text-secondary" for="game_{index}_condition"
                  >Condition</label
                >
                <select
                  class="mt-2 w-full rounded-lg border border-subtle bg-surface-body transition-colors px-3 py-2 text-primary focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
                  id="game_{index}_condition"
                  name="game_{index}_condition"
                  required
                  bind:value={game.condition}
                >
                  {#each data.conditionOptions as option (option)}
                    <option value={option}
                      >{option.charAt(0).toUpperCase() + option.slice(1)}</option
                    >
                  {/each}
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-secondary" for="game_{index}_year"
                  >Year (optional)</label
                >
                <input
                  class="mt-2 w-full rounded-lg border border-subtle bg-surface-body transition-colors px-3 py-2 text-primary focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
                  id="game_{index}_year"
                  type="number"
                  min="1900"
                  max="2100"
                  placeholder="Eg: 2019"
                  bind:value={game.year}
                />
              </div>

              <div class="sm:col-span-2">
                <label class="block text-sm font-medium text-secondary" for="game_{index}_notes"
                  >Notes</label
                >
                <textarea
                  class="mt-2 min-h-[120px] w-full rounded-lg border border-subtle bg-surface-body transition-colors px-3 py-2 text-primary focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
                  id="game_{index}_notes"
                  name="game_{index}_notes"
                  maxlength="2000"
                  placeholder={game.itemType === 'board_game'
                    ? 'Mention wear, missing components, or included expansions.'
                    : 'Describe the item, materials, dimensions, or any relevant details.'}
                  bind:value={game.notes}
                />
              </div>
            </div>
          </section>
        {/each}
      </div>

      <section
        class="space-y-6 rounded-xl border border-subtle bg-surface-card transition-colors p-6"
      >
        <div class="space-y-2">
          <h2 class="text-xl font-semibold text-primary">Offer terms</h2>
          <p class="text-sm text-muted">
            These terms apply to the whole listing. Buyers will see one offer covering every item
            above.
          </p>
        </div>

        <div class="grid gap-6 sm:grid-cols-2">
          <div>
            <label class="block text-sm font-medium text-secondary" for="cash_amount"
              >Asking price (NZ$)</label
            >
            <input
              class="mt-2 w-full rounded-lg border border-subtle bg-surface-body transition-colors px-3 py-2 text-primary focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
              id="cash_amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="Leave blank for trade only"
              bind:value={cashAmount}
            />
          </div>

          <div class="flex items-end">
            <label class="flex items-center gap-2 text-sm text-secondary">
              <input
                class="h-4 w-4 rounded border border-subtle bg-surface-body transition-colors"
                type="checkbox"
                bind:checked={openToLowerOffers}
              />
              Open to lower offers (or near offer)
            </label>
          </div>

          <div class="sm:col-span-2">
            <label class="flex items-center gap-2 text-sm text-secondary">
              <input
                class="h-4 w-4 rounded border border-subtle bg-surface-body transition-colors"
                type="checkbox"
                bind:checked={openToTradeOffers}
              />
              Open to trade offers
            </label>
          </div>

          {#if openToTradeOffers}
            <div class="sm:col-span-2">
              <label class="block text-sm font-medium text-secondary" for="trade_for_items"
                >What you'd take in trade</label
              >
              <input
                class="mt-2 w-full rounded-lg border border-subtle bg-surface-body transition-colors px-3 py-2 text-primary focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
                id="trade_for_items"
                placeholder="Eg: Scythe, Wingspan, or similar Euro games"
                maxlength="500"
                bind:value={tradeForItemsText}
              />
            </div>
          {/if}

          <div class="sm:col-span-2">
            <label class="flex items-center gap-2 text-sm text-secondary">
              <input
                class="h-4 w-4 rounded border border-subtle bg-surface-body transition-colors"
                type="checkbox"
                bind:checked={canPostOffer}
              />
              📬 Can post (available for courier/postal delivery)
            </label>
          </div>

          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-secondary" for="offer_notes"
              >Offer notes (optional)</label
            >
            <textarea
              class="mt-2 min-h-[100px] w-full rounded-lg border border-subtle bg-surface-body transition-colors px-3 py-2 text-primary focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
              id="offer_notes"
              maxlength="1000"
              placeholder="Any additional information about this offer..."
              bind:value={offerNotes}
            ></textarea>
          </div>
        </div>
      </section>

      <div class="flex items-center justify-end gap-4">
        <!-- eslint-disable svelte/no-navigation-without-resolve -->
        <a
          class="rounded-lg border border-subtle px-4 py-2 text-sm text-secondary transition hover:border-emerald-500 hover:text-emerald-300"
          href="/"
        >
          Cancel
        </a>
        <button
          class="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-[var(--accent-contrast)] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          type="submit"
          disabled={submitting}
        >
          {submitting
            ? 'Publishing...'
            : `Publish listing ${games.length > 1 ? `with ${games.length} items` : ''}`}
        </button>
        <!-- eslint-enable svelte/no-navigation-without-resolve -->
      </div>
    </form>
  </div>
</main>
