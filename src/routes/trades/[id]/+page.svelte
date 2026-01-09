<script lang="ts">
  import type { PageData } from './$types';
  import { pb, currentUser } from '$lib/pocketbase';
  import { invalidate } from '$app/navigation';
  import type { TradeRecord, UserRecord } from '$lib/types/pocketbase';
  import type { ListingRecord } from '$lib/types/listing';
  import { logStatusChange } from '$lib/utils/listing-status';
  import Alert from '$lib/components/Alert.svelte';

  let { data }: { data: PageData } = $props();

  let trade = $state(data.trade as TradeRecord);
  let listing = $derived(trade.expand?.listing as ListingRecord);
  let buyer = $derived(trade.expand?.buyer as UserRecord);
  let seller = $derived(trade.expand?.seller as UserRecord);
  let hasVouched = $state(data.hasVouched);

  let isBuyer = $derived($currentUser?.id === trade.buyer);
  let isSeller = $derived($currentUser?.id === trade.seller);
  let otherParty = $derived(isBuyer ? seller : buyer);

  let actionError = $state<string | null>(null);
  let processing = $state(false);
  let showFeedbackForm = $state(false);
  let feedbackRating = $state(5);
  let feedbackReview = $state('');
  let feedbackError = $state<string | null>(null);
  let submittingFeedback = $state(false);

  let showVouchForm = $state(false);
  let vouchMessage = $state('');
  let vouchError = $state<string | null>(null);
  let submittingVouch = $state(false);

  let trackingNumber = $state(trade.tracking_number || '');
  let showTrackingInput = $state(false);

  const statusLabels: Record<string, string> = {
    initiated: 'Offer Pending',
    accepted: 'Accepted',
    shipped: 'Shipped',
    received: 'Received',
    completed: 'Completed',
    disputed: 'Disputed',
    cancelled: 'Cancelled',
  };

  const statusColors: Record<string, string> = {
    initiated: 'border-amber-500/80 bg-amber-500/10 text-badge-amber',
    accepted: 'border-sky-500/80 bg-sky-500/10 text-badge-sky',
    shipped: 'border-blue-500/80 bg-blue-500/10 text-badge-blue',
    received: 'border-indigo-500/80 bg-indigo-500/10 text-badge-indigo',
    completed: 'border-emerald-500/80 bg-emerald-500/10 text-badge-emerald',
    disputed: 'border-rose-500/80 bg-rose-500/10 text-badge-rose',
    cancelled: 'border-slate-500/80 bg-slate-500/10 text-slate-400',
  };

  async function updateTradeStatus(newStatus: string) {
    actionError = null;
    processing = true;

    try {
      const data: Partial<TradeRecord> = { status: newStatus };
      if (newStatus === 'shipped') {
        data.shipped_at = new Date().toISOString();
        data.tracking_number = trackingNumber.trim() || undefined;
      } else if (newStatus === 'received') {
        data.received_at = new Date().toISOString();
      }

      const updatedTrade = await pb.collection('trades').update<TradeRecord>(trade.id, data);

      // If completing trade, update listing and increment trade counts
      if (newStatus === 'completed') {
        await completeTradeFlow();
      }

      // Send notifications based on status change
      await sendStatusNotification(newStatus);

      trade = updatedTrade;
      await invalidate('app:trade');
    } catch (err) {
      console.error('Failed to update trade status', err);
      actionError = 'Failed to update trade. Please try again.';
    } finally {
      processing = false;
    }
  }

  async function sendStatusNotification(status: string) {
    let title = '';
    let message = '';
    let type = 'new_message';
    let recipientId = '';

    switch (status) {
      case 'shipped':
        title = 'Trade shipped!';
        message = `${seller.display_name} has marked the items as shipped for "${listing.title}"`;
        if (trackingNumber.trim()) message += `. Tracking: ${trackingNumber.trim()}`;
        type = 'trade_shipped';
        recipientId = buyer.id;
        break;
      case 'received':
        title = 'Items received!';
        message = `${buyer.display_name} confirmed they received the items for "${listing.title}"`;
        type = 'trade_received';
        recipientId = seller.id;
        break;
      case 'completed':
        title = 'Trade completed!';
        message = `Your trade for "${listing.title}" is officially complete!`;
        type = 'trade_completed';
        // We notify both in completeTradeFlow
        return;
      case 'disputed':
        title = 'Trade disputed';
        message = `${$currentUser?.display_name} reported an issue with the trade for "${listing.title}"`;
        type = 'new_message';
        recipientId = otherParty.id;
        break;
      default:
        return;
    }

    if (recipientId) {
      await pb.collection('notifications').create({
        user: recipientId,
        type,
        title,
        message,
        link: `/trades/${trade.id}`,
        read: false,
      });
    }
  }

  async function completeTradeFlow() {
    try {
      // Update listing status
      const oldStatus = listing.status;
      await pb.collection('listings').update(listing.id, {
        status: 'completed',
      });

      // Update trade with completed date
      await pb.collection('trades').update(trade.id, {
        completed_date: new Date().toISOString(),
      });

      // Log status change
      await logStatusChange(
        listing.id,
        oldStatus,
        'completed',
        'Trade completed',
        $currentUser!.id
      );

      // Mark seller items as sold
      if (trade.seller_items && trade.seller_items.length > 0) {
        for (const itemId of trade.seller_items) {
          await pb.collection('items').update(itemId, {
            status: 'sold',
          });
        }
      } else {
        // Legacy: mark all games as sold if no specific items selected
        const items = await pb.collection('items').getFullList({
          filter: `listing = "${listing.id}"`,
        });

        for (const item of items) {
          await pb.collection('items').update(item.id, {
            status: 'sold',
          });
        }
      }

      // Mark buyer items as sold if any
      if (trade.buyer_items && trade.buyer_items.length > 0) {
        for (const itemId of trade.buyer_items) {
          await pb
            .collection('items')
            .update(itemId, {
              status: 'sold',
            })
            .catch((err) => console.warn(`Failed to mark buyer item ${itemId} as sold`, err));
        }
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
        type: 'trade_completed',
        title: 'Trade completed!',
        message: `Your trade with ${seller.display_name} for "${listing.title}" is complete.`,
        link: `/trades/${trade.id}`,
        read: false,
      });

      await pb.collection('notifications').create({
        user: seller.id,
        type: 'trade_completed',
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
    updateTradeStatus('received');
  }

  function handleMarkShipped() {
    if (listing.shipping_available && !trackingNumber.trim() && !showTrackingInput) {
      showTrackingInput = true;
      return;
    }
    updateTradeStatus('shipped');
  }

  function handleCompleteTrade() {
    updateTradeStatus('completed');
  }

  function handleDisputeTrade() {
    updateTradeStatus('disputed');
  }

  async function handleCancelTrade() {
    if (!confirm('Are you sure you want to cancel this trade? This action cannot be undone.')) {
      return;
    }

    actionError = null;
    processing = true;

    try {
      // Update trade status to cancelled
      const updatedTrade = await pb.collection('trades').update<TradeRecord>(trade.id, {
        status: 'cancelled',
      });

      // Revert listing status back to active
      await pb.collection('listings').update(listing.id, {
        status: 'active',
      });

      // Log status change
      await logStatusChange(
        listing.id,
        listing.status,
        'active',
        'Trade cancelled - listing reopened',
        $currentUser!.id
      );

      // Send notification to other party
      await pb.collection('notifications').create({
        user: otherParty.id,
        type: 'trade_cancelled',
        title: 'Trade cancelled',
        message: `${$currentUser?.display_name} cancelled the trade for "${listing.title}"`,
        link: `/listings/${listing.id}`,
        read: false,
      });

      trade = updatedTrade;
      await invalidate('app:trade');
    } catch (err) {
      console.error('Failed to cancel trade', err);
      actionError = 'Failed to cancel trade. Please try again.';
    } finally {
      processing = false;
    }
  }

  async function handleSubmitFeedback(e: Event) {
    e.preventDefault();
    feedbackError = null;

    if (!feedbackRating || feedbackRating < 1 || feedbackRating > 5) {
      feedbackError = 'Please select a valid rating';
      return;
    }

    submittingFeedback = true;
    try {
      // Update trade with rating and review
      const updatedTrade = await pb.collection('trades').update<TradeRecord>(trade.id, {
        rating: feedbackRating,
        review: feedbackReview.trim() || null,
      });

      trade = updatedTrade;
      showFeedbackForm = false;
      feedbackReview = '';
      await invalidate('app:trade');

      // Notify the other party
      await pb.collection('notifications').create({
        user: otherParty.id,
        type: 'trade_completed',
        title: 'Received feedback',
        message: `${$currentUser?.display_name} left you a ${feedbackRating}-star review`,
        link: `/trades/${trade.id}`,
        read: false,
      });
    } catch (err) {
      console.error('Failed to submit feedback', err);
      feedbackError = 'Failed to submit feedback. Please try again.';
    } finally {
      submittingFeedback = false;
    }
  }

  async function handleSubmitVouch(e: Event) {
    e.preventDefault();
    vouchError = null;

    submittingVouch = true;
    try {
      // Create vouch record
      await pb.collection('vouches').create({
        voucher: $currentUser!.id,
        vouchee: otherParty.id,
        message: vouchMessage.trim() || '',
      });

      // Increment vouchee's vouch_count
      await pb.collection('users').update(otherParty.id, {
        vouch_count: otherParty.vouch_count + 1,
      });

      // Send notification
      await pb.collection('notifications').create({
        user: otherParty.id,
        type: 'vouch_received',
        title: `${$currentUser?.display_name} vouched for you!`,
        message: vouchMessage.trim() || 'New vouch from a trading partner',
        link: `/users/${$currentUser!.id}`,
        read: false,
      });

      hasVouched = true;
      showVouchForm = false;
      vouchMessage = '';
    } catch (err) {
      console.error('Failed to submit vouch', err);
      vouchError = 'Failed to submit vouch. Please try again.';
    } finally {
      submittingVouch = false;
    }
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
    <section class="rounded-xl border border-subtle bg-surface-card transition-colors p-6">
      <h2 class="text-xl font-semibold text-primary mb-4">Trade Progress</h2>
      <ol class="space-y-4 text-sm">
        <!-- 1. Accepted -->
        <li
          class={`flex items-center gap-3 ${['accepted', 'shipped', 'received', 'completed'].includes(trade.status) ? 'text-emerald-300' : 'text-muted'}`}
        >
          <span
            class={`flex h-8 w-8 items-center justify-center rounded-full border ${['accepted', 'shipped', 'received', 'completed'].includes(trade.status) ? 'border-emerald-500 bg-emerald-500/20' : 'border-subtle bg-surface-panel'}`}
          >
            {['accepted', 'shipped', 'received', 'completed'].includes(trade.status) ? '✓' : '1'}
          </span>
          <div class="flex flex-col">
            <span class="font-medium">Offer Accepted</span>
            {#if trade.updated && trade.status !== 'initiated'}
              <span class="text-xs opacity-70">{formatDate(trade.updated)}</span>
            {/if}
          </div>
        </li>

        <!-- 2. Shipped -->
        <li
          class={`flex items-center gap-3 ${['shipped', 'received', 'completed'].includes(trade.status) ? 'text-emerald-300' : 'text-muted'}`}
        >
          <span
            class={`flex h-8 w-8 items-center justify-center rounded-full border ${['shipped', 'received', 'completed'].includes(trade.status) ? 'border-emerald-500 bg-emerald-500/20' : 'border-subtle bg-surface-panel'}`}
          >
            {['shipped', 'received', 'completed'].includes(trade.status) ? '✓' : '2'}
          </span>
          <div class="flex flex-col">
            <span class="font-medium">Items Shipped / Handed Over</span>
            {#if trade.shipped_at}
              <span class="text-xs opacity-70">{formatDate(trade.shipped_at)}</span>
              {#if trade.tracking_number}
                <span class="text-xs font-mono bg-surface-panel px-1 rounded mt-1"
                  >Track: {trade.tracking_number}</span
                >
              {/if}
            {/if}
          </div>
        </li>

        <!-- 3. Received -->
        <li
          class={`flex items-center gap-3 ${['received', 'completed'].includes(trade.status) ? 'text-emerald-300' : 'text-muted'}`}
        >
          <span
            class={`flex h-8 w-8 items-center justify-center rounded-full border ${['received', 'completed'].includes(trade.status) ? 'border-emerald-500 bg-emerald-500/20' : 'border-subtle bg-surface-panel'}`}
          >
            {['received', 'completed'].includes(trade.status) ? '✓' : '3'}
          </span>
          <div class="flex flex-col">
            <span class="font-medium">Receipt Confirmed</span>
            {#if trade.received_at}
              <span class="text-xs opacity-70">{formatDate(trade.received_at)}</span>
            {/if}
          </div>
        </li>

        <!-- 4. Completed -->
        <li
          class={`flex items-center gap-3 ${trade.status === 'completed' ? 'text-emerald-300' : 'text-muted'}`}
        >
          <span
            class={`flex h-8 w-8 items-center justify-center rounded-full border ${trade.status === 'completed' ? 'border-emerald-500 bg-emerald-500/20' : 'border-subtle bg-surface-panel'}`}
          >
            {trade.status === 'completed' ? '✓' : '4'}
          </span>
          <div class="flex flex-col">
            <span class="font-medium">Trade Completed</span>
            {#if trade.status === 'completed' && trade.completed_date}
              <span class="text-xs opacity-70">{formatDate(trade.completed_date)}</span>
            {/if}
          </div>
        </li>
      </ol>
    </section>

    <!-- Listing Details -->
    <section class="rounded-xl border border-subtle bg-surface-card transition-colors p-6">
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

    <!-- Trade Details -->
    <section
      class="rounded-xl border border-subtle bg-surface-card transition-colors p-6 space-y-4"
    >
      <h2 class="text-xl font-semibold text-primary">Trade Details</h2>

      <!-- Delivery Method -->
      {#if trade.delivery_method}
        <div>
          <h3 class="text-sm font-semibold text-secondary mb-2">Delivery</h3>
          <div class="flex items-center gap-2 text-sm text-secondary">
            {#if trade.delivery_method === 'in_person'}
              <span class="rounded-full bg-emerald-500/20 px-3 py-1 font-medium text-badge-emerald">
                🤝 Meet up
              </span>
            {:else if trade.delivery_method === 'post'}
              <span class="rounded-full bg-blue-500/20 px-3 py-1 font-medium text-badge-blue">
                📬 Post
              </span>
            {:else if trade.delivery_method === 'either'}
              <span class="rounded-full bg-slate-500/20 px-3 py-1 font-medium text-slate-300">
                Either
              </span>
            {/if}
          </div>
        </div>
      {/if}
      <!-- Items being traded -->
      <div class="grid gap-6 md:grid-cols-2">
        <!-- Selected Items from Seller -->
        {#if trade.seller_items && trade.seller_items.length > 0}
          <div>
            <h3 class="text-sm font-semibold text-secondary mb-2">
              Items from {seller.display_name} ({trade.seller_items.length})
            </h3>
            <div class="space-y-2">
              {#if trade.expand?.seller_items}
                {#each trade.expand.seller_items as item}
                  <div class="rounded-lg border border-subtle bg-surface-body p-3 text-sm">
                    <div class="font-medium text-primary">{item.title}</div>
                    <div class="mt-1 text-xs text-muted">
                      {item.condition}
                      {#if item.price}
                        · ${item.price}
                      {:else if item.trade_value}
                        · Value: ${item.trade_value}
                      {/if}
                    </div>
                  </div>
                {/each}
              {:else}
                <p class="text-sm text-muted">{trade.seller_items.length} item(s) selected</p>
              {/if}
            </div>
          </div>
        {:else}
          <div>
            <h3 class="text-sm font-semibold text-secondary mb-2">Items</h3>
            <p class="text-sm text-muted">All items in the listing</p>
          </div>
        {/if}

        <!-- Items from Buyer -->
        {#if trade.buyer_items && trade.buyer_items.length > 0}
          <div>
            <h3 class="text-sm font-semibold text-secondary mb-2">
              Items from {buyer.display_name} ({trade.buyer_items.length})
            </h3>
            <div class="space-y-2">
              {#if trade.expand?.buyer_items}
                {#each trade.expand.buyer_items as item}
                  <div class="rounded-lg border border-subtle bg-surface-body p-3 text-sm">
                    <div class="font-medium text-primary">{item.title}</div>
                    <div class="mt-1 text-xs text-muted">
                      {item.condition}
                    </div>
                  </div>
                {/each}
              {:else}
                <p class="text-sm text-muted">{trade.buyer_items.length} item(s) selected</p>
              {/if}
            </div>
          </div>
        {/if}
      </div>

      <!-- Cash Amount -->
      {#if trade.buyer_cash_amount}
        <div class="border-t border-subtle pt-4">
          <h3 class="text-sm font-semibold text-secondary mb-1">Cash Offer</h3>
          <p class="text-lg font-bold text-emerald-400">
            ${(trade.buyer_cash_amount / 100).toFixed(2)}
          </p>
        </div>
      {/if}

      <!-- Buyer's Notes/Description -->
      {#if trade.buyer_items_description}
        <div class="border-t border-subtle pt-4">
          <h3 class="text-sm font-semibold text-secondary mb-2">Offer Details</h3>
          <p
            class="text-sm text-secondary whitespace-pre-line bg-surface-body p-3 rounded-lg border border-subtle"
          >
            {trade.buyer_items_description}
          </p>
        </div>
      {/if}

      <!-- Offer Message -->
      {#if trade.offer_message}
        <div class="border-t border-subtle pt-4">
          <h3 class="text-sm font-semibold text-secondary mb-2">Message</h3>
          <p class="text-sm text-muted italic">
            "{trade.offer_message}"
          </p>
        </div>
      {/if}
    </section>

    <!-- Action Buttons -->
    <section
      class="rounded-xl border border-subtle bg-surface-card transition-colors p-6 space-y-4"
    >
      <h2 class="text-xl font-semibold text-primary">Actions</h2>

      {#if actionError}
        <Alert type="error">{actionError}</Alert>
      {/if}

      <div class="flex flex-col gap-4">
        {#if showTrackingInput}
          <div class="space-y-2 rounded-lg bg-surface-panel p-4 border border-subtle">
            <label for="tracking" class="block text-sm font-medium text-secondary">
              Tracking Number (optional)
            </label>
            <input
              id="tracking"
              type="text"
              bind:value={trackingNumber}
              placeholder="e.g. NZ Post 12345678"
              class="w-full rounded-lg border border-subtle bg-surface-card px-3 py-2 text-primary focus:border-emerald-500 focus:outline-none"
            />
            <div class="flex gap-2">
              <button onclick={handleMarkShipped} disabled={processing} class="btn-primary">
                Confirm Dispatch
              </button>
              <button onclick={() => (showTrackingInput = false)} class="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        {/if}

        <div class="flex flex-wrap gap-3">
          {#if isSeller && trade.status === 'accepted'}
            <button
              onclick={handleMarkShipped}
              disabled={processing || showTrackingInput}
              class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Processing...' : 'Mark as Shipped'}
            </button>
          {/if}

          {#if isBuyer && trade.status === 'shipped'}
            <button
              onclick={handleConfirmReceipt}
              disabled={processing}
              class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Processing...' : 'Confirm Receipt'}
            </button>
          {/if}

          {#if trade.status === 'received'}
            <button
              onclick={handleCompleteTrade}
              disabled={processing}
              class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Processing...' : '✓ Complete Trade'}
            </button>
          {/if}

          {#if !['completed', 'disputed', 'cancelled'].includes(trade.status)}
            <button
              onclick={handleDisputeTrade}
              disabled={processing}
              class="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Processing...' : 'Report Issue'}
            </button>
          {/if}

          {#if trade.status !== 'completed' && trade.status !== 'cancelled'}
            <button
              onclick={handleCancelTrade}
              disabled={processing}
              class="rounded-lg border border-slate-500 bg-slate-500/10 px-4 py-2 font-semibold text-slate-300 transition hover:bg-slate-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processing ? 'Processing...' : 'Cancel Trade'}
            </button>
          {/if}
        </div>

        <p class="text-xs text-muted">
          Both parties must confirm the trade is complete before it's finalized.
        </p>
      </div>
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
        <a href={`/messages`} class="btn-secondary"> 💬 Message </a>
      </div>
    </section>

    <!-- Feedback Form (shown after trade completion if no rating given yet) -->
    {#if trade.status === 'completed' && !trade.rating}
      <section
        class="rounded-xl border border-emerald-500/50 bg-surface-card transition-colors p-6 space-y-4"
      >
        <div class="flex items-start justify-between">
          <div>
            <h2 class="text-xl font-semibold text-primary">How was your experience?</h2>
            <p class="mt-1 text-sm text-muted">
              Help others by sharing your feedback about this trade
            </p>
          </div>
          {#if !showFeedbackForm}
            <button type="button" onclick={() => (showFeedbackForm = true)} class="btn-primary">
              Leave Feedback
            </button>
          {/if}
        </div>

        {#if showFeedbackForm}
          <form onsubmit={handleSubmitFeedback} class="space-y-4 border-t border-subtle pt-4">
            <!-- Rating -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-secondary" for="rating"> Rating </label>
              <div class="flex gap-2">
                {#each [1, 2, 3, 4, 5] as star}
                  <button
                    type="button"
                    onclick={() => (feedbackRating = star)}
                    class={`h-12 w-12 rounded-lg border transition ${
                      feedbackRating >= star
                        ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                        : 'border-subtle bg-surface-panel text-muted hover:border-amber-500/50'
                    }`}
                  >
                    ⭐
                  </button>
                {/each}
              </div>
              <p class="text-xs text-muted">
                {#if feedbackRating === 1}
                  Poor
                {:else if feedbackRating === 2}
                  Fair
                {:else if feedbackRating === 3}
                  Good
                {:else if feedbackRating === 4}
                  Very Good
                {:else}
                  Excellent
                {/if}
              </p>
            </div>

            <!-- Review -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-secondary" for="review">
                Review (optional)
              </label>
              <textarea
                id="review"
                bind:value={feedbackReview}
                placeholder="Share details about your trading experience..."
                maxlength="2000"
                rows="4"
                disabled={submittingFeedback}
                class="w-full resize-none rounded-lg border border-subtle bg-surface-panel px-3 py-2 text-primary placeholder-slate-500 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/35"
              ></textarea>
              <p class="text-xs text-muted">{feedbackReview.length} / 2000 characters</p>
            </div>

            {#if feedbackError}
              <Alert type="error">{feedbackError}</Alert>
            {/if}

            <div class="flex gap-3">
              <button
                type="submit"
                disabled={submittingFeedback}
                class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
              </button>
              <button
                type="button"
                onclick={() => {
                  showFeedbackForm = false;
                  feedbackError = null;
                }}
                disabled={submittingFeedback}
                class="btn-secondary disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        {/if}
      </section>
    {/if}

    <!-- Show existing feedback if already given -->
    {#if trade.rating}
      <section
        class="rounded-xl border border-subtle bg-surface-card transition-colors p-6 space-y-3"
      >
        <h2 class="text-xl font-semibold text-primary">Your Feedback</h2>
        <div class="flex items-center gap-2">
          <div class="flex gap-1">
            {#each [1, 2, 3, 4, 5] as star}
              <span class={star <= trade.rating ? 'text-amber-300' : 'text-muted'}>⭐</span>
            {/each}
          </div>
          <span class="text-sm text-secondary">
            {trade.rating} out of 5
          </span>
        </div>
        {#if trade.review}
          <p class="text-sm text-secondary whitespace-pre-line">{trade.review}</p>
        {/if}
      </section>
    {/if}

    <!-- Vouch Prompt (shown after trade completion if not already vouched) -->
    {#if trade.status === 'completed' && !hasVouched}
      <section
        class="rounded-xl border border-emerald-500/50 bg-surface-card transition-colors p-6 space-y-4"
      >
        <div class="flex items-start justify-between">
          <div>
            <h2 class="text-xl font-semibold text-primary">Vouch for {otherParty.display_name}?</h2>
            <p class="mt-1 text-sm text-muted">
              Vouching builds community trust and helps others trade confidently
            </p>
          </div>
          {#if !showVouchForm}
            <button type="button" onclick={() => (showVouchForm = true)} class="btn-primary">
              ✓ Vouch
            </button>
          {/if}
        </div>

        {#if showVouchForm}
          <form onsubmit={handleSubmitVouch} class="space-y-4 border-t border-subtle pt-4">
            <!-- Vouch Message -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-secondary" for="vouch-message">
                Testimonial (optional)
              </label>
              <textarea
                id="vouch-message"
                bind:value={vouchMessage}
                placeholder="Share what made this a great trade..."
                maxlength="1000"
                rows="3"
                disabled={submittingVouch}
                class="w-full resize-none rounded-lg border border-subtle bg-surface-panel px-3 py-2 text-primary placeholder-slate-500 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/35"
              ></textarea>
              <p class="text-xs text-muted">{vouchMessage.length} / 1000 characters</p>
            </div>

            {#if vouchError}
              <Alert type="error">{vouchError}</Alert>
            {/if}

            <div class="flex gap-3">
              <button
                type="submit"
                disabled={submittingVouch}
                class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingVouch ? 'Submitting...' : 'Submit Vouch'}
              </button>
              <button
                type="button"
                onclick={() => {
                  showVouchForm = false;
                  vouchError = null;
                }}
                disabled={submittingVouch}
                class="btn-secondary disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        {/if}
      </section>
    {/if}

    <!-- Show if already vouched -->
    {#if hasVouched}
      <section class="rounded-xl border border-subtle bg-surface-card transition-colors p-6">
        <div class="flex items-center gap-2 text-emerald-300">
          <span class="text-2xl">✓</span>
          <span class="text-sm font-medium">You've vouched for {otherParty.display_name}</span>
        </div>
      </section>
    {/if}
  </div>
</main>
