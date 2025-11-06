<script lang="ts">
  import type { ActivityItem } from '$lib/types/activity';
  import type { ListingType } from '$lib/types/listing';
  import BaseCard from './BaseCard.svelte';
  import {
    getAccountAgeDays,
    getTrustTier,
    getTrustTierInfo,
    getTooltipText,
  } from '$lib/utils/trust-tiers';

  let { game }: { game: ActivityItem } = $props();

  const typeLabels: Record<ListingType, string> = {
    trade: 'Trade',
    sell: 'Sell',
    want: 'Looking for',
  };

  const typeColors: Record<ListingType, { border: string; bg: string; text: string }> = {
    trade: {
      border: 'border-emerald-600',
      bg: 'bg-emerald-500/10',
      text: 'text-badge-emerald',
    },
    sell: {
      border: 'border-emerald-600',
      bg: 'bg-emerald-500/10',
      text: 'text-badge-emerald',
    },
    want: {
      border: 'border-blue-600',
      bg: 'bg-blue-500/10',
      text: 'text-badge-blue',
    },
  };

  const conditionLabels: Record<string, string> = {
    mint: 'Mint',
    excellent: 'Excellent',
    good: 'Good',
    fair: 'Fair',
    poor: 'Well loved',
  };

  let colors = $derived(game.activityType === 'listing' ? typeColors[game.type] : undefined);

  const currencyFormatter = new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });

  // Add game ID to URL so listing page can scroll to it (only for listing activities)
  let gameUrl = $derived(
    game.activityType === 'listing' ? `${game.listingHref}?game=${game.id}` : '#'
  );
</script>

<BaseCard
  href={gameUrl}
  imageUrl={game.activityType === 'listing' ? game.thumbnail : null}
  imageAlt={game.activityType === 'listing' ? game.gameTitle : 'Activity'}
  borderClass={colors ? `border-2 ${colors.border}` : 'border border-subtle'}
>
  {#snippet header()}
    {#if game.activityType === 'listing' && colors}
      <!-- Type badge -->
      <div class="flex items-center justify-between">
        <span
          class="rounded-full border-2 {colors.border} {colors.bg} px-3 py-1 text-xs font-bold uppercase tracking-wider {colors.text}"
        >
          {typeLabels[game.type]}
        </span>
      </div>

      <!-- Listing title (smaller text) -->
      {#if game.listingTitle}
        <p class="text-xs font-medium uppercase tracking-wide text-muted">
          {game.listingTitle}
        </p>
      {/if}
    {/if}
  {/snippet}

  {#snippet content()}
    {#if game.activityType === 'listing'}
      <!-- Game title -->
      <div class="space-y-2">
        <h3 class="text-xl font-bold text-primary transition-colors">{game.gameTitle}</h3>
      </div>

      <!-- User info (moved up, before details) -->
      <div class="flex items-center gap-1.5 text-sm">
        {#if game.userId && game.userName}
          {#if game.userJoinedDate}
            {@const tier = getTrustTier(
              getAccountAgeDays(game.userJoinedDate),
              game.userVouchedTrades
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
            href={`/users/${game.userId}`}
            class="font-medium text-primary transition hover:text-[var(--accent)]"
            onclick={(e) => e.stopPropagation()}
          >
            {game.userName}
          </a>
        {:else if game.userName}
          <span class="font-medium text-primary">{game.userName}</span>
        {:else}
          <span class="font-medium text-primary">Meeple Cart member</span>
        {/if}
      </div>

      <!-- Game details -->
      <div class="flex flex-wrap items-center gap-3 text-sm">
        <div class="flex items-center gap-2">
          <span class="text-muted">Condition</span>
          <span
            class="rounded-full bg-surface-card-alt px-3 py-1 text-xs font-semibold text-primary transition-colors"
          >
            {conditionLabels[game.condition]}
          </span>
        </div>
        {#if game.price !== null}
          <div class="flex items-center gap-2">
            <span class="text-muted">Price</span>
            <span
              class="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-badge-emerald ring-1 ring-emerald-500/50"
            >
              {currencyFormatter.format(game.price)}
            </span>
          </div>
        {:else if game.tradeValue !== null}
          <div class="flex items-center gap-2">
            <span class="text-muted">Value</span>
            <span
              class="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-badge-emerald ring-1 ring-emerald-500/50"
            >
              {currencyFormatter.format(game.tradeValue)}
            </span>
          </div>
        {/if}
      </div>
    {/if}
  {/snippet}

  {#snippet footer()}
    <!-- Location info -->
    {#if game.activityType === 'listing' && game.userLocation}
      <div class="border-t border-subtle pt-3 text-sm">
        <span class="text-xs text-muted">📍 {game.userLocation}</span>
      </div>
    {/if}
  {/snippet}
</BaseCard>
