<script lang="ts">
  import type { PageData } from './$types';
  import { formatCurrency } from '$lib/utils/currency';
  import WatchlistButton from '$lib/components/WatchlistButton.svelte';
  import PhotoRegionOverlay from '$lib/components/PhotoRegionOverlay.svelte';
  import ListingReactions from '$lib/components/ListingReactions.svelte';
  import TrustBadge from '$lib/components/TrustBadge.svelte';
  import { pb, currentUser } from '$lib/pocketbase';
  import { goto } from '$app/navigation';
  import { generateThreadId } from '$lib/types/message';
  import { logStatusChange } from '$lib/utils/listing-status';
  import Alert from '$lib/components/Alert.svelte';
  import { REGION_LABELS } from '$lib/constants/regions';

  let { data }: { data: PageData } = $props();

  let message = $state('');
  let showMessageForm = $state(false);
  let messageError = $state<string | null>(null);
  let sendingMessage = $state(false);
  let initiatingTrade = $state(false);
  let tradeError = $state<string | null>(null);
  let showTradeForm = $state(false);
  let selectedGameIds = $state<string[]>([]);
  let shippingMethod = $state<'in_person' | 'shipped' | 'either'>('either');
  let cashOffer = $state(''); // Cash amount in dollars (will convert to cents)
  let offerMessage = $state(''); // Buyer's message with their offer
  let showShareModal = $state(false);
  let shareLinkCopied = $state(false);
  let shareTextCopied = $state(false);

  let listing = $derived(data.listing);
  let owner = $derived(data.owner);
  let games = $derived(data.games);
  let photos = $derived(data.photos ?? []);
  let discussions = $derived(data.discussions ?? []);
  let activePhotoIndex = $state(0);

  // Check if any selected games can be posted
  let canPostSelectedGames = $derived(
    selectedGameIds.length > 0 &&
      games.filter((g) => selectedGameIds.includes(g.id)).some((g) => g.can_post === true)
  );

  // Photo region state
  let photoRegions = $derived(listing.photo_region_map ?? []);
  let mainImageRef: HTMLImageElement | undefined = undefined;
  let imageWidth = $state(0);
  let imageHeight = $state(0);

  const selectPhoto = (index: number) => {
    activePhotoIndex = index;
  };

  // Update image dimensions when photo loads or changes
  function handleImageLoad() {
    if (!mainImageRef) return;
    imageWidth = mainImageRef.clientWidth;
    imageHeight = mainImageRef.clientHeight;
  }

  // Scroll to a game when its region is clicked
  function scrollToGame(gameId: string) {
    const gameElement = document.getElementById(`game-${gameId}`);
    if (gameElement) {
      gameElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add a highlight effect
      gameElement.classList.add('highlight-flash');
      setTimeout(() => {
        gameElement.classList.remove('highlight-flash');
      }, 2000);
    }
  }

  $effect(() => {
    if (photos.length > 0 && activePhotoIndex >= photos.length) {
      activePhotoIndex = 0;
    }
  });

  // Scroll to game if game ID is in URL
  $effect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('game');

    if (gameId && games.length > 0) {
      // Wait for the DOM to be ready
      setTimeout(() => {
        scrollToGame(gameId);
      }, 100);
    }
  });

  const toCurrency = (value?: number | null) => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return null;
    }

    const cents = Math.round(value * 100);
    return formatCurrency(cents);
  };

  const listingCreated = new Intl.DateTimeFormat('en-NZ', {
    dateStyle: 'medium',
  }).format(new Date(listing.created));

  const contactPreference: Record<string, string> = {
    platform: 'Meeple Cart messages',
    email: 'Email',
    phone: 'Phone',
  };

  const conditionBadges: Record<(typeof games)[number]['condition'], string> = {
    mint: 'Mint',
    excellent: 'Excellent',
    good: 'Good',
    fair: 'Fair',
    poor: 'Well loved',
  };

  const conditionDescriptions: Record<string, string> = {
    mint: 'Mint – unplayed or shrink-wrapped',
    excellent: 'Excellent – like new with minimal handling',
    good: 'Good – light wear, all components included',
    fair: 'Fair – noticeable wear or minor missing pieces',
    poor: 'Poor – heavy wear or missing components',
  };

  const statusLabels: Record<(typeof games)[number]['status'], string> = {
    available: 'Available',
    pending: 'Pending',
    sold: 'Sold',
    bundled: 'Bundled',
  };

  const statusTone: Record<(typeof games)[number]['status'], string> = {
    available: 'border-emerald-500/80 bg-emerald-500/10 text-badge-emerald',
    pending: 'border-amber-500/80 bg-amber-500/10 text-badge-amber',
    sold: 'border-rose-500/80 bg-rose-500/10 text-badge-rose',
    bundled: 'border-sky-500/80 bg-sky-500/10 text-badge-sky',
  };

  async function handleSendMessage(e: Event) {
    e.preventDefault();
    if (!owner || !$currentUser) return;

    messageError = null;
    const initialMessage = message.trim();

    if (!initialMessage || initialMessage.length === 0) {
      messageError = 'Message cannot be empty';
      return;
    }

    if (initialMessage.length > 4000) {
      messageError = 'Message too long';
      return;
    }

    if (owner.id === $currentUser.id) {
      messageError = 'Cannot message yourself';
      return;
    }

    sendingMessage = true;
    try {
      // Generate thread ID from user IDs
      const threadId = generateThreadId($currentUser.id, owner.id);

      // Create the first message in the thread
      await pb.collection('messages').create({
        listing: listing.id,
        thread_id: threadId,
        sender: $currentUser.id,
        recipient: owner.id,
        content: initialMessage,
        is_public: false,
        read: false,
      });

      // Redirect to the thread
      goto(`/messages/${threadId}`);
    } catch (err) {
      console.error('Failed to create message', err);
      messageError = 'Failed to send message';
      sendingMessage = false;
    }
  }

  // Generate shareable link
  let shareUrl = $derived.by(() => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/listings/${listing.id}`;
  });

  // Generate formatted text for Facebook posting
  let shareText = $derived.by(() => {
    const gamesList =
      games.length > 0
        ? games
            .map((g) => {
              const parts = [`• ${g.title}`];
              if (g.condition) parts.push(`- ${conditionBadges[g.condition]}`);
              // Note: price/tradeValue now in offer templates, not shown here
              return parts.join(' ');
            })
            .join('\n')
        : '';

    const type = 'LISTING';

    const regionText =
      listing.regions && listing.regions.length > 0
        ? `\n📍 ${listing.regions.map((r) => REGION_LABELS[r] || r).join(', ')}`
        : '';

    return `${type}: ${listing.title}${regionText}

${gamesList ? `Games:\n${gamesList}\n` : ''}
${listing.summary ? `\n${listing.summary}\n` : ''}
View full details: ${shareUrl}`;
  });

  async function copyToClipboard(text: string, type: 'link' | 'text') {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'link') {
        shareLinkCopied = true;
        setTimeout(() => (shareLinkCopied = false), 2000);
      } else {
        shareTextCopied = true;
        setTimeout(() => (shareTextCopied = false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  }

  async function handleInitiateTrade(e?: Event) {
    e?.preventDefault();
    if (!owner || !$currentUser) return;

    tradeError = null;

    // Verify not trading with self
    if (owner.id === $currentUser.id) {
      tradeError = 'Cannot trade with yourself';
      return;
    }

    // Validate game selection if games exist
    if (games.length > 0 && selectedGameIds.length === 0) {
      tradeError = 'Please select at least one item you want';
      return;
    }

    // Validate cash offer (optional but must be valid if provided)
    let cashAmountCents: number | undefined = undefined;
    if (cashOffer.trim()) {
      const parsed = parseFloat(cashOffer);
      if (isNaN(parsed) || parsed < 0) {
        tradeError = 'Please enter a valid cash amount (or leave blank)';
        return;
      }
      cashAmountCents = Math.round(parsed * 100); // Convert to cents
    }

    initiatingTrade = true;
    try {
      // Check for existing pending offer from this buyer
      const existingOffers = await pb.collection('trades').getList(1, 1, {
        filter: `listing = "${listing.id}" && buyer = "${$currentUser.id}" && offer_status = "pending"`,
      });

      if (existingOffers.items.length > 0) {
        tradeError = 'You already have a pending offer for this listing';
        initiatingTrade = false;
        return;
      }

      // Create offer (trade record with offer_status = pending)
      const trade = await pb.collection('trades').create({
        listing: listing.id,
        buyer: $currentUser.id,
        seller: owner.id,
        offer_status: 'pending',
        status: 'initiated', // Status for after offer is accepted
        requested_items: selectedGameIds.length > 0 ? selectedGameIds : undefined,
        cash_offer_amount: cashAmountCents,
        shipping_method: shippingMethod,
        offer_message: offerMessage.trim() || undefined,
      });

      // DO NOT update listing status yet - only when offer is accepted
      // Listing stays 'active' to allow other offers

      // Send notification to seller
      const offerDetails = [];
      if (cashAmountCents) {
        offerDetails.push(`$${(cashAmountCents / 100).toFixed(2)}`);
      }
      if (selectedGameIds.length > 0) {
        offerDetails.push(`${selectedGameIds.length} item(s)`);
      }

      await pb.collection('notifications').create({
        user: owner.id,
        type: 'new_message', // TODO: add 'offer_received' type
        title: `New offer from ${$currentUser.display_name}`,
        message: `${$currentUser.display_name} made an offer for "${listing.title}"${offerDetails.length > 0 ? `: ${offerDetails.join(' + ')}` : ''}`,
        link: `/listings/${listing.id}/offers`,
        read: false,
      });

      // Show success and redirect to offer view
      goto(`/trades/${trade.id}`);
    } catch (err) {
      console.error('Failed to create offer', err);
      tradeError = 'Failed to create offer. Please try again.';
      initiatingTrade = false;
    }
  }
</script>

<svelte:head>
  <title>{listing.title} · Meeple Cart</title>
  <meta
    name="description"
    content={`${listing.title}${listing.summary ? ` - ${listing.summary}` : ''}`}
  />

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content={shareUrl} />
  <meta property="og:title" content={`${listing.title} · Meeple Cart`} />
  <meta
    property="og:description"
    content={`${listing.listing_type === 'want' ? 'Wanted: ' : listing.listing_type === 'sell' ? 'For Sale: ' : 'For Trade: '}${listing.title}${listing.summary ? ` - ${listing.summary}` : ''}`}
  />
  {#if photos.length > 0}
    <meta property="og:image" content={photos[0].full} />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
  {/if}

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content={shareUrl} />
  <meta name="twitter:title" content={`${listing.title} · Meeple Cart`} />
  <meta
    name="twitter:description"
    content={`${listing.listing_type === 'want' ? 'Wanted: ' : listing.listing_type === 'sell' ? 'For Sale: ' : 'For Trade: '}${listing.title}${listing.summary ? ` - ${listing.summary}` : ''}`}
  />
  {#if photos.length > 0}
    <meta name="twitter:image" content={photos[0].full} />
  {/if}
</svelte:head>

<main class="bg-surface-body transition-colors px-6 py-16 text-primary sm:px-8">
  <div class="mx-auto flex max-w-5xl flex-col gap-8">
    <h1 class="text-4xl font-semibold tracking-tight text-primary sm:text-5xl">{listing.title}</h1>

    <header class="flex flex-col gap-6 lg:flex-row">
      <div class="flex-1 space-y-4">
        <!-- Reactions -->
        <ListingReactions
          listingId={listing.id}
          initialCounts={data.reactionCounts}
          initialUserReaction={data.userReaction}
        />

        <div class="flex flex-wrap gap-3 text-sm text-secondary">
          <span
            class="rounded-full border border-emerald-500/80 bg-emerald-500/10 px-3 py-1 font-semibold text-badge-emerald uppercase"
          >
            {listing.listing_type === 'want'
              ? 'Want to Buy'
              : listing.listing_type === 'sell'
                ? 'Sell'
                : 'Trade'}
          </span>
          <span class="rounded-full border border-subtle px-3 py-1">Added {listingCreated}</span>
          {#if listing.prefer_bundle}
            <span class="rounded-full border border-subtle px-3 py-1">Prefers bundle</span>
          {/if}
        </div>

        <!-- Pickup Regions -->
        {#if listing.regions && listing.regions.length > 0}
          <div class="flex flex-wrap gap-2">
            <span class="text-sm font-medium text-secondary">Pickup regions:</span>
            {#each listing.regions as regionValue (regionValue)}
              <span
                class="rounded-full border border-subtle bg-surface-card-alt px-3 py-1 text-sm text-secondary"
              >
                {REGION_LABELS[regionValue] || regionValue}
              </span>
            {/each}
          </div>
        {/if}

        <!-- Additional location details -->
        {#if listing.location}
          <div class="flex gap-2 text-sm">
            <span class="font-medium text-secondary">Location details:</span>
            <span class="text-muted">{listing.location}</span>
          </div>
        {/if}
        {#if listing.summary}
          <p class="max-w-2xl text-base text-secondary">{listing.summary}</p>
        {/if}
      </div>

      <aside
        class="w-full max-w-sm rounded-xl border border-subtle bg-surface-card transition-colors p-5 text-sm text-secondary"
      >
        <h2 class="text-base font-semibold text-primary">Trader details</h2>
        {#if owner}
          <div class="mt-2 flex items-center gap-2">
            <!-- eslint-disable svelte/no-navigation-without-resolve -->
            <a
              href={`/users/${owner.id}`}
              class="text-lg font-semibold text-emerald-300 transition hover:text-emerald-200"
            >
              {owner.display_name}
            </a>
            <!-- eslint-enable svelte/no-navigation-without-resolve -->
            {#if owner.joined_date}
              <TrustBadge
                joinedDate={owner.joined_date}
                vouchedTrades={owner.vouch_count}
                size="small"
              />
            {/if}
          </div>
          {#if owner.location}
            <p class="text-sm text-muted">Based in {owner.location}</p>
          {/if}
          <dl class="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt class="text-muted">Trades</dt>
              <dd class="text-lg font-semibold text-emerald-300">{owner.trade_count}</dd>
            </div>
            <div>
              <dt class="text-muted">Vouches</dt>
              <dd class="text-lg font-semibold text-emerald-300">{owner.vouch_count}</dd>
            </div>
          </dl>
          <div class="mt-4 space-y-2">
            <p>Preferred contact: {contactPreference[owner.preferred_contact]}</p>
            <p class="text-xs text-muted">
              Coordinate trades via the in-app messenger or the method agreed with the seller.
            </p>
          </div>
        {:else}
          <p class="mt-2 text-muted">Owner details are unavailable.</p>
        {/if}
      </aside>
    </header>

    {#if photos.length > 0}
      <section class="space-y-4">
        <div
          class="relative overflow-hidden rounded-xl border border-subtle bg-surface-card transition-colors"
        >
          <img
            bind:this={mainImageRef}
            alt={`${listing.title} photo ${activePhotoIndex + 1}`}
            class="h-full w-full max-h-[520px] object-cover"
            src={photos[activePhotoIndex].full}
            loading="lazy"
            onload={handleImageLoad}
          />

          <!-- Photo Region Overlay -->
          {#if imageWidth > 0 && imageHeight > 0 && photoRegions.length > 0}
            <PhotoRegionOverlay
              regions={photoRegions}
              photoId={photos[activePhotoIndex].id}
              {games}
              {imageWidth}
              {imageHeight}
              onRegionClick={scrollToGame}
            />
          {/if}
        </div>

        {#if photos.length > 1}
          <div class="grid gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {#each photos as photo, index (photo.id)}
              <button
                type="button"
                class={`overflow-hidden rounded-lg border ${
                  index === activePhotoIndex
                    ? 'border-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.4)]'
                    : 'border-subtle hover:border-emerald-400'
                }`}
                onclick={() => selectPhoto(index)}
                aria-label={`View photo ${index + 1}`}
                aria-current={index === activePhotoIndex}
              >
                <img
                  alt={`${listing.title} thumbnail ${index + 1}`}
                  class="h-24 w-full object-cover"
                  src={photo.thumb}
                  loading="lazy"
                />
              </button>
            {/each}
          </div>
        {/if}
      </section>
    {:else}
      <section
        class="rounded-xl border border-dashed border-subtle bg-surface-card transition-colors p-6 text-center text-sm text-muted"
      >
        This listing has no photos
      </section>
    {/if}

    <!-- Offer Templates Section -->
    {#if data.offerTemplates.length > 0}
      <section class="space-y-6">
        <div>
          <h2 class="text-2xl font-semibold text-primary">Available Offers</h2>
          <p class="text-sm text-muted">
            The seller has created offer templates showing what they're willing to accept.
          </p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          {#each data.offerTemplates as template (template.id)}
            <article class="rounded-lg border border-subtle bg-surface-panel p-5 transition-colors hover:border-accent/50">
              <div class="space-y-3">
                <div class="flex items-start justify-between gap-3">
                  <h3 class="text-lg font-semibold text-primary">
                    {template.display_name || 'Offer template'}
                  </h3>
                  <div class="flex items-center gap-1 text-sm">
                    {#if template.template_type === 'cash_only'}
                      <span title="Cash only">💰</span>
                    {:else if template.template_type === 'trade_only'}
                      <span title="Trade only">🔄</span>
                    {:else}
                      <span title="Cash or trade">💰🔄</span>
                    {/if}
                  </div>
                </div>

                <!-- Price -->
                {#if template.cash_amount}
                  <div class="text-2xl font-bold text-emerald-400">
                    ${(template.cash_amount / 100).toFixed(2)} NZD
                    {#if template.open_to_lower_offers}
                      <span class="text-sm font-normal text-muted">(or nearest offer)</span>
                    {/if}
                  </div>
                {/if}

                <!-- Items included -->
                {#if template.expand?.items && Array.isArray(template.expand.items)}
                  <div>
                    <div class="text-xs font-medium text-secondary">Includes:</div>
                    <div class="mt-1 flex flex-wrap gap-1.5">
                      {#each template.expand.items as item}
                        <span class="rounded-full bg-surface-body px-2 py-0.5 text-xs text-muted">
                          {item.title}
                        </span>
                      {/each}
                    </div>
                  </div>
                {/if}

                <!-- Trade items wanted -->
                {#if template.trade_for_items && template.trade_for_items.length > 0}
                  <div>
                    <div class="text-xs font-medium text-secondary">Wants in trade:</div>
                    <div class="mt-1 space-y-1">
                      {#each template.trade_for_items.slice(0, 3) as wantedItem}
                        <div class="text-sm text-muted">
                          • {wantedItem.title}
                          {#if wantedItem.bgg_id}
                            <span class="text-xs">(BGG {wantedItem.bgg_id})</span>
                          {/if}
                        </div>
                      {/each}
                      {#if template.trade_for_items.length > 3}
                        <div class="text-xs text-muted">
                          +{template.trade_for_items.length - 3} more...
                        </div>
                      {/if}
                    </div>
                  </div>
                {/if}

                <!-- Options -->
                <div class="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
                  {#if template.open_to_shipping_negotiation}
                    <span title="Open to shipping negotiation">📦 Shipping flexible</span>
                  {/if}
                  {#if template.open_to_trade_offers && template.template_type === 'cash_only'}
                    <span title="Also open to trade offers">🔄 Trade offers OK</span>
                  {/if}
                </div>

                <!-- Notes -->
                {#if template.notes}
                  <p class="text-sm text-muted italic">{template.notes}</p>
                {/if}
              </div>
            </article>
          {/each}
        </div>

        <div class="rounded-lg border border-subtle bg-surface-card p-4">
          <p class="text-sm text-secondary">
            💡 <strong>Tip:</strong> Contact the seller to discuss these offers or propose your own.
            Scroll down to use the "Send Message" or "Propose Trade" buttons.
          </p>
        </div>
      </section>
    {/if}

    <section
      class="grid gap-8 lg:grid-cols-[2fr_1fr]"
    >
      <div class="space-y-6">
        <div>
          <h2 class="text-2xl font-semibold text-primary">Items in this listing</h2>
          <p class="text-sm text-muted">
            Condition, pricing, and trade preferences for each item included.
          </p>
        </div>

        {#if games.length > 0}
          <div class="space-y-4">
            {#each games as game (game.id)}
              <article
                id="game-{game.id}"
                class="space-y-4 rounded-lg border border-subtle transition-colors p-5 {game.status === 'pending' ? 'bg-amber-500/5' : game.status === 'sold' ? 'bg-surface-panel/50 opacity-75' : 'bg-surface-panel'}"
              >
                <header class="space-y-2">
                  <div class="flex flex-wrap items-center justify-between gap-3">
                    <h3 class="text-xl font-semibold text-primary">{game.title}</h3>
                    {#if game.bggUrl}
                      <!-- eslint-disable svelte/no-navigation-without-resolve -->
                      <a
                        class="text-sm font-medium text-emerald-300 transition hover:text-emerald-200"
                        href={game.bggUrl}
                        target="_blank"
                        rel="external noopener"
                      >
                        View on BGG
                      </a>
                      <!-- eslint-enable svelte/no-navigation-without-resolve -->
                    {/if}
                  </div>
                  <div class="flex flex-wrap gap-2 text-xs font-semibold">
                    <span
                      class="inline-flex items-center rounded-full border border-subtle bg-surface-card-alt px-2 py-1 text-secondary"
                    >
                      {conditionBadges[game.condition]}
                    </span>
                    <span
                      class={`inline-flex items-center rounded-full border px-2 py-1 ${statusTone[game.status]}`}
                    >
                      {statusLabels[game.status]}
                    </span>
                    {#if game.year !== null}
                      <span
                        class="inline-flex items-center rounded-full border border-subtle bg-surface-card-alt px-2 py-1 text-secondary"
                      >
                        Published {game.year}
                      </span>
                    {/if}
                    {#if game.can_post}
                      <span
                        class="inline-flex items-center rounded-full border border-subtle bg-surface-card-alt px-2 py-1 text-secondary"
                      >
                        🚚 Can post
                      </span>
                    {/if}
                  </div>
                  {#if conditionDescriptions[game.condition]}
                    <p class="text-xs text-muted">{conditionDescriptions[game.condition]}</p>
                  {/if}
                </header>

                <dl class="grid gap-3 text-sm sm:grid-cols-2">
                  {#if listing.listing_type === 'sell' && game.price !== null}
                    <div>
                      <dt class="text-muted">Price</dt>
                      <dd class="text-lg font-semibold">
                        {#if game.previousPrice !== null && game.previousPrice > game.price}
                          <span class="text-muted line-through">
                            {toCurrency(game.previousPrice) ??
                              `${game.previousPrice.toFixed(2)} NZD`}
                          </span>
                          <span class="ml-2 text-emerald-200">
                            {toCurrency(game.price) ?? `${game.price.toFixed(2)} NZD`}
                          </span>
                        {:else}
                          <span class="text-emerald-200">
                            {toCurrency(game.price) ?? `${game.price.toFixed(2)} NZD`}
                          </span>
                        {/if}
                      </dd>
                    </div>
                  {/if}
                  {#if listing.listing_type === 'trade' && game.tradeValue !== null}
                    <div>
                      <dt class="text-muted">Trade value</dt>
                      <dd class="text-lg font-semibold">
                        {#if game.previousTradeValue !== null && game.previousTradeValue > game.tradeValue}
                          <span class="text-muted line-through">
                            {toCurrency(game.previousTradeValue) ??
                              `${game.previousTradeValue.toFixed(2)} NZD`}
                          </span>
                          <span class="ml-2 text-emerald-200">
                            {toCurrency(game.tradeValue) ?? `${game.tradeValue.toFixed(2)} NZD`}
                          </span>
                        {:else}
                          <span class="text-emerald-200">
                            {toCurrency(game.tradeValue) ?? `${game.tradeValue.toFixed(2)} NZD`}
                          </span>
                        {/if}
                      </dd>
                    </div>
                  {/if}
                  {#if listing.listing_type === 'want' && game.price !== null}
                    <div>
                      <dt class="text-muted">Max price</dt>
                      <dd class="text-lg font-semibold">
                        <span class="text-emerald-200">
                          {toCurrency(game.price) ?? `${game.price.toFixed(2)} NZD`}
                        </span>
                      </dd>
                    </div>
                  {/if}
                  {#if (listing.listing_type === 'sell' && game.price === null) || (listing.listing_type === 'trade' && game.tradeValue === null) || (listing.listing_type === 'want' && game.price === null)}
                    <div class="sm:col-span-2">
                      <dt class="text-muted">Negotiable</dt>
                      <dd class="text-sm text-secondary">Price to be discussed with the trader.</dd>
                    </div>
                  {/if}
                </dl>

                {#if game.notes}
                  <div>
                    <h4 class="text-sm font-semibold text-secondary">Seller notes</h4>
                    <p class="mt-2 whitespace-pre-line text-sm text-secondary">{game.notes}</p>
                  </div>
                {/if}
              </article>
            {/each}
          </div>
        {:else}
          <div
            class="rounded-lg border border-dashed border-subtle bg-surface-body transition-colors/50 p-6 text-sm text-muted"
          >
            The seller has not added individual item details yet.
          </div>
        {/if}
      </div>

      <aside
        class="space-y-4 rounded-lg border border-subtle bg-surface-panel transition-colors p-5 text-sm text-secondary"
      >
        <h3 class="text-base font-semibold text-primary">Contact trader</h3>

        {#if !$currentUser}
          <div class="space-y-4">
            <p class="text-sm text-muted">Sign in to send a message to this trader.</p>
            <!-- eslint-disable svelte/no-navigation-without-resolve -->
            <a
              class="btn-secondary w-full"
              href="/login"
            >
              Sign in to message
            </a>
            <!-- eslint-enable svelte/no-navigation-without-resolve -->
          </div>
        {:else if owner && $currentUser.id === owner.id}
          <div class="space-y-3 rounded-lg bg-surface-card transition-colors p-4">
            <p class="text-center text-sm text-muted">This is your listing</p>

            <!-- Pending Offers Badge/Button -->
            {#if data.pendingOfferCount > 0}
              <!-- eslint-disable svelte/no-navigation-without-resolve -->
              <a
                href={`/listings/${listing.id}/offers`}
                class="block w-full rounded-lg border border-amber-500 bg-amber-500 px-4 py-2 text-center font-semibold text-[var(--accent-contrast)] shadow-[0_10px_25px_rgba(245,158,11,0.25)] transition hover:bg-amber-400"
              >
                💰 {data.pendingOfferCount} Pending Offer{data.pendingOfferCount > 1 ? 's' : ''}
              </a>
              <!-- eslint-enable svelte/no-navigation-without-resolve -->
            {/if}

            <!-- eslint-disable svelte/no-navigation-without-resolve -->
            <a
              href={`/listings/${listing.id}/edit`}
              class="block w-full rounded-lg border border-emerald-500 bg-emerald-500/10 px-4 py-2 text-center font-semibold text-emerald-200 transition hover:bg-emerald-500/20"
            >
              Edit prices
            </a>
            <a
              href={`/listings/${listing.id}/photos`}
              class="block w-full rounded-lg border border-emerald-500 bg-emerald-500/10 px-4 py-2 text-center font-semibold text-emerald-200 transition hover:bg-emerald-500/20"
            >
              Manage photos
            </a>
            <!-- eslint-enable svelte/no-navigation-without-resolve -->
          </div>
        {:else if owner}
          <div class="space-y-3">
            <!-- Show View Trade button if user has existing trade, otherwise Propose Trade -->
            {#if data.existingTrade}
              <!-- eslint-disable svelte/no-navigation-without-resolve -->
              <a
                href="/trades/{data.existingTrade.id}"
                class="block w-full rounded-lg border border-emerald-500 bg-emerald-500 px-4 py-2 text-center font-semibold text-[var(--accent-contrast)] shadow-[0_10px_25px_rgba(16,185,129,0.25)] transition hover:bg-emerald-400"
              >
                👁️ View Trade
              </a>
              <!-- eslint-enable svelte/no-navigation-without-resolve -->
              <p class="text-xs text-center text-muted">
                You have an active trade for this listing
              </p>
            {:else}
              <!-- Propose Trade Form -->
              {#if !showTradeForm}
                <button
                  type="button"
                  onclick={() => {
                    showTradeForm = true;
                    // Pre-select all available games
                    selectedGameIds = games
                      .filter((g) => g.status === 'available')
                      .map((g) => g.id);
                  }}
                  class="w-full rounded-lg border border-emerald-500 bg-emerald-500 px-4 py-2 font-semibold text-[var(--accent-contrast)] shadow-[0_10px_25px_rgba(16,185,129,0.25)] transition hover:bg-emerald-400"
                >
                  💰 Make Offer
                </button>
              {:else}
                <form
                  onsubmit={handleInitiateTrade}
                  class="space-y-4 rounded-lg border border-subtle bg-surface-card p-4"
                >
                  <h4 class="font-semibold text-primary">Make an Offer</h4>

                  {#if tradeError}
                    <Alert type="error">{tradeError}</Alert>
                  {/if}

                  {#if games.length > 0}
                    <!-- Game Selection -->
                    <div class="space-y-2">
                      <label class="block text-sm font-medium text-secondary">
                        Select games you want ({selectedGameIds.length} selected)
                      </label>
                      <div
                        class="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-subtle bg-surface-body p-3"
                      >
                        {#each games as game (game.id)}
                          <label
                            class="flex cursor-pointer items-start gap-3 rounded-lg p-2 transition hover:bg-surface-ghost {game.status !==
                            'available'
                              ? 'opacity-50'
                              : ''}"
                          >
                            <input
                              type="checkbox"
                              value={game.id}
                              checked={selectedGameIds.includes(game.id)}
                              disabled={game.status !== 'available'}
                              onchange={(e) => {
                                const checked = e.currentTarget.checked;
                                if (checked) {
                                  selectedGameIds = [...selectedGameIds, game.id];
                                } else {
                                  selectedGameIds = selectedGameIds.filter((id) => id !== game.id);
                                }
                              }}
                              class="mt-1 h-4 w-4 rounded border-subtle bg-surface-body text-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0"
                            />
                            <div class="flex-1">
                              <div class="font-medium text-primary">{game.title}</div>
                              <div class="text-xs text-muted">
                                {conditionBadges[game.condition]}
                                {#if game.price}
                                  · {toCurrency(game.price)}
                                {:else if game.tradeValue}
                                  · Value: {toCurrency(game.tradeValue)}
                                {/if}
                                {#if game.can_post}
                                  · 🚚 Can post
                                {/if}
                                {#if game.status !== 'available'}
                                  · {game.status}
                                {/if}
                              </div>
                            </div>
                          </label>
                        {/each}
                      </div>
                    </div>
                  {/if}

                  <!-- Cash Offer (Optional) -->
                  <div class="space-y-2">
                    <label for="cash-offer" class="block text-sm font-medium text-secondary">
                      Cash offer (optional)
                    </label>
                    <div class="relative">
                      <span
                        class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted"
                        >$</span
                      >
                      <input
                        id="cash-offer"
                        type="number"
                        step="0.01"
                        min="0"
                        bind:value={cashOffer}
                        placeholder="0.00"
                        class="w-full rounded-lg border border-subtle bg-surface-body pl-7 pr-3 py-2 text-primary placeholder-muted transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0"
                      />
                    </div>
                    <p class="text-xs text-muted">Enter amount in NZD, or leave blank</p>
                  </div>

                  <!-- Shipping Method Selection -->
                  <div class="space-y-2">
                    <label class="block text-sm font-medium text-secondary">
                      Preferred shipping method
                    </label>
                    <div class="space-y-2">
                      <label
                        class="flex cursor-pointer items-center gap-3 rounded-lg border border-subtle bg-surface-body p-3 transition hover:bg-surface-ghost {shippingMethod ===
                        'in_person'
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : ''}"
                      >
                        <input
                          type="radio"
                          name="shipping_method"
                          value="in_person"
                          checked={shippingMethod === 'in_person'}
                          onchange={() => (shippingMethod = 'in_person')}
                          class="h-4 w-4 border-subtle bg-surface-body text-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0"
                        />
                        <div class="flex-1">
                          <div class="font-medium text-primary">In-person meetup</div>
                          <div class="text-xs text-muted">Arrange to meet locally</div>
                        </div>
                      </label>
                      <label
                        class="flex cursor-pointer items-center gap-3 rounded-lg border border-subtle bg-surface-body p-3 transition hover:bg-surface-ghost {shippingMethod ===
                        'shipped'
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : ''}"
                      >
                        <input
                          type="radio"
                          name="shipping_method"
                          value="shipped"
                          checked={shippingMethod === 'shipped'}
                          onchange={() => (shippingMethod = 'shipped')}
                          disabled={!canPostSelectedGames}
                          class="h-4 w-4 border-subtle bg-surface-body text-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0"
                        />
                        <div class="flex-1">
                          <div class="font-medium text-primary">
                            📮 Shipping
                            {#if !canPostSelectedGames}
                              <span class="text-xs text-muted"
                                >(not available for selected games)</span
                              >
                            {/if}
                          </div>
                          <div class="text-xs text-muted">Seller posts to you</div>
                        </div>
                      </label>
                      <label
                        class="flex cursor-pointer items-center gap-3 rounded-lg border border-subtle bg-surface-body p-3 transition hover:bg-surface-ghost {shippingMethod ===
                        'either'
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : ''}"
                      >
                        <input
                          type="radio"
                          name="shipping_method"
                          value="either"
                          checked={shippingMethod === 'either'}
                          onchange={() => (shippingMethod = 'either')}
                          class="h-4 w-4 border-subtle bg-surface-body text-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0"
                        />
                        <div class="flex-1">
                          <div class="font-medium text-primary">Either method</div>
                          <div class="text-xs text-muted">Flexible - can arrange either way</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <!-- Offer Message (Optional) -->
                  <div class="space-y-2">
                    <label for="offer-message" class="block text-sm font-medium text-secondary">
                      Message to seller (optional)
                    </label>
                    <textarea
                      id="offer-message"
                      bind:value={offerMessage}
                      placeholder="Hi! I'm interested in your listing..."
                      rows="3"
                      maxlength="1000"
                      class="w-full resize-none rounded-lg border border-subtle bg-surface-body px-3 py-2 text-primary placeholder-muted transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0"
                    />
                    <p class="text-xs text-muted">{offerMessage.length}/1000 characters</p>
                  </div>

                  <!-- Action Buttons -->
                  <div class="flex gap-2">
                    <button
                      type="submit"
                      disabled={initiatingTrade || selectedGameIds.length === 0}
                      class="flex-1 rounded-lg border border-emerald-500 bg-emerald-500 px-4 py-2 font-semibold text-[var(--accent-contrast)] shadow-[0_10px_25px_rgba(16,185,129,0.25)] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {initiatingTrade ? 'Submitting offer...' : 'Submit Offer'}
                    </button>
                    <button
                      type="button"
                      onclick={() => {
                        showTradeForm = false;
                        selectedGameIds = [];
                        cashOffer = '';
                        offerMessage = '';
                        shippingMethod = 'either';
                        tradeError = null;
                      }}
                      disabled={initiatingTrade}
                      class="rounded-lg border border-subtle px-4 py-2 font-semibold text-secondary transition hover:bg-surface-ghost disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              {/if}
            {/if}

            <!-- Send Message Button -->
            {#if !showMessageForm}
              <button
                type="button"
                onclick={() => (showMessageForm = true)}
                class="w-full rounded-lg border border-subtle px-4 py-2 font-semibold text-secondary transition hover:bg-surface-ghost hover:border-emerald-500 hover:text-emerald-200"
              >
                💬 Send message
              </button>
            {:else}
              <form onsubmit={handleSendMessage} class="space-y-3">
                {#if messageError}
                  <Alert type="error">{messageError}</Alert>
                {/if}

                <textarea
                  name="message"
                  bind:value={message}
                  placeholder="Hi! I'm interested in this listing..."
                  rows="4"
                  maxlength="4000"
                  required
                  disabled={sendingMessage}
                  class="w-full resize-none rounded-lg border border-subtle bg-surface-card transition-colors px-3 py-2 text-primary placeholder-slate-500 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
                />

                <div class="flex gap-2">
                  <button
                    type="submit"
                    disabled={!message.trim() || sendingMessage}
                    class="flex-1 rounded-lg bg-emerald-500 px-4 py-2 font-medium text-[var(--accent-contrast)] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sendingMessage ? 'Sending...' : 'Send'}
                  </button>
                  <button
                    type="button"
                    disabled={sendingMessage}
                    onclick={() => {
                      showMessageForm = false;
                      message = '';
                      messageError = null;
                    }}
                    class="rounded-lg border border-subtle px-4 py-2 text-secondary transition hover:bg-surface-card-alt disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            {/if}
          </div>

          <p class="text-xs text-muted">
            Initiate a formal trade to track progress, or message to discuss details.
          </p>
        {/if}
      </aside>
    </section>

    <!-- Discussion Section -->
    <section class="mt-12">
      <div class="mb-6 flex items-center justify-between">
        <h2 class="text-2xl font-bold text-primary">Discussion</h2>
        <a
          href="/discussions/new?listing={listing.id}"
          class="btn-secondary"
        >
          Start a Discussion
        </a>
      </div>

      {#if discussions.length === 0}
        <div class="rounded-lg border border-subtle bg-surface-card p-8 text-center">
          <p class="text-secondary">No discussions yet</p>
          <p class="mt-2 text-sm text-muted">
            Be the first to start a conversation about this listing!
          </p>
          <a
            href="/discussions/new?listing={listing.id}"
            class="btn-primary mt-4 text-base px-8 py-3"
          >
            Start Discussion
          </a>
        </div>
      {:else}
        <div class="space-y-3">
          {#each discussions as thread}
            <a
              href="/discussions/{thread.id}"
              class="block rounded-lg border border-subtle bg-surface-card p-4 transition hover:border-accent"
            >
              <div class="mb-2 flex items-start justify-between gap-4">
                <h3 class="font-semibold text-primary hover:text-accent">
                  {thread.title}
                </h3>
                {#if thread.pinned}
                  <span
                    class="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-200"
                  >
                    📌 Pinned
                  </span>
                {/if}
              </div>

              <div class="flex items-center gap-3 text-xs text-muted">
                <span class="font-medium text-secondary">
                  {thread.expand?.author?.display_name ?? 'Unknown'}
                </span>
                <span>·</span>
                <span>
                  {new Date(thread.created).toLocaleDateString('en-NZ', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <span>·</span>
                <span>💬 {thread.reply_count} replies</span>
              </div>
            </a>
          {/each}
        </div>

        {#if discussions.length >= 10}
          <div class="mt-4 text-center">
            <a href="/discussions" class="text-sm text-accent hover:underline">
              View all discussions →
            </a>
          </div>
        {/if}
      {/if}
    </section>
  </div>
</main>

<style>
  /* Highlight flash animation for when clicking photo regions */
  :global(.highlight-flash) {
    animation: highlight-pulse 2s ease-out;
  }

  @keyframes highlight-pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.7);
      transform: scale(1);
    }
    50% {
      box-shadow: 0 0 0 10px rgba(52, 211, 153, 0);
      transform: scale(1.02);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(52, 211, 153, 0);
      transform: scale(1);
    }
  }
</style>
