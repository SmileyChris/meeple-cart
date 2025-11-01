<script lang="ts">
  import type { ActivityItem } from '$lib/types/activity';
  import type { ListingType } from '$lib/types/listing';
  import MeepleIcon from './MeepleIcon.svelte';

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
      border: 'border-blue-600',
      bg: 'bg-blue-500/10',
      text: 'text-badge-blue',
    },
    want: {
      border: 'border-purple-600',
      bg: 'bg-purple-500/10',
      text: 'text-badge-purple',
    },
  };

  const conditionLabels: Record<ActivityItem['condition'], string> = {
    mint: 'Mint',
    excellent: 'Excellent',
    good: 'Good',
    fair: 'Fair',
    poor: 'Well loved',
  };

  let colors = $derived(typeColors[game.type]);

  const currencyFormatter = new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });

  let bggUrl = $derived(game.bggId ? `https://boardgamegeek.com/boardgame/${game.bggId}` : null);

  // Extract listing name from the href (you might want to pass this as a separate prop)
  // For now, we'll use the userName and location as context
  let listingContext = $derived(
    [game.userName, game.userLocation].filter(Boolean).join(' · ')
  );

  // Add game ID to URL so listing page can scroll to it
  let gameUrl = $derived(`${game.listingHref}?game=${game.id}`);
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -->
<div
  class="group block cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-body)]"
  role="link"
  tabindex="0"
  onclick={() => (window.location.href = gameUrl)}
  onkeydown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      window.location.href = gameUrl;
    }
  }}
>
  <article
    class="flex flex-col overflow-hidden rounded-xl border-2 {colors.border} bg-surface-card shadow-elevated transition-all group-hover:scale-[1.02] group-hover:shadow-lg"
  >
    {#if game.thumbnail}
      <img
        alt={game.gameTitle}
        class="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
        src={game.thumbnail}
        loading="lazy"
      />
    {:else}
      <div
        class="flex h-48 w-full flex-col items-center justify-center gap-3 bg-surface-card-alt text-muted transition-colors"
      >
        <MeepleIcon size={64} className="opacity-50" seed={game.id} />
        <span class="text-xs font-medium uppercase tracking-wider opacity-40">No image yet</span>
      </div>
    {/if}

    <div class="flex flex-1 flex-col gap-3 p-5">
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

      <!-- Game title -->
      <div class="space-y-2">
        <h3 class="text-xl font-bold text-primary transition-colors">{game.gameTitle}</h3>
        {#if bggUrl}
          <a
            class="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] transition hover:text-[var(--accent-strong)]"
            href={bggUrl}
            target="_blank"
            rel="external noopener"
            onclick={(e) => e.stopPropagation()}
          >
            View on BGG →
          </a>
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

      <!-- User info -->
      <div class="mt-auto flex flex-col gap-1 border-t border-subtle pt-3 text-sm text-secondary">
        {#if game.userName}
          <span class="font-semibold text-primary">{game.userName}</span>
        {:else}
          <span class="font-semibold text-primary">Meeple Cart member</span>
        {/if}
        {#if game.userLocation}
          <span class="text-xs text-muted">📍 {game.userLocation}</span>
        {/if}
      </div>
    </div>
  </article>
</div>
<!-- eslint-enable svelte/no-navigation-without-resolve -->
