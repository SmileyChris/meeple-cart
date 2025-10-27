<script lang="ts">
  import type { PageData } from './$types';
  import { pb, currentUser } from '$lib/pocketbase';
  import { invalidate } from '$app/navigation';
  import type { TradeRecord, UserRecord } from '$lib/types/pocketbase';
  import type { ListingRecord } from '$lib/types/listing';

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

      // Optionally notify the other party
      await pb.collection('notifications').create({
        user: otherParty.id,
        type: 'new_message',
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
          <span
            >Seller confirmed - {trade.status === 'confirmed' || trade.status === 'completed'
              ? formatDate(trade.updated)
              : 'Pending'}</span
          >
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
          <span
            >Trade completed - {trade.status === 'completed' && trade.completed_date
              ? formatDate(trade.completed_date)
              : 'Pending'}</span
          >
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
            <button type="button" on:click={() => (showFeedbackForm = true)} class="btn-primary">
              Leave Feedback
            </button>
          {/if}
        </div>

        {#if showFeedbackForm}
          <form on:submit={handleSubmitFeedback} class="space-y-4 border-t border-subtle pt-4">
            <!-- Rating -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-secondary" for="rating"> Rating </label>
              <div class="flex gap-2">
                {#each [1, 2, 3, 4, 5] as star}
                  <button
                    type="button"
                    on:click={() => (feedbackRating = star)}
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
              <div class="rounded-lg bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
                {feedbackError}
              </div>
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
                on:click={() => {
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
            <button type="button" on:click={() => (showVouchForm = true)} class="btn-primary">
              ✓ Vouch
            </button>
          {/if}
        </div>

        {#if showVouchForm}
          <form on:submit={handleSubmitVouch} class="space-y-4 border-t border-subtle pt-4">
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
              <div class="rounded-lg bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
                {vouchError}
              </div>
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
                on:click={() => {
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
