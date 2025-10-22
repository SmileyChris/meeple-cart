<script lang="ts">
  import type { ActivityItem } from '$lib/types/activity';
  import type { ListingType } from '$lib/types/listing';
  import { formatRelativeTime, isVeryRecent } from '$lib/utils/time';
  import MeepleIcon from './MeepleIcon.svelte';

  export let activity: ActivityItem;

  const typeLabels: Record<ListingType, string> = {
    trade: 'Trade',
    sell: 'Sell',
    want: 'Looking for',
  };

  const typeColors: Record<ListingType, { border: string; bg: string; text: string; dot: string }> =
    {
      trade: {
        border: 'border-emerald-600',
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-200',
        dot: 'bg-emerald-500',
      },
      sell: {
        border: 'border-blue-600',
        bg: 'bg-blue-500/10',
        text: 'text-blue-200',
        dot: 'bg-blue-500',
      },
      want: {
        border: 'border-purple-600',
        bg: 'bg-purple-500/10',
        text: 'text-purple-200',
        dot: 'bg-purple-500',
      },
    };

  const conditionLabels: Record<ActivityItem['condition'], string> = {
    mint: 'Mint',
    excellent: 'Excellent',
    good: 'Good',
    fair: 'Fair',
    poor: 'Well loved',
  };

  const colors = typeColors[activity.type];
  const relativeTime = formatRelativeTime(activity.timestamp);
  const isNew = isVeryRecent(activity.timestamp);

  const currencyFormatter = new Intl.NumberFormat('en-NZ', {
    style: 'currency',
    currency: 'NZD',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  });

  const bggUrl = activity.bggId ? `https://boardgamegeek.com/boardgame/${activity.bggId}` : null;
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -->
<div class="relative flex gap-6 text-primary sm:gap-8">
  <!-- Timeline connector -->
  <div class="relative flex flex-col items-center">
    <!-- Dot -->
    <div class="relative z-10 flex-shrink-0">
      <div
        class="{colors.dot} h-4 w-4 rounded-full shadow-lg ring-4 ring-[color:var(--surface-body)] {isNew
          ? 'animate-pulse'
          : ''}"
      ></div>
      {#if isNew}
        <div class="absolute inset-0 {colors.dot} animate-ping rounded-full opacity-75"></div>
      {/if}
    </div>
    <!-- Dotted line -->
    <div class="mt-2 flex-1 border-l-2 border-dotted border-[color:var(--border-subtle)]"></div>
  </div>

  <!-- Activity card -->
  <div
    class="group mb-10 flex-1 cursor-pointer pb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-body)] sm:mb-12"
    role="link"
    tabindex="0"
    onclick={() => (window.location.href = activity.listingHref)}
    onkeydown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        window.location.href = activity.listingHref;
      }
    }}
  >
    <div
      class="overflow-hidden rounded-2xl border-2 {colors.border} bg-surface-card shadow-elevated backdrop-blur-sm transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-2xl group-hover:shadow-{colors.dot}/20"
    >
      <!-- Image header -->
      {#if activity.thumbnail}
        <div class="relative h-48 overflow-hidden sm:h-64">
          <img
            alt={activity.gameTitle}
            class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
            src={activity.thumbnail}
            loading="lazy"
          />
          <div
            class="absolute inset-0 bg-gradient-to-t from-[color:rgba(15,23,42,0.88)] to-transparent"
          ></div>
          <!-- Type badge overlay -->
          <div class="absolute left-4 top-4">
            <span
              class="rounded-full border-2 {colors.border} {colors.bg} px-4 py-1.5 text-sm font-bold uppercase tracking-wider {colors.text} backdrop-blur-sm"
            >
              {typeLabels[activity.type]}
            </span>
          </div>
          {#if isNew}
            <div class="absolute right-4 top-4">
              <span
                class="animate-pulse rounded-full border-2 border-emerald-500 bg-emerald-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-300 backdrop-blur-sm"
              >
                New
              </span>
            </div>
          {/if}
        </div>
      {:else}
        <div
          class="relative flex h-48 items-center justify-center overflow-hidden bg-gradient-to-br from-[color:rgba(30,41,59,0.9)] to-[color:rgba(15,23,42,0.95)] sm:h-64 transition-colors"
        >
          <MeepleIcon size={96} className="opacity-20" seed={activity.id} />
          <!-- Type badge overlay -->
          <div class="absolute left-4 top-4">
            <span
              class="rounded-full border-2 {colors.border} {colors.bg} px-4 py-1.5 text-sm font-bold uppercase tracking-wider {colors.text} backdrop-blur-sm"
            >
              {typeLabels[activity.type]}
            </span>
          </div>
          {#if isNew}
            <div class="absolute right-4 top-4">
              <span
                class="animate-pulse rounded-full border-2 border-emerald-500 bg-emerald-500/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-300 backdrop-blur-sm"
              >
                New
              </span>
            </div>
          {/if}
        </div>
      {/if}

      <!-- Content -->
      <div class="space-y-4 p-6">
        <!-- Game title and BGG link -->
        <div>
          <div class="flex flex-wrap items-start justify-between gap-3">
            <h3 class="text-2xl font-bold text-primary sm:text-3xl">{activity.gameTitle}</h3>
            {#if bggUrl}
              <a
                class="btn-secondary shrink-0 px-3 py-1.5 text-sm"
                href={bggUrl}
                target="_blank"
                rel="external noopener"
                onclick={(e) => e.stopPropagation()}
              >
                View on BGG →
              </a>
            {/if}
          </div>
        </div>

        <!-- Details grid -->
        <div class="flex flex-wrap items-center gap-4 text-sm text-secondary">
          <div class="flex items-center gap-2">
            <span class="text-muted">Condition</span>
            <span
              class="rounded-full bg-surface-card-alt px-3 py-1 font-semibold text-primary transition-colors"
            >
              {conditionLabels[activity.condition]}
            </span>
          </div>
          {#if activity.price !== null}
            <div class="flex items-center gap-2">
              <span class="text-muted">Price</span>
              <span
                class="rounded-full bg-emerald-500/20 px-3 py-1 font-bold text-emerald-300 ring-1 ring-emerald-500/50"
              >
                {currencyFormatter.format(activity.price)}
              </span>
            </div>
          {:else if activity.tradeValue !== null}
            <div class="flex items-center gap-2">
              <span class="text-muted">Trade Value</span>
              <span
                class="rounded-full bg-emerald-500/20 px-3 py-1 font-bold text-emerald-300 ring-1 ring-emerald-500/50"
              >
                {currencyFormatter.format(activity.tradeValue)}
              </span>
            </div>
          {/if}
        </div>

        <!-- User info and timestamp -->
        <div
          class="flex flex-wrap items-center justify-between gap-3 border-t border-subtle pt-4 text-secondary"
        >
          <div class="flex flex-col gap-1">
            {#if activity.userName}
              <span class="font-semibold text-primary">{activity.userName}</span>
            {:else}
              <span class="font-semibold text-primary">Meeple Cart member</span>
            {/if}
            {#if activity.userLocation}
              <span class="text-sm text-muted">📍 {activity.userLocation}</span>
            {/if}
          </div>
          <span class="text-sm font-medium text-muted">{relativeTime}</span>
        </div>
      </div>
    </div>
  </div>
</div>
<!-- eslint-enable svelte/no-navigation-without-resolve -->
