<script lang="ts">
  import type { ListingPreview } from '$lib/types/listing';
  import MeepleIcon from './MeepleIcon.svelte';

  export let listing: ListingPreview;

  const typeLabels: Record<ListingPreview['listingType'], string> = {
    trade: 'Trade',
    sell: 'Sell',
    want: 'Want to Buy',
  };

  const createdLabel = new Intl.DateTimeFormat('en-NZ', {
    dateStyle: 'medium',
  }).format(new Date(listing.created));

  const conditionLabels: Record<ListingPreview['games'][number]['condition'], string> = {
    mint: 'Mint',
    excellent: 'Excellent',
    good: 'Good',
    fair: 'Fair',
    poor: 'Well loved',
  };

  const statusLabels: Record<ListingPreview['games'][number]['status'], string> = {
    available: 'Available',
    pending: 'Pending',
    sold: 'Sold',
    bundled: 'Bundled',
  };

  const currencyFormatter = new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -->
<div
  class="group block cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
  role="link"
  tabindex="0"
  onclick={() => window.location.href = listing.href}
  onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); window.location.href = listing.href; }}}
>
  <article
    class="flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 shadow transition group-hover:border-emerald-500/80 group-hover:shadow-lg"
  >
    {#if listing.coverImage}
      <img
        alt={listing.title}
        class="h-48 w-full object-cover"
        src={listing.coverImage}
        loading="lazy"
      />
    {:else}
      <div class="flex h-48 w-full flex-col items-center justify-center gap-3 bg-slate-900 text-slate-500">
        <MeepleIcon size={64} className="opacity-50" seed={listing.id} />
        <span class="text-xs font-medium uppercase tracking-wider opacity-40">No image yet</span>
      </div>
    {/if}
    <div class="flex flex-1 flex-col gap-4 p-5">
      <div class="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400">
        <span
          class="rounded-full border border-emerald-600 bg-emerald-500/10 px-3 py-1 font-semibold text-emerald-200"
        >
          {typeLabels[listing.listingType]}
        </span>
        <span>{createdLabel}</span>
      </div>

      <div class="space-y-2">
        <h3 class="text-lg font-semibold text-slate-100">{listing.title}</h3>
        {#if listing.summary}
          <p class="text-sm text-slate-300">{listing.summary}</p>
        {/if}
      </div>

      {#if listing.games.length > 0}
        <div class="space-y-2">
          <h4 class="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Games included
          </h4>
          <ul class="space-y-2">
            {#each listing.games as game (game.id)}
              <li
                class="flex items-start justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/70 p-3"
              >
                <div class="space-y-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <span class="font-medium text-slate-100">{game.title}</span>
                    {#if game.bggUrl}
                      <a
                        class="text-xs font-medium text-emerald-300 transition hover:text-emerald-200"
                        href={game.bggUrl}
                        target="_blank"
                        rel="external noopener"
                        onclick={(e) => e.stopPropagation()}
                      >
                        BGG
                      </a>
                    {/if}
                  </div>
                  <div class="text-xs text-slate-400">
                    {conditionLabels[game.condition]} · {statusLabels[game.status]}
                  </div>
                </div>
                <div class="text-right text-xs font-semibold">
                  {#if game.price !== null}
                    <span class="text-emerald-300">{currencyFormatter.format(game.price)}</span>
                  {:else if game.tradeValue !== null}
                    <span class="text-emerald-300">
                      {currencyFormatter.format(game.tradeValue)} value
                    </span>
                  {:else}
                    <span class="uppercase text-slate-500">{statusLabels[game.status]}</span>
                  {/if}
                </div>
              </li>
            {/each}
          </ul>
        </div>
      {/if}

      <div class="mt-auto flex items-center justify-between text-sm text-slate-400">
        <div class="flex flex-col">
          {#if listing.ownerName}
            <span class="font-medium text-slate-200">{listing.ownerName}</span>
          {:else}
            <span class="font-medium text-slate-200">Meeple Cart trader</span>
          {/if}
          {#if listing.location}
            <span>{listing.location}</span>
          {/if}
        </div>
        <span
          class="rounded-full border border-slate-700 px-3 py-1 text-xs font-medium text-slate-300"
        >
          {listing.ownerId ? 'Verified member' : 'New listing'}
        </span>
      </div>
    </div>
  </article>
</div>
<!-- eslint-enable svelte/no-navigation-without-resolve -->
