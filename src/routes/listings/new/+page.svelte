<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { ActionData, PageData } from './$types';

  export let data: PageData;
  export let form: ActionData | undefined;

  const values = form?.values ?? {
    title: '',
    listing_type: data.defaults.listing_type,
    summary: '',
    location: '',
    shipping_available: false,
    prefer_bundle: false,
    bundle_discount: '',
    game_title: '',
    condition: data.defaults.condition,
    price: '',
    trade_value: '',
    notes: '',
    bgg_id: '',
  };

  const fieldErrors = form?.fieldErrors ?? {};

  let photoPreviews: Array<{ name: string; url: string; size: string }> = [];

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

  onDestroy(() => {
    resetPreviews();
  });
</script>

<svelte:head>
  <title>Create listing · Meeple Cart</title>
</svelte:head>

<main class="bg-slate-950 px-6 py-12 text-slate-100 sm:px-8">
  <div class="mx-auto max-w-4xl space-y-10">
    <header class="space-y-3">
      <h1 class="text-3xl font-semibold tracking-tight">Create a new listing</h1>
      <p class="text-sm text-slate-400">
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
      <section class="space-y-6 rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div class="space-y-2">
          <h2 class="text-xl font-semibold text-slate-100">Photos</h2>
          <p class="text-sm text-slate-400">
            Upload up to 6 images (PNG, JPG, WEBP, 5MB maximum each).
          </p>
        </div>

        <div class="space-y-3">
          <label class="block text-sm font-medium text-slate-200" for="photos">Upload photos</label>
          <input
            class="w-full cursor-pointer rounded-lg border border-dashed border-slate-700 bg-slate-950 px-3 py-8 text-sm text-slate-300 focus:border-emerald-500 focus:outline-none"
            id="photos"
            name="photos"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            on:change={handlePhotoChange}
          />
          {#if fieldErrors.photos}
            <p class="text-sm text-rose-300">{fieldErrors.photos}</p>
          {/if}
          <p class="text-xs text-slate-500">
            You'll need to reselect images if the form submission fails.
          </p>
        </div>

        {#if photoPreviews.length > 0}
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {#each photoPreviews as preview (preview.url)}
              <figure class="overflow-hidden rounded-lg border border-slate-800 bg-slate-950/60">
                <img
                  alt={`Preview of ${preview.name}`}
                  class="h-40 w-full object-cover"
                  src={preview.url}
                />
                <figcaption class="px-3 py-2 text-xs text-slate-300">
                  <span class="block truncate font-medium text-slate-100">{preview.name}</span>
                  <span class="text-slate-500">{preview.size}</span>
                </figcaption>
              </figure>
            {/each}
          </div>
        {/if}
      </section>

      <section class="space-y-6 rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div class="space-y-2">
          <h2 class="text-xl font-semibold text-slate-100">Listing overview</h2>
          <p class="text-sm text-slate-400">
            These details describe how your listing appears in the feed.
          </p>
        </div>

        <div class="grid gap-6 sm:grid-cols-2">
          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-slate-200" for="title">Listing title</label
            >
            <input
              class="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
              id="title"
              name="title"
              placeholder="Eg: Gloomhaven 2nd edition with inserts"
              required
              maxlength="120"
              value={values.title}
            />
            {#if fieldErrors.title}
              <p class="mt-2 text-sm text-rose-300">{fieldErrors.title}</p>
            {/if}
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-200" for="listing_type"
              >Listing type</label
            >
            <select
              class="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
              id="listing_type"
              name="listing_type"
              required
              value={values.listing_type}
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

          <div>
            <label class="block text-sm font-medium text-slate-200" for="location">Location</label>
            <input
              class="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
              id="location"
              name="location"
              placeholder="City or suburb"
              maxlength="120"
              value={values.location}
            />
          </div>

          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-slate-200" for="summary">Summary</label>
            <textarea
              class="mt-2 min-h-[140px] w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
              id="summary"
              name="summary"
              maxlength="2000"
              placeholder="Describe condition, included expansions, and trade preferences."
              >{values.summary}</textarea
            >
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <label class="flex items-center gap-2 text-sm text-slate-300">
            <input
              class="h-4 w-4 rounded border border-slate-700 bg-slate-950"
              name="shipping_available"
              type="checkbox"
              checked={values.shipping_available}
            />
            Shipping available
          </label>
          <label class="flex items-center gap-2 text-sm text-slate-300">
            <input
              class="h-4 w-4 rounded border border-slate-700 bg-slate-950"
              name="prefer_bundle"
              type="checkbox"
              checked={values.prefer_bundle}
            />
            Prefer bundle deals
          </label>
          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-slate-200" for="bundle_discount"
              >Bundle discount (%)</label
            >
            <input
              class="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
              id="bundle_discount"
              name="bundle_discount"
              placeholder="Optional"
              inputmode="numeric"
              pattern="[0-9]*"
              value={values.bundle_discount}
            />
            {#if fieldErrors.bundle_discount}
              <p class="mt-2 text-sm text-rose-300">{fieldErrors.bundle_discount}</p>
            {/if}
          </div>
        </div>
      </section>

      <section class="space-y-6 rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div class="space-y-2">
          <h2 class="text-xl font-semibold text-slate-100">Game details</h2>
          <p class="text-sm text-slate-400">
            Tell potential traders more about this specific copy.
          </p>
        </div>

        <div class="grid gap-6 sm:grid-cols-2">
          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-slate-200" for="game_title"
              >Game title</label
            >
            <input
              class="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
              id="game_title"
              name="game_title"
              placeholder="Eg: Gloomhaven"
              required
              maxlength="200"
              value={values.game_title}
            />
            {#if fieldErrors.game_title}
              <p class="mt-2 text-sm text-rose-300">{fieldErrors.game_title}</p>
            {/if}
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-200" for="condition">Condition</label
            >
            <select
              class="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
              id="condition"
              name="condition"
              required
              value={values.condition}
            >
              {#each data.conditionOptions as option (option)}
                <option value={option}>{option.charAt(0).toUpperCase() + option.slice(1)}</option>
              {/each}
            </select>
            {#if fieldErrors.condition}
              <p class="mt-2 text-sm text-rose-300">{fieldErrors.condition}</p>
            {/if}
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-200" for="price">Price (NZD)</label>
            <input
              class="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
              id="price"
              name="price"
              placeholder="Optional"
              inputmode="decimal"
              value={values.price}
            />
            {#if fieldErrors.price}
              <p class="mt-2 text-sm text-rose-300">{fieldErrors.price}</p>
            {/if}
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-200" for="trade_value"
              >Trade value (NZD)</label
            >
            <input
              class="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
              id="trade_value"
              name="trade_value"
              placeholder="Optional"
              inputmode="decimal"
              value={values.trade_value}
            />
            {#if fieldErrors.trade_value}
              <p class="mt-2 text-sm text-rose-300">{fieldErrors.trade_value}</p>
            {/if}
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-200" for="bgg_id"
              >BoardGameGeek ID</label
            >
            <input
              class="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
              id="bgg_id"
              name="bgg_id"
              placeholder="Optional"
              inputmode="numeric"
              pattern="[0-9]*"
              value={values.bgg_id}
            />
            {#if fieldErrors.bgg_id}
              <p class="mt-2 text-sm text-rose-300">{fieldErrors.bgg_id}</p>
            {/if}
          </div>

          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-slate-200" for="notes">Copy notes</label>
            <textarea
              class="mt-2 min-h-[120px] w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
              id="notes"
              name="notes"
              maxlength="2000"
              placeholder="Mention wear, missing components, or house-rule kits."
              >{values.notes}</textarea
            >
          </div>
        </div>
      </section>

      <div class="flex items-center justify-end gap-4">
        <!-- eslint-disable svelte/no-navigation-without-resolve -->
        <a
          class="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-emerald-500 hover:text-emerald-300"
          href="/"
        >
          Cancel
        </a>
        <button
          class="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-900 transition hover:bg-emerald-400"
          type="submit"
        >
          Publish listing
        </button>
        <!-- eslint-enable svelte/no-navigation-without-resolve -->
      </div>
    </form>
  </div>
</main>
