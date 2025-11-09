<script lang="ts">
  import type { PageData } from './$types';
  import type { TradeRecord } from '$lib/types/pocketbase';
  import { pb, currentUser } from '$lib/pocketbase';
  import { goto } from '$app/navigation';
  import { formatCurrency } from '$lib/utils/currency';
  import TrustBadge from '$lib/components/TrustBadge.svelte';
  import Alert from '$lib/components/Alert.svelte';
  import { logStatusChange } from '$lib/utils/listing-status';

  let { data }: { data: PageData } = $props();

  let listing = $derived(data.listing);
  let pendingOffers = $state(data.pendingOffers);
  let games = $derived(data.games);

  let processingOfferId = $state<string | null>(null);
  let errorMessage = $state<string | null>(null);
  let successMessage = $state<string | null>(null);

  // Decline state
  let decliningOfferId = $state<string | null>(null);
  let declineReason = $state('');

  const conditionBadges: Record<string, string> = {
    mint: '⭐ Mint',
    excellent: '✨ Excellent',
    good: '👍 Good',
    fair: '👌 Fair',
    poor: '📦 Poor',
  };

  function formatShippingMethod(method?: string): string {
    if (!method) return 'Not specified';
    switch (method) {
      case 'in_person':
        return 'In-person meetup';
      case 'shipped':
        return 'Shipping only';
      case 'either':
        return 'Either method';
      default:
        return method;
    }
  }

  function getRequestedGamesForOffer(offer: TradeRecord) {
    if (!offer.requested_items || !offer.expand?.requested_items) {
      return [];
    }
    return Array.isArray(offer.expand.requested_items)
      ? offer.expand.requested_items
      : [offer.expand.requested_items];
  }

  async function handleAcceptOffer(offerId: string) {
    if (!$currentUser) return;

    const confirmed = confirm(
      'Accept this offer? This will:\n\n' +
        '• Mark this offer as accepted\n' +
        '• Decline all other pending offers\n' +
        '• Lock the listing (status → pending)\n' +
        '• Start the trade flow with this buyer\n\n' +
        'Continue?'
    );

    if (!confirmed) return;

    processingOfferId = offerId;
    errorMessage = null;
    successMessage = null;

    try {
      // 1. Update this offer to 'accepted'
      await pb.collection('trades').update(offerId, {
        offer_status: 'accepted',
      });

      // 2. Auto-decline all other pending offers for this listing
      const otherOffers = pendingOffers.filter((o) => o.id !== offerId);
      for (const offer of otherOffers) {
        await pb.collection('trades').update(offer.id, {
          offer_status: 'declined',
          declined_reason: 'Seller accepted another offer',
        });

        // Notify declined buyers
        const buyer = offer.expand?.buyer;
        if (buyer) {
          await pb.collection('notifications').create({
            user: buyer.id,
            type: 'new_message', // TODO: add 'offer_declined' type
            title: 'Offer declined',
            message: `Your offer for "${listing.title}" was declined (seller accepted another offer)`,
            link: `/trades/${offer.id}`,
            read: false,
          });
        }
      }

      // 3. Update listing status to 'pending'
      const oldStatus = listing.status;
      await pb.collection('listings').update(listing.id, {
        status: 'pending',
      });

      // Log status change
      await logStatusChange(listing.id, oldStatus, 'pending', 'Offer accepted', $currentUser.id);

      // 4. Notify winning buyer
      const acceptedOffer = pendingOffers.find((o) => o.id === offerId);
      const buyer = acceptedOffer?.expand?.buyer;
      if (buyer) {
        await pb.collection('notifications').create({
          user: buyer.id,
          type: 'new_message', // TODO: add 'offer_accepted' type
          title: 'Offer accepted!',
          message: `${$currentUser.display_name} accepted your offer for "${listing.title}"`,
          link: `/trades/${offerId}`,
          read: false,
        });
      }

      successMessage = 'Offer accepted! Redirecting to trade...';

      // Redirect to trade detail page after brief delay
      setTimeout(() => {
        goto(`/trades/${offerId}`);
      }, 1500);
    } catch (err) {
      console.error('Failed to accept offer:', err);
      errorMessage = 'Failed to accept offer. Please try again.';
      processingOfferId = null;
    }
  }

  function startDecline(offerId: string) {
    decliningOfferId = offerId;
    declineReason = '';
  }

  async function handleDeclineOffer(offerId: string) {
    if (!$currentUser) return;

    processingOfferId = offerId;
    errorMessage = null;

    try {
      // Update offer to 'declined'
      await pb.collection('trades').update(offerId, {
        offer_status: 'declined',
        declined_reason: declineReason.trim() || undefined,
      });

      // Notify buyer
      const offer = pendingOffers.find((o) => o.id === offerId);
      const buyer = offer?.expand?.buyer;
      if (buyer) {
        await pb.collection('notifications').create({
          user: buyer.id,
          type: 'new_message', // TODO: add 'offer_declined' type
          title: 'Offer declined',
          message: `${$currentUser.display_name} declined your offer for "${listing.title}"${declineReason.trim() ? `: ${declineReason.trim()}` : ''}`,
          link: `/trades/${offerId}`,
          read: false,
        });
      }

      // Remove from pending offers list
      pendingOffers = pendingOffers.filter((o) => o.id !== offerId);
      decliningOfferId = null;
      declineReason = '';
      processingOfferId = null;

      successMessage = 'Offer declined';
      setTimeout(() => {
        successMessage = null;
      }, 3000);
    } catch (err) {
      console.error('Failed to decline offer:', err);
      errorMessage = 'Failed to decline offer. Please try again.';
      processingOfferId = null;
    }
  }

  function getGameTitle(gameId: string): string {
    const game = games.find((g) => g.id === gameId);
    return game?.title || 'Unknown game';
  }

  function getGameDetails(gameId: string): string {
    const game = games.find((g) => g.id === gameId);
    if (!game) return '';
    const parts = [];
    if (game.condition) parts.push(conditionBadges[game.condition]);
    if (game.price) parts.push(formatCurrency(Math.round(game.price * 100)));
    return parts.join(' · ');
  }
</script>

<svelte:head>
  <title>Offers for {listing.title} · Meeple Cart</title>
</svelte:head>

<main class="bg-surface-body px-6 py-16 text-primary transition-colors sm:px-8">
  <div class="mx-auto max-w-4xl space-y-8">
    <!-- Header -->
    <div class="space-y-4">
      <a
        href="/listings/{listing.id}"
        class="inline-flex items-center gap-2 text-sm text-secondary transition hover:text-primary"
      >
        ← Back to listing
      </a>
      <h1 class="text-4xl font-semibold tracking-tight text-primary">
        Offers for {listing.title}
      </h1>
      <p class="text-secondary">
        {pendingOffers.length} pending offer{pendingOffers.length !== 1 ? 's' : ''}
      </p>
    </div>

    <!-- Alerts -->
    {#if errorMessage}
      <Alert type="error">{errorMessage}</Alert>
    {/if}
    {#if successMessage}
      <Alert type="success">{successMessage}</Alert>
    {/if}

    <!-- No offers -->
    {#if pendingOffers.length === 0}
      <div
        class="rounded-lg border border-subtle bg-surface-card p-12 text-center transition-colors"
      >
        <p class="text-lg text-muted">No pending offers yet</p>
        <p class="mt-2 text-sm text-muted">
          Buyers can make offers from your listing page. You'll see them here.
        </p>
      </div>
    {:else}
      <!-- Offers List -->
      <div class="space-y-4">
        {#each pendingOffers as offer (offer.id)}
          {@const buyer = offer.expand?.buyer}
          {@const requestedGames = getRequestedGamesForOffer(offer)}
          {@const cashAmount = offer.cash_offer_amount}
          {@const isProcessing = processingOfferId === offer.id}
          {@const isDeclining = decliningOfferId === offer.id}

          <div
            class="rounded-lg border border-subtle bg-surface-card p-6 transition-colors {isProcessing
              ? 'opacity-50'
              : ''}"
          >
            <!-- Buyer Info -->
            <div class="mb-4 flex items-start justify-between">
              <div class="flex items-center gap-3">
                {#if buyer}
                  <a
                    href="/users/{buyer.id}"
                    class="text-lg font-semibold text-primary transition hover:text-accent"
                  >
                    {buyer.display_name}
                  </a>
                  <TrustBadge
                    tradeCount={buyer.trade_count}
                    vouchCount={buyer.vouch_count}
                    size="sm"
                  />
                {:else}
                  <span class="text-lg font-semibold text-muted">Unknown buyer</span>
                {/if}
              </div>
              <div class="text-right text-sm text-muted">
                {new Date(offer.created).toLocaleDateString('en-NZ', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>

            <!-- Offer Details -->
            <div class="space-y-4">
              <!-- Cash Offer -->
              {#if cashAmount}
                <div>
                  <div class="text-sm font-medium text-secondary">Cash offer</div>
                  <div class="text-2xl font-bold text-accent">
                    {formatCurrency(cashAmount)}
                  </div>
                </div>
              {/if}

              <!-- Requested Items -->
              {#if requestedGames.length > 0}
                <div>
                  <div class="text-sm font-medium text-secondary">
                    Wants ({requestedGames.length} item{requestedGames.length !== 1 ? 's' : ''})
                  </div>
                  <ul class="mt-2 space-y-1">
                    {#each requestedGames as game}
                      <li class="flex items-start gap-2 text-sm">
                        <span class="text-muted">•</span>
                        <div>
                          <span class="font-medium text-primary">{game.title}</span>
                          {#if getGameDetails(game.id)}
                            <span class="text-muted">– {getGameDetails(game.id)}</span>
                          {/if}
                        </div>
                      </li>
                    {/each}
                  </ul>
                </div>
              {/if}

              <!-- Shipping Method -->
              <div>
                <span class="text-sm font-medium text-secondary">Shipping preference:</span>
                <span class="ml-2 text-sm text-primary">
                  {formatShippingMethod(offer.shipping_method)}
                </span>
              </div>

              <!-- Offer Message -->
              {#if offer.offer_message}
                <div>
                  <div class="text-sm font-medium text-secondary">Message</div>
                  <div
                    class="mt-2 rounded-lg border border-subtle bg-surface-body p-3 text-sm text-primary"
                  >
                    {offer.offer_message}
                  </div>
                </div>
              {/if}
            </div>

            <!-- Actions -->
            {#if !isDeclining}
              <div class="mt-6 flex flex-wrap gap-3">
                <button
                  onclick={() => handleAcceptOffer(offer.id)}
                  disabled={isProcessing}
                  class="rounded-lg border border-emerald-500 bg-emerald-500 px-6 py-2 font-semibold text-[var(--accent-contrast)] shadow-[0_10px_25px_rgba(16,185,129,0.25)] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isProcessing ? 'Accepting...' : '✓ Accept Offer'}
                </button>
                <button
                  onclick={() => startDecline(offer.id)}
                  disabled={isProcessing}
                  class="rounded-lg border border-subtle px-6 py-2 font-semibold text-secondary transition hover:bg-surface-ghost disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ✗ Decline
                </button>
                {#if buyer}
                  <a
                    href="/messages?user={buyer.id}&listing={listing.id}"
                    class="rounded-lg border border-subtle px-6 py-2 font-semibold text-secondary transition hover:bg-surface-ghost"
                  >
                    💬 Message
                  </a>
                {/if}
              </div>
            {:else}
              <!-- Decline Form -->
              <div class="mt-6 space-y-3 rounded-lg border border-subtle bg-surface-body p-4">
                <div class="text-sm font-medium text-secondary">
                  Decline this offer (optional: provide a reason)
                </div>
                <textarea
                  bind:value={declineReason}
                  placeholder="e.g., Looking for a higher offer, prefer different shipping method..."
                  rows="3"
                  maxlength="500"
                  class="w-full resize-none rounded-lg border border-subtle bg-surface-card px-3 py-2 text-primary placeholder-muted transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0"
                />
                <div class="flex gap-2">
                  <button
                    onclick={() => handleDeclineOffer(offer.id)}
                    disabled={isProcessing}
                    class="rounded-lg border border-red-500 bg-red-500 px-6 py-2 font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isProcessing ? 'Declining...' : 'Confirm Decline'}
                  </button>
                  <button
                    onclick={() => {
                      decliningOfferId = null;
                      declineReason = '';
                    }}
                    disabled={isProcessing}
                    class="rounded-lg border border-subtle px-6 py-2 font-semibold text-secondary transition hover:bg-surface-ghost disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</main>
