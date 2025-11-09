<script lang="ts">
  import { pb, currentUser } from '$lib/pocketbase';
  import type { TradePartyMatchRecord } from '$lib/types/pocketbase';
  import TradeChainDiagram from './TradeChainDiagram.svelte';

  interface Props {
    partyId: string;
  }

  let { partyId }: Props = $props();

  let matches = $state<TradePartyMatchRecord[]>([]);
  let isLoading = $state(true);
  let error = $state<string | null>(null);

  // Group matches by chain_id
  let matchesByChain = $derived(() => {
    if (!matches || matches.length === 0) {
      return {};
    }

    const chains: Record<string, TradePartyMatchRecord[]> = {};

    for (const match of matches) {
      if (!match.chain_id) {
        console.warn('Match missing chain_id:', match);
        continue;
      }

      if (!chains[match.chain_id]) {
        chains[match.chain_id] = [];
      }
      chains[match.chain_id].push(match);
    }

    // Sort matches within each chain by position
    for (const chainId in chains) {
      chains[chainId].sort((a, b) => a.chain_position - b.chain_position);
    }

    return chains;
  });

  // Get only matches involving current user
  let myMatches = $derived(() => {
    if (!$currentUser) return [];
    return matches.filter(
      (m) => m.giving_user === $currentUser.id || m.receiving_user === $currentUser.id
    );
  });

  // Load matches on mount
  $effect(() => {
    loadMatches();
  });

  async function loadMatches() {
    if (!$currentUser) {
      error = 'You must be logged in to view matches';
      isLoading = false;
      return;
    }

    try {
      isLoading = true;
      matches = await pb.collection('trade_party_matches').getFullList({
        filter: `trade_party = "${partyId}" && (giving_user = "${$currentUser.id}" || receiving_user = "${$currentUser.id}")`,
        expand: 'giving_submission,receiving_submission,giving_user,receiving_user',
        sort: 'chain_id,chain_position',
      });
    } catch (err: any) {
      console.error('Failed to load matches:', err);
      error = err.message || 'Failed to load matches';
    } finally {
      isLoading = false;
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'pending':
        return 'bg-amber-500/20 text-amber-200';
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

  async function updateMatchStatus(matchId: string, newStatus: string, trackingNumber?: string) {
    try {
      const updateData: any = { status: newStatus };

      if (newStatus === 'shipping' && trackingNumber) {
        updateData.tracking_number = trackingNumber;
        updateData.shipped_at = new Date().toISOString();
      } else if (newStatus === 'completed') {
        updateData.received_at = new Date().toISOString();
      }

      await pb.collection('trade_party_matches').update(matchId, updateData);

      // Reload matches to show updated status
      await loadMatches();
    } catch (err: any) {
      console.error('Failed to update match status:', err);
      const errorMessage = err.message || 'Failed to update status';
      alert(`Error: ${errorMessage}. Please try again.`);
    }
  }

  async function handleMarkShipped(matchId: string) {
    const trackingNumber = prompt('Enter tracking number (optional):');
    await updateMatchStatus(matchId, 'shipping', trackingNumber || undefined);
  }

  async function handleMarkReceived(matchId: string) {
    if (confirm('Confirm you have received this game?')) {
      await updateMatchStatus(matchId, 'completed');
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
{:else if myMatches.length === 0}
  <div class="rounded-lg border border-subtle bg-surface-card p-8 text-center">
    <div class="mb-3 text-4xl">📭</div>
    <p class="text-lg text-secondary">No matches found for you in this party</p>
    <p class="mt-2 text-sm text-muted">
      This could mean:
    </p>
    <ul class="mt-2 space-y-1 text-sm text-muted">
      <li>• The algorithm hasn't run yet</li>
      <li>• You weren't matched with other participants</li>
      <li>• No suitable trade chains were possible with your submissions</li>
    </ul>
  </div>
{:else}
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h3 class="text-xl font-semibold text-primary">
        Your Matches ({myMatches.length})
      </h3>
    </div>

    {#each Object.entries(matchesByChain()) as [chainId, chainMatches]}
      <div class="rounded-lg border border-subtle bg-surface-card p-6">
        <div class="mb-4 flex items-center justify-between">
          <h4 class="font-semibold text-primary">Trade Chain {chainId.split('_').pop()}</h4>
          <span class="text-sm text-muted">{chainMatches.length} trades in chain</span>
        </div>

        <!-- Trade Chain Visualization -->
        <TradeChainDiagram matches={chainMatches} currentUserId={$currentUser?.id || ''} />

        <!-- Detailed Match Cards -->
        <div class="mt-6 space-y-4">
          {#each chainMatches as match}
            {@const isGiving = match.giving_user === $currentUser?.id}
            {@const isReceiving = match.receiving_user === $currentUser?.id}
            {@const myRole = isGiving ? 'giving' : isReceiving ? 'receiving' : null}

            {#if myRole}
              <div
                class="rounded-lg border border-subtle bg-surface-body p-4 {myRole === 'giving' ? 'border-l-4 border-l-orange-500' : 'border-l-4 border-l-emerald-500'}"
              >
                <div class="mb-3 flex items-center justify-between">
                  <span class="text-sm font-medium text-primary">
                    {myRole === 'giving' ? '📤 You are sending' : '📥 You are receiving'}
                  </span>
                  <span class="rounded-full px-3 py-1 text-xs font-semibold {getStatusColor(match.status)}">
                    {match.status}
                  </span>
                </div>

                <div class="grid gap-4 md:grid-cols-2">
                  <!-- Sending -->
                  {#if myRole === 'giving'}
                    <div>
                      <p class="mb-1 text-xs text-muted">You're sending:</p>
                      <p class="font-semibold text-primary">
                        {match.expand?.giving_submission?.title || 'Unknown'}
                      </p>
                      <p class="text-xs text-secondary">
                        To: {match.expand?.receiving_user?.display_name || match.expand?.receiving_user?.username || 'Unknown'}
                      </p>
                    </div>
                  {/if}

                  <!-- Receiving -->
                  {#if myRole === 'receiving'}
                    <div>
                      <p class="mb-1 text-xs text-muted">You're receiving:</p>
                      <p class="font-semibold text-primary">
                        {match.expand?.receiving_submission?.title || 'Unknown'}
                      </p>
                      <p class="text-xs text-secondary">
                        From: {match.expand?.giving_user?.display_name || match.expand?.giving_user?.username || 'Unknown'}
                      </p>
                    </div>
                  {/if}
                </div>

                {#if match.tracking_number}
                  <div class="mt-3 rounded border border-subtle bg-surface-card p-2">
                    <p class="text-xs text-muted">Tracking: <span class="font-mono text-primary">{match.tracking_number}</span></p>
                  </div>
                {/if}

                <!-- Status Actions -->
                <div class="mt-4 flex gap-2">
                  {#if myRole === 'giving' && match.status === 'pending'}
                    <button
                      onclick={() => handleMarkShipped(match.id)}
                      class="rounded-lg border border-accent bg-accent px-4 py-2 text-sm font-semibold text-surface-body transition hover:bg-accent/90"
                      title="Mark this game as shipped to the recipient"
                    >
                      Mark as Shipped
                    </button>
                    <p class="flex items-center text-xs text-muted">
                      💡 Ship your game to complete your part of the trade
                    </p>
                  {/if}

                  {#if myRole === 'receiving' && match.status === 'shipping'}
                    <button
                      onclick={() => handleMarkReceived(match.id)}
                      class="rounded-lg border border-emerald-500 bg-emerald-500 px-4 py-2 text-sm font-semibold text-surface-body transition hover:bg-emerald-500/90"
                      title="Confirm you have received this game"
                    >
                      Mark as Received
                    </button>
                    <p class="flex items-center text-xs text-muted">
                      📦 Game is on its way to you!
                    </p>
                  {/if}

                  {#if myRole === 'receiving' && match.status === 'pending'}
                    <p class="flex items-center text-xs text-muted">
                      ⏳ Waiting for sender to ship...
                    </p>
                  {/if}

                  {#if match.status === 'completed'}
                    <div class="flex items-center gap-2 text-sm text-emerald-200">
                      <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fill-rule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clip-rule="evenodd"
                        />
                      </svg>
                      <span>Trade Complete!</span>
                    </div>
                  {/if}
                </div>
              </div>
            {/if}
          {/each}
        </div>
      </div>
    {/each}
  </div>
{/if}
