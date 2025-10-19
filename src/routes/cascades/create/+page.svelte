<script lang="ts">
  import type { PageData, ActionData } from './$types';
  import { enhance } from '$app/forms';
  import { NZ_REGIONS } from '$lib/constants/regions';

  export let data: PageData;
  export let form: ActionData;

  const { availableGames } = data;

  let selectedGameId = '';
  let cascadeName = '';
  let description = '';
  let deadlineDays = 14;
  let region = '';
  let shippingRequirement = 'shipping_available';
  let specialRules = '';
  let isSubmitting = false;

  $: selectedGame = availableGames.find((g) => g.id === selectedGameId);
</script>

<svelte:head>
  <title>Start a Gift Cascade · Meeple Cart</title>
  <meta name="description" content="Start a gift cascade and share a game with the community" />
</svelte:head>

<main class="min-h-screen bg-slate-950 px-6 py-12">
  <div class="mx-auto max-w-3xl space-y-6">
    <!-- Header -->
    <div class="space-y-2">
      <a
        href="/cascades"
        class="inline-flex items-center gap-1 text-sm text-slate-400 transition hover:text-emerald-400"
      >
        ← Back to Gift Cascades
      </a>
      <h1 class="text-3xl font-bold text-slate-100">Start a Gift Cascade</h1>
      <p class="text-slate-400">
        Gift a game to a random winner, who will then pass on the generosity by creating their own
        gift cascade.
      </p>
    </div>

    {#if availableGames.length === 0}
      <!-- No Games Available -->
      <div
        class="rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/40 p-12 text-center"
      >
        <div class="mb-4 text-6xl opacity-20">🎁</div>
        <h2 class="text-xl font-semibold text-slate-300">No games available</h2>
        <p class="mt-2 text-slate-400">
          You need an active listing with available games to start a gift cascade.
        </p>
        <a
          href="/listings/new"
          class="mt-6 inline-block rounded-lg border border-emerald-500 bg-emerald-500/10 px-6 py-2 font-medium text-emerald-200 transition hover:bg-emerald-500/20"
        >
          Create a listing
        </a>
      </div>
    {:else}
      <!-- Form -->
      <form
        method="POST"
        use:enhance={() => {
          isSubmitting = true;
          return async ({ update }) => {
            await update();
            isSubmitting = false;
          };
        }}
        class="space-y-6"
      >
        <!-- Error Message -->
        {#if form?.error}
          <div class="rounded-lg border border-rose-500 bg-rose-500/10 p-4 text-rose-200">
            {form.error}
          </div>
        {/if}

        <!-- Select Game -->
        <div class="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 class="text-xl font-semibold text-slate-100">Select Game</h2>
          <p class="mt-1 text-sm text-slate-400">
            Choose which game you want to gift to start the cascade.
          </p>

          <div class="mt-4">
            <label for="game_id" class="block text-sm font-medium text-slate-300">Game *</label>
            <select
              id="game_id"
              name="game_id"
              bind:value={selectedGameId}
              required
              class="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
            <div class="mt-3 rounded border border-slate-700 bg-slate-800/40 p-3 text-sm">
              <p class="text-slate-300">
                <strong>Selected:</strong>
                {selectedGame.title}
              </p>
              <p class="text-slate-400">
                <strong>Condition:</strong>
                {selectedGame.condition}
              </p>
            </div>
          {/if}
        </div>

        <!-- Gift Cascade Details -->
        <div class="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <h2 class="text-xl font-semibold text-slate-100">Gift Cascade Details</h2>
          <p class="mt-1 text-sm text-slate-400">
            Customize your gift cascade (all optional except deadline).
          </p>

          <div class="mt-4 space-y-4">
            <!-- Name -->
            <div>
              <label for="name" class="block text-sm font-medium text-slate-300"
                >Gift Cascade Name (optional)</label
              >
              <input
                type="text"
                id="name"
                name="name"
                bind:value={cascadeName}
                maxlength="120"
                placeholder="e.g., Wellington Area Gift Cascade, Party Games Only"
                class="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <!-- Description -->
            <div>
              <label for="description" class="block text-sm font-medium text-slate-300"
                >Description (optional)</label
              >
              <textarea
                id="description"
                name="description"
                bind:value={description}
                maxlength="2000"
                rows="3"
                placeholder="Add any additional context about this cascade..."
                class="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <!-- Deadline -->
            <div>
              <label for="deadline_days" class="block text-sm font-medium text-slate-300"
                >Entry Deadline *</label
              >
              <select
                id="deadline_days"
                name="deadline_days"
                bind:value={deadlineDays}
                required
                class="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value={7}>7 days</option>
                <option value={14}>14 days (recommended)</option>
                <option value={21}>21 days</option>
                <option value={30}>30 days</option>
              </select>
              <p class="mt-1 text-xs text-slate-500">
                How long people have to enter before a recipient is randomly selected.
              </p>
            </div>

            <!-- Region -->
            <div>
              <label for="region" class="block text-sm font-medium text-slate-300"
                >Region (optional)</label
              >
              <select
                id="region"
                name="region"
                bind:value={region}
                class="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {#each NZ_REGIONS as region}
                  <option value={region.value}>{region.label}</option>
                {/each}
              </select>
            </div>

            <!-- Shipping -->
            <div>
              <label for="shipping_requirement" class="block text-sm font-medium text-slate-300"
                >Shipping *</label
              >
              <select
                id="shipping_requirement"
                name="shipping_requirement"
                bind:value={shippingRequirement}
                required
                class="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="pickup_only">Pickup only</option>
                <option value="shipping_available">Shipping available (I'll pay)</option>
                <option value="shipping_only">Shipping only (recipient pays)</option>
              </select>
            </div>

            <!-- Special Rules -->
            <div>
              <label for="special_rules" class="block text-sm font-medium text-slate-300"
                >Special Rules (optional)</label
              >
              <textarea
                id="special_rules"
                name="special_rules"
                bind:value={specialRules}
                maxlength="1000"
                rows="2"
                placeholder="e.g., Must be willing to pass on a party game, First-time cascade participants only"
                class="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
            <li>• The recipient will be expected to create their own gift cascade within 30 days</li>
            <li>• This builds your Gift Cascade Seed Starter badge!</li>
          </ul>
        </div>

        <!-- Submit -->
        <div class="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting || !selectedGameId}
            class="flex-1 rounded-lg border border-emerald-500 bg-emerald-500/10 px-6 py-3 font-semibold text-emerald-200 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Start Gift Cascade'}
          </button>
          <a
            href="/cascades"
            class="rounded-lg border border-slate-700 px-6 py-3 font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-900/60"
          >
            Cancel
          </a>
        </div>
      </form>
    {/if}
  </div>
</main>
