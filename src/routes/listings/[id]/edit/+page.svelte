<script lang="ts">
  import type { PageData, ActionData } from './$types';
  import { enhance } from '$app/forms';

  export let data: PageData;
  export let form: ActionData;

  const listing = data.listing;
  const games = data.games;

  let isSubmitting = false;

  const formatCurrency = (value: number | null | undefined) => {
    if (value == null) return '';
    return value.toString();
  };
</script>

<svelte:head>
  <title>Edit Prices - {listing.title} · Meeple Cart</title>
</svelte:head>

<main class="bg-slate-950 px-6 py-12 text-slate-100 sm:px-8">
  <div class="mx-auto max-w-4xl space-y-8">
    <!-- Header -->
    <header class="space-y-3">
      <nav class="flex items-center gap-3 text-sm text-slate-400">
        <!-- eslint-disable svelte/no-navigation-without-resolve -->
        <a class="hover:text-emerald-300" href="/profile">Profile</a>
        <span>/</span>
        <a class="hover:text-emerald-300" href={`/listings/${listing.id}`}>{listing.title}</a>
        <span>/</span>
        <span>Edit Prices</span>
        <!-- eslint-enable svelte/no-navigation-without-resolve -->
      </nav>
      <h1 class="text-3xl font-semibold tracking-tight">Edit Game Prices</h1>
      <p class="text-sm text-slate-400">
        Update prices for games in this listing. Price drops will notify users watching this
        listing.
      </p>
    </header>

    <!-- Success/Error Messages -->
    {#if form?.success}
      <div class="rounded-lg bg-emerald-500/10 px-4 py-3 text-emerald-300">
        ✓ {form.message || 'Prices updated successfully'}
      </div>
    {/if}

    {#if form?.error}
      <div class="rounded-lg bg-rose-500/10 px-4 py-3 text-rose-400">
        {form.error}
      </div>
    {/if}

    <!-- Edit Form -->
    <form
      method="POST"
      action="?/update_prices"
      use:enhance={() => {
        isSubmitting = true;
        return async ({ update }) => {
          await update();
          isSubmitting = false;
        };
      }}
      class="space-y-6"
    >
      <!-- Games List -->
      <div class="space-y-4">
        <h2 class="text-xl font-semibold text-slate-100">Games in this listing</h2>

        {#if games.length === 0}
          <p class="text-slate-400">No games found in this listing.</p>
        {:else}
          <div class="space-y-4">
            {#each games as game (game.id)}
              <div
                class="rounded-xl border border-slate-800 bg-slate-900/60 p-5 transition hover:border-slate-700"
              >
                <div class="space-y-4">
                  <!-- Game Header -->
                  <div class="border-b border-slate-800 pb-3">
                    <h3 class="text-lg font-semibold text-slate-100">{game.title}</h3>
                    {#if game.year}
                      <p class="text-sm text-slate-400">({game.year})</p>
                    {/if}
                  </div>

                  <!-- Price Fields -->
                  <div class="grid gap-4 sm:grid-cols-2">
                    <!-- Price -->
                    <div>
                      <label for="price_{game.id}" class="mb-2 block text-sm text-slate-300">
                        Price (NZD)
                      </label>
                      <input
                        type="number"
                        id="price_{game.id}"
                        name="price_{game.id}"
                        value={formatCurrency(game.price)}
                        step="0.01"
                        min="0"
                        placeholder="No price set"
                        class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                      />
                      {#if form?.fieldErrors?.[`price_${game.id}`]}
                        <p class="mt-1 text-sm text-rose-400">
                          {form.fieldErrors[`price_${game.id}`]}
                        </p>
                      {/if}
                    </div>

                    <!-- Trade Value -->
                    <div>
                      <label for="trade_value_{game.id}" class="mb-2 block text-sm text-slate-300">
                        Trade Value (NZD)
                      </label>
                      <input
                        type="number"
                        id="trade_value_{game.id}"
                        name="trade_value_{game.id}"
                        value={formatCurrency(game.trade_value)}
                        step="0.01"
                        min="0"
                        placeholder="No trade value set"
                        class="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                      />
                      {#if form?.fieldErrors?.[`trade_value_${game.id}`]}
                        <p class="mt-1 text-sm text-rose-400">
                          {form.fieldErrors[`trade_value_${game.id}`]}
                        </p>
                      {/if}
                    </div>
                  </div>

                  <!-- Current Price Info -->
                  {#if game.price !== null || game.trade_value !== null}
                    <div class="text-xs text-slate-500">
                      Current:
                      {#if game.price !== null}
                        <span>Price ${game.price.toFixed(2)}</span>
                      {/if}
                      {#if game.price !== null && game.trade_value !== null}
                        <span class="mx-1">·</span>
                      {/if}
                      {#if game.trade_value !== null}
                        <span>Trade Value ${game.trade_value.toFixed(2)}</span>
                      {/if}
                    </div>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Actions -->
      <div class="flex gap-3 border-t border-slate-800 pt-6">
        <!-- eslint-disable svelte/no-navigation-without-resolve -->
        <a
          href={`/listings/${listing.id}`}
          class="rounded-lg border border-slate-700 px-6 py-2 text-center text-slate-300 transition hover:border-emerald-500 hover:text-emerald-300"
        >
          Cancel
        </a>
        <!-- eslint-enable svelte/no-navigation-without-resolve -->
        <button
          type="submit"
          disabled={isSubmitting || games.length === 0}
          class="flex-1 rounded-lg bg-emerald-500 px-6 py-2 font-medium text-slate-900 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save Prices'}
        </button>
      </div>
    </form>

    <!-- Help Text -->
    <div class="rounded-lg border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-400">
      <h3 class="mb-2 font-semibold text-slate-300">💡 Price Drop Tips</h3>
      <ul class="space-y-1">
        <li>
          • Price drops are shown publicly after 3 days from listing creation (prevents gaming)
        </li>
        <li>
          • Users watching this listing will be notified of price drops if they've enabled
          notifications
        </li>
        <li>• Leave fields empty to remove pricing (e.g., for trade-only or negotiable items)</li>
        <li>• Previous lowest price is shown (not the most recent price)</li>
      </ul>
    </div>
  </div>
</main>
