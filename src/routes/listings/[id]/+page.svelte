<script lang="ts">
  import type { PageData } from './$types';
  import { formatCurrency } from '$lib/utils/currency';
  import WatchlistButton from '$lib/components/WatchlistButton.svelte';
  import PhotoRegionOverlay from '$lib/components/PhotoRegionOverlay.svelte';
  import ListingReactions from '$lib/components/ListingReactions.svelte';
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
  let shippingMethod = $state<'in_person' | 'shipped'>('in_person');

  let listing = $derived(data.listing);
  let owner = $derived(data.owner);
  let games = $derived(data.games);
  let photos = $derived(data.photos ?? []);
  let discussions = $derived(data.discussions ?? []);
  let activePhotoIndex = $state(0);

  // Check if any selected games can be posted
  let canPostSelectedGames = $derived(
    selectedGameIds.length > 0 &&
    games.filter(g => selectedGameIds.includes(g.id)).some(g => g.can_post === true)
  );

  // Photo region state
  let photoRegions = $derived(listing.photo_region_map ?? []);
  let mainImageRef: HTMLImageElement;
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
      tradeError = 'Please select at least one game you want to trade for';
      return;
    }

    initiatingTrade = true;
    try {
      // Check for duplicate trades
      const existingTrades = await pb.collection('trades').getList(1, 1, {
        filter: `listing = "${listing.id}" && buyer = "${$currentUser.id}" && status != "cancelled"`,
      });

      if (existingTrades.items.length > 0) {
        tradeError = 'You already have an active trade for this listing';
        initiatingTrade = false;
        return;
      }

      // Create trade record with selected games and shipping method
      const trade = await pb.collection('trades').create({
        listing: listing.id,
        buyer: $currentUser.id,
        seller: owner.id,
        status: 'initiated',
        games: selectedGameIds.length > 0 ? selectedGameIds : undefined,
        shipping_method: shippingMethod,
      });

      // Update listing status to pending
      const oldStatus = listing.status;
      await pb.collection('listings').update(listing.id, {
        status: 'pending',
      });

      // Log status change
      await logStatusChange(
        listing.id,
        oldStatus,
        'pending',
        'Trade initiated',
        $currentUser.id
      );

      // Send notification to seller
      await pb.collection('notifications').create({
        user: owner.id,
        type: 'new_message', // We'll need to add 'trade_initiated' type later
        title: `${$currentUser.display_name} wants to trade`,
        message: `${$currentUser.display_name} has initiated a trade for "${listing.title}"`,
        link: `/trades/${trade.id}`,
        read: false,
      });

      // Redirect to trade detail page
      goto(`/trades/${trade.id}`);
    } catch (err) {
      console.error('Failed to initiate trade', err);
      tradeError = 'Failed to initiate trade. Please try again.';
      initiatingTrade = false;
    }
  }
</script>

<svelte:head>
  <title>{listing.title} · Meeple Cart</title>
  <meta
    name="description"
    content={`View full details for ${listing.title} listed on Meeple Cart.`}
  />
</svelte:head>

<main class="bg-surface-body transition-colors px-6 py-12 text-primary sm:px-8">
  <div class="mx-auto flex max-w-5xl flex-col gap-8">
    <nav class="flex items-center text-sm text-muted">
      <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
      <a class="hover:text-emerald-300" href="/">Home</a>
      <span class="px-2">/</span>
      <span>{listing.title}</span>
    </nav>

    <header class="flex flex-col gap-6 lg:flex-row">
      <div class="flex-1 space-y-4">
        <h1 class="text-4xl font-semibold tracking-tight text-primary">{listing.title}</h1>

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
              <span class="rounded-full border border-subtle bg-surface-card-alt px-3 py-1 text-sm text-secondary">
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
          <!-- eslint-disable svelte/no-navigation-without-resolve -->
          <a
            href={`/users/${owner.id}`}
            class="mt-2 inline-block text-lg font-semibold text-emerald-300 transition hover:text-emerald-200"
          >
            {owner.display_name}
          </a>
          <!-- eslint-enable svelte/no-navigation-without-resolve -->
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
        This listing does not have photos yet.
      </section>
    {/if}

    <section
      class="grid gap-8 rounded-xl border border-subtle bg-surface-card transition-colors p-6 lg:grid-cols-[2fr_1fr]"
    >
      <div class="space-y-6">
        <div>
          <h2 class="text-2xl font-semibold text-primary">Games in this listing</h2>
          <p class="text-sm text-muted">
            Condition, pricing, and trade preferences for each game included.
          </p>
        </div>

        {#if games.length > 0}
          <div class="space-y-4">
            {#each games as game (game.id)}
              <article
                id="game-{game.id}"
                class="space-y-4 rounded-lg border border-subtle bg-surface-panel transition-colors p-5"
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
                        📮 Can post
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
            The trader has not added individual game details yet.
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
              class="inline-flex w-full items-center justify-center rounded-lg border border-emerald-500 bg-emerald-500/10 px-4 py-2 font-semibold text-emerald-200 transition hover:bg-emerald-500/20"
              href="/login"
            >
              Sign in to message
            </a>
            <!-- eslint-enable svelte/no-navigation-without-resolve -->
          </div>
        {:else if owner && $currentUser.id === owner.id}
          <div class="space-y-3 rounded-lg bg-surface-card transition-colors p-4">
            <p class="text-center text-sm text-muted">This is your listing</p>
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
                    selectedGameIds = games.filter(g => g.status === 'available').map(g => g.id);
                  }}
                  class="w-full rounded-lg border border-emerald-500 bg-emerald-500 px-4 py-2 font-semibold text-[var(--accent-contrast)] shadow-[0_10px_25px_rgba(16,185,129,0.25)] transition hover:bg-emerald-400"
                >
                  🤝 Propose Trade
                </button>
              {:else}
                <form onsubmit={handleInitiateTrade} class="space-y-4 rounded-lg border border-subtle bg-surface-card p-4">
                  <h4 class="font-semibold text-primary">Trade Proposal</h4>

                  {#if tradeError}
                    <Alert type="error">{tradeError}</Alert>
                  {/if}

                  {#if games.length > 0}
                    <!-- Game Selection -->
                    <div class="space-y-2">
                      <label class="block text-sm font-medium text-secondary">
                        Select games you want ({selectedGameIds.length} selected)
                      </label>
                      <div class="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-subtle bg-surface-body p-3">
                        {#each games as game (game.id)}
                          <label
                            class="flex cursor-pointer items-start gap-3 rounded-lg p-2 transition hover:bg-surface-ghost {game.status !== 'available' ? 'opacity-50' : ''}"
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
                                  selectedGameIds = selectedGameIds.filter(id => id !== game.id);
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
                                  · 📮 Can post
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

                  <!-- Shipping Method Selection -->
                  <div class="space-y-2">
                    <label class="block text-sm font-medium text-secondary">
                      Preferred method
                    </label>
                    <div class="space-y-2">
                      <label
                        class="flex cursor-pointer items-center gap-3 rounded-lg border border-subtle bg-surface-body p-3 transition hover:bg-surface-ghost {shippingMethod === 'in_person' ? 'border-emerald-500 bg-emerald-500/10' : ''}"
                      >
                        <input
                          type="radio"
                          name="shipping_method"
                          value="in_person"
                          checked={shippingMethod === 'in_person'}
                          onchange={() => shippingMethod = 'in_person'}
                          class="h-4 w-4 border-subtle bg-surface-body text-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0"
                        />
                        <div class="flex-1">
                          <div class="font-medium text-primary">In-person meetup</div>
                          <div class="text-xs text-muted">Arrange to meet locally</div>
                        </div>
                      </label>
                      <label
                        class="flex cursor-pointer items-center gap-3 rounded-lg border border-subtle bg-surface-body p-3 transition hover:bg-surface-ghost {shippingMethod === 'shipped' ? 'border-emerald-500 bg-emerald-500/10' : ''}"
                      >
                        <input
                          type="radio"
                          name="shipping_method"
                          value="shipped"
                          checked={shippingMethod === 'shipped'}
                          onchange={() => shippingMethod = 'shipped'}
                          disabled={!canPostSelectedGames}
                          class="h-4 w-4 border-subtle bg-surface-body text-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0"
                        />
                        <div class="flex-1">
                          <div class="font-medium text-primary">
                            📮 Can post
                            {#if !canPostSelectedGames}
                              <span class="text-xs text-muted">(not available for selected games)</span>
                            {/if}
                          </div>
                          <div class="text-xs text-muted">Seller posts to you</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <!-- Action Buttons -->
                  <div class="flex gap-2">
                    <button
                      type="submit"
                      disabled={initiatingTrade || selectedGameIds.length === 0}
                      class="flex-1 rounded-lg border border-emerald-500 bg-emerald-500 px-4 py-2 font-semibold text-[var(--accent-contrast)] shadow-[0_10px_25px_rgba(16,185,129,0.25)] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {initiatingTrade ? 'Initiating...' : 'Confirm Trade Proposal'}
                    </button>
                    <button
                      type="button"
                      onclick={() => {
                        showTradeForm = false;
                        selectedGameIds = [];
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
          class="rounded-lg border border-subtle bg-surface-body px-4 py-2 text-sm font-medium text-secondary transition hover:border-accent hover:text-primary"
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
            class="mt-4 inline-block rounded-lg border border-emerald-500 bg-emerald-500 px-6 py-2 font-semibold text-surface-body transition hover:bg-emerald-600"
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
