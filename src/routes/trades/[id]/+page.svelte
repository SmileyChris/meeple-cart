<script lang="ts">
  import type { PageData } from './$types';
  import { pb, currentUser } from '$lib/pocketbase';
  import { invalidate } from '$app/navigation';
  import type { TradeRecord, UserRecord } from '$lib/types/pocketbase';
  import type { ListingRecord } from '$lib/types/listing';

  export let data: PageData;

  let trade = data.trade as TradeRecord;
  let listing = trade.expand?.listing as ListingRecord;
  let buyer = trade.expand?.buyer as UserRecord;
  let seller = trade.expand?.seller as UserRecord;

  $: isBuyer = $currentUser?.id === trade.buyer;
  $: isSeller = $currentUser?.id === trade.seller;
  $: otherParty = isBuyer ? seller : buyer;

  let actionError: string | null = null;
  let processing = false;

  const statusLabels: Record<string, string> = {
    initiated: 'Initiated',
    confirmed: 'Confirmed',
    completed: 'Completed',
    disputed: 'Disputed',
  };

  const statusColors: Record<string, string> = {
    initiated: 'border-amber-500/80 bg-amber-500/10 text-amber-200',
    confirmed: 'border-sky-500/80 bg-sky-500/10 text-sky-200',
    completed: 'border-emerald-500/80 bg-emerald-500/10 text-emerald-200',
    disputed: 'border-rose-500/80 bg-rose-500/10 text-rose-200',
  };

  async function updateTradeStatus(newStatus: string) {
    actionError = null;
    processing = true;

    try {
      const updatedTrade = await pb.collection('trades').update<TradeRecord>(trade.id, {
        status: newStatus,
      });

      // If completing trade, update listing and increment trade counts
      if (newStatus === 'completed') {
        await completeTradeFlow();
      }

      trade = updatedTrade;
      await invalidate('app:trade');
    } catch (err) {
      console.error('Failed to update trade status', err);
      actionError = 'Failed to update trade. Please try again.';
    } finally {
      processing = false;
    }
  }

  async function completeTradeFlow() {
    try {
      // Update listing status
      await pb.collection('listings').update(listing.id, {
        status: 'completed',
      });

      // Update all games in listing to sold
      const games = await pb.collection('games').getFullList({
        filter: `listing = "${listing.id}"`,
      });

      for (const game of games) {
        await pb.collection('games').update(game.id, {
          status: 'sold',
        });
      }

      // Increment trade counts for both users
      await pb.collection('users').update(buyer.id, {
        trade_count: buyer.trade_count + 1,
      });

      await pb.collection('users').update(seller.id, {
        trade_count: seller.trade_count + 1,
      });

      // Send completion notifications
      await pb.collection('notifications').create({
        user: buyer.id,
        type: 'new_message',
        title: 'Trade completed!',
        message: `Your trade with ${seller.display_name} for "${listing.title}" is complete.`,
        link: `/trades/${trade.id}`,
        read: false,
      });

      await pb.collection('notifications').create({
        user: seller.id,
        type: 'new_message',
        title: 'Trade completed!',
        message: `Your trade with ${buyer.display_name} for "${listing.title}" is complete.`,
        link: `/trades/${trade.id}`,
        read: false,
      });
    } catch (err) {
      console.error('Failed to complete trade flow', err);
      throw err;
    }
  }

  function handleConfirmReceipt() {
    updateTradeStatus('confirmed');
  }

  function handleMarkShipped() {
    updateTradeStatus('confirmed');
  }

  function handleCompleteTrade() {
    updateTradeStatus('completed');
  }

  function handleDisputeTrade() {
    updateTradeStatus('disputed');
  }

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat('en-NZ', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
</script>

<svelte:head>
  <title>Trade with {otherParty.display_name} · Meeple Cart</title>
</svelte:head>

<main class="bg-surface-body transition-colors px-6 py-12 text-primary sm:px-8">
  <div class="mx-auto max-w-4xl space-y-8">
    <nav class="flex items-center text-sm text-muted">
      <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
      <a class="hover:text-emerald-300" href="/trades">My Trades</a>
      <span class="px-2">/</span>
      <span>Trade Details</span>
    </nav>

    <header class="space-y-4">
      <div class="flex items-start justify-between">
        <div>
          <h1 class="text-3xl font-semibold tracking-tight text-primary">
            Trade with {otherParty.display_name}
          </h1>
          <p class="mt-2 text-sm text-muted">
            Initiated {formatDate(trade.created)}
          </p>
        </div>
        <span
          class={`inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-semibold ${statusColors[trade.status]}`}
        >
          {statusLabels[trade.status]}
        </span>
      </div>
    </header>

    <!-- Trade Progress Timeline -->
    <section
      class="rounded-xl border border-subtle bg-surface-card transition-colors p-6"
    >
      <h2 class="text-xl font-semibold text-primary mb-4">Trade Progress</h2>
      <ol class="space-y-3 text-sm">
        <li
          class={`flex items-center gap-3 ${trade.status === 'initiated' || trade.status === 'confirmed' || trade.status === 'completed' ? 'text-emerald-300' : 'text-muted'}`}
        >
          <span
            class={`flex h-8 w-8 items-center justify-center rounded-full border ${trade.status === 'initiated' || trade.status === 'confirmed' || trade.status === 'completed' ? 'border-emerald-500 bg-emerald-500/20' : 'border-subtle bg-surface-panel'}`}
          >
            {#if trade.status === 'initiated' || trade.status === 'confirmed' || trade.status === 'completed'}
              ✓
            {:else}
              1
            {/if}
          </span>
          <span>Trade initiated - {formatDate(trade.created)}</span>
        </li>

        <li
          class={`flex items-center gap-3 ${trade.status === 'confirmed' || trade.status === 'completed' ? 'text-emerald-300' : 'text-muted'}`}
        >
          <span
            class={`flex h-8 w-8 items-center justify-center rounded-full border ${trade.status === 'confirmed' || trade.status === 'completed' ? 'border-emerald-500 bg-emerald-500/20' : 'border-subtle bg-surface-panel'}`}
          >
            {#if trade.status === 'confirmed' || trade.status === 'completed'}
              ✓
            {:else}
              2
            {/if}
          </span>
          <span>Seller confirmed - {trade.status === 'confirmed' || trade.status === 'completed' ? formatDate(trade.updated) : 'Pending'}</span>
        </li>

        <li
          class={`flex items-center gap-3 ${trade.status === 'completed' ? 'text-emerald-300' : 'text-muted'}`}
        >
          <span
            class={`flex h-8 w-8 items-center justify-center rounded-full border ${trade.status === 'completed' ? 'border-emerald-500 bg-emerald-500/20' : 'border-subtle bg-surface-panel'}`}
          >
            {#if trade.status === 'completed'}
              ✓
            {:else}
              3
            {/if}
          </span>
          <span>Trade completed - {trade.status === 'completed' && trade.completed_date ? formatDate(trade.completed_date) : 'Pending'}</span>
        </li>
      </ol>
    </section>

    <!-- Listing Details -->
    <section
      class="rounded-xl border border-subtle bg-surface-card transition-colors p-6"
    >
      <h2 class="text-xl font-semibold text-primary mb-4">Listing</h2>
      <div class="flex gap-4">
        <div class="flex-1">
          <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
          <a
            href={`/listings/${listing.id}`}
            class="text-lg font-semibold text-emerald-300 hover:text-emerald-200 transition"
          >
            {listing.title}
          </a>
          <p class="mt-1 text-sm text-muted">
            Listed by {seller.display_name}
          </p>
        </div>
      </div>
    </section>

    <!-- Action Buttons -->
    <section
      class="rounded-xl border border-subtle bg-surface-card transition-colors p-6 space-y-4"
    >
      <h2 class="text-xl font-semibold text-primary">Actions</h2>

      {#if actionError}
        <div class="rounded-lg bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          {actionError}
        </div>
      {/if}

      <div class="flex flex-wrap gap-3">
        {#if isSeller && trade.status === 'initiated'}
          <button
            on:click={handleMarkShipped}
            disabled={processing}
            class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? 'Processing...' : 'Confirm & Mark as Shipped'}
          </button>
        {/if}

        {#if isBuyer && trade.status === 'confirmed'}
          <button
            on:click={handleConfirmReceipt}
            disabled={processing}
            class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? 'Processing...' : 'Confirm Receipt'}
          </button>
        {/if}

        {#if trade.status === 'confirmed'}
          <button
            on:click={handleCompleteTrade}
            disabled={processing}
            class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? 'Processing...' : '✓ Complete Trade'}
          </button>
        {/if}

        {#if trade.status !== 'completed' && trade.status !== 'disputed'}
          <button
            on:click={handleDisputeTrade}
            disabled={processing}
            class="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? 'Processing...' : 'Report Issue'}
          </button>
        {/if}
      </div>

      <p class="text-xs text-muted">
        Both parties must confirm the trade is complete before it's finalized.
      </p>
    </section>

    <!-- Trader Info -->
    <section
      class="rounded-xl border border-subtle bg-surface-card transition-colors p-6 space-y-4"
    >
      <h2 class="text-xl font-semibold text-primary">Trading Partner</h2>
      <div class="flex items-center justify-between">
        <div>
          <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
          <a
            href={`/users/${otherParty.id}`}
            class="text-lg font-semibold text-emerald-300 hover:text-emerald-200 transition"
          >
            {otherParty.display_name}
          </a>
          <p class="text-sm text-muted">
            {otherParty.trade_count} trades · {otherParty.vouch_count} vouches
          </p>
        </div>
        <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
        <a href={`/messages`} class="btn-secondary">
          💬 Message
        </a>
      </div>
    </section>
  </div>
</main>
