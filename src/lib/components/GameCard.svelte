<script lang="ts">
  import type { ListingActivity, SignupActivity } from '$lib/types/activity';
  import BaseCard from './BaseCard.svelte';
  import {
    getAccountAgeDays,
    getTrustTier,
    getTrustTierInfo,
    getTooltipText,
  } from '$lib/utils/trust-tiers';

  // Superset of ActivityItem that also carries the year/price the /games route resolves
  // (year straight off the item, price from the item or its offer_template's cash_amount).
  type GameCardActivity =
    | (ListingActivity & { year: number | null; price: number | null })
    | SignupActivity;

  let { game }: { game: GameCardActivity } = $props();

  const conditionLabels: Record<string, string> = {
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

  // Add game ID to URL so listing page can scroll to it (only for listing activities)
  let gameUrl = $derived(
    game.activityType === 'listing' ? `${game.listingHref}?game=${game.id}` : '#'
  );
</script>

<BaseCard
  href={gameUrl}
  imageUrl={game.activityType === 'listing' ? game.thumbnail : null}
  imageAlt={game.activityType === 'listing' ? game.gameTitle : 'Activity'}
  borderClass="border border-subtle"
>
  {#snippet header()}
    {#if game.activityType === 'listing' && game.listingTitle}
      <!-- Listing title (smaller text) -->
      <p class="text-xs font-medium uppercase tracking-wide text-muted">
        {game.listingTitle}
      </p>
    {/if}
  {/snippet}

  {#snippet content()}
    {#if game.activityType === 'listing'}
      <!-- Game title -->
      <div class="space-y-2">
        <h3 class="text-xl font-bold text-primary transition-colors">
          {game.year ? `${game.gameTitle} (${game.year})` : game.gameTitle}
        </h3>
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

        {#if game.price != null}
          <div class="flex items-center gap-2">
            <span class="text-muted">Price</span>
            <span
              class="rounded-full bg-surface-card-alt px-3 py-1 text-xs font-semibold text-primary transition-colors"
            >
              {currencyFormatter.format(game.price / 100)}
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
