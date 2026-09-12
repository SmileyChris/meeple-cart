<script lang="ts">
  import type { PageData } from './$types';
  import StatusHistory from '$lib/components/StatusHistory.svelte';
  import Alert from '$lib/components/Alert.svelte';
  import { pb } from '$lib/pocketbase';
  import { invalidate } from '$app/navigation';

  let { data }: { data: PageData } = $props();

  let showAddForm = $state(false);
  let editingGameId = $state<string | null>(null);

  let addFormValues = $state({
    title: '',
    condition: 'excellent',
    notes: '',
    bgg_id: '',
    can_post: false,
  });

  let manageError = $state<string | null>(null);
  let addingGame = $state(false);
  let savingGameId = $state<string | null>(null);
  let removingGameId = $state<string | null>(null);
  let updatingStatusId = $state<string | null>(null);

  const toggleAddForm = () => {
    showAddForm = !showAddForm;
    if (!showAddForm) {
      Object.assign(addFormValues, {
        title: '',
        condition: 'excellent',
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

  function errorMessageFor(err: unknown): string {
    const status = (err as { status?: number } | null)?.status;
    if (status === 400) return 'Invalid data. Please check the form and try again.';
    if (status === 403) return 'You do not have permission to do that.';
    return 'Something went wrong. Please try again later.';
  }

  async function handleAddGame(event: SubmitEvent) {
    event.preventDefault();
    manageError = null;
    addingGame = true;

    try {
      const payload: Record<string, unknown> = {
        listing: data.listing.id,
        title: addFormValues.title.trim(),
        condition: addFormValues.condition,
        notes: addFormValues.notes.trim(),
        can_post: addFormValues.can_post,
        status: 'available',
      };
      const bggId = addFormValues.bgg_id.trim();
      if (bggId) payload.bgg_id = parseInt(bggId, 10);

      await pb.collection('items').create(payload);
      await invalidate('app:listing-manage');
      toggleAddForm();
    } catch (err) {
      console.error('Failed to add game:', err);
      manageError = errorMessageFor(err);
    } finally {
      addingGame = false;
    }
  }

  async function handleUpdateGame(event: SubmitEvent, gameId: string) {
    event.preventDefault();
    manageError = null;
    savingGameId = gameId;

    try {
      const formData = new FormData(event.currentTarget as HTMLFormElement);
      const payload: Record<string, unknown> = {
        title: String(formData.get('title') ?? '').trim(),
        condition: String(formData.get('condition') ?? ''),
        notes: String(formData.get('notes') ?? '').trim(),
        can_post: formData.get('can_post') === 'on',
      };
      const bggId = String(formData.get('bgg_id') ?? '').trim();
      if (bggId) payload.bgg_id = parseInt(bggId, 10);

      await pb.collection('items').update(gameId, payload);
      await invalidate('app:listing-manage');
      editingGameId = null;
    } catch (err) {
      console.error('Failed to update game:', err);
      manageError = errorMessageFor(err);
    } finally {
      savingGameId = null;
    }
  }

  async function handleRemoveGame(gameId: string) {
    if (!confirm('Are you sure you want to remove this game?')) return;

    manageError = null;
    removingGameId = gameId;

    try {
      await pb.collection('items').delete(gameId);
      await invalidate('app:listing-manage');
    } catch (err) {
      console.error('Failed to remove game:', err);
      manageError = errorMessageFor(err);
    } finally {
      removingGameId = null;
    }
  }

  async function handleStatusChange(gameId: string, status: string) {
    manageError = null;
    updatingStatusId = gameId;

    try {
      await pb.collection('items').update(gameId, { status });
      await invalidate('app:listing-manage');
    } catch (err) {
      console.error('Failed to update game status:', err);
      manageError = errorMessageFor(err);
    } finally {
      updatingStatusId = null;
    }
  }
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

    {#if manageError}
      <Alert type="error">{manageError}</Alert>
    {/if}

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
          <form onsubmit={handleAddGame} class="space-y-4">
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

              <!-- Note: Price and trade value removed - now handled via offer_templates -->

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
                  🚚 Can post (available for courier/postal delivery)
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
                class="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                type="submit"
                disabled={addingGame}
              >
                {addingGame ? 'Adding...' : 'Add Game'}
              </button>
            </div>
          </form>
        </section>
      {/if}

      <div class="space-y-4">
        {#each data.games as game (game.id)}
          <section class="rounded-xl border border-subtle bg-surface-card transition-colors p-6">
            {#if editingGameId === game.id}
              <form onsubmit={(event) => handleUpdateGame(event, game.id)} class="space-y-4">
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
                      🚚 Can post (available for courier/postal delivery)
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
                    class="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-[var(--accent-contrast)] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                    type="submit"
                    disabled={savingGameId === game.id}
                  >
                    {savingGameId === game.id ? 'Saving...' : 'Save Changes'}
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
                      <!-- Note: Price and trade_value display removed - now in offer_templates -->
                      {#if game.bgg_id}
                        <span>• BGG ID: {game.bgg_id}</span>
                      {/if}
                      {#if game.can_post}
                        <span>• 🚚 Can post</span>
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
                      <button
                        class="text-sm text-rose-400 transition hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-50"
                        type="button"
                        disabled={removingGameId === game.id}
                        onclick={() => handleRemoveGame(game.id)}
                      >
                        {removingGameId === game.id ? 'Removing...' : 'Remove'}
                      </button>
                    {/if}
                  </div>
                </div>

                {#if game.status !== 'sold'}
                  <div class="flex gap-2">
                    <span class="text-sm text-muted">Status:</span>
                    <select
                      class="rounded border border-subtle bg-surface-card transition-colors px-2 py-1 text-xs text-secondary"
                      value={game.status}
                      disabled={updatingStatusId === game.id}
                      onchange={(e) => handleStatusChange(game.id, e.currentTarget.value)}
                    >
                      {#each data.gameStatuses as status (status)}
                        <option value={status}
                          >{status.charAt(0).toUpperCase() + status.slice(1)}</option
                        >
                      {/each}
                    </select>
                  </div>
                {/if}
              </div>
            {/if}
          </section>
        {/each}
      </div>

      <!-- Offer Templates Section -->
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-semibold">
            Offer Templates ({data.templates.length})
          </h2>
          <a
            href="/listings/{data.listing.id}/templates/new"
            class="rounded-lg border border-emerald-500 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/10"
          >
            + Create Template
          </a>
        </div>

        {#if data.templates.length === 0}
          <div
            class="rounded-xl border border-dashed border-subtle bg-surface-card p-8 text-center transition-colors"
          >
            <div class="text-4xl opacity-20">📋</div>
            <p class="mt-4 text-sm text-muted">
              No offer templates yet. Create templates to let buyers know what you're willing to
              accept.
            </p>
            <a
              href="/listings/{data.listing.id}/templates/new"
              class="mt-4 inline-block text-sm text-accent hover:underline"
            >
              Create your first template →
            </a>
          </div>
        {:else}
          <div class="space-y-4">
            {#each data.templates as template (template.id)}
              <section
                class="rounded-xl border border-subtle bg-surface-card p-6 transition-colors"
              >
                <div class="space-y-3">
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <h3 class="text-lg font-semibold text-primary">
                        {template.display_name || 'Unnamed template'}
                      </h3>
                      <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                        <span class="flex items-center gap-1">
                          {#if template.template_type === 'cash_only'}
                            💰 Cash only
                          {:else if template.template_type === 'trade_only'}
                            🔄 Trade only
                          {:else}
                            💰🔄 Cash or trade
                          {/if}
                        </span>
                        {#if template.cash_amount}
                          <span>
                            • ${(template.cash_amount / 100).toFixed(2)} NZD
                            {#if template.open_to_lower_offers}(OBO){/if}
                          </span>
                        {/if}
                        <span
                          class={template.status === 'active' ? 'text-emerald-400' : 'text-muted'}
                        >
                          • {template.status.charAt(0).toUpperCase() + template.status.slice(1)}
                        </span>
                      </div>

                      {#if template.expand?.items && Array.isArray(template.expand.items)}
                        <div class="mt-3">
                          <span class="text-xs font-medium text-secondary">Items included:</span>
                          <div class="mt-1 flex flex-wrap gap-2">
                            {#each template.expand.items as item (item.id)}
                              <span
                                class="rounded-full bg-surface-body px-2 py-1 text-xs text-muted"
                              >
                                {item.title}
                              </span>
                            {/each}
                          </div>
                        </div>
                      {/if}

                      {#if template.trade_for_items && template.trade_for_items.length > 0}
                        <div class="mt-3">
                          <span class="text-xs font-medium text-secondary">Wants in trade:</span>
                          <div class="mt-1 flex flex-wrap gap-2">
                            {#each template.trade_for_items as wantedItem (wantedItem.title)}
                              <span
                                class="rounded-full bg-surface-body px-2 py-1 text-xs text-muted"
                              >
                                {wantedItem.title}
                                {#if wantedItem.bgg_id}(BGG {wantedItem.bgg_id}){/if}
                              </span>
                            {/each}
                          </div>
                        </div>
                      {/if}

                      {#if template.notes}
                        <p class="mt-3 text-sm text-muted">{template.notes}</p>
                      {/if}
                    </div>

                    <div class="flex gap-2">
                      {#if template.status === 'active'}
                        <button
                          class="text-sm text-muted transition hover:text-secondary"
                          type="button"
                          onclick={async () => {
                            if (
                              confirm(
                                'Withdraw this template? It will no longer be visible to buyers.'
                              )
                            ) {
                              try {
                                await pb
                                  .collection('offer_templates')
                                  .update(template.id, { status: 'withdrawn' });
                                await invalidate('app:listing-manage');
                              } catch (err) {
                                console.error('Failed to withdraw template:', err);
                                alert('Failed to withdraw template');
                              }
                            }
                          }}
                        >
                          Withdraw
                        </button>
                      {/if}
                      <button
                        class="text-sm text-rose-400 transition hover:text-rose-300"
                        type="button"
                        onclick={async () => {
                          if (confirm('Delete this template permanently?')) {
                            try {
                              await pb.collection('offer_templates').delete(template.id);
                              await invalidate('app:listing-manage');
                            } catch (err) {
                              console.error('Failed to delete template:', err);
                              alert('Failed to delete template');
                            }
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            {/each}
          </div>
        {/if}
      </div>

      <StatusHistory statusHistory={data.statusHistory} />
    </div>
  </div>
</main>
