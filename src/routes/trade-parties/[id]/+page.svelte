<script lang="ts">
  import { currentUser } from '$lib/pocketbase';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let party = $derived(data.party);
  let organizer = $derived(party.expand?.organizer);
  let isOrganizer = $derived($currentUser?.id === party.organizer);

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

  <!-- Under Construction Notice -->
  <div class="mb-8 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
    <div class="flex items-start gap-3">
      <span class="text-2xl">🚧</span>
      <div>
        <p class="font-semibold text-amber-200">Under Construction</p>
        <p class="mt-1 text-sm text-amber-300/80">
          Party details page is being built. Soon you'll be able to submit games, build want lists,
          and view results here!
        </p>
      </div>
    </div>
  </div>

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
