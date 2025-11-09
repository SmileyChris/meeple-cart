<script lang="ts">
  import { pb, currentUser } from '$lib/pocketbase';
  import type {
    TradePartySubmissionRecord,
    TradePartyWantListRecord,
  } from '$lib/types/pocketbase';

  interface Props {
    mySubmission: TradePartySubmissionRecord;
    availableSubmissions: TradePartySubmissionRecord[];
    tradePartyId: string;
    onSave?: () => void;
  }

  let { mySubmission, availableSubmissions, tradePartyId, onSave }: Props = $props();

  // State for selected want list items with rankings
  let selectedWants = $state<
    Array<{
      submission: TradePartySubmissionRecord;
      rank: number;
    }>
  >([]);
  let noTrade = $state(false);
  let isSaving = $state(false);
  let error = $state('');
  let isLoading = $state(true);

  // Load existing want list on mount
  $effect(() => {
    loadExistingWantList();
  });

  async function loadExistingWantList() {
    if (!$currentUser) return;

    try {
      isLoading = true;
      const wantLists = await pb.collection('trade_party_want_lists').getFullList({
        filter: `my_submission = "${mySubmission.id}"`,
        expand: 'wanted_submission',
        sort: 'preference_rank',
      });

      // Check for "no trade" option
      const noTradeEntry = wantLists.find((w) => !w.wanted_submission);
      if (noTradeEntry) {
        noTrade = true;
      }

      // Load ranked preferences
      selectedWants = wantLists
        .filter((w) => w.wanted_submission)
        .map((w) => ({
          submission: w.expand?.wanted_submission as TradePartySubmissionRecord,
          rank: w.preference_rank,
        }));
    } catch (err) {
      console.error('Failed to load want list:', err);
    } finally {
      isLoading = false;
    }
  }

  function toggleSubmission(submission: TradePartySubmissionRecord) {
    const index = selectedWants.findIndex((w) => w.submission.id === submission.id);

    if (index >= 0) {
      // Remove from want list
      selectedWants = selectedWants.filter((_, i) => i !== index);
      // Renumber ranks
      selectedWants = selectedWants.map((w, i) => ({ ...w, rank: i + 1 }));
    } else {
      // Add to want list with next rank
      selectedWants = [...selectedWants, { submission, rank: selectedWants.length + 1 }];
    }
  }

  function moveUp(index: number) {
    if (index === 0) return;

    const newWants = [...selectedWants];
    [newWants[index - 1], newWants[index]] = [newWants[index], newWants[index - 1]];

    // Renumber ranks
    selectedWants = newWants.map((w, i) => ({ ...w, rank: i + 1 }));
  }

  function moveDown(index: number) {
    if (index === selectedWants.length - 1) return;

    const newWants = [...selectedWants];
    [newWants[index], newWants[index + 1]] = [newWants[index + 1], newWants[index]];

    // Renumber ranks
    selectedWants = newWants.map((w, i) => ({ ...w, rank: i + 1 }));
  }

  async function handleSave() {
    if (!$currentUser) return;

    isSaving = true;
    error = '';

    try {
      // Delete existing want lists for this submission
      const existing = await pb.collection('trade_party_want_lists').getFullList({
        filter: `my_submission = "${mySubmission.id}"`,
      });

      await Promise.all(existing.map((w) => pb.collection('trade_party_want_lists').delete(w.id)));

      // Create new want list entries
      if (noTrade) {
        // Create "no trade" entry
        await pb.collection('trade_party_want_lists').create({
          my_submission: mySubmission.id,
          wanted_submission: null,
          preference_rank: 1,
        });
      } else {
        // Create entries for each selected submission
        await Promise.all(
          selectedWants.map((w) =>
            pb.collection('trade_party_want_lists').create({
              my_submission: mySubmission.id,
              wanted_submission: w.submission.id,
              preference_rank: w.rank,
            })
          )
        );
      }

      if (onSave) {
        onSave();
      }
    } catch (err: any) {
      console.error('Failed to save want list:', err);
      error = err.message || 'Failed to save want list. Please try again.';
    } finally {
      isSaving = false;
    }
  }

  // Filter out user's own submissions
  let otherSubmissions = $derived(
    availableSubmissions.filter((s) => s.id !== mySubmission.id && s.user !== $currentUser?.id)
  );

  let isSelected = $derived((submissionId: string) =>
    selectedWants.some((w) => w.submission.id === submissionId)
  );
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-start justify-between">
    <div>
      <h3 class="text-lg font-semibold text-primary">
        Build Want List for: {mySubmission.title}
      </h3>
      <p class="text-sm text-muted">
        Select games you'd want to receive in exchange for this game, ranked by preference
      </p>
    </div>
  </div>

  {#if error}
    <div class="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
      <p class="text-sm text-red-200">{error}</p>
    </div>
  {/if}

  {#if isLoading}
    <div class="flex items-center justify-center py-8">
      <div
        class="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent"
      ></div>
    </div>
  {:else}
    <!-- No Trade Option -->
    <div class="rounded-lg border border-subtle bg-surface-card p-4">
      <label class="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          bind:checked={noTrade}
          class="h-5 w-5 rounded border-subtle bg-surface-body text-accent focus:ring-2 focus:ring-accent/20"
        />
        <div>
          <span class="font-semibold text-primary">I don't want to trade this game</span>
          <p class="text-xs text-muted">
            Select this if you don't want any of the available games in exchange
          </p>
        </div>
      </label>
    </div>

    {#if !noTrade}
      <!-- Selected Want List (Ranked) -->
      {#if selectedWants.length > 0}
        <div class="rounded-lg border border-subtle bg-surface-card p-4">
          <h4 class="mb-3 font-semibold text-primary">
            Your Want List ({selectedWants.length} selected)
          </h4>
          <div class="space-y-2">
            {#each selectedWants as want, index}
              <div class="flex items-center gap-3 rounded-lg border border-subtle bg-surface-body p-3">
                <div class="flex flex-col gap-1">
                  <button
                    onclick={() => moveUp(index)}
                    disabled={index === 0}
                    class="rounded border border-subtle bg-surface-card p-1 text-xs text-secondary hover:bg-surface-body disabled:opacity-30"
                  >
                    ▲
                  </button>
                  <button
                    onclick={() => moveDown(index)}
                    disabled={index === selectedWants.length - 1}
                    class="rounded border border-subtle bg-surface-card p-1 text-xs text-secondary hover:bg-surface-body disabled:opacity-30"
                  >
                    ▼
                  </button>
                </div>

                <div
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-surface-body"
                >
                  {want.rank}
                </div>

                <div class="flex-1">
                  <div class="font-medium text-primary">{want.submission.title}</div>
                  <div class="text-xs text-muted capitalize">
                    {want.submission.condition.replace('_', ' ')}
                  </div>
                </div>

                <button
                  onclick={() => toggleSubmission(want.submission)}
                  class="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1 text-sm text-red-200 hover:bg-red-500/20"
                >
                  Remove
                </button>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Available Submissions -->
      <div class="rounded-lg border border-subtle bg-surface-card p-4">
        <h4 class="mb-3 font-semibold text-primary">Available Games to Trade For</h4>

        {#if otherSubmissions.length === 0}
          <p class="text-sm text-muted">No other games available yet</p>
        {:else}
          <div class="space-y-2">
            {#each otherSubmissions as submission}
              <button
                onclick={() => toggleSubmission(submission)}
                class="w-full rounded-lg border p-3 text-left transition {isSelected(
                  submission.id
                )
                  ? 'border-accent bg-accent/10'
                  : 'border-subtle bg-surface-body hover:border-accent/50'}"
              >
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <div class="font-medium text-primary">{submission.title}</div>
                    <div class="text-xs text-muted capitalize">
                      {submission.condition.replace('_', ' ')}
                      {#if submission.bgg_id}
                        · BGG #{submission.bgg_id}
                      {/if}
                    </div>
                    {#if submission.description}
                      <div class="mt-1 text-xs text-secondary line-clamp-2">
                        {submission.description}
                      </div>
                    {/if}
                  </div>

                  {#if isSelected(submission.id)}
                    <div class="ml-3 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-surface-body">
                      #{selectedWants.find((w) => w.submission.id === submission.id)?.rank}
                    </div>
                  {/if}
                </div>
              </button>
            {/each}
          </div>
        {/if}
      </div>
    {/if}

    <!-- Save Button -->
    <div class="flex justify-end gap-3">
      <button
        onclick={handleSave}
        disabled={isSaving || (!noTrade && selectedWants.length === 0)}
        class="rounded-lg border border-accent bg-accent px-6 py-2 font-semibold text-surface-body transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSaving ? 'Saving...' : 'Save Want List'}
      </button>
    </div>
  {/if}
</div>
