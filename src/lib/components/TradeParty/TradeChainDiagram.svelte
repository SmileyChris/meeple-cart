<script lang="ts">
  import type { TradePartyMatchRecord } from '$lib/types/pocketbase';

  interface Props {
    matches: TradePartyMatchRecord[];
    currentUserId: string;
  }

  let { matches, currentUserId }: Props = $props();

  // Build a map of user -> user trades to visualize the chain
  let tradeFlow = $derived(() => {
    const flow: Array<{
      from: string;
      to: string;
      game: string;
      isCurrentUser: boolean;
      position: number;
    }> = [];

    for (const match of matches) {
      const fromUser =
        match.expand?.giving_user?.display_name ||
        match.expand?.giving_user?.username ||
        'Unknown';
      const toUser =
        match.expand?.receiving_user?.display_name ||
        match.expand?.receiving_user?.username ||
        'Unknown';
      const game = match.expand?.giving_submission?.title || 'Unknown';

      flow.push({
        from: fromUser,
        to: toUser,
        game,
        isCurrentUser: match.giving_user === currentUserId || match.receiving_user === currentUserId,
        position: match.chain_position,
      });
    }

    return flow.sort((a, b) => a.position - b.position);
  });

  // Check if it's a circular chain (last person sends to first person)
  let isCircular = $derived(() => {
    if (tradeFlow().length < 2) return false;
    const first = tradeFlow()[0];
    const last = tradeFlow()[tradeFlow().length - 1];
    return last.to === first.from;
  });
</script>

<div class="overflow-x-auto rounded-lg border border-subtle bg-surface-body p-4">
  <div class="flex items-center gap-4">
    {#each tradeFlow() as trade, index}
      <!-- User Box -->
      <div
        class="flex min-w-[120px] flex-col items-center rounded-lg border p-3 {trade.isCurrentUser
          ? 'border-accent bg-accent/10'
          : 'border-subtle bg-surface-card'}"
      >
        <div class="mb-1 text-center text-sm font-semibold {trade.isCurrentUser ? 'text-accent' : 'text-primary'}">
          {trade.from}
          {#if trade.isCurrentUser}
            <span class="text-xs">(You)</span>
          {/if}
        </div>
        <div class="text-xs text-muted">sends</div>
        <div class="mt-1 text-center text-xs font-medium text-secondary line-clamp-2">
          {trade.game}
        </div>
      </div>

      <!-- Arrow -->
      {#if index < tradeFlow().length - 1 || isCircular()}
        <div class="flex flex-col items-center">
          <svg
            class="h-6 w-8 text-accent"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            />
          </svg>
        </div>
      {/if}
    {/each}

    <!-- Circular indicator - show last recipient if circular -->
    {#if isCircular()}
      {@const lastTrade = tradeFlow()[tradeFlow().length - 1]}
      <div
        class="flex min-w-[120px] flex-col items-center rounded-lg border p-3 {lastTrade.to ===
        (tradeFlow()[0]?.from || '')
          ? 'border-accent bg-accent/10'
          : 'border-subtle bg-surface-card'}"
      >
        <div class="text-center text-sm font-semibold text-primary">
          {lastTrade.to}
          {#if tradeFlow().some((t) => t.from === lastTrade.to && (t.isCurrentUser))}
            <span class="text-xs">(You)</span>
          {/if}
        </div>
        <div class="text-xs text-muted">receives</div>
      </div>
    {/if}
  </div>

  {#if isCircular()}
    <div class="mt-3 text-center text-xs text-muted">
      🔄 Circular trade chain - everyone gives and receives
    </div>
  {:else}
    <div class="mt-3 text-center text-xs text-muted">
      ➡️ Linear trade chain - {tradeFlow().length} trades
    </div>
  {/if}
</div>
