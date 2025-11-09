<script lang="ts">
  import { pb, currentUser } from '$lib/pocketbase';
  import type { PageData } from './$types';
  import type { TradePartySubmissionRecord } from '$lib/types/pocketbase';
  import SubmissionForm from '$lib/components/TradeParty/SubmissionForm.svelte';

  let { data }: { data: PageData } = $props();

  let party = $derived(data.party);
  let organizer = $derived(party.expand?.organizer);
  let isOrganizer = $derived($currentUser?.id === party.organizer);
  let mySubmissions = $derived(data.mySubmissions);

  let showSubmissionForm = $state(false);

  function handleSubmissionSuccess(submission: TradePartySubmissionRecord) {
    showSubmissionForm = false;
    // Refresh page data to show updated game count
    window.location.reload();
  }

  async function handleDeleteSubmission(submissionId: string) {
    if (!confirm('Are you sure you want to delete this submission?')) return;

    try {
      await pb.collection('trade_party_submissions').delete(submissionId);

      // Update party game count
      await pb.collection('trade_parties').update(party.id, {
        game_count: { $inc: -1 },
      });

      window.location.reload();
    } catch (err) {
      console.error('Failed to delete submission:', err);
      alert('Failed to delete submission. Please try again.');
    }
  }

  // Check current phase based on dates and status
  let now = $derived(new Date());
  let submissionsOpen = $derived(
    party.status === 'submissions' ||
      (new Date(party.submission_opens) <= now && new Date(party.submission_closes) > now)
  );
  let wantListsOpen = $derived(
    party.status === 'want_lists' ||
      (new Date(party.want_list_opens) <= now && new Date(party.want_list_closes) > now)
  );
  let resultsPublished = $derived(
    party.status === 'execution' || party.status === 'completed'
  );

  // Format date helper
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  // Get status badge color
  function getStatusColor(status: string) {
    switch (status) {
      case 'planning':
        return 'bg-blue-500/20 text-blue-200';
      case 'submissions':
        return 'bg-emerald-500/20 text-emerald-200';
      case 'want_lists':
        return 'bg-purple-500/20 text-purple-200';
      case 'matching':
        return 'bg-amber-500/20 text-amber-200';
      case 'execution':
        return 'bg-orange-500/20 text-orange-200';
      case 'completed':
        return 'bg-gray-500/20 text-gray-200';
      default:
        return 'bg-gray-500/20 text-gray-200';
    }
  }

  function getStatusLabel(status: string) {
    return status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }
</script>

<svelte:head>
  <title>{party.name} · Trade Party</title>
</svelte:head>

<div class="mx-auto max-w-4xl px-4 py-8">
  <!-- Party Header -->
  <div class="mb-8">
    <div class="mb-3 flex items-center gap-3">
      <span class="rounded-full px-3 py-1 text-sm font-semibold {getStatusColor(party.status)}">
        {getStatusLabel(party.status)}
      </span>
      {#if isOrganizer}
        <span class="rounded-full bg-accent/20 px-3 py-1 text-sm font-semibold text-accent">
          Organizer
        </span>
      {/if}
    </div>

    <h1 class="mb-3 text-4xl font-bold text-primary">{party.name}</h1>

    <div class="flex items-center gap-4 text-sm text-secondary">
      <span>
        Organized by {organizer?.display_name || organizer?.username || 'Unknown'}
      </span>
      <span>·</span>
      <span>{party.participant_count} participants</span>
      <span>·</span>
      <span>{party.game_count} games submitted</span>
    </div>
  </div>

  <!-- Phase-based Action Cards -->
  {#if $currentUser}
    {#if submissionsOpen}
      <!-- Submission Phase Active -->
      <div class="mb-8 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-6">
        <div class="mb-4 flex items-center gap-3">
          <span class="text-3xl">📦</span>
          <div>
            <h3 class="text-xl font-semibold text-emerald-200">Submission Phase Open</h3>
            <p class="text-sm text-emerald-300/80">
              Add games you want to trade until {formatDate(party.submission_closes)}
            </p>
          </div>
        </div>

        {#if showSubmissionForm}
          <SubmissionForm
            tradePartyId={party.id}
            onSuccess={handleSubmissionSuccess}
            onCancel={() => (showSubmissionForm = false)}
          />
        {:else}
          <button
            onclick={() => (showSubmissionForm = true)}
            class="rounded-lg border border-accent bg-accent px-6 py-2 font-semibold text-surface-body transition hover:bg-accent/90"
          >
            Submit a Game
          </button>
        {/if}
      </div>

      <!-- User's Submissions List -->
      {#if mySubmissions.length > 0}
        <div class="mb-8 rounded-lg border border-subtle bg-surface-card p-6">
          <h2 class="mb-4 text-lg font-semibold text-primary">Your Submissions ({mySubmissions.length})</h2>
          <div class="space-y-4">
            {#each mySubmissions as submission}
              <div class="flex items-start gap-4 rounded-lg border border-subtle bg-surface-body p-4">
                <div class="flex-1">
                  <div class="mb-2 flex items-start justify-between">
                    <div>
                      <h3 class="font-semibold text-primary">{submission.title}</h3>
                      {#if submission.bgg_id}
                        <a
                          href="https://boardgamegeek.com/boardgame/{submission.bgg_id}"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="text-xs text-muted hover:text-accent"
                        >
                          BGG #{submission.bgg_id}
                        </a>
                      {/if}
                    </div>
                    <span
                      class="rounded-full px-3 py-1 text-xs font-medium {submission.status ===
                      'approved'
                        ? 'bg-emerald-500/20 text-emerald-200'
                        : submission.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-200'
                          : 'bg-red-500/20 text-red-200'}"
                    >
                      {submission.status}
                    </span>
                  </div>

                  <div class="space-y-2 text-sm">
                    <div class="flex items-center gap-2">
                      <span class="text-muted">Condition:</span>
                      <span class="font-medium text-secondary capitalize">{submission.condition.replace('_', ' ')}</span>
                    </div>

                    {#if submission.description}
                      <div>
                        <span class="text-muted">Description:</span>
                        <p class="mt-1 text-secondary">{submission.description}</p>
                      </div>
                    {/if}

                    {#if submission.ship_from_region}
                      <div class="flex items-center gap-2">
                        <span class="text-muted">Ships from:</span>
                        <span class="text-secondary">{submission.ship_from_region}</span>
                      </div>
                    {/if}
                  </div>
                </div>

                <button
                  onclick={() => handleDeleteSubmission(submission.id)}
                  class="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/20"
                >
                  Delete
                </button>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    {:else if wantListsOpen}
      <!-- Want List Phase Active -->
      <div class="mb-8 rounded-lg border border-purple-500/30 bg-purple-500/10 p-6">
        <div class="mb-4 flex items-center gap-3">
          <span class="text-3xl">📝</span>
          <div>
            <h3 class="text-xl font-semibold text-purple-200">Want List Phase Open</h3>
            <p class="text-sm text-purple-300/80">
              Build your want lists until {formatDate(party.want_list_closes)}
            </p>
          </div>
        </div>
        <button
          disabled
          class="rounded-lg border border-accent bg-accent px-6 py-2 font-semibold text-surface-body opacity-50"
        >
          Build Want Lists (Coming Soon)
        </button>
      </div>
    {:else if resultsPublished}
      <!-- Results Published -->
      <div class="mb-8 rounded-lg border border-blue-500/30 bg-blue-500/10 p-6">
        <div class="mb-4 flex items-center gap-3">
          <span class="text-3xl">🎉</span>
          <div>
            <h3 class="text-xl font-semibold text-blue-200">Results Published!</h3>
            <p class="text-sm text-blue-300/80">
              The algorithm has run. Check your matches below.
            </p>
          </div>
        </div>
        <button
          disabled
          class="rounded-lg border border-accent bg-accent px-6 py-2 font-semibold text-surface-body opacity-50"
        >
          View My Matches (Coming Soon)
        </button>
      </div>
    {:else}
      <!-- Planning/Waiting Phase -->
      <div class="mb-8 rounded-lg border border-gray-500/30 bg-gray-500/10 p-6">
        <div class="flex items-start gap-3">
          <span class="text-2xl">⏳</span>
          <div>
            <p class="font-semibold text-gray-200">Waiting for Next Phase</p>
            <p class="mt-1 text-sm text-gray-300/80">
              Check back when submissions open on {formatDate(party.submission_opens)}
            </p>
          </div>
        </div>
      </div>
    {/if}
  {:else}
    <!-- Not logged in -->
    <div class="mb-8 rounded-lg border border-blue-500/30 bg-blue-500/10 p-6">
      <div class="mb-4">
        <p class="font-semibold text-blue-200">Sign in to Participate</p>
        <p class="mt-1 text-sm text-blue-300/80">
          Create an account or sign in to join this trade party
        </p>
      </div>
      <a
        href="/login?redirect=/trade-parties/{party.id}"
        class="inline-block rounded-lg border border-accent bg-accent px-6 py-2 font-semibold text-surface-body transition hover:bg-accent/90"
      >
        Sign In
      </a>
    </div>
  {/if}

  <!-- Description -->
  <div class="mb-8 rounded-lg border border-subtle bg-surface-card p-6">
    <h2 class="mb-3 text-lg font-semibold text-primary">About This Trade Party</h2>
    <div class="prose prose-invert max-w-none text-secondary">
      {@html party.description}
    </div>
  </div>

  <!-- Timeline -->
  <div class="mb-8 rounded-lg border border-subtle bg-surface-card p-6">
    <h2 class="mb-4 text-lg font-semibold text-primary">Timeline</h2>
    <div class="space-y-3">
      <div class="flex items-start gap-4">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-200">
          1
        </div>
        <div class="flex-1">
          <h3 class="font-semibold text-primary">Submission Period</h3>
          <p class="text-sm text-muted">
            {formatDate(party.submission_opens)} → {formatDate(party.submission_closes)}
          </p>
        </div>
      </div>

      <div class="flex items-start gap-4">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-200">
          2
        </div>
        <div class="flex-1">
          <h3 class="font-semibold text-primary">Want List Period</h3>
          <p class="text-sm text-muted">
            {formatDate(party.want_list_opens)} → {formatDate(party.want_list_closes)}
          </p>
        </div>
      </div>

      <div class="flex items-start gap-4">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-purple-200">
          3
        </div>
        <div class="flex-1">
          <h3 class="font-semibold text-primary">Results Published</h3>
          <p class="text-sm text-muted">
            {formatDate(party.algorithm_runs_at)}
          </p>
        </div>
      </div>

      <div class="flex items-start gap-4">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-200">
          4
        </div>
        <div class="flex-1">
          <h3 class="font-semibold text-primary">Execution Deadline</h3>
          <p class="text-sm text-muted">
            {formatDate(party.execution_deadline)}
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- Configuration -->
  <div class="mb-8 rounded-lg border border-subtle bg-surface-card p-6">
    <h2 class="mb-4 text-lg font-semibold text-primary">Rules & Configuration</h2>
    <div class="space-y-2 text-sm">
      {#if party.max_games_per_user}
        <div class="flex justify-between">
          <span class="text-secondary">Max games per person:</span>
          <span class="font-medium text-primary">{party.max_games_per_user}</span>
        </div>
      {/if}

      <div class="flex justify-between">
        <span class="text-secondary">"No trade" option:</span>
        <span class="font-medium text-primary">
          {party.allow_no_trade ? 'Allowed' : 'Not allowed'}
        </span>
      </div>

      {#if party.regional_restriction}
        <div class="flex justify-between">
          <span class="text-secondary">Regional restriction:</span>
          <span class="font-medium text-primary">{party.regional_restriction}</span>
        </div>
      {/if}

      {#if party.shipping_rules}
        <div class="mt-4 border-t border-subtle pt-4">
          <h3 class="mb-2 font-semibold text-primary">Shipping Rules</h3>
          <div class="prose prose-sm prose-invert max-w-none text-secondary">
            {@html party.shipping_rules}
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Actions (for organizer) -->
  {#if isOrganizer}
    <div class="mb-8 rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
      <p class="mb-3 text-sm text-blue-200">
        <strong>Organizer Controls:</strong> More options coming soon (edit details, manage submissions, run algorithm)
      </p>
      <button
        disabled
        class="rounded-lg border border-accent bg-accent px-6 py-2 font-semibold text-surface-body opacity-50"
      >
        Edit Party Settings
      </button>
    </div>
  {/if}
</div>
