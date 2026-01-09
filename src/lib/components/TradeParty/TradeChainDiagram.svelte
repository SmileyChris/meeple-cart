  import type { TradePartyMatchRecord, TradeRecord, UserRecord, TradePartySubmissionRecord } from '$lib/types/pocketbase';
  import type { TradePartyContextRecord } from '$lib/types/trade-party-context';

  interface Props {
    matches: (TradePartyMatchRecord | TradePartyContextRecord)[];
    currentUserId: string;
    isDraft?: boolean;
  }

  let { matches, currentUserId, isDraft }: Props = $props();

  // Helper to get name from user or record, handles anonymization
  function getName(userIndex: number, userRecord?: UserRecord): string {
    if (isDraft) {
      return `Participant ${String.fromCharCode(65 + userIndex)}`; // A, B, C...
    }
    return userRecord?.display_name || userRecord?.username || 'Unknown User';
  }

  // Build a map of user -> user trades to visualize the chain
  let tradeFlow = $derived(() => {
    if (!matches || matches.length === 0) {
      return [];
    }

    const flow: Array<{
      from: string;
      to: string;
      game: string;
      isCurrentUser: boolean;
      position: number;
    }> = [];

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      
      let fromUserRecord: UserRecord | undefined;
      let toUserRecord: UserRecord | undefined;
      let gameTitle = 'Unknown Game';
      let givingUserId = '';
      let receivingUserId = '';

      // Handle both legacy MatchRecord and new ContextRecord
      if ('giving_user' in match) {
        // Legacy/Finalized MatchRecord
        fromUserRecord = match.expand?.giving_user as UserRecord;
        toUserRecord = match.expand?.receiving_user as UserRecord;
        gameTitle = match.expand?.giving_submission?.title || 'Unknown Game';
        givingUserId = match.giving_user;
        receivingUserId = match.receiving_user;
      } else {
        // New ContextRecord
        const trade = match.expand?.trade as TradeRecord;
        fromUserRecord = trade?.expand?.seller;
        toUserRecord = trade?.expand?.buyer;
        gameTitle = (match.expand?.giving_submission as TradePartySubmissionRecord)?.title || 'Unknown Game';
        givingUserId = trade?.seller || '';
        receivingUserId = trade?.buyer || '';
      }

      flow.push({
        from: getName(i, fromUserRecord),
        to: getName((i + 1) % matches.length, toUserRecord),
        game: gameTitle,
        isCurrentUser: givingUserId === currentUserId || receivingUserId === currentUserId,
        position: match.chain_position || 0,
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
