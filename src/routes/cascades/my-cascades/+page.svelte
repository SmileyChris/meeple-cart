<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let enteredCascades = $derived(data.enteredCascades);
  let wonCascades = $derived(data.wonCascades);
  let startedCascades = $derived(data.startedCascades);
  let stats = $derived(data.stats);

  let activeTab = $state<'entered' | 'won' | 'started'>('entered');

  const statusLabels: Record<string, string> = {
    accepting_entries: 'Accepting Entries',
    selecting_winner: 'Selecting Recipient',
    in_transit: 'In Transit',
    awaiting_pass: 'Awaiting Pass-On',
    completed: 'Completed',
    broken: 'Broken',
  };

  const getTimeRemaining = (deadline?: string) => {
    if (!deadline) return null;

    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffMs = deadlineDate.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffMs < 0) return 'Ended';
    if (diffHours < 24) return `${diffHours}h remaining`;
    return `${diffDays}d remaining`;
  };

  let activeCascades = $derived(
    activeTab === 'entered' ? enteredCascades : activeTab === 'won' ? wonCascades : startedCascades
  );
</script>

<svelte:head>
  <title>My Gift Cascades · Meeple Cart</title>
  <meta name="description" content="Manage your gift cascade entries, wins, and creations" />
</svelte:head>

<main class="min-h-screen bg-surface-body px-6 py-12 text-primary transition-colors">
  <div class="mx-auto max-w-6xl space-y-6">
    <!-- Header -->
    <div class="space-y-2">
      <a
        href="/cascades"
        class="inline-flex items-center gap-1 text-sm text-muted transition hover:text-[var(--accent)]"
      >
        ← Back to Gift Cascades
      </a>
      <h1 class="text-3xl font-bold text-primary">My Gift Cascades</h1>
      <p class="text-muted">Track your gift cascade activity and manage your entries.</p>
    </div>

    <!-- Stats Cards -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <div class="rounded-lg border border-subtle bg-surface-card p-4 transition-colors">
        <p class="text-sm text-muted">Seeded</p>
        <p class="mt-1 text-2xl font-bold text-emerald-400">{stats.cascadesSeeded}</p>
      </div>
      <div class="rounded-lg border border-subtle bg-surface-card p-4 transition-colors">
        <p class="text-sm text-muted">Received</p>
        <p class="mt-1 text-2xl font-bold text-blue-400">{stats.cascadesReceived}</p>
      </div>
      <div class="rounded-lg border border-subtle bg-surface-card p-4 transition-colors">
        <p class="text-sm text-muted">Passed On</p>
        <p class="mt-1 text-2xl font-bold text-purple-400">{stats.cascadesPassed}</p>
      </div>
      <div class="rounded-lg border border-subtle bg-surface-card p-4 transition-colors">
        <p class="text-sm text-muted">Broken</p>
        <p class="mt-1 text-2xl font-bold text-orange-400">{stats.cascadesBroken}</p>
      </div>
      <div class="rounded-lg border border-subtle bg-surface-card p-4 transition-colors">
        <p class="text-sm text-muted">Reputation</p>
        <p class="mt-1 text-2xl font-bold text-amber-400">{stats.cascadeReputation}%</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 border-b border-subtle">
      <button
        on:click={() => (activeTab = 'entered')}
        class={`px-4 py-2 font-medium transition ${
          activeTab === 'entered'
            ? 'border-b-2 border-emerald-500 text-emerald-400'
            : 'text-muted hover:text-secondary'
        }`}
      >
        Entered ({enteredCascades.length})
      </button>
      <button
        on:click={() => (activeTab = 'won')}
        class={`px-4 py-2 font-medium transition ${
          activeTab === 'won'
            ? 'border-b-2 border-emerald-500 text-emerald-400'
            : 'text-muted hover:text-secondary'
        }`}
      >
        Received ({wonCascades.length})
      </button>
      <button
        on:click={() => (activeTab = 'started')}
        class={`px-4 py-2 font-medium transition ${
          activeTab === 'started'
            ? 'border-b-2 border-emerald-500 text-emerald-400'
            : 'text-muted hover:text-secondary'
        }`}
      >
        Started ({startedCascades.length})
      </button>
    </div>

    <!-- Cascade List -->
    {#if activeCascades.length === 0}
      <div
        class="rounded-2xl border-2 border-dashed border-subtle bg-surface-card p-12 text-center transition-colors"
      >
        <div class="mb-4 text-6xl opacity-20">
          {activeTab === 'entered' ? '🎯' : activeTab === 'won' ? '🏆' : '🌱'}
        </div>
        <h2 class="text-xl font-semibold text-secondary">
          {#if activeTab === 'entered'}
            No entries yet
          {:else if activeTab === 'won'}
            No games received yet
          {:else}
            No gift cascades started
          {/if}
        </h2>
        <p class="mt-2 text-muted">
          {#if activeTab === 'entered'}
            Browse gift cascades and enter to receive free games!
          {:else if activeTab === 'won'}
            Enter gift cascades to receive games and build your collection.
          {:else}
            Start a gift cascade to share the generosity with the community.
          {/if}
        </p>
        <a
          href={activeTab === 'started' ? '/cascades/create' : '/cascades'}
          class="btn-primary mt-6 inline-block px-6 py-2 font-medium"
        >
          {activeTab === 'started' ? 'Start a Gift Cascade' : 'Browse Gift Cascades'}
        </a>
      </div>
    {:else}
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {#each activeCascades as cascade (cascade.id)}
          <a
            href={`/cascades/${cascade.id}`}
            class="flex flex-col rounded-xl border border-subtle bg-surface-card p-4 shadow-elevated transition hover:border-[var(--accent)]"
          >
            <!-- Header -->
            <div class="flex items-start justify-between gap-2">
              <div class="flex-1">
                <h3 class="font-semibold text-primary">{cascade.gameTitle}</h3>
                {#if cascade.name}
                  <p class="mt-1 text-xs italic text-muted">"{cascade.name}"</p>
                {/if}
              </div>
              {#if cascade.generation > 0}
                <span
                  class="rounded-full border border-purple-600 bg-purple-500/10 px-2 py-0.5 text-xs text-purple-200"
                >
                  Gen {cascade.generation}
                </span>
              {/if}
            </div>

            <!-- Metadata -->
            <div class="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span
                class="rounded-full border border-subtle bg-surface-card-alt px-2 py-0.5 text-secondary transition-colors"
              >
                {cascade.gameCondition}
              </span>
              <span
                class="rounded-full border border-subtle bg-surface-card-alt px-2 py-0.5 uppercase text-secondary transition-colors"
              >
                {statusLabels[cascade.status] ?? cascade.status}
              </span>
            </div>

            <!-- Holder/Winner Info -->
            <p class="mt-3 text-sm text-muted">
              {#if activeTab === 'started'}
                {cascade.entryCount}
                {cascade.entryCount === 1 ? 'entry' : 'entries'}
              {:else}
                by {cascade.holderName}
              {/if}
            </p>

            <!-- Deadline (if applicable) -->
            {#if cascade.deadline}
              {@const timeRemaining = getTimeRemaining(cascade.deadline)}
              {#if timeRemaining}
                <p
                  class={`mt-2 text-xs font-medium ${
                    timeRemaining.includes('h remaining') ? 'text-orange-400' : 'text-emerald-400'
                  }`}
                >
                  {timeRemaining}
                </p>
              {/if}
            {/if}

            <!-- Action Hint -->
            <div class="mt-auto pt-3 text-xs text-muted">
              {#if activeTab === 'won' && cascade.status === 'awaiting_pass'}
                ⚠️ Action required: Pass it on
              {:else if activeTab === 'started' && cascade.status === 'selecting_winner'}
                🎲 Ready to select recipient
              {:else}
                Click to view details →
              {/if}
            </div>
          </a>
        {/each}
      </div>
    {/if}
  </div>
</main>
