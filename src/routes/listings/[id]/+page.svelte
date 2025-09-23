<script lang="ts">
  import type { PageData } from './$types';
  import { formatCurrency } from '$lib/utils/currency';

  export let data: PageData;

  const listing = data.listing;
  const owner = data.owner;
  const games = data.games;
  const photos = data.photos ?? [];
  let activePhotoIndex = 0;

  const selectPhoto = (index: number) => {
    activePhotoIndex = index;
  };

  $: if (photos.length > 0 && activePhotoIndex >= photos.length) {
    activePhotoIndex = 0;
  }

  const toCurrency = (value?: number | null) => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return null;
    }

    const cents = Math.round(value * 100);
    return formatCurrency(cents);
  };

  const listingCreated = new Intl.DateTimeFormat('en-NZ', {
    dateStyle: 'medium',
  }).format(new Date(listing.created));

  const contactPreference: Record<string, string> = {
    platform: 'Meeple Cart messages',
    email: 'Email',
    phone: 'Phone',
  };

  const conditionBadges: Record<(typeof games)[number]['condition'], string> = {
    mint: 'Mint',
    excellent: 'Excellent',
    good: 'Good',
    fair: 'Fair',
    poor: 'Well loved',
  };

  const conditionDescriptions: Record<string, string> = {
    mint: 'Mint – unplayed or shrink-wrapped',
    excellent: 'Excellent – like new with minimal handling',
    good: 'Good – light wear, all components included',
    fair: 'Fair – noticeable wear or minor missing pieces',
    poor: 'Poor – heavy wear or missing components',
  };

  const statusLabels: Record<(typeof games)[number]['status'], string> = {
    available: 'Available',
    pending: 'Pending',
    sold: 'Sold',
    bundled: 'Bundled',
  };

  const statusTone: Record<(typeof games)[number]['status'], string> = {
    available: 'border-emerald-500/80 bg-emerald-500/10 text-emerald-200',
    pending: 'border-amber-500/80 bg-amber-500/10 text-amber-200',
    sold: 'border-rose-500/80 bg-rose-500/10 text-rose-200',
    bundled: 'border-sky-500/80 bg-sky-500/10 text-sky-200',
  };
</script>

<svelte:head>
  <title>{listing.title} · Meeple Cart</title>
  <meta
    name="description"
    content={`View full details for ${listing.title} listed on Meeple Cart.`}
  />
</svelte:head>

<main class="bg-slate-950 px-6 py-12 text-slate-100 sm:px-8">
  <div class="mx-auto flex max-w-5xl flex-col gap-8">
    <nav class="flex items-center text-sm text-slate-400">
      <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
      <a class="hover:text-emerald-300" href="/">Home</a>
      <span class="px-2">/</span>
      <span>{listing.title}</span>
    </nav>

    <header class="flex flex-col gap-6 lg:flex-row">
      <div class="flex-1 space-y-4">
        <h1 class="text-4xl font-semibold tracking-tight text-slate-50">{listing.title}</h1>
        <div class="flex flex-wrap gap-3 text-sm text-slate-300">
          <span
            class="rounded-full border border-emerald-500/80 bg-emerald-500/10 px-3 py-1 font-semibold text-emerald-200 uppercase"
          >
            {listing.listing_type === 'want'
              ? 'Want to Buy'
              : listing.listing_type === 'sell'
                ? 'Sell'
                : 'Trade'}
          </span>
          {#if listing.location}
            <span class="rounded-full border border-slate-700 px-3 py-1">{listing.location}</span>
          {/if}
          <span class="rounded-full border border-slate-700 px-3 py-1">Added {listingCreated}</span>
          {#if listing.shipping_available}
            <span class="rounded-full border border-slate-700 px-3 py-1">Shipping available</span>
          {/if}
          {#if listing.prefer_bundle}
            <span class="rounded-full border border-slate-700 px-3 py-1">Prefers bundle</span>
          {/if}
        </div>
        {#if listing.summary}
          <p class="max-w-2xl text-base text-slate-300">{listing.summary}</p>
        {/if}
      </div>

      <aside
        class="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-300"
      >
        <h2 class="text-base font-semibold text-slate-100">Trader details</h2>
        {#if owner}
          <p class="mt-2 text-lg font-semibold text-slate-50">{owner.display_name}</p>
          {#if owner.location}
            <p class="text-sm text-slate-400">Based in {owner.location}</p>
          {/if}
          <dl class="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt class="text-slate-400">Trades</dt>
              <dd class="text-lg font-semibold text-emerald-300">{owner.trade_count}</dd>
            </div>
            <div>
              <dt class="text-slate-400">Vouches</dt>
              <dd class="text-lg font-semibold text-emerald-300">{owner.vouch_count}</dd>
            </div>
          </dl>
          <div class="mt-4 space-y-2">
            <p>Preferred contact: {contactPreference[owner.preferred_contact]}</p>
            <p class="text-xs text-slate-500">
              Coordinate trades via the in-app messenger or the method agreed with the seller.
            </p>
          </div>
        {:else}
          <p class="mt-2 text-slate-400">Owner details are unavailable.</p>
        {/if}
      </aside>
    </header>

    {#if photos.length > 0}
      <section class="space-y-4">
        <div class="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/40">
          <img
            alt={`${listing.title} photo ${activePhotoIndex + 1}`}
            class="h-full w-full max-h-[520px] object-cover"
            src={photos[activePhotoIndex].full}
            loading="lazy"
          />
        </div>

        {#if photos.length > 1}
          <div class="grid gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {#each photos as photo, index (photo.id)}
              <button
                type="button"
                class={`overflow-hidden rounded-lg border ${
                  index === activePhotoIndex
                    ? 'border-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.4)]'
                    : 'border-slate-800 hover:border-emerald-400'
                }`}
                on:click={() => selectPhoto(index)}
                aria-label={`View photo ${index + 1}`}
                aria-current={index === activePhotoIndex}
              >
                <img
                  alt={`${listing.title} thumbnail ${index + 1}`}
                  class="h-24 w-full object-cover"
                  src={photo.thumb}
                  loading="lazy"
                />
              </button>
            {/each}
          </div>
        {/if}
      </section>
    {:else}
      <section
        class="rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-6 text-center text-sm text-slate-400"
      >
        This listing does not have photos yet.
      </section>
    {/if}

    <section
      class="grid gap-8 rounded-xl border border-slate-800 bg-slate-900/60 p-6 lg:grid-cols-[2fr_1fr]"
    >
      <div class="space-y-6">
        <div>
          <h2 class="text-2xl font-semibold text-slate-100">Games in this listing</h2>
          <p class="text-sm text-slate-400">
            Condition, pricing, and trade preferences for each game included.
          </p>
        </div>

        {#if games.length > 0}
          <div class="space-y-4">
            {#each games as game (game.id)}
              <article class="space-y-4 rounded-lg border border-slate-800 bg-slate-950/70 p-5">
                <header class="space-y-2">
                  <div class="flex flex-wrap items-center justify-between gap-3">
                    <h3 class="text-xl font-semibold text-slate-100">{game.title}</h3>
                    {#if game.bggUrl}
                      <!-- eslint-disable svelte/no-navigation-without-resolve -->
                      <a
                        class="text-sm font-medium text-emerald-300 transition hover:text-emerald-200"
                        href={game.bggUrl}
                        target="_blank"
                        rel="external noopener"
                      >
                        View on BGG
                      </a>
                      <!-- eslint-enable svelte/no-navigation-without-resolve -->
                    {/if}
                  </div>
                  <div class="flex flex-wrap gap-2 text-xs font-semibold">
                    <span
                      class="inline-flex items-center rounded-full border border-slate-700 bg-slate-800/80 px-2 py-1 text-slate-200"
                    >
                      {conditionBadges[game.condition]}
                    </span>
                    <span
                      class={`inline-flex items-center rounded-full border px-2 py-1 ${statusTone[game.status]}`}
                    >
                      {statusLabels[game.status]}
                    </span>
                    {#if game.year !== null}
                      <span
                        class="inline-flex items-center rounded-full border border-slate-700 bg-slate-800/80 px-2 py-1 text-slate-200"
                      >
                        Published {game.year}
                      </span>
                    {/if}
                  </div>
                  {#if conditionDescriptions[game.condition]}
                    <p class="text-xs text-slate-500">{conditionDescriptions[game.condition]}</p>
                  {/if}
                </header>

                <dl class="grid gap-3 text-sm sm:grid-cols-2">
                  {#if game.price !== null}
                    <div>
                      <dt class="text-slate-400">Price guide</dt>
                      <dd class="text-lg font-semibold text-emerald-200">
                        {toCurrency(game.price) ?? `${game.price.toFixed(2)} NZD`}
                      </dd>
                    </div>
                  {/if}
                  {#if game.tradeValue !== null}
                    <div>
                      <dt class="text-slate-400">Trade value</dt>
                      <dd class="text-lg font-semibold text-emerald-200">
                        {toCurrency(game.tradeValue) ?? `${game.tradeValue.toFixed(2)} NZD`}
                      </dd>
                    </div>
                  {/if}
                  {#if game.price === null && game.tradeValue === null}
                    <div class="sm:col-span-2">
                      <dt class="text-slate-400">Negotiable</dt>
                      <dd class="text-sm text-slate-300">Price to be discussed with the trader.</dd>
                    </div>
                  {/if}
                </dl>

                {#if game.notes}
                  <div>
                    <h4 class="text-sm font-semibold text-slate-200">Seller notes</h4>
                    <p class="mt-2 whitespace-pre-line text-sm text-slate-300">{game.notes}</p>
                  </div>
                {/if}
              </article>
            {/each}
          </div>
        {:else}
          <div
            class="rounded-lg border border-dashed border-slate-800 bg-slate-950/50 p-6 text-sm text-slate-400"
          >
            The trader has not added individual game details yet.
          </div>
        {/if}
      </div>

      <aside
        class="space-y-4 rounded-lg border border-slate-800 bg-slate-950/80 p-5 text-sm text-slate-300"
      >
        <h3 class="text-base font-semibold text-slate-100">Next steps</h3>
        <ol class="list-decimal space-y-2 pl-5">
          <li>Sign in or create an account to send a direct message.</li>
          <li>Confirm pickup or shipping details with the trader.</li>
          <li>Update the listing to pending once a trade is agreed.</li>
        </ol>
        <!-- eslint-disable svelte/no-navigation-without-resolve -->
        <a
          class="mt-4 inline-flex items-center justify-center rounded-lg border border-emerald-500 bg-emerald-500/10 px-4 py-2 font-semibold text-emerald-200 transition hover:bg-emerald-500/20"
          href="/login"
        >
          Message this trader
        </a>
        <!-- eslint-enable svelte/no-navigation-without-resolve -->
        <p class="text-xs text-slate-500">
          Messaging requires a Meeple Cart account. Once trust features launch, vouches and
          verification will surface here.
        </p>
      </aside>
    </section>
  </div>
</main>
