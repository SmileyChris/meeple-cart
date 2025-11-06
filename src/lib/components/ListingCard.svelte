<script lang="ts">
  import { REGION_LABELS } from '$lib/constants/regions';
  import type { ListingPreview } from '$lib/types/listing';
  import BaseCard from './BaseCard.svelte';
  import {
    getAccountAgeDays,
    getTrustTier,
    getTrustTierInfo,
    getTooltipText,
  } from '$lib/utils/trust-tiers';

  let {
    listing,
    userPreferredRegions,
    hideOwner = false,
  }: { listing: ListingPreview; userPreferredRegions?: string[]; hideOwner?: boolean } = $props();

  const typeLabels: Record<ListingPreview['listingType'], string> = {
    trade: 'Trade',
    sell: 'Sell',
    want: 'Want to Buy',
  };

  const typeColors: Record<
    ListingPreview['listingType'],
    { border: string; bg: string; text: string }
  > = {
    trade: {
      border: 'border-[var(--border-listing-trade)]',
      bg: 'bg-emerald-500/10',
      text: 'text-badge-emerald',
    },
    sell: {
      border: 'border-[var(--border-listing-want)]',
      bg: 'bg-blue-500/10',
      text: 'text-badge-blue',
    },
    want: {
      border: 'border-[var(--border-listing-want)]',
      bg: 'bg-blue-500/10',
      text: 'text-badge-blue',
    },
  };

  // Check if any listing region matches user's preferred regions
  let isPreferredRegion = $derived(
    userPreferredRegions &&
      listing.regions &&
      listing.regions.some((r) => userPreferredRegions.includes(r))
  );

  // Check if any game can be posted
  let canPost = $derived(listing.games.some((game) => game.canPost));

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

  let colors = $derived(typeColors[listing.listingType]);

  // Build border class based on listing type and region match
  let borderClass = $derived.by(() => {
    if (isPreferredRegion) {
      // 1px colored border for preferred region
      return listing.listingType === 'trade'
        ? 'border border-listing-trade'
        : 'border border-listing-sell';
    }

    // Grey border by default with colored border on hover
    switch (listing.listingType) {
      case 'trade':
        return 'border border-subtle group-hover:border-listing-trade';
      case 'sell':
      case 'want':
        return 'border border-subtle group-hover:border-listing-sell';
    }
  });

  let showAllGames = $state(false);
</script>

<BaseCard href={listing.href} imageUrl={listing.coverImage} imageAlt={listing.title} {borderClass}>
  {#snippet header()}
    <div class="flex items-center justify-between text-xs uppercase tracking-wide text-muted">
      <span
        class="rounded-full border {colors.border} {colors.bg} px-3 py-1 font-semibold {colors.text}"
      >
        {#if isPreferredRegion}<span class="mr-1">📍</span>{/if}{typeLabels[listing.listingType]}
      </span>
      <span>{createdLabel}</span>
    </div>
  {/snippet}

  {#snippet content()}
    <div class="space-y-2">
      <h3 class="text-lg font-semibold text-primary transition-colors">{listing.title}</h3>

      <!-- Owner info right after title -->
      {#if !hideOwner}
        <div class="flex items-center gap-1.5 text-sm">
          {#if listing.ownerId && listing.ownerName}
            {#if listing.ownerJoinedDate}
              {@const tier = getTrustTier(
                getAccountAgeDays(listing.ownerJoinedDate),
                listing.ownerVouchedTrades
              )}
              {@const tierInfo = getTrustTierInfo(tier)}
              {@const tooltipText = getTooltipText(tier)}
              <span
                class="text-base leading-none"
                title={tooltipText}
                role="img"
                aria-label="Trust tier: {tierInfo.label}"
              >
                {tierInfo.icon}
              </span>
            {/if}
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
        </div>
      {/if}

      {#if listing.summary}
        <p class="text-sm text-secondary transition-colors">{listing.summary}</p>
      {/if}
    </div>

    {#if listing.games.length > 0}
      <div class="space-y-2">
        <h4 class="text-xs font-semibold uppercase tracking-wide text-muted">
          {listing.games.length}
          {listing.games.length === 1 ? 'game' : 'games'} included
        </h4>
        <div class="flex flex-wrap gap-2">
          {#each listing.games.slice(0, showAllGames ? listing.games.length : 3) as game (game.id)}
            <span
              class="rounded-full border border-subtle bg-surface-card-alt px-3 py-1 text-xs font-medium text-primary transition-colors"
            >
              {game.title}
            </span>
          {/each}
          {#if listing.games.length > 3 && !showAllGames}
            <button
              type="button"
              class="rounded-full border border-dashed border-subtle bg-surface-card-alt px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
              onclick={(e) => {
                e.stopPropagation();
                showAllGames = true;
              }}
            >
              +{listing.games.length - 3} more
            </button>
          {/if}
        </div>
      </div>
    {/if}
  {/snippet}

  {#snippet footer()}
    <!-- Region badges -->
    {#if (listing.regions && listing.regions.length > 0) || listing.location || canPost}
      <!-- Divider line -->
      <div class="border-t border-subtle pt-2 opacity-50"></div>
      <div class="flex items-center gap-1">
        <span class="text-base leading-none text-muted">📍</span>
        <div class="flex flex-wrap items-center gap-1.5">
          {#if listing.regions && listing.regions.length > 0}
            {#each listing.regions.slice(0, 3) as regionValue (regionValue)}
              <span
                class={`flex items-center gap-1 rounded-full px-2 text-xs font-medium transition-colors ${
                  isPreferredRegion && userPreferredRegions?.includes(regionValue)
                    ? 'bg-[var(--accent)] text-[var(--accent-contrast)]'
                    : 'border border-subtle bg-surface-card-alt text-secondary'
                }`}
              >
                <span class="text-xs">🤝</span>
                {REGION_LABELS[regionValue] || regionValue}
              </span>
            {/each}
            {#if listing.regions.length > 3}
              <span
                class="rounded-full border border-dashed border-subtle bg-surface-card-alt px-2 text-xs font-medium text-muted transition-colors"
              >
                +{listing.regions.length - 3}
              </span>
            {/if}
          {/if}
          {#if canPost}
            <span
              class="flex items-center gap-1 rounded-full border border-subtle bg-surface-card-alt px-2 text-xs font-medium text-secondary"
            >
              <span class="text-xs">🚚</span>
              Can post
            </span>
          {/if}
          <!-- Additional location details -->
          {#if listing.location}
            <span class="w-full pl-2 text-xs text-muted">{listing.location}</span>
          {/if}
        </div>
      </div>
    {/if}
  {/snippet}
</BaseCard>
