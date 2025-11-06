<script lang="ts">
  import type { PageData } from './$types';
  import { NZ_REGIONS } from '$lib/constants/regions';
  import { pb, currentUser } from '$lib/pocketbase';
  import { goto } from '$app/navigation';

  let { data }: { data: PageData } = $props();

  let availableGames = $derived(data.availableGames);

  let selectedGameId = $state('');
  let cascadeName = $state('');
  let description = $state('');
  let deadlineDays = $state(14);
  let region = $state('');
  let shippingRequirement = $state('shipping_available');
  let specialRules = $state('');
  let isSubmitting = $state(false);
  let error = $state<string | null>(null);

  let selectedGame = $derived(availableGames.find((g) => g.id === selectedGameId));

  async function handleSubmit(e: Event) {
    e.preventDefault();
    error = null;

    if (!selectedGameId) {
      error = 'Please select a game';
      return;
    }

    isSubmitting = true;

    try {
      // Calculate entry deadline
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + deadlineDays);

      // Create the cascade
      const cascade = await pb.collection('cascades').create({
        current_game: selectedGameId,
        current_holder: $currentUser!.id,
        status: 'accepting_entries',
        generation: 1,
        entry_count: 0,
        entry_deadline: deadline.toISOString(),
        name: cascadeName || null,
        description: description || null,
        region: region || null,
        shipping_requirement: shippingRequirement,
        special_rules: specialRules || null,
      });

      // Update game status to cascaded
      await pb.collection('items').update(selectedGameId, {
        status: 'cascaded',
      });

      // Update user's cascade stats
      await pb.collection('users').update($currentUser!.id, {
        cascades_seeded: $currentUser!.cascades_seeded + 1,
      });

      // Redirect to the new cascade
      goto(`/cascades/${cascade.id}`);
    } catch (err: any) {
      console.error('Failed to create cascade', err);
      error = err.message || 'Failed to create cascade. Please try again.';
      isSubmitting = false;
    }
  }
</script>

<svelte:head>
  <title>Start a Gift Cascade · Meeple Cart</title>
  <meta name="description" content="Start a gift cascade and share a game with the community" />
</svelte:head>

<main class="bg-surface-body px-6 py-12 text-primary transition-colors">
  <div class="mx-auto max-w-3xl space-y-6">
    <!-- Header -->
    <div class="space-y-2">
      <a
        href="/cascades"
        class="inline-flex items-center gap-1 text-sm text-muted transition hover:text-[var(--accent)]"
      >
        ← Back to Gift Cascades
      </a>
      <h1 class="text-3xl font-bold text-primary">Start a Gift Cascade</h1>
      <p class="text-muted">
        Gift a game to a random winner, who will then pass on the generosity by creating their own
        gift cascade.
      </p>
    </div>

    {#if availableGames.length === 0}
      <!-- No Games Available -->
      <div
        class="rounded-2xl border-2 border-dashed border-subtle bg-surface-card p-12 text-center transition-colors"
      >
        <div class="mb-4 text-6xl opacity-20">🎁</div>
        <h2 class="text-xl font-semibold text-secondary">No games available</h2>
        <p class="mt-2 text-muted">
          You need an active listing with available games to start a gift cascade.
        </p>
        <a href="/listings/new" class="btn-primary mt-6 inline-block px-6 py-2 font-medium">
          Create a listing
        </a>
      </div>
    {:else}
      <!-- Form -->
      <form onsubmit={handleSubmit} class="space-y-6">
        <!-- Error Message -->
        {#if error}
          <div class="rounded-lg border border-rose-500 bg-rose-500/10 p-4 text-rose-200">
            {error}
          </div>
        {/if}

        <!-- Select Game -->
        <div class="rounded-xl border border-subtle bg-surface-card p-6 transition-colors">
          <h2 class="text-xl font-semibold text-primary">Select Game</h2>
          <p class="mt-1 text-sm text-muted">
            Choose which game you want to gift to start the cascade.
          </p>

          <div class="mt-4">
            <label for="game_id" class="block text-sm font-medium text-secondary">Game *</label>
            <select
              id="game_id"
              name="game_id"
              bind:value={selectedGameId}
              required
              class="mt-1 w-full rounded-lg border border-subtle bg-surface-card px-4 py-2.5 text-primary transition focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
            >
              <option value="">-- Select a game --</option>
              {#each availableGames as game (game.id)}
                <option value={game.id}>
                  {game.title} ({game.condition}) - from "{game.listingTitle}"
                </option>
              {/each}
            </select>
          </div>

          {#if selectedGame}
            <div
              class="mt-3 rounded border border-subtle bg-surface-card-alt p-3 text-sm transition-colors"
            >
              <p class="text-secondary">
                <strong>Selected:</strong>
                {selectedGame.title}
              </p>
              <p class="text-muted">
                <strong>Condition:</strong>
                {selectedGame.condition}
              </p>
            </div>
          {/if}
        </div>

        <!-- Gift Cascade Details -->
        <div class="rounded-xl border border-subtle bg-surface-card p-6 transition-colors">
          <h2 class="text-xl font-semibold text-primary">Gift Cascade Details</h2>
          <p class="mt-1 text-sm text-muted">
            Customize your gift cascade (all optional except deadline).
          </p>

          <div class="mt-4 space-y-4">
            <!-- Name -->
            <div>
              <label for="name" class="block text-sm font-medium text-secondary"
                >Gift Cascade Name (optional)</label
              >
              <input
                type="text"
                id="name"
                name="name"
                bind:value={cascadeName}
                maxlength="120"
                placeholder="e.g., Wellington Area Gift Cascade, Party Games Only"
                class="mt-1 w-full rounded-lg border border-subtle bg-surface-card px-4 py-2.5 text-primary placeholder:text-muted transition focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
              />
            </div>

            <!-- Description -->
            <div>
              <label for="description" class="block text-sm font-medium text-secondary"
                >Description (optional)</label
              >
              <textarea
                id="description"
                name="description"
                bind:value={description}
                maxlength="2000"
                rows="3"
                placeholder="Add any additional context about this cascade..."
                class="mt-1 w-full rounded-lg border border-subtle bg-surface-card px-4 py-2.5 text-primary placeholder:text-muted transition focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
              />
            </div>

            <!-- Deadline -->
            <div>
              <label for="deadline_days" class="block text-sm font-medium text-secondary"
                >Entry Deadline *</label
              >
              <select
                id="deadline_days"
                name="deadline_days"
                bind:value={deadlineDays}
                required
                class="mt-1 w-full rounded-lg border border-subtle bg-surface-card px-4 py-2.5 text-primary transition focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
              >
                <option value={7}>7 days</option>
                <option value={14}>14 days (recommended)</option>
                <option value={21}>21 days</option>
                <option value={30}>30 days</option>
              </select>
              <p class="mt-1 text-xs text-muted">
                How long people have to enter before a recipient is randomly selected.
              </p>
            </div>

            <!-- Region -->
            <div>
              <label for="region" class="block text-sm font-medium text-secondary"
                >Region (optional)</label
              >
              <select
                id="region"
                name="region"
                bind:value={region}
                class="mt-1 w-full rounded-lg border border-subtle bg-surface-card px-4 py-2.5 text-primary transition focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
              >
                {#each NZ_REGIONS as region}
                  <option value={region.value}>{region.label}</option>
                {/each}
              </select>
            </div>

            <!-- Shipping -->
            <div>
              <label for="shipping_requirement" class="block text-sm font-medium text-secondary">
                Shipping *
              </label>
              <select
                id="shipping_requirement"
                name="shipping_requirement"
                bind:value={shippingRequirement}
                required
                class="mt-1 w-full rounded-lg border border-subtle bg-surface-card px-4 py-2.5 text-primary transition focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
              >
                <option value="pickup_only">Pickup only</option>
                <option value="shipping_available">Shipping available (I'll pay)</option>
                <option value="shipping_only">Shipping only (recipient pays)</option>
              </select>
            </div>

            <!-- Special Rules -->
            <div>
              <label for="special_rules" class="block text-sm font-medium text-secondary"
                >Special Rules (optional)</label
              >
              <textarea
                id="special_rules"
                name="special_rules"
                bind:value={specialRules}
                maxlength="1000"
                rows="2"
                placeholder="e.g., Must be willing to pass on a party game, First-time cascade participants only"
                class="mt-1 w-full rounded-lg border border-subtle bg-surface-card px-4 py-2.5 text-primary placeholder:text-muted transition focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
              />
            </div>
          </div>
        </div>

        <!-- Important Note -->
        <div class="rounded-lg border border-amber-600 bg-amber-500/10 p-4">
          <h3 class="font-semibold text-amber-200">Important:</h3>
          <ul class="mt-2 space-y-1 text-sm text-amber-200/80">
            <li>• Your game will be locked and unavailable for other trades/sales</li>
            <li>• You must ship the game to the recipient when selected</li>
            <li>
              • The recipient will be expected to create their own gift cascade within 30 days
            </li>
            <li>• This builds your Gift Cascade Seed Starter badge!</li>
          </ul>
        </div>

        <!-- Submit -->
        <div class="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting || !selectedGameId}
            class="btn-primary flex-1 px-6 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Start Gift Cascade'}
          </button>
          <a href="/cascades" class="btn-ghost px-6 py-3 font-medium"> Cancel </a>
        </div>
      </form>
    {/if}
  </div>
</main>
