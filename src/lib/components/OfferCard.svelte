<script lang="ts">
  import { REGION_LABELS } from '$lib/constants/regions';
  import type { OfferPreview } from '$lib/types/listing';
  import BaseCard from './BaseCard.svelte';
  import {
    getAccountAgeDays,
    getTrustTier,
    getTrustTierInfo,
    getTooltipText,
  } from '$lib/utils/trust-tiers';

  let {
    offer,
    userPreferredRegions,
    hideOwner = false,
  }: { offer: OfferPreview; userPreferredRegions?: string[]; hideOwner?: boolean } = $props();

  // Check if any offer region matches user's preferred regions
  let isPreferredRegion = $derived(
    userPreferredRegions &&
      offer.regions &&
      offer.regions.some((r: string) => userPreferredRegions.includes(r))
  );

  let createdLabel = $derived(
    new Intl.DateTimeFormat('en-NZ', {
      dateStyle: 'medium',
    }).format(new Date(offer.created))
  );

  const conditionLabels: Record<OfferPreview['games'][number]['condition'], string> = {
    mint: 'Mint',
    excellent: 'Excellent',
    good: 'Good',
    fair: 'Fair',
    poor: 'Well loved',
  };

  const currencyFormatter = new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });

  // Determine offer type for styling based on flags
  let offerType = $derived.by(() => {
    if (offer.openToTradeOffers && offer.cashAmount) return 'either';
    if (offer.openToTradeOffers) return 'trade';
    return 'sell';
  });

  const typeColors: Record<string, { border: string; bg: string; text: string }> = {
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
    either: {
      border: 'border-[var(--border-listing-trade)]',
      bg: 'bg-amber-500/10',
      text: 'text-badge-amber',
    },
  };

  let colors = $derived(typeColors[offerType] || typeColors.sell);

  // Build border class based on offer type and region match
  let borderClass = $derived.by(() => {
    if (isPreferredRegion) {
      return offerType === 'sell'
        ? 'border border-listing-sell'
        : 'border border-listing-trade';
    }

    // Grey border by default with colored border on hover
    return offerType === 'sell'
      ? 'border border-subtle group-hover:border-listing-sell'
      : 'border border-subtle group-hover:border-listing-trade';
  });

  // Build display title from offer
  let displayTitle = $derived.by(() => {
    // If displayName is set, use it
    if (offer.displayName) return offer.displayName;

    // Build from games/items
    if (offer.games.length === 0) return 'Untitled offer';
    if (offer.games.length === 1) return offer.games[0].title;

    // Multiple games - list first two with "+ N more"
    const titles = offer.games.slice(0, 2).map((g) => g.title);
    if (offer.games.length > 2) {
      return `${titles.join(', ')} + ${offer.games.length - 2} more`;
    }
    return titles.join(' & ');
  });

  // Build price display
  let priceDisplay = $derived.by(() => {
    if (offer.cashAmount) {
      const price = currencyFormatter.format(offer.cashAmount / 100);
      return offer.openToLowerOffers ? `${price} ono` : price;
    }
    return null;
  });

  let showAllGames = $state(false);
</script>

<BaseCard href={offer.href} imageUrl={offer.coverImage} imageAlt={displayTitle} {borderClass}>
  {#snippet header()}
    <div class="flex items-center justify-between text-xs uppercase tracking-wide text-muted">
      <div class="flex items-center gap-2">
        <span
          class="rounded-full border {colors.border} {colors.bg} px-3 py-1 font-semibold {colors.text}"
        >
          {#if isPreferredRegion}<span class="mr-1">📍</span>{/if}
          {#if offerType === 'trade'}
            🔄 Trade
          {:else if offerType === 'either'}
            💱 Trade/Sell
          {:else}
            💰 Sell
          {/if}
        </span>
        {#if priceDisplay}
          <span class="font-semibold text-primary">{priceDisplay}</span>
        {/if}
      </div>
      <span>{createdLabel}</span>
    </div>
  {/snippet}

  {#snippet content()}
    <div class="space-y-2">
      <h3 class="text-lg font-semibold text-primary transition-colors">{displayTitle}</h3>

      <!-- Owner info right after title -->
      {#if !hideOwner}
        <div class="flex items-center gap-1.5 text-sm">
          {#if offer.ownerId && offer.ownerName}
            {#if offer.ownerJoinedDate}
              {@const tier = getTrustTier(
                getAccountAgeDays(offer.ownerJoinedDate),
                offer.ownerVouchedTrades
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
              href={`/users/${offer.ownerId}`}
              class="font-medium text-primary transition hover:text-[var(--accent)]"
              onclick={(e) => e.stopPropagation()}
            >
              {offer.ownerName}
            </a>
          {:else if offer.ownerName}
            <span class="font-medium text-primary">{offer.ownerName}</span>
          {:else}
            <span class="font-medium text-primary">Meeple Cart trader</span>
          {/if}
        </div>
      {/if}

      <!-- Trade preferences -->
      {#if offer.openToTradeOffers && offer.tradeForItems && offer.tradeForItems.length > 0}
        <p class="text-sm text-secondary">
          Looking for: {offer.tradeForItems.map(i => i.title).join(', ')}
        </p>
      {/if}
    </div>

    {#if offer.games.length > 0}
      <div class="space-y-2">
        <div class="flex items-center gap-2">
          <h4 class="text-xs font-semibold uppercase tracking-wide text-muted">
            {offer.games.length}
            {offer.games.length === 1 ? 'game' : 'games'} included
          </h4>
          {#if offer.willConsiderSplit && offer.games.length > 1}
            <span class="rounded-full border border-amber-500/50 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300" title="Will consider selling items separately">
              ✂️ May split
            </span>
          {/if}
        </div>
        <div class="flex flex-wrap gap-2">
          {#each offer.games.slice(0, showAllGames ? offer.games.length : 3) as game (game.id)}
            <span
              class="rounded-full border border-subtle bg-surface-card-alt px-3 py-1 text-xs font-medium text-primary transition-colors"
              title="{game.title} - {conditionLabels[game.condition]}"
            >
              {game.title}
            </span>
          {/each}
          {#if offer.games.length > 3 && !showAllGames}
            <button
              type="button"
              class="rounded-full border border-dashed border-subtle bg-surface-card-alt px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
              onclick={(e) => {
                e.stopPropagation();
                showAllGames = true;
              }}
            >
              +{offer.games.length - 3} more
            </button>
          {/if}
        </div>
      </div>
    {/if}
  {/snippet}

  {#snippet footer()}
    <!-- Region badges and shipping -->
    {#if (offer.regions && offer.regions.length > 0) || offer.location || offer.canPost}
      <!-- Divider line -->
      <div class="border-t border-subtle pt-2 opacity-50"></div>
      <div class="flex items-center gap-1">
        <span class="text-base leading-none text-muted">📍</span>
        <div class="flex flex-wrap items-center gap-1.5">
          {#if offer.regions && offer.regions.length > 0}
            {#each offer.regions.slice(0, 3) as regionValue (regionValue)}
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
            {#if offer.regions.length > 3}
              <span
                class="rounded-full border border-dashed border-subtle bg-surface-card-alt px-2 text-xs font-medium text-muted transition-colors"
              >
                +{offer.regions.length - 3}
              </span>
            {/if}
          {/if}
          {#if offer.canPost}
            <span
              class="flex items-center gap-1 rounded-full border border-subtle bg-surface-card-alt px-2 text-xs font-medium text-secondary"
            >
              <span class="text-xs">📬</span>
              Can post
            </span>
          {/if}
          <!-- Additional location details -->
          {#if offer.location}
            <span class="w-full pl-2 text-xs text-muted">{offer.location}</span>
          {/if}
        </div>
      </div>
    {/if}
  {/snippet}
</BaseCard>
