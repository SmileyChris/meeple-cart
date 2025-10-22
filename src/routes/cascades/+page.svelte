<script lang="ts">
  import type { PageData } from './$types';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { NZ_REGIONS, REGION_LABELS } from '$lib/constants/regions';

  export let data: PageData;

  const { cascades, filters, pagination } = data;

  const statusLabels: Record<string, string> = {
    accepting_entries: 'Accepting Entries',
    selecting_winner: 'Selecting Recipient',
    in_transit: 'In Transit',
    awaiting_pass: 'Awaiting Pass-On',
    completed: 'Completed',
    broken: 'Broken',
  };

  const sortLabels: Record<string, string> = {
    deadline: 'Ending Soon',
    newest: 'Newest',
    generation: 'Longest Lineage',
    entries: 'Most Entries',
  };

  function updateFilter(param: string, value: string) {
    const currentUrl = new URL($page.url);
    if (value) {
      currentUrl.searchParams.set(param, value);
    } else {
      currentUrl.searchParams.delete(param);
    }
    currentUrl.searchParams.delete('page'); // Reset to page 1 on filter change
    goto(currentUrl.toString(), { keepFocus: true });
  }

  function goToPage(newPage: number) {
    const currentUrl = new URL($page.url);
    currentUrl.searchParams.set('page', String(newPage));
    goto(currentUrl.toString(), { keepFocus: true });
  }
</script>

<svelte:head>
  <title>Gift Cascades · Meeple Cart</title>
  <meta name="description" content="Browse gift cascades - win free games and pay it forward" />
</svelte:head>

<main class="min-h-screen bg-surface-body px-6 py-12 text-primary transition-colors">
  <div class="mx-auto max-w-7xl space-y-6">
    <!-- Header -->
    <div class="space-y-3">
      <h1 class="text-4xl font-bold text-primary">Gift Cascades</h1>
      <p class="text-lg text-secondary">
        Receive free games, then pass on the generosity. Each gift cascade creates a lineage of
        giving.
      </p>
      <div class="flex gap-3">
        <a href="/cascades/create" class="btn-primary px-6 py-2.5 font-semibold">
          Start a Gift Cascade
        </a>
        <a href="/cascades/my-cascades" class="btn-ghost px-6 py-2.5 font-medium">
          My Gift Cascades
        </a>
      </div>
    </div>

    <!-- Filters -->
    <div
      class="flex flex-wrap items-center gap-3 rounded-xl border border-subtle bg-surface-panel p-4 shadow-elevated transition-colors"
    >
      <!-- Status Filter -->
      <div class="flex items-center gap-2">
        <label for="status-filter" class="text-sm font-medium text-secondary">Status:</label>
        <select
          id="status-filter"
          value={filters.status ?? ''}
          on:change={(e) => updateFilter('status', e.currentTarget.value)}
          class="rounded border border-subtle bg-surface-card px-3 py-1.5 text-sm text-primary transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
        >
          <option value="">All Active</option>
          <option value="accepting_entries">Accepting Entries</option>
          <option value="selecting_winner">Selecting Recipient</option>
          <option value="in_transit">In Transit</option>
          <option value="awaiting_pass">Awaiting Pass-On</option>
        </select>
      </div>

      <!-- Region Filter -->
      <div class="flex items-center gap-2">
        <label for="region-filter" class="text-sm font-medium text-secondary">Region:</label>
        <select
          id="region-filter"
          value={filters.region ?? ''}
          on:change={(e) => updateFilter('region', e.currentTarget.value)}
          class="rounded border border-subtle bg-surface-card px-3 py-1.5 text-sm text-primary transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
        >
          <option value="">All Regions</option>
          {#each NZ_REGIONS.filter((r) => r.value !== '') as region}
            <option value={region.value}>{region.label}</option>
          {/each}
        </select>
      </div>

      <!-- Sort -->
      <div class="flex items-center gap-2">
        <label for="sort-filter" class="text-sm font-medium text-secondary">Sort by:</label>
        <select
          id="sort-filter"
          value={filters.sort ?? 'deadline'}
          on:change={(e) => updateFilter('sort', e.currentTarget.value)}
          class="rounded border border-subtle bg-surface-card px-3 py-1.5 text-sm text-primary transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
        >
          <option value="deadline">Ending Soon</option>
          <option value="newest">Newest</option>
          <option value="generation">Longest Lineage</option>
          <option value="entries">Most Entries</option>
        </select>
      </div>
    </div>

    <!-- Cascades Grid -->
    {#if cascades.length === 0}
      <div
        class="rounded-2xl border-2 border-dashed border-subtle bg-surface-card p-12 text-center transition-colors"
      >
        <div class="mb-4 text-6xl">🎁</div>
        <h2 class="text-xl font-semibold text-secondary">No gift cascades found</h2>
        <p class="mt-2 text-muted">
          {#if filters.status || filters.region}
            Try adjusting your filters or start a new gift cascade.
          {:else}
            Be the first to start a gift cascade!
          {/if}
        </p>
        <a href="/cascades/create" class="btn-primary mt-6 inline-block px-6 py-2 font-medium">
          Start a Gift Cascade
        </a>
      </div>
    {:else}
      <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {#each cascades as cascade (cascade.id)}
          <a
            href={`/cascades/${cascade.id}`}
            class="group flex flex-col overflow-hidden rounded-xl border border-subtle bg-surface-card shadow-elevated transition hover:border-[var(--accent)] hover:shadow-lg"
          >
            <!-- Game Image -->
            {#if cascade.gameImage}
              <img
                alt={cascade.gameTitle}
                class="h-48 w-full object-cover"
                src={cascade.gameImage}
              />
            {:else}
              <div
                class="flex h-48 items-center justify-center bg-surface-card-alt text-6xl opacity-20"
              >
                🎲
              </div>
            {/if}

            <div class="flex flex-1 flex-col p-4">
              <!-- Generation Badge -->
              {#if cascade.generation > 0}
                <div class="mb-2">
                  <span
                    class="inline-block rounded-full border border-purple-600 bg-purple-500/10 px-2 py-0.5 text-xs font-medium text-purple-200"
                  >
                    Gen {cascade.generation}
                  </span>
                </div>
              {/if}

              <!-- Game Title -->
              <h3
                class="text-lg font-semibold text-primary transition group-hover:text-[var(--accent)]"
              >
                {cascade.gameTitle}
              </h3>

              <!-- Cascade Name (if set) -->
              {#if cascade.name}
                <p class="mt-1 text-sm italic text-muted">"{cascade.name}"</p>
              {/if}

              <!-- Metadata -->
              <div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                <span
                  class="rounded-full border border-subtle bg-surface-card-alt px-2 py-0.5 text-secondary transition-colors"
                >
                  {cascade.gameCondition}
                </span>
                {#if cascade.region}
                  <span
                    class="rounded-full border border-subtle bg-surface-card-alt px-2 py-0.5 text-secondary transition-colors"
                  >
                    {REGION_LABELS[cascade.region] ?? cascade.region}
                  </span>
                {/if}
              </div>

              <!-- Holder Info -->
              <div class="mt-3 text-sm text-muted">
                Held by <span class="font-medium text-secondary">{cascade.holderName}</span>
              </div>

              <!-- Entry Count & Deadline -->
              <div class="mt-auto border-t border-subtle pt-3">
                <div class="flex items-center justify-between text-sm text-secondary">
                  <span class="text-muted">
                    {cascade.entryCount}
                    {cascade.entryCount === 1 ? 'entry' : 'entries'}
                  </span>
                  <span
                    class={cascade.timeRemaining.includes('h remaining') ||
                    cascade.timeRemaining.includes('m remaining')
                      ? 'font-semibold text-orange-400'
                      : 'text-emerald-400'}
                  >
                    {cascade.timeRemaining}
                  </span>
                </div>
              </div>
            </div>
          </a>
        {/each}
      </div>

      <!-- Pagination -->
      {#if pagination.totalPages > 1}
        <div class="flex items-center justify-center gap-2">
          <button
            disabled={pagination.page === 1}
            on:click={() => goToPage(pagination.page - 1)}
            class="btn-ghost px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>

          <span class="px-4 text-sm text-muted">
            Page {pagination.page} of {pagination.totalPages}
          </span>

          <button
            disabled={pagination.page === pagination.totalPages}
            on:click={() => goToPage(pagination.page + 1)}
            class="btn-ghost px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      {/if}

      <!-- Results Info -->
      <div class="text-center text-sm text-muted">
        Showing {cascades.length} of {pagination.totalItems}
        {pagination.totalItems === 1 ? 'gift cascade' : 'gift cascades'}
      </div>
    {/if}

    <!-- How it Works & Why Start One -->
    <div class="space-y-6">
      <!-- Concept Explainer -->
      <div
        class="rounded-xl border border-emerald-600 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-6"
      >
        <h2 class="text-2xl font-bold text-primary">💚 The Spirit of Gift Cascades</h2>
        <p class="mt-3 text-secondary">
          A gift cascade is a <strong>chain of generosity</strong>. Someone gifts you a game, you
          pass one on to someone else. Each cascade creates a ripple effect of kindness through the
          board game community.
        </p>
        <p class="mt-2 text-sm text-muted">
          Inspired by the <a
            href="https://boardgamegeek.com/wiki/page/BGG_Chain_of_Generosity"
            target="_blank"
            class="text-emerald-400 underline hover:text-emerald-300">BGG Chain of Generosity</a
          >, but streamlined for modern trading.
        </p>
      </div>

      <!-- How it Works -->
      <div class="rounded-xl border border-subtle bg-surface-panel p-6 transition-colors">
        <h2 class="text-xl font-bold text-primary">How It Works</h2>
        <div class="mt-4 grid gap-4 md:grid-cols-3">
          <div class="space-y-2">
            <div class="text-3xl">🌱</div>
            <h3 class="font-semibold text-emerald-400">1. Seed a Gift</h3>
            <p class="text-sm text-muted">
              Pick a game from your shelf, set a deadline, and let people enter to receive it.
              <span class="text-secondary">(You can do this anonymously!)</span>
            </p>
          </div>
          <div class="space-y-2">
            <div class="text-3xl">🎲</div>
            <h3 class="font-semibold text-emerald-400">2. Random Selection</h3>
            <p class="text-sm text-muted">
              At the deadline, a recipient is randomly selected. Ship them the game (you usually
              cover shipping for gifts).
            </p>
          </div>
          <div class="space-y-2">
            <div class="text-3xl">🔗</div>
            <h3 class="font-semibold text-emerald-400">3. Chain Continues</h3>
            <p class="text-sm text-muted">
              The recipient creates their own gift cascade within 30 days, keeping the generosity
              flowing.
            </p>
          </div>
        </div>
      </div>

      <!-- Why Start One -->
      <div class="rounded-xl border border-subtle bg-surface-panel p-6 transition-colors">
        <h2 class="text-xl font-bold text-primary">Why Start a Gift Cascade?</h2>
        <div class="mt-4 grid gap-3 md:grid-cols-2">
          <div
            class="flex items-start gap-3 rounded-lg border border-subtle bg-surface-card-alt p-3"
          >
            <div class="text-2xl">🏡</div>
            <div class="flex-1">
              <h3 class="font-semibold text-secondary">Declutter Your Shelf</h3>
              <p class="mt-1 text-sm text-muted">
                Give an unloved game a new home where it'll actually get played
              </p>
            </div>
          </div>
          <div
            class="flex items-start gap-3 rounded-lg border border-subtle bg-surface-card-alt p-3"
          >
            <div class="text-2xl">🤝</div>
            <div class="flex-1">
              <h3 class="font-semibold text-secondary">Build Community</h3>
              <p class="mt-1 text-sm text-muted">
                Connect with other gamers and spread the joy of board gaming
              </p>
            </div>
          </div>
          <div
            class="flex items-start gap-3 rounded-lg border border-subtle bg-surface-card-alt p-3"
          >
            <div class="text-2xl">✨</div>
            <div class="flex-1">
              <h3 class="font-semibold text-secondary">Feel Good Karma</h3>
              <p class="mt-1 text-sm text-muted">
                The recipient's excitement is genuinely rewarding (and you might receive one later!)
              </p>
            </div>
          </div>
          <div
            class="flex items-start gap-3 rounded-lg border border-subtle bg-surface-card-alt p-3"
          >
            <div class="text-2xl">🎖️</div>
            <div class="flex-1">
              <h3 class="font-semibold text-secondary">Earn Badges</h3>
              <p class="mt-1 text-sm text-muted">
                Get recognition with Seed Starter, Keeper, and Champion badges
              </p>
            </div>
          </div>
        </div>

        <!-- CTA -->
        <div class="mt-6 flex items-center justify-center gap-3 border-t border-subtle pt-6">
          <a href="/cascades/create" class="btn-primary px-8 py-3 font-semibold">
            🌱 Start Your First Gift Cascade
          </a>
          <span class="text-sm text-muted">No obligation. Fully optional.</span>
        </div>
      </div>

      <!-- Anonymous Option Callout -->
      <div class="rounded-lg border border-purple-600 bg-purple-500/10 p-4">
        <div class="flex items-start gap-3">
          <div class="text-2xl">🎭</div>
          <div class="flex-1">
            <h3 class="font-semibold text-purple-200">Want to give anonymously?</h3>
            <p class="mt-1 text-sm text-purple-200/80">
              Just leave the cascade name blank when creating. Recipients will see "Anonymous" as
              the giver. Perfect for pure generosity with zero recognition.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</main>
