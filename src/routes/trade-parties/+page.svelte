<script lang="ts">
  import { pb, currentUser } from '$lib/pocketbase';
  import type { PageData } from './$types';

  let { data } = $props<{ data: PageData }>();
</script>

<svelte:head>
  <title>Trade Parties · Meeple Cart</title>
  <meta
    name="description"
    content="Join smart multi-way trading events to find the perfect match for your board games."
  />
</svelte:head>

<main class="bg-surface-body px-6 py-16 text-primary transition-colors sm:px-8">
  <div class="mx-auto max-w-5xl space-y-8">
    <!-- Header -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-4xl font-semibold tracking-tight sm:text-5xl">🎉 Trade Parties</h1>
          <p class="mt-2 text-base text-secondary sm:text-lg">
            Smart multi-way trading events for the community
          </p>
        </div>
        {#if $currentUser}
          <a
            href="/trade-parties/new"
            class="rounded-lg border border-emerald-500 bg-emerald-500 px-4 py-2 font-semibold text-surface-body transition hover:bg-emerald-600"
          >
            Start Trade Party
          </a>
        {/if}
      </div>
    </div>

    <!-- Tabs (Placeholder for now) -->
    <div class="flex gap-2 border-b border-subtle">
      <button class="border-b-2 border-accent px-4 py-2 text-sm font-medium text-accent">
        All Parties
      </button>
    </div>

    <!-- State -->
    {#if data.parties.length === 0}
      <div
        class="rounded-xl border border-dashed border-subtle bg-surface-card p-12 text-center transition-colors"
      >
        <div class="mb-4">
          <span class="text-6xl">🚧</span>
        </div>
        <p class="text-lg font-medium text-primary">No Trade Parties Found</p>
        <p class="mt-2 text-sm text-secondary">
          Be the first to start a smart multi-way trading event!
        </p>
        <div class="mt-6 flex justify-center">
          <a
            href="/trade-parties/new"
            class="rounded-lg border border-emerald-500 bg-emerald-500 px-4 py-2 font-semibold text-surface-body transition hover:bg-emerald-600"
          >
            Start Trade Party
          </a>
        </div>
      </div>
    {:else}
      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {#each data.parties as party}
          <a
            href="/trade-parties/{party.id}"
            class="flex flex-col overflow-hidden rounded-xl border border-subtle bg-surface-card transition hover:border-accent hover:shadow-lg"
          >
            <div class="flex-1 p-6">
              <div class="flex items-start justify-between">
                <div>
                  <h3 class="text-xl font-bold text-primary">{party.name}</h3>
                  <p class="mt-1 text-sm text-secondary line-clamp-2">
                    {party.description || 'No description provided.'}
                  </p>
                </div>
                <span
                  class="rounded-full px-2.25 py-0.75 text-xs font-semibold uppercase tracking-wider"
                  class:bg-blue-100={party.status === 'open'}
                  class:text-blue-700={party.status === 'open'}
                  class:bg-emerald-100={party.status === 'matching_preview'}
                  class:text-emerald-700={party.status === 'matching_preview'}
                  class:bg-orange-100={party.status === 'execution'}
                  class:text-orange-700={party.status === 'execution'}
                  class:bg-gray-100={party.status === 'completed'}
                  class:text-gray-700={party.status === 'completed'}
                >
                  {party.status.replace('_', ' ')}
                </span>
              </div>

              <div class="mt-4 flex items-center gap-2 text-sm text-muted">
                <div class="h-6 w-6 overflow-hidden rounded-full bg-subtle">
                  {#if party.expand?.organizer?.avatar}
                    <img
                      src={pb.files.getUrl(party.expand.organizer, party.expand.organizer.avatar)}
                      alt={party.expand.organizer.username}
                      class="h-full w-full object-cover"
                    />
                  {:else}
                    <div
                      class="flex h-full w-full items-center justify-center text-[10px] font-bold uppercase"
                    >
                      {(party.expand?.organizer?.username || 'O').charAt(0)}
                    </div>
                  {/if}
                </div>
                <span>Organized by <b>{party.expand?.organizer?.username || 'Unknown'}</b></span>
              </div>
            </div>

            <div class="border-t border-subtle bg-surface-body px-6 py-3 text-xs text-muted">
              <div class="flex justify-between">
                <span>Ends {new Date(party.submission_closes).toLocaleDateString()}</span>
                {#if party.matching_finalized_at}
                  <span>Matched {new Date(party.matching_finalized_at).toLocaleDateString()}</span>
                {/if}
              </div>
            </div>
          </a>
        {/each}
      </div>
    {/if}

    <!-- Features Section (Always visible) -->
    <div class="mt-16 space-y-8">
      <div class="text-center">
        <h2 class="text-2xl font-bold text-primary">Why Join a Trade Party?</h2>
        <p class="mt-2 text-secondary">Smart multi-way trading events for maximum efficiency</p>
      </div>

      <div class="grid gap-6 sm:grid-cols-3">
        <div class="rounded-xl border border-subtle bg-surface-card p-6 transition-colors">
          <div class="mb-4 text-3xl">🎯</div>
          <h3 class="text-lg font-semibold text-primary">Smart Matching</h3>
          <p class="mt-2 text-sm text-secondary">
            Our algorithm finds optimal trade chains across dozens of participants at once.
          </p>
        </div>
        <div class="rounded-xl border border-subtle bg-surface-card p-6 transition-colors">
          <div class="mb-4 text-3xl">🔀</div>
          <h3 class="text-lg font-semibold text-primary">Multi-Way Trades</h3>
          <p class="mt-2 text-sm text-secondary">
            Tired of 1-for-1 gaps? Trade in circular chains (A gives to B, B to C, C to A).
          </p>
        </div>
        <div class="rounded-xl border border-subtle bg-surface-card p-6 transition-colors">
          <div class="mb-4 text-3xl">📊</div>
          <h3 class="text-lg font-semibold text-primary">Fair & Transparent</h3>
          <p class="mt-2 text-sm text-secondary">
            See all trade chains and understand why matches were made after the party finishes.
          </p>
        </div>
      </div>
    </div>

    <!-- How It Works (Always visible) -->
    <div class="rounded-2xl border border-subtle bg-surface-card p-8 shadow-sm transition-colors">
      <h3 class="mb-8 text-center text-xs font-bold uppercase tracking-widest text-muted">
        How Trade Parties Work
      </h3>
      <div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div class="relative">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-xl bg-accent font-bold text-surface-body shadow-lg shadow-accent/20"
          >
            1
          </div>
          <h4 class="mt-4 font-bold text-primary">Submit Games</h4>
          <p class="mt-1 text-sm text-secondary leading-relaxed">
            List games you're ready to part with during the submission window.
          </p>
        </div>
        <div class="relative">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-xl bg-accent font-bold text-surface-body shadow-lg shadow-accent/20"
          >
            2
          </div>
          <h4 class="mt-4 font-bold text-primary">Build Want List</h4>
          <p class="mt-1 text-sm text-secondary leading-relaxed">
            Rank which games from other participants you want in return.
          </p>
        </div>
        <div class="relative">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-xl bg-accent font-bold text-surface-body shadow-lg shadow-accent/20"
          >
            3
          </div>
          <h4 class="mt-4 font-bold text-primary">Algorithm Runs</h4>
          <p class="mt-1 text-sm text-secondary leading-relaxed">
            The computer finds the most efficient chains to satisfy everyone's wants.
          </p>
        </div>
        <div class="relative">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-xl bg-accent font-bold text-surface-body shadow-lg shadow-accent/20"
          >
            4
          </div>
          <h4 class="mt-4 font-bold text-primary">Finalize & Trade</h4>
          <p class="mt-1 text-sm text-secondary leading-relaxed">
            Identities are revealed, and you coordinate shipping with your partner.
          </p>
        </div>
      </div>
    </div>
  </div>
</main>
