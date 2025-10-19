<script lang="ts">
  import type { PageData, ActionData } from './$types';
  import { enhance } from '$app/forms';
  import { page } from '$app/stores';
  import { REGION_LABELS } from '$lib/constants/regions';

  export let data: PageData;
  export let form: ActionData;

  const { cascade, game, listing, holder, entries, history, userEntry, canEnter, eligibilityMessage } = data;

  let entryMessage = '';
  let isSubmitting = false;
  let showFullHistory = false;

  const statusLabels: Record<string, string> = {
    accepting_entries: 'Accepting Entries',
    selecting_winner: 'Selecting Recipient',
    in_transit: 'In Transit',
    awaiting_pass: 'Awaiting Pass-On',
    completed: 'Completed',
    broken: 'Broken',
  };

  const shippingLabels: Record<string, string> = {
    pickup_only: 'Pickup only',
    shipping_available: 'Shipping available (sender pays)',
    shipping_only: 'Shipping only (recipient pays)',
  };

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRelativeTime = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const getTimeRemaining = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffMs = deadlineDate.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffMs < 0) return { text: 'Ended', urgent: false };
    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return { text: `${diffMinutes} minutes remaining`, urgent: true };
    }
    if (diffHours < 24) return { text: `${diffHours} hours remaining`, urgent: true };
    if (diffDays === 1) return { text: '1 day remaining', urgent: false };
    return { text: `${diffDays} days remaining`, urgent: false };
  };

  const timeRemaining = getTimeRemaining(cascade.deadline);

  // Get game image URL
  const getGameImageUrl = () => {
    if (listing && listing.photos && listing.photos.length > 0) {
      return `${$page.url.origin}/api/files/listings/${listing.id}/${listing.photos[0]}?thumb=800x600`;
    }
    return null;
  };

  const gameImageUrl = getGameImageUrl();
</script>

<svelte:head>
  <title>{game?.title ?? 'Gift Cascade'} · Meeple Cart</title>
  <meta
    name="description"
    content="Enter to receive {game?.title ?? 'this game'} in a gift cascade"
  />
</svelte:head>

<main class="min-h-screen bg-slate-950 px-6 py-12">
  <div class="mx-auto max-w-6xl space-y-6">
    <!-- Back Link -->
    <a
      href="/cascades"
      class="inline-flex items-center gap-1 text-sm text-slate-400 transition hover:text-emerald-400"
    >
      ← Back to Gift Cascades
    </a>

    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Main Content (Left Column - 2 cols) -->
      <div class="space-y-6 lg:col-span-2">
        <!-- Game Card -->
        <div class="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 shadow-lg">
          {#if gameImageUrl}
            <img alt={game?.title ?? 'Game'} class="h-64 w-full object-cover" src={gameImageUrl} />
          {:else}
            <div class="flex h-64 items-center justify-center bg-slate-800 text-8xl opacity-20">
              🎲
            </div>
          {/if}

          <div class="p-6 space-y-4">
            <!-- Generation Badge & Status -->
            <div class="flex items-center gap-2">
              {#if cascade.generation > 0}
                <span
                  class="inline-block rounded-full border border-purple-600 bg-purple-500/10 px-3 py-1 text-sm font-medium text-purple-200"
                >
                  Generation {cascade.generation}
                </span>
              {:else}
                <span
                  class="inline-block rounded-full border border-emerald-600 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-200"
                >
                  Seed Gift Cascade 🌱
                </span>
              {/if}
              <span
                class="inline-block rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-300"
              >
                {statusLabels[cascade.status] ?? cascade.status}
              </span>
            </div>

            <!-- Game Title & Condition -->
            <div>
              <h1 class="text-3xl font-bold text-slate-100">{game?.title ?? 'Unknown Game'}</h1>
              {#if cascade.name}
                <p class="mt-1 text-lg italic text-slate-400">"{cascade.name}"</p>
              {/if}
              <p class="mt-2 text-slate-300">
                Condition: <span class="font-medium">{game?.condition ?? 'Unknown'}</span>
              </p>
            </div>

            <!-- Description -->
            {#if cascade.description}
              <div class="rounded-lg border border-slate-700 bg-slate-800/40 p-4">
                <p class="text-sm text-slate-300">{cascade.description}</p>
              </div>
            {/if}

            <!-- Game Notes -->
            {#if game?.notes}
              <div>
                <h3 class="font-semibold text-slate-200">Game Notes:</h3>
                <p class="mt-1 text-sm text-slate-400">{game.notes}</p>
              </div>
            {/if}

            <!-- Special Rules -->
            {#if cascade.specialRules}
              <div class="rounded-lg border border-amber-600 bg-amber-500/10 p-4">
                <h3 class="font-semibold text-amber-200">Special Rules:</h3>
                <p class="mt-1 text-sm text-amber-200/80">{cascade.specialRules}</p>
              </div>
            {/if}

            <!-- Shipping & Region -->
            <div class="flex flex-wrap gap-4 text-sm">
              <div>
                <span class="text-slate-400">Shipping:</span>
                <span class="ml-2 font-medium text-slate-200">
                  {shippingLabels[cascade.shippingRequirement] ?? cascade.shippingRequirement}
                </span>
              </div>
              {#if cascade.region}
                <div>
                  <span class="text-slate-400">Region:</span>
                  <span class="ml-2 font-medium text-slate-200">
                    {REGION_LABELS[cascade.region] ?? cascade.region.toUpperCase()}
                  </span>
                </div>
              {/if}
            </div>

            <!-- BGG Link -->
            {#if game?.bggId}
              <a
                href={`https://boardgamegeek.com/boardgame/${game.bggId}`}
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300"
              >
                View on BoardGameGeek →
              </a>
            {/if}
          </div>
        </div>

        <!-- Holder Info -->
        {#if holder}
          <div class="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 class="text-xl font-semibold text-slate-100">Current Holder</h2>
            <div class="mt-4 flex items-start gap-4">
              <div class="flex-1">
                <a
                  href={`/users/${holder.id}`}
                  class="text-lg font-medium text-emerald-400 hover:text-emerald-300"
                >
                  {holder.displayName}
                </a>
                <div class="mt-2 flex flex-wrap gap-3 text-sm text-slate-400">
                  <span>{holder.vouchCount} vouches</span>
                  <span>·</span>
                  <span>{holder.tradeCount} trades</span>
                  <span>·</span>
                  <span>{holder.cascadesSeeded} cascades seeded</span>
                  {#if holder.cascadeReputation > 0}
                    <span>·</span>
                    <span>{holder.cascadeReputation}% cascade reputation</span>
                  {/if}
                </div>
              </div>
            </div>
          </div>
        {/if}

        <!-- Entries List -->
        {#if cascade.status === 'accepting_entries'}
          <div class="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 class="text-xl font-semibold text-slate-100">
              Entries ({entries.length})
            </h2>
            {#if entries.length === 0}
              <p class="mt-4 text-sm text-slate-400">No entries yet. Be the first to enter this gift cascade!</p>
            {:else}
              <div class="mt-4 space-y-3">
                {#each entries as entry (entry.id)}
                  <div class="rounded-lg border border-slate-700 bg-slate-800/40 p-3">
                    <a
                      href={entry.userId ? `/users/${entry.userId}` : '#'}
                      class="font-medium text-slate-200 hover:text-emerald-400"
                    >
                      {entry.userName}
                    </a>
                    <span class="ml-2 text-xs text-slate-500">
                      {formatRelativeTime(entry.created)}
                    </span>
                    {#if entry.message}
                      <p class="mt-1 text-sm text-slate-400 italic">"{entry.message}"</p>
                    {/if}
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/if}

        <!-- History -->
        {#if history.length > 0}
          <div class="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 class="text-xl font-semibold text-slate-100">Gift Cascade History</h2>
            <div class="mt-4 space-y-2">
              {#each history.slice(0, showFullHistory ? undefined : 5) as h (h.eventDate)}
                <div class="flex items-start gap-3 text-sm">
                  <span class="text-slate-500">{formatRelativeTime(h.eventDate)}</span>
                  <span class="flex-1 text-slate-300">
                    <strong>{h.actorName}</strong>
                    {#if h.eventType === 'seeded'}
                      started this gift cascade
                    {:else if h.eventType === 'winner_selected'}
                      was selected to receive the gift cascade
                    {:else if h.eventType === 'shipped'}
                      shipped the game
                    {:else if h.eventType === 'received'}
                      received the game
                    {:else if h.eventType === 'passed_on'}
                      created a new gift cascade to pass it on
                    {:else}
                      {h.eventType}
                    {/if}
                  </span>
                </div>
              {/each}
            </div>
            {#if history.length > 5 && !showFullHistory}
              <button
                on:click={() => (showFullHistory = true)}
                class="mt-3 text-sm text-emerald-400 hover:text-emerald-300"
              >
                Show all history ({history.length} events)
              </button>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Sidebar (Right Column - 1 col) -->
      <div class="space-y-6">
        <!-- Deadline Card -->
        <div class="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <h3 class="text-lg font-semibold text-slate-100">Entry Deadline</h3>
          <p class="mt-2 text-2xl font-bold {timeRemaining.urgent ? 'text-orange-400' : 'text-emerald-400'}">
            {timeRemaining.text}
          </p>
          <p class="mt-1 text-xs text-slate-500">{formatDate(cascade.deadline)}</p>
        </div>

        <!-- Entry Actions -->
        {#if cascade.status === 'accepting_entries'}
          <div class="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
            {#if form?.success}
              <div class="rounded-lg border border-emerald-500 bg-emerald-500/10 p-4 text-emerald-200 mb-4">
                {form.message}
              </div>
            {/if}

            {#if form?.error}
              <div class="rounded-lg border border-rose-500 bg-rose-500/10 p-4 text-rose-200 mb-4">
                {form.error}
              </div>
            {/if}

            {#if userEntry}
              <!-- Already Entered -->
              <div class="space-y-4">
                <div class="rounded-lg border border-emerald-600 bg-emerald-500/10 p-4">
                  <p class="font-semibold text-emerald-200">✓ You've entered this gift cascade</p>
                  {#if userEntry.message}
                    <p class="mt-2 text-sm text-emerald-200/80 italic">"{userEntry.message}"</p>
                  {/if}
                </div>
                <form
                  method="POST"
                  action="?/withdraw"
                  use:enhance={() => {
                    isSubmitting = true;
                    return async ({ update }) => {
                      await update();
                      isSubmitting = false;
                    };
                  }}
                >
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    class="w-full rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-rose-500 hover:text-rose-300 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Withdrawing...' : 'Withdraw Entry'}
                  </button>
                </form>
              </div>
            {:else if canEnter}
              <!-- Entry Form -->
              <form
                method="POST"
                action="?/enter"
                use:enhance={() => {
                  isSubmitting = true;
                  return async ({ update }) => {
                    await update();
                    isSubmitting = false;
                  };
                }}
                class="space-y-4"
              >
                <div>
                  <label for="message" class="block text-sm font-medium text-slate-300 mb-2">
                    Message (optional)
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    bind:value={entryMessage}
                    maxlength="500"
                    rows="3"
                    placeholder="Why do you want this game?"
                    class="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  class="w-full rounded-lg border border-emerald-500 bg-emerald-500/10 px-6 py-3 font-semibold text-emerald-200 transition hover:bg-emerald-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Entering...' : 'Enter to Receive'}
                </button>
              </form>
            {:else}
              <!-- Cannot Enter -->
              <div class="rounded-lg border border-amber-600 bg-amber-500/10 p-4">
                <p class="text-sm text-amber-200">{eligibilityMessage}</p>
              </div>
            {/if}
          </div>
        {/if}

        <!-- Stats -->
        <div class="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <h3 class="text-lg font-semibold text-slate-100">Stats</h3>
          <div class="mt-4 space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-slate-400">Total Entries:</span>
              <span class="font-medium text-slate-200">{cascade.entryCount}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Generation:</span>
              <span class="font-medium text-slate-200">{cascade.generation}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Views:</span>
              <span class="font-medium text-slate-200">{cascade.viewCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</main>
