<script lang="ts">
  import type { PageData } from './$types';
  import type { TradeRecord, UserRecord } from '$lib/types/pocketbase';
  import type { ListingRecord } from '$lib/types/listing';
  import { currentUser } from '$lib/pocketbase';

  let { data }: { data: PageData } = $props();

  let trades = $derived(data.trades);
  let filter = $derived(data.filter);
  let counts = $derived(data.counts);

  const statusLabels: Record<string, string> = {
    initiated: 'Initiated',
    confirmed: 'In Progress',
    completed: 'Completed',
    disputed: 'Disputed',
  };

  const statusColors: Record<string, string> = {
    initiated: 'border-amber-500/80 bg-amber-500/10 text-amber-200',
    confirmed: 'border-sky-500/80 bg-sky-500/10 text-sky-200',
    completed: 'border-emerald-500/80 bg-emerald-500/10 text-emerald-200',
    disputed: 'border-rose-500/80 bg-rose-500/10 text-rose-200',
  };

  function getOtherParty(trade: TradeRecord): UserRecord {
    if (trade.buyer === $currentUser?.id) {
      return trade.expand?.seller as UserRecord;
    }
    return trade.expand?.buyer as UserRecord;
  }

  function getUserRole(trade: TradeRecord): string {
    if (trade.buyer === $currentUser?.id) {
      return 'Buyer';
    }
    return 'Seller';
  }

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat('en-NZ', { dateStyle: 'medium' }).format(new Date(iso));
</script>

<svelte:head>
  <title>My Trades · Meeple Cart</title>
</svelte:head>

<main class="bg-surface-body transition-colors px-6 py-12 text-primary sm:px-8">
  <div class="mx-auto max-w-5xl space-y-8">
    <header>
      <h1 class="text-3xl font-semibold tracking-tight text-primary">My Trades</h1>
      <p class="mt-2 text-sm text-muted">
        Track your active and completed trades with other collectors.
      </p>
    </header>

    <!-- Filter Tabs -->
    <nav class="flex gap-2 border-b border-subtle pb-0">
      <a
        href="/trades?filter=active"
        class={`rounded-t-lg px-4 py-2 text-sm font-medium transition ${
          filter === 'active'
            ? 'border-b-2 border-emerald-500 bg-surface-card text-emerald-300'
            : 'text-muted hover:text-secondary hover:bg-surface-ghost'
        }`}
      >
        Active ({counts.active})
      </a>
      <a
        href="/trades?filter=completed"
        class={`rounded-t-lg px-4 py-2 text-sm font-medium transition ${
          filter === 'completed'
            ? 'border-b-2 border-emerald-500 bg-surface-card text-emerald-300'
            : 'text-muted hover:text-secondary hover:bg-surface-ghost'
        }`}
      >
        Completed ({counts.completed})
      </a>
      <a
        href="/trades?filter=disputed"
        class={`rounded-t-lg px-4 py-2 text-sm font-medium transition ${
          filter === 'disputed'
            ? 'border-b-2 border-emerald-500 bg-surface-card text-emerald-300'
            : 'text-muted hover:text-secondary hover:bg-surface-ghost'
        }`}
      >
        Disputed ({counts.disputed})
      </a>
    </nav>

    <!-- Trades List -->
    {#if trades.length === 0}
      <div
        class="rounded-xl border border-dashed border-subtle bg-surface-card transition-colors p-12 text-center"
      >
        <p class="text-muted">
          {#if filter === 'active'}
            No active trades. Start by proposing a trade on a listing!
          {:else if filter === 'completed'}
            No completed trades yet.
          {:else}
            No disputed trades.
          {/if}
        </p>
        {#if filter === 'active'}
          <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
          <a href="/" class="btn-primary mt-4 inline-block">
            Browse Listings
          </a>
        {/if}
      </div>
    {:else}
      <div class="space-y-4">
        {#each trades as trade (trade.id)}
          {@const otherParty = getOtherParty(trade)}
          {@const listing = trade.expand?.listing as ListingRecord}
          {@const role = getUserRole(trade)}
          <article
            class="rounded-xl border border-subtle bg-surface-card transition-colors hover:border-emerald-500/50 p-6"
          >
            <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div class="flex-1 space-y-2">
                <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
                <a
                  href={`/trades/${trade.id}`}
                  class="text-lg font-semibold text-emerald-300 hover:text-emerald-200 transition"
                >
                  {listing.title}
                </a>
                <div class="flex flex-wrap gap-3 text-sm text-muted">
                  <span>With: <span class="text-secondary">{otherParty.display_name}</span></span>
                  <span>·</span>
                  <span>Role: <span class="text-secondary">{role}</span></span>
                  <span>·</span>
                  <span>{formatDate(trade.created)}</span>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <span
                  class={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusColors[trade.status]}`}
                >
                  {statusLabels[trade.status]}
                </span>
                <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
                <a
                  href={`/trades/${trade.id}`}
                  class="text-sm font-medium text-emerald-300 hover:text-emerald-200 transition"
                >
                  View →
                </a>
              </div>
            </div>
          </article>
        {/each}
      </div>
    {/if}
  </div>
</main>
