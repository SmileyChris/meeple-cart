  import { pb, currentUser } from '$lib/pocketbase';
  import type { TradePartyRecord, TradeRecord } from '$lib/types/pocketbase';
  import type { TradePartyContextRecord } from '$lib/types/trade-party-context';
  import TradeChainDiagram from './TradeChainDiagram.svelte';

  interface Props {
    partyId: string;
    isOrganizer?: boolean;
    partyStatus?: string;
  }

  let { partyId, isOrganizer, partyStatus }: Props = $props();

  let contextRecords = $state<TradePartyContextRecord[]>([]);
  let isLoading = $state(true);
  let error = $state<string | null>(null);
  let isFinalizing = $state(false);

  // Group context records by chain_id
  let chains = $derived(() => {
    if (!contextRecords || contextRecords.length === 0) {
      return {};
    }

    const groups: Record<string, TradePartyContextRecord[]> = {};

    for (const record of contextRecords) {
      if (!record.chain_id) continue;

      if (!groups[record.chain_id]) {
        groups[record.chain_id] = [];
      }
      groups[record.chain_id].push(record);
    }

    // Sort by position
    for (const id in groups) {
      groups[id].sort((a, b) => a.chain_position - b.chain_position);
    }

    return groups;
  });

  // Calculate my involvements
  let myContextRecords = $derived(() => {
    if (!$currentUser) return [];
    return contextRecords.filter(c => {
      const trade = c.expand?.trade as TradeRecord | undefined;
      if (!trade) return false;
      return trade.buyer === $currentUser.id || trade.seller === $currentUser.id;
    });
  });

  // Load data on mount
  $effect(() => {
    loadMatches();
  });

  async function loadMatches() {
    try {
      isLoading = true;
      error = null;

      // Fetch context records (includes draft and non-draft)
      // Expand chain to get trade and participants
      contextRecords = await pb.collection('trade_party_context').getFullList<TradePartyContextRecord>({
        filter: `party = "${partyId}"`,
        expand: 'trade,giving_submission,receiving_submission,trade.buyer,trade.seller',
        sort: 'chain_id,chain_position',
        $autoCancel: false
      });
    } catch (err: any) {
      console.error('Failed to load matches:', err);
      error = err.message || 'Failed to load matches';
    } finally {
      isLoading = false;
    }
  }

  async function handleFinalize() {
    if (!confirm('Are you sure you want to finalize these matches? This will notify all participants and reveal identities.')) {
      return;
    }

    try {
      isFinalizing = true;
      // We'll call a server action or use the PB SDK if we have the finalizeTradeMatching exported
      // For now, let's assume we use an endpoint or just direct PB updates if allowed
      // In a real app, this should be a secure server-side call.
      
      // Temporary: Since I added finalizeTradeMatching to runner.ts, I'll assume 
      // there's a way to call it. Usually this would be via an API route.
      const response = await fetch(`/api/trade-parties/${partyId}/finalize`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error('Failed to finalize matches');
      }

      await loadMatches();
    } catch (err: any) {
      console.error('Finalization failed:', err);
      alert('Failed to finalize matches: ' + err.message);
    } finally {
      isFinalizing = false;
    }
  }

  function getStatusColor(status: string, isDraft?: boolean) {
    if (isDraft) return 'bg-purple-500/20 text-purple-200';
    
    switch (status) {
      case 'initiated':
      case 'pending':
        return 'bg-amber-500/20 text-amber-200';
      case 'confirmed':
      case 'shipping':
        return 'bg-blue-500/20 text-blue-200';
      case 'completed':
        return 'bg-emerald-500/20 text-emerald-200';
      case 'disputed':
        return 'bg-red-500/20 text-red-200';
      default:
        return 'bg-gray-500/20 text-gray-200';
    }
  }
</script>

{#if isLoading}
  <div class="flex items-center justify-center py-12">
    <div
      class="h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent"
    ></div>
  </div>
{:else if error}
  <div class="rounded-lg border border-red-500/30 bg-red-500/10 p-6">
    <p class="text-sm text-red-200">{error}</p>
  </div>
{:else if contextRecords.length === 0}
  <div class="rounded-lg border border-subtle bg-surface-card p-8 text-center">
    <div class="mb-3 text-4xl">📭</div>
    <p class="text-lg text-secondary">No matches found for this party</p>
    <p class="mt-2 text-sm text-muted">
      This could mean:
    </p>
    <ul class="mt-2 space-y-1 text-sm text-muted">
      <li>• The algorithm hasn't run yet</li>
      <li>• No suitable trade chains were possible with the current submissions</li>
    </ul>
  </div>
{:else}
  <div class="space-y-6">
    <!-- Organizer Preview Header -->
    {#if isOrganizer && partyStatus === 'matching_preview'}
      <div class="rounded-lg border border-purple-500/30 bg-purple-500/10 p-4">
        <div class="flex items-center justify-between">
          <div>
            <h4 class="font-semibold text-purple-200">Matching Results (Preview)</h4>
            <p class="text-sm text-purple-200/70">
              Review weights and chains before making them official. Participants currently see anonymized results.
            </p>
          </div>
          <div class="flex gap-3">
            <button
              onclick={loadMatches}
              class="rounded-lg border border-subtle bg-surface-card px-4 py-2 text-sm font-medium text-primary hover:bg-surface-body"
            >
              Refresh Results
            </button>
            <button
              onclick={handleFinalize}
              disabled={isFinalizing}
              class="rounded-lg bg-purple-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-purple-500 disabled:opacity-50"
            >
              {isFinalizing ? 'Finalizing...' : 'Finalize Matches'}
            </button>
          </div>
        </div>
      </div>
    {/if}

    <div class="flex items-center justify-between">
      <h3 class="text-xl font-semibold text-primary">
        {#if partyStatus === 'matching_preview'}
          Matches Preview ({Object.keys(chains()).length} Chains)
        {:else}
          Your Matches ({myContextRecords.length})
        {/if}
      </h3>
    </div>

    <!-- Group by Chain -->
    {#each Object.entries(chains()) as [chainId, chainRecords]}
      {@const isMyChain = myContextRecords.some(r => r.chain_id === chainId)}
      {@const isDraft = chainRecords[0]?.is_draft}
      
      <!-- Only show my chains if not organizer and not public preview -->
      {#if isOrganizer || !isDraft || isMyChain}
        <div class="rounded-lg border border-subtle bg-surface-card p-6 {isDraft ? 'border-purple-500/30 shadow-[0_0_15px_-5px_rgba(168,85,247,0.2)]' : ''}">
          <div class="mb-4 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <h4 class="font-semibold text-primary">Trade Chain {chainId.split('_').pop()}</h4>
              {#if isDraft}
                <span class="rounded bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-200">
                  Draft Preview
                </span>
              {/if}
            </div>
            <span class="text-sm text-muted">{chainRecords.length} trades in chain</span>
          </div>

          <!-- Trade Chain Visualization -->
          <TradeChainDiagram 
            matches={chainRecords} 
            currentUserId={$currentUser?.id || ''} 
            isDraft={isDraft}
          />

          <!-- Detailed Match Cards (Only shown if finalized or if I'm a participant) -->
          {#if !isDraft || isOrganizer}
            <div class="mt-6 space-y-4">
              {#each chainRecords as record}
                {@const trade = record.expand?.trade as TradeRecord | undefined}
                {@const isGiving = trade?.seller === $currentUser?.id}
                {@const isReceiving = trade?.buyer === $currentUser?.id}
                {@const myRole = isGiving ? 'giving' : isReceiving ? 'receiving' : null}

                {#if isOrganizer || myRole}
                  <div
                    class="rounded-lg border border-subtle bg-surface-body p-4 {myRole === 'giving' ? 'border-l-4 border-l-orange-500' : myRole === 'receiving' ? 'border-l-4 border-l-emerald-500' : 'border-l-2'}"
                  >
                    <div class="mb-3 flex items-center justify-between">
                      <span class="text-sm font-medium text-primary">
                        {#if myRole === 'giving'}
                          📤 You are sending
                        {:else if myRole === 'receiving'}
                          📥 You are receiving
                        {:else}
                          🔄 Trade {record.chain_position}
                        {/if}
                      </span>
                      <span class="rounded-full px-3 py-1 text-xs font-semibold {getStatusColor(trade?.status || 'pending', isDraft)}">
                        {isDraft ? 'Draft' : trade?.status}
                      </span>
                    </div>

                    <div class="grid gap-4 md:grid-cols-2">
                      <div>
                        <p class="mb-1 text-xs text-muted">Sending Game:</p>
                        <p class="font-semibold text-primary">
                          {record.expand?.giving_submission?.title || 'Unknown'}
                        </p>
                        <p class="text-xs text-secondary">
                          From: {isDraft ? 'Participant' : (trade?.expand?.seller?.display_name || trade?.expand?.seller?.username || 'Unknown')}
                        </p>
                      </div>

                      <div>
                        <p class="mb-1 text-xs text-muted">To Recipient:</p>
                        <p class="text-sm font-medium text-primary">
                          {isDraft ? 'Participant (Hidden)' : (trade?.expand?.buyer?.display_name || trade?.expand?.buyer?.username || 'Unknown')}
                        </p>
                        {#if isReceiving && !isDraft}
                          <p class="mt-1 text-xs text-secondary">
                            Receiving: {record.expand?.receiving_submission?.title || 'Your Submission'}
                          </p>
                        {/if}
                      </div>
                    </div>

                    {#if trade?.tracking_number}
                      <div class="mt-3 rounded border border-subtle bg-surface-card p-2">
                        <p class="text-xs text-muted">Tracking: <span class="font-mono text-primary">{trade.tracking_number}</span></p>
                      </div>
                    {/if}
                    
                    <!-- Only show controls if not draft and it's my trade -->
                    {#if !isDraft && myRole}
                       <div class="mt-4 flex gap-4">
                          <a 
                            href="/trades/{trade?.id}"
                            class="text-xs font-semibold text-accent hover:underline"
                          >
                            View Full Trade Details →
                          </a>
                       </div>
                    {/if}
                  </div>
                {/if}
              {/each}
            </div>
          {/if}
        </div>
      {/if}
    {/each}
  </div>
{/if}
