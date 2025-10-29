<script lang="ts">
  import type { PageData } from './$types';
  import { formatCurrency } from '$lib/utils/currency';
  import WatchlistButton from '$lib/components/WatchlistButton.svelte';
  import PhotoRegionOverlay from '$lib/components/PhotoRegionOverlay.svelte';
  import { pb, currentUser } from '$lib/pocketbase';
  import { goto } from '$app/navigation';
  import { generateThreadId } from '$lib/types/message';

  let { data }: { data: PageData } = $props();

  let message = $state('');
  let showMessageForm = $state(false);
  let messageError = $state<string | null>(null);
  let sendingMessage = $state(false);
  let initiatingTrade = $state(false);
  let tradeError = $state<string | null>(null);

  let listing = $derived(data.listing);
  let owner = $derived(data.owner);
  let games = $derived(data.games);
  let photos = $derived(data.photos ?? []);
  let activePhotoIndex = $state(0);

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
    available: 'border-emerald-500/80 bg-emerald-500/10 text-emerald-200',
    pending: 'border-amber-500/80 bg-amber-500/10 text-amber-200',
    sold: 'border-rose-500/80 bg-rose-500/10 text-rose-200',
    bundled: 'border-sky-500/80 bg-sky-500/10 text-sky-200',
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

  async function handleInitiateTrade() {
    if (!owner || !$currentUser) return;

    tradeError = null;

    // Verify not trading with self
    if (owner.id === $currentUser.id) {
      tradeError = 'Cannot trade with yourself';
      return;
    }

    initiatingTrade = true;
    try {
      // Check for duplicate trades
      const existingTrades = await pb.collection('trades').getList(1, 1, {
        filter: `listing = "${listing.id}" && buyer = "${$currentUser.id}"`,
      });

      if (existingTrades.items.length > 0) {
        tradeError = 'You already have an active trade for this listing';
        initiatingTrade = false;
        return;
      }

      // Create trade record
      const trade = await pb.collection('trades').create({
        listing: listing.id,
        buyer: $currentUser.id,
        seller: owner.id,
        status: 'initiated',
      });

      // Update listing status to pending
      await pb.collection('listings').update(listing.id, {
        status: 'pending',
      });

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
        <div class="flex flex-wrap gap-3 text-sm text-secondary">
          <span
            class="rounded-full border border-emerald-500/80 bg-emerald-500/10 px-3 py-1 font-semibold text-emerald-200 uppercase"
          >
            {listing.listing_type === 'want'
              ? 'Want to Buy'
              : listing.listing_type === 'sell'
                ? 'Sell'
                : 'Trade'}
          </span>
          {#if listing.location}
            <span class="rounded-full border border-subtle px-3 py-1">{listing.location}</span>
          {/if}
          <span class="rounded-full border border-subtle px-3 py-1">Added {listingCreated}</span>
          {#if listing.shipping_available}
            <span class="rounded-full border border-subtle px-3 py-1">Shipping available</span>
          {/if}
          {#if listing.prefer_bundle}
            <span class="rounded-full border border-subtle px-3 py-1">Prefers bundle</span>
          {/if}
        </div>
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
                  </div>
                  {#if conditionDescriptions[game.condition]}
                    <p class="text-xs text-muted">{conditionDescriptions[game.condition]}</p>
                  {/if}
                </header>

                <dl class="grid gap-3 text-sm sm:grid-cols-2">
                  {#if game.price !== null}
                    <div>
                      <dt class="text-muted">Price guide</dt>
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
                  {#if game.tradeValue !== null}
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
                  {#if game.price === null && game.tradeValue === null}
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

        <!-- Watchlist button (show for all logged-in users) -->
        {#if $currentUser}
          <div class="pb-4">
            <WatchlistButton listingId={listing.id} isWatching={data.isWatching} />
          </div>
        {/if}

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
            <!-- Initiate Trade Button -->
            <button
              type="button"
              onclick={handleInitiateTrade}
              disabled={initiatingTrade}
              class="w-full rounded-lg border border-emerald-500 bg-emerald-500 px-4 py-2 font-semibold text-[var(--accent-contrast)] shadow-[0_10px_25px_rgba(16,185,129,0.25)] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {initiatingTrade ? 'Initiating...' : '🤝 Propose Trade'}
            </button>

            {#if tradeError}
              <div class="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-400">
                {tradeError}
              </div>
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
                  <div class="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-400">
                    {messageError}
                  </div>
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
