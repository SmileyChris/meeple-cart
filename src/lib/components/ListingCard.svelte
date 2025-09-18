<script lang="ts">
  import type { ListingPreview } from '$lib/types/listing';

  export let listing: ListingPreview;

  const typeLabels: Record<ListingPreview['listingType'], string> = {
    trade: 'Trade',
    sell: 'Sell',
    want: 'Want to Buy',
    bundle: 'Bundle',
  };

  const createdLabel = new Intl.DateTimeFormat('en-NZ', {
    dateStyle: 'medium',
  }).format(new Date(listing.created));
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -->
<a
  class="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
  href={listing.href}
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
      <div class="flex h-48 w-full items-center justify-center bg-slate-900 text-sm text-slate-500">
        No image yet
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
</a>
<!-- eslint-enable svelte/no-navigation-without-resolve -->
