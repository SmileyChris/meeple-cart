<script lang="ts">
  import type { ListingPreview } from '$lib/types/listing';
  import MeepleIcon from './MeepleIcon.svelte';

  let { listing }: { listing: ListingPreview } = $props();

  const typeLabels: Record<ListingPreview['listingType'], string> = {
    trade: 'Trade',
    sell: 'Sell',
    want: 'Want to Buy',
  };

  let createdLabel = $derived(
    new Intl.DateTimeFormat('en-NZ', {
      dateStyle: 'medium',
    }).format(new Date(listing.created))
  );

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
  class="group block cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-body)]"
  role="link"
  tabindex="0"
  onclick={() => (window.location.href = listing.href)}
  onkeydown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      window.location.href = listing.href;
    }
  }}
>
  <article
    class="flex flex-col overflow-hidden rounded-xl border border-subtle bg-surface-card shadow-elevated transition-colors group-hover:border-[var(--accent)] group-hover:shadow-lg"
  >
    {#if listing.coverImage}
      <img
        alt={listing.title}
        class="h-48 w-full object-cover"
        src={listing.coverImage}
        loading="lazy"
      />
    {:else}
      <div
        class="flex h-48 w-full flex-col items-center justify-center gap-3 bg-surface-card-alt text-muted transition-colors"
      >
        <MeepleIcon size={64} className="opacity-50" seed={listing.id} />
        <span class="text-xs font-medium uppercase tracking-wider opacity-40">No image yet</span>
      </div>
    {/if}
    <div class="flex flex-1 flex-col gap-4 p-5">
      <div class="flex items-center justify-between text-xs uppercase tracking-wide text-muted">
        <span
          class="rounded-full border border-[var(--accent)] bg-[var(--accent-soft)] px-3 py-1 font-semibold text-[var(--accent-strong)]"
        >
          {typeLabels[listing.listingType]}
        </span>
        <span>{createdLabel}</span>
      </div>

      <div class="space-y-2">
        <h3 class="text-lg font-semibold text-primary transition-colors">{listing.title}</h3>
        {#if listing.summary}
          <p class="text-sm text-secondary transition-colors">{listing.summary}</p>
        {/if}
      </div>

      {#if listing.games.length > 0}
        <div class="space-y-2">
          <h4 class="text-xs font-semibold uppercase tracking-wide text-muted">
            {listing.games.length} {listing.games.length === 1 ? 'game' : 'games'} included
          </h4>
          <div class="flex flex-wrap gap-2">
            {#each listing.games.slice(0, 3) as game (game.id)}
              <span
                class="rounded-full border border-subtle bg-surface-card-alt px-3 py-1 text-xs font-medium text-primary transition-colors"
              >
                {game.title}
              </span>
            {/each}
            {#if listing.games.length > 3}
              <span
                class="rounded-full border border-dashed border-subtle bg-surface-card-alt px-3 py-1 text-xs font-medium text-muted transition-colors"
              >
                +{listing.games.length - 3} more
              </span>
            {/if}
          </div>
        </div>
      {/if}

      <div
        class="mt-auto flex items-center justify-between text-sm text-secondary transition-colors"
      >
        <div class="flex flex-col">
          {#if listing.ownerId && listing.ownerName}
            <a
              href={`/users/${listing.ownerId}`}
              class="font-medium text-primary transition hover:text-[var(--accent)]"
              onclick={(e) => e.stopPropagation()}
            >
              {listing.ownerName}
            </a>
          {:else if listing.ownerName}
            <span class="font-medium text-primary">{listing.ownerName}</span>
          {:else}
            <span class="font-medium text-primary">Meeple Cart trader</span>
          {/if}
          {#if listing.location}
            <span>{listing.location}</span>
          {/if}
        </div>
      </div>
    </div>
  </article>
</div>
<!-- eslint-enable svelte/no-navigation-without-resolve -->
