<script lang="ts">
  import { goto } from '$app/navigation';
  import { currentUser, pb } from '$lib/pocketbase';

  // Redirect to login if not authenticated
  $effect(() => {
    if (!$currentUser) {
      goto('/login?redirect=/trade-parties/new');
    }
  });

  let name = $state('');
  let description = $state('');
  let isSubmitting = $state(false);
  let error = $state('');

  async function handleSubmit(e: Event) {
    e.preventDefault();

    if (!$currentUser) return;

    isSubmitting = true;
    error = '';

    try {
      const party = await pb.collection('trade_parties').create({
        name,
        description,
        organizer: $currentUser.id,
        status: 'planning',
        // Set default dates (organizer can update later)
        submission_opens: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
        submission_closes: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), // 3 weeks from now
        want_list_opens: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        want_list_closes: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(), // 4 weeks from now
        algorithm_runs_at: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
        execution_deadline: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString(), // 6 weeks from now
        allow_no_trade: true,
        participant_count: 0,
        game_count: 0,
        successful_matches: 0,
      });

      // Redirect to the party detail page
      goto(`/trade-parties/${party.id}`);
    } catch (err: any) {
      console.error('Failed to create trade party:', err);
      error = err.message || 'Failed to create trade party. Please try again.';
    } finally {
      isSubmitting = false;
    }
  }
</script>

<svelte:head>
  <title>Start Trade Party · Meeple Cart</title>
</svelte:head>

<div class="container mx-auto max-w-3xl px-4 py-8">
  <!-- Breadcrumb -->
  <div class="mb-6 text-sm text-secondary">
    <a href="/trade-parties" class="hover:text-primary">Trade Parties</a>
    <span class="mx-2">/</span>
    <span class="text-primary">New Trade Party</span>
  </div>

  <!-- Header -->
  <div class="mb-8">
    <h1 class="mb-2 text-3xl font-bold text-primary">Start a Trade Party</h1>
    <p class="text-secondary">
      Organize a smart multi-way trade event for the community
    </p>
  </div>

  <!-- Under Construction Notice -->
  <div class="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
    <div class="flex items-start gap-3">
      <span class="text-2xl">🚧</span>
      <div>
        <p class="font-semibold text-amber-200">Under Construction</p>
        <p class="mt-1 text-sm text-amber-300/80">
          Basic party creation is available. More features (dates, settings, submissions) coming soon!
        </p>
      </div>
    </div>
  </div>

  <!-- Creation Form -->
  <form onsubmit={handleSubmit} class="rounded-lg border border-subtle bg-surface-card p-6">
    {#if error}
      <div class="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
        <p class="text-sm text-red-200">{error}</p>
      </div>
    {/if}

    <div class="space-y-6">
      <!-- Party Name -->
      <div>
        <label for="name" class="mb-2 block text-sm font-medium text-primary">
          Party Name <span class="text-red-400">*</span>
        </label>
        <input
          type="text"
          id="name"
          bind:value={name}
          required
          minlength="3"
          maxlength="100"
          placeholder="e.g., Summer 2026 Auckland Trade Party"
          class="w-full rounded-lg border border-subtle bg-surface-body px-4 py-2 text-primary placeholder-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
        <p class="mt-1 text-xs text-muted">
          Choose a descriptive name that includes the season/date and location if applicable
        </p>
      </div>

      <!-- Description -->
      <div>
        <label for="description" class="mb-2 block text-sm font-medium text-primary">
          Description <span class="text-red-400">*</span>
        </label>
        <textarea
          id="description"
          bind:value={description}
          required
          minlength="20"
          rows="6"
          placeholder="Describe the trade party: who can participate, any regional restrictions, shipping expectations, etc."
          class="w-full rounded-lg border border-subtle bg-surface-body px-4 py-2 text-primary placeholder-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        ></textarea>
        <p class="mt-1 text-xs text-muted">
          Include important details like regional restrictions, shipping costs, and deadlines
        </p>
      </div>

      <!-- Info about what happens next -->
      <div class="rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
        <p class="text-sm text-blue-200">
          <strong>After creating:</strong> You'll be able to configure dates, settings, and share a private link
          with participants. The party will be in "Planning" mode until you're ready to open submissions.
        </p>
      </div>
    </div>

    <!-- Actions -->
    <div class="mt-6 flex items-center justify-between border-t border-subtle pt-6">
      <a href="/trade-parties" class="text-sm text-secondary hover:text-primary">
        ← Back to Trade Parties
      </a>
      <button
        type="submit"
        disabled={isSubmitting || name.length < 3 || description.length < 20}
        class="rounded-lg border border-accent bg-accent px-6 py-2 font-semibold text-surface-body transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? 'Creating...' : 'Create Trade Party'}
      </button>
    </div>
  </form>

  <!-- Trade Party Phases Info -->
  <div class="mt-6 rounded-lg border border-subtle bg-surface-body p-6">
    <h3 class="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">
      How Trade Parties Work
    </h3>
    <div class="space-y-3">
      <div class="flex items-start gap-3">
        <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-200">
          1
        </div>
        <div>
          <h4 class="font-semibold text-primary">Submission Phase</h4>
          <p class="text-sm text-muted">
            Participants add games they want to trade with photos and condition notes
          </p>
        </div>
      </div>
      <div class="flex items-start gap-3">
        <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-sm font-bold text-blue-200">
          2
        </div>
        <div>
          <h4 class="font-semibold text-primary">Want List Phase</h4>
          <p class="text-sm text-muted">
            Each participant builds ranked want lists for their submitted games
          </p>
        </div>
      </div>
      <div class="flex items-start gap-3">
        <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-sm font-bold text-purple-200">
          3
        </div>
        <div>
          <h4 class="font-semibold text-primary">Algorithm Execution</h4>
          <p class="text-sm text-muted">
            System finds optimal trade chains using graph matching algorithms
          </p>
        </div>
      </div>
      <div class="flex items-start gap-3">
        <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-sm font-bold text-amber-200">
          4
        </div>
        <div>
          <h4 class="font-semibold text-primary">Execution Phase</h4>
          <p class="text-sm text-muted">
            Matched participants coordinate shipping and complete their trades
          </p>
        </div>
      </div>
    </div>
  </div>

  <!-- Tips -->
  <div class="mt-6 rounded-lg border border-subtle bg-surface-body p-4">
    <h3 class="mb-2 text-sm font-semibold text-primary">💡 Trade Party Tips</h3>
    <ul class="space-y-2 text-sm text-secondary">
      <li>• Trade parties work best with 15+ participants for maximum matching opportunities</li>
      <li>• Set realistic timelines - typically 2 weeks submission + 1 week want lists</li>
      <li>• Consider regional groupings to reduce shipping costs</li>
      <li>• Enable "no trade" options so participants aren't forced into unwanted trades</li>
      <li>• Communicate shipping expectations clearly upfront</li>
    </ul>
  </div>
</div>
