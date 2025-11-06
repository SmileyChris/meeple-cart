<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { ActionData, PageData } from './$types';
  import {
    NORTH_ISLAND_REGIONS,
    SOUTH_ISLAND_REGIONS,
    getIslandRegions,
  } from '$lib/constants/regions';

  let { data, form }: { data: PageData; form?: ActionData } = $props();

  interface GameEntry {
    title: string;
    condition: string;
    price: string;
    trade_value: string;
    notes: string;
    bgg_id: string;
    can_post: boolean;
  }

  let listingValues = $derived(
    form?.values ?? {
      title: '',
      listing_type: data.defaults.listing_type,
      summary: '',
      location: '',
      prefer_bundle: false,
      bundle_discount: '',
    }
  );

  let selectedRegions = $state<string[]>(form?.regions ?? []);

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

  let games = $state<GameEntry[]>(
    form?.games ??
      ([
        {
          title: '',
          condition: data.defaults.condition,
          price: '',
          trade_value: '',
          notes: '',
          bgg_id: '',
          can_post: false,
        },
      ] as GameEntry[])
  );

  let fieldErrors = $derived(form?.fieldErrors ?? {});

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
        title: '',
        condition: data.defaults.condition,
        price: '',
        trade_value: '',
        notes: '',
        bgg_id: '',
        can_post: false,
      },
    ];
  };

  const removeGame = (index: number) => {
    games = games.filter((_, i) => i !== index);
  };

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
        Share the details of the game you want to trade or sell. Listings publish immediately and
        can be edited from your profile afterwards.
      </p>
    </header>

    {#if form?.message}
      <div class="rounded-lg border border-rose-500 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
        {form.message}
      </div>
    {/if}

    <form class="space-y-10" method="POST">
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
              value={listingValues.title}
            />
            {#if fieldErrors.title}
              <p class="mt-2 text-sm text-rose-300">{fieldErrors.title}</p>
            {/if}
          </div>

          <div>
            <label class="block text-sm font-medium text-secondary" for="listing_type"
              >Listing type</label
            >
            <select
              class="mt-2 w-full rounded-lg border border-subtle bg-surface-body transition-colors px-3 py-2 text-primary focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
              id="listing_type"
              name="listing_type"
              required
              value={listingValues.listing_type}
            >
              {#each data.listingTypes as type (type)}
                <option value={type}
                  >{type === 'want'
                    ? 'Want to Buy'
                    : type.charAt(0).toUpperCase() + type.slice(1)}</option
                >
              {/each}
            </select>
            {#if fieldErrors.listing_type}
              <p class="mt-2 text-sm text-rose-300">{fieldErrors.listing_type}</p>
            {/if}
          </div>

          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-secondary">Pickup regions</label>
            <p class="mt-1 text-xs text-muted">
              Select regions where you can meet for pickup (postage options set per-game below)
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
              value={listingValues.location}
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
              >{listingValues.summary}</textarea
            >
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <label class="flex items-center gap-2 text-sm text-secondary">
            <input
              class="h-4 w-4 rounded border border-subtle bg-surface-body transition-colors"
              name="prefer_bundle"
              type="checkbox"
              checked={listingValues.prefer_bundle}
            />
            Prefer bundle deals
          </label>
          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-secondary" for="bundle_discount"
              >Bundle discount (%)</label
            >
            <input
              class="mt-2 w-full rounded-lg border border-subtle bg-surface-body transition-colors px-3 py-2 text-primary focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
              id="bundle_discount"
              name="bundle_discount"
              placeholder="Optional"
              inputmode="numeric"
              pattern="[0-9]*"
              value={listingValues.bundle_discount}
            />
            {#if fieldErrors.bundle_discount}
              <p class="mt-2 text-sm text-rose-300">{fieldErrors.bundle_discount}</p>
            {/if}
          </div>
        </div>
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
          {#if fieldErrors.photos}
            <p class="text-sm text-rose-300">{fieldErrors.photos}</p>
          {/if}
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
            <h2 class="text-xl font-semibold text-primary">Games</h2>
            <p class="text-sm text-muted">Add one or more games to this listing.</p>
          </div>
          <button
            class="rounded-lg border border-emerald-500 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/10"
            type="button"
            onclick={addGame}
          >
            + Add game
          </button>
        </div>

        {#each games as game, index (index)}
          <section
            class="space-y-6 rounded-xl border border-subtle bg-surface-card transition-colors p-6"
          >
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-medium text-primary">Game {index + 1}</h3>
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

            <div class="grid gap-6 sm:grid-cols-2">
              <div class="sm:col-span-2">
                <label class="block text-sm font-medium text-secondary" for="game_{index}_title"
                  >Game title</label
                >
                <input
                  class="mt-2 w-full rounded-lg border border-subtle bg-surface-body transition-colors px-3 py-2 text-primary focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
                  id="game_{index}_title"
                  name="game_{index}_title"
                  placeholder="Eg: Gloomhaven"
                  required
                  maxlength="200"
                  bind:value={game.title}
                />
                {#if fieldErrors[`game_${index}_title`]}
                  <p class="mt-2 text-sm text-rose-300">{fieldErrors[`game_${index}_title`]}</p>
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
                {#if fieldErrors[`game_${index}_condition`]}
                  <p class="mt-2 text-sm text-rose-300">{fieldErrors[`game_${index}_condition`]}</p>
                {/if}
              </div>

              <div>
                <label class="block text-sm font-medium text-secondary" for="game_{index}_price"
                  >Price (NZD)</label
                >
                <input
                  class="mt-2 w-full rounded-lg border border-subtle bg-surface-body transition-colors px-3 py-2 text-primary focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
                  id="game_{index}_price"
                  name="game_{index}_price"
                  placeholder="Optional"
                  inputmode="decimal"
                  bind:value={game.price}
                />
                {#if fieldErrors[`game_${index}_price`]}
                  <p class="mt-2 text-sm text-rose-300">{fieldErrors[`game_${index}_price`]}</p>
                {/if}
              </div>

              <div>
                <label
                  class="block text-sm font-medium text-secondary"
                  for="game_{index}_trade_value">Trade value (NZD)</label
                >
                <input
                  class="mt-2 w-full rounded-lg border border-subtle bg-surface-body transition-colors px-3 py-2 text-primary focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
                  id="game_{index}_trade_value"
                  name="game_{index}_trade_value"
                  placeholder="Optional"
                  inputmode="decimal"
                  bind:value={game.trade_value}
                />
                {#if fieldErrors[`game_${index}_trade_value`]}
                  <p class="mt-2 text-sm text-rose-300">
                    {fieldErrors[`game_${index}_trade_value`]}
                  </p>
                {/if}
              </div>

              <div>
                <label class="block text-sm font-medium text-secondary" for="game_{index}_bgg_id"
                  >BoardGameGeek ID</label
                >
                <input
                  class="mt-2 w-full rounded-lg border border-subtle bg-surface-body transition-colors px-3 py-2 text-primary focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
                  id="game_{index}_bgg_id"
                  name="game_{index}_bgg_id"
                  placeholder="Optional"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  bind:value={game.bgg_id}
                />
                {#if fieldErrors[`game_${index}_bgg_id`]}
                  <p class="mt-2 text-sm text-rose-300">{fieldErrors[`game_${index}_bgg_id`]}</p>
                {/if}
              </div>

              <div class="sm:col-span-2">
                <label class="block text-sm font-medium text-secondary" for="game_{index}_notes"
                  >Copy notes</label
                >
                <textarea
                  class="mt-2 min-h-[120px] w-full rounded-lg border border-subtle bg-surface-body transition-colors px-3 py-2 text-primary focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
                  id="game_{index}_notes"
                  name="game_{index}_notes"
                  maxlength="2000"
                  placeholder="Mention wear, missing components, or house-rule kits."
                  bind:value={game.notes}
                />
              </div>

              <div class="sm:col-span-2">
                <label class="flex items-center gap-2 text-sm text-secondary">
                  <input
                    class="h-4 w-4 rounded border border-subtle bg-surface-body transition-colors"
                    type="checkbox"
                    name="game_{index}_can_post"
                    bind:checked={game.can_post}
                  />
                  🚚 Can post (available for courier/postal delivery)
                </label>
              </div>
            </div>
          </section>
        {/each}
      </div>

      <div class="flex items-center justify-end gap-4">
        <!-- eslint-disable svelte/no-navigation-without-resolve -->
        <a
          class="rounded-lg border border-subtle px-4 py-2 text-sm text-secondary transition hover:border-emerald-500 hover:text-emerald-300"
          href="/"
        >
          Cancel
        </a>
        <button
          class="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-[var(--accent-contrast)] transition hover:bg-emerald-400"
          type="submit"
        >
          Publish listing {games.length > 1 ? `with ${games.length} games` : ''}
        </button>
        <!-- eslint-enable svelte/no-navigation-without-resolve -->
      </div>
    </form>
  </div>
</main>
