<script lang="ts">
  import type { PageData } from './$types';
  import StatusHistory from '$lib/components/StatusHistory.svelte';

  let { data }: { data: PageData } = $props();

  let showAddForm = $state(false);
  let editingGameId = $state<string | null>(null);

  let addFormValues = $state({
    title: '',
    condition: 'excellent',
    price: '',
    trade_value: '',
    notes: '',
    bgg_id: '',
    can_post: false,
  });

  const toggleAddForm = () => {
    showAddForm = !showAddForm;
    if (!showAddForm) {
      Object.assign(addFormValues, {
        title: '',
        condition: 'excellent',
        price: '',
        trade_value: '',
        notes: '',
        bgg_id: '',
        can_post: false,
      });
    }
  };

  const startEditing = (gameId: string) => {
    editingGameId = gameId;
  };

  const cancelEditing = () => {
    editingGameId = null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'text-emerald-400';
      case 'pending':
        return 'text-amber-400';
      case 'sold':
        return 'text-muted';
      case 'bundled':
        return 'text-blue-400';
      default:
        return 'text-muted';
    }
  };

  // TODO: Migrate form actions to client-side mutations
  // Form submissions won't work until migrated to use PocketBase SDK directly
</script>

<svelte:head>
  <title>Manage Games · {data.listing.title} · Meeple Cart</title>
</svelte:head>

<main class="bg-surface-body transition-colors px-6 py-12 text-primary sm:px-8">
  <div class="mx-auto max-w-4xl space-y-8">
    <header class="space-y-4">
      <div class="flex items-center gap-4">
        <!-- eslint-disable svelte/no-navigation-without-resolve -->
        <a
          href="/profile"
          class="rounded-lg p-2 text-muted transition hover:bg-surface-card-alt hover:text-secondary"
        >
          <!-- eslint-enable svelte/no-navigation-without-resolve -->
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </a>
        <div class="flex-1">
          <h1 class="text-3xl font-semibold tracking-tight">Manage Games</h1>
          <p class="mt-1 text-sm text-muted">{data.listing.title}</p>
        </div>
      </div>
    </header>

    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold">
          Games ({data.games.length})
        </h2>
        <button
          class="rounded-lg border border-emerald-500 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/10"
          type="button"
          onclick={toggleAddForm}
        >
          {showAddForm ? 'Cancel' : '+ Add Game'}
        </button>
      </div>

      {#if showAddForm}
        <section class="rounded-xl border border-subtle bg-surface-card transition-colors p-6">
          <h3 class="mb-4 text-lg font-medium">Add New Game</h3>
          <form method="POST" action="?/add_game" class="space-y-4">
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="sm:col-span-2">
                <label class="block text-sm font-medium text-secondary" for="new_title"
                  >Game title</label
                >
                <input
                  class="mt-2 w-full rounded-lg border border-subtle bg-surface-body transition-colors px-3 py-2 text-primary focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
                  id="new_title"
                  name="title"
                  placeholder="Eg: Gloomhaven"
                  required
                  maxlength="200"
                  bind:value={addFormValues.title}
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-secondary" for="new_condition"
                  >Condition</label
                >
                <select
                  class="mt-2 w-full rounded-lg border border-subtle bg-surface-body transition-colors px-3 py-2 text-primary focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
                  id="new_condition"
                  name="condition"
                  required
                  bind:value={addFormValues.condition}
                >
                  {#each data.conditionOptions as option (option)}
                    <option value={option}
                      >{option.charAt(0).toUpperCase() + option.slice(1)}</option
                    >
                  {/each}
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-secondary" for="new_price"
                  >Price (NZD)</label
                >
                <input
                  class="mt-2 w-full rounded-lg border border-subtle bg-surface-body transition-colors px-3 py-2 text-primary focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
                  id="new_price"
                  name="price"
                  placeholder="Optional"
                  inputmode="decimal"
                  bind:value={addFormValues.price}
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-secondary" for="new_trade_value"
                  >Trade value (NZD)</label
                >
                <input
                  class="mt-2 w-full rounded-lg border border-subtle bg-surface-body transition-colors px-3 py-2 text-primary focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
                  id="new_trade_value"
                  name="trade_value"
                  placeholder="Optional"
                  inputmode="decimal"
                  bind:value={addFormValues.trade_value}
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-secondary" for="new_bgg_id"
                  >BoardGameGeek ID</label
                >
                <input
                  class="mt-2 w-full rounded-lg border border-subtle bg-surface-body transition-colors px-3 py-2 text-primary focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
                  id="new_bgg_id"
                  name="bgg_id"
                  placeholder="Optional"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  bind:value={addFormValues.bgg_id}
                />
              </div>

              <div class="sm:col-span-2">
                <label class="block text-sm font-medium text-secondary" for="new_notes"
                  >Copy notes</label
                >
                <textarea
                  class="mt-2 min-h-[120px] w-full rounded-lg border border-subtle bg-surface-body transition-colors px-3 py-2 text-primary focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
                  id="new_notes"
                  name="notes"
                  maxlength="2000"
                  placeholder="Mention wear, missing components, or house-rule kits."
                  bind:value={addFormValues.notes}
                ></textarea>
              </div>

              <div class="sm:col-span-2">
                <label class="flex items-center gap-2 text-sm text-secondary">
                  <input
                    class="h-4 w-4 rounded border border-subtle bg-surface-body transition-colors"
                    type="checkbox"
                    name="can_post"
                    bind:checked={addFormValues.can_post}
                  />
                  📮 Can post (available for courier/postal delivery)
                </label>
              </div>
            </div>

            <div class="flex justify-end gap-3">
              <button
                class="rounded-lg border border-subtle px-4 py-2 text-sm text-secondary transition hover:border-strong"
                type="button"
                onclick={toggleAddForm}
              >
                Cancel
              </button>
              <button
                class="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)] transition hover:bg-emerald-400"
                type="submit"
              >
                Add Game
              </button>
            </div>
          </form>
        </section>
      {/if}

      <div class="space-y-4">
        {#each data.games as game (game.id)}
          <section class="rounded-xl border border-subtle bg-surface-card transition-colors p-6">
            {#if editingGameId === game.id}
              <form method="POST" action="?/update_game" class="space-y-4">
                <input type="hidden" name="game_id" value={game.id} />

                <div class="grid gap-4 sm:grid-cols-2">
                  <div class="sm:col-span-2">
                    <label
                      class="block text-sm font-medium text-secondary"
                      for="edit_title_{game.id}">Game title</label
                    >
                    <input
                      class="mt-2 w-full rounded-lg border border-subtle bg-surface-body transition-colors px-3 py-2 text-primary focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
                      id="edit_title_{game.id}"
                      name="title"
                      required
                      maxlength="200"
                      value={game.title}
                    />
                  </div>

                  <div>
                    <label
                      class="block text-sm font-medium text-secondary"
                      for="edit_condition_{game.id}">Condition</label
                    >
                    <select
                      class="mt-2 w-full rounded-lg border border-subtle bg-surface-body transition-colors px-3 py-2 text-primary focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
                      id="edit_condition_{game.id}"
                      name="condition"
                      required
                      value={game.condition}
                    >
                      {#each data.conditionOptions as option (option)}
                        <option value={option}
                          >{option.charAt(0).toUpperCase() + option.slice(1)}</option
                        >
                      {/each}
                    </select>
                  </div>

                  <div>
                    <label
                      class="block text-sm font-medium text-secondary"
                      for="edit_bgg_id_{game.id}">BoardGameGeek ID</label
                    >
                    <input
                      class="mt-2 w-full rounded-lg border border-subtle bg-surface-body transition-colors px-3 py-2 text-primary focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
                      id="edit_bgg_id_{game.id}"
                      name="bgg_id"
                      placeholder="Optional"
                      inputmode="numeric"
                      pattern="[0-9]*"
                      value={game.bgg_id ?? ''}
                    />
                  </div>

                  <div class="sm:col-span-2">
                    <label
                      class="block text-sm font-medium text-secondary"
                      for="edit_notes_{game.id}">Copy notes</label
                    >
                    <textarea
                      class="mt-2 min-h-[120px] w-full rounded-lg border border-subtle bg-surface-body transition-colors px-3 py-2 text-primary focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
                      id="edit_notes_{game.id}"
                      name="notes"
                      maxlength="2000"
                      placeholder="Mention wear, missing components, or house-rule kits."
                      >{game.notes ?? ''}</textarea
                    >
                  </div>

                  <div class="sm:col-span-2">
                    <label class="flex items-center gap-2 text-sm text-secondary">
                      <input
                        class="h-4 w-4 rounded border border-subtle bg-surface-body transition-colors"
                        type="checkbox"
                        name="can_post"
                        checked={game.can_post ?? false}
                      />
                      📮 Can post (available for courier/postal delivery)
                    </label>
                  </div>
                </div>

                <div class="flex justify-end gap-3">
                  <button
                    class="rounded-lg border border-subtle px-4 py-2 text-sm text-secondary transition hover:border-strong"
                    type="button"
                    onclick={cancelEditing}
                  >
                    Cancel
                  </button>
                  <button
                    class="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)] transition hover:bg-emerald-400"
                    type="submit"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            {:else}
              <div class="space-y-4">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <h3 class="text-lg font-semibold text-primary">{game.title}</h3>
                    <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                      <span
                        >Condition: <span class="text-secondary"
                          >{game.condition.charAt(0).toUpperCase() + game.condition.slice(1)}</span
                        ></span
                      >
                      <span class={getStatusColor(game.status)}
                        >• {game.status.charAt(0).toUpperCase() + game.status.slice(1)}</span
                      >
                      {#if game.price}
                        <span>• Price: ${game.price.toFixed(2)} NZD</span>
                      {/if}
                      {#if game.trade_value}
                        <span>• Trade Value: ${game.trade_value.toFixed(2)} NZD</span>
                      {/if}
                      {#if game.bgg_id}
                        <span>• BGG ID: {game.bgg_id}</span>
                      {/if}
                      {#if game.can_post}
                        <span>• 📮 Can post</span>
                      {/if}
                    </div>
                    {#if game.notes}
                      <p class="mt-2 text-sm text-muted">{game.notes}</p>
                    {/if}
                  </div>

                  <div class="flex gap-2">
                    <button
                      class="text-sm text-emerald-400 transition hover:text-emerald-300"
                      type="button"
                      onclick={() => startEditing(game.id)}
                    >
                      Edit
                    </button>
                    {#if data.games.length > 1}
                      <form method="POST" action="?/remove_game" class="inline">
                        <input type="hidden" name="game_id" value={game.id} />
                        <button
                          class="text-sm text-rose-400 transition hover:text-rose-300"
                          type="submit"
                          onclick={(e) => {
                            if (!confirm('Are you sure you want to remove this game?')) {
                              e.preventDefault();
                            }
                          }}
                        >
                          Remove
                        </button>
                      </form>
                    {/if}
                  </div>
                </div>

                {#if game.status !== 'sold'}
                  <div class="flex gap-2">
                    <span class="text-sm text-muted">Status:</span>
                    <form method="POST" action="?/update_status" class="inline">
                      <input type="hidden" name="game_id" value={game.id} />
                      <select
                        class="rounded border border-subtle bg-surface-card transition-colors px-2 py-1 text-xs text-secondary"
                        name="status"
                        value={game.status}
                        onchange={(e) => e.currentTarget.form?.requestSubmit()}
                      >
                        {#each data.gameStatuses as status (status)}
                          <option value={status}
                            >{status.charAt(0).toUpperCase() + status.slice(1)}</option
                          >
                        {/each}
                      </select>
                    </form>
                  </div>
                {/if}
              </div>
            {/if}
          </section>
        {/each}
      </div>

      <StatusHistory statusHistory={data.statusHistory} />
    </div>
  </div>
</main>
