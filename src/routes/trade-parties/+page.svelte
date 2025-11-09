<script lang="ts">
  import { currentUser } from '$lib/pocketbase';
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

    <!-- Tabs -->
    <div class="flex gap-2 border-b border-subtle">
      <button
        class="border-b-2 border-accent px-4 py-2 text-sm font-medium text-accent"
      >
        Active
      </button>
      <button
        class="border-b-2 border-transparent px-4 py-2 text-sm font-medium text-secondary transition hover:text-primary"
      >
        Accepting Submissions
      </button>
      <button
        class="border-b-2 border-transparent px-4 py-2 text-sm font-medium text-secondary transition hover:text-primary"
      >
        Results
      </button>
      <button
        class="border-b-2 border-transparent px-4 py-2 text-sm font-medium text-secondary transition hover:text-primary"
      >
        Completed
      </button>
    </div>

    <!-- Placeholder Content -->
    <div
      class="rounded-xl border border-dashed border-subtle bg-surface-card p-12 text-center transition-colors"
    >
      <div class="mb-4">
        <span class="text-6xl">🚧</span>
      </div>
      <p class="text-lg font-medium text-primary">Trade Parties Coming Soon!</p>
      <p class="mt-2 text-sm text-secondary">
        Smart multi-way trading events for maximum efficiency
      </p>
      <div class="mt-6 grid gap-4 text-left sm:grid-cols-3">
        <div class="rounded-lg border border-subtle bg-surface-body p-4">
          <div class="mb-2 text-2xl">🎯</div>
          <h3 class="font-semibold text-primary">Smart Matching</h3>
          <p class="mt-1 text-sm text-muted">
            Algorithm finds optimal trade chains across dozens of participants
          </p>
        </div>
        <div class="rounded-lg border border-subtle bg-surface-body p-4">
          <div class="mb-2 text-2xl">🔀</div>
          <h3 class="font-semibold text-primary">Multi-Way Trades</h3>
          <p class="mt-1 text-sm text-muted">
            Trade with multiple people at once through circular chains
          </p>
        </div>
        <div class="rounded-lg border border-subtle bg-surface-body p-4">
          <div class="mb-2 text-2xl">📊</div>
          <h3 class="font-semibold text-primary">Fair & Transparent</h3>
          <p class="mt-1 text-sm text-muted">
            See all trade chains and understand why matches were made
          </p>
        </div>
      </div>

      <!-- How It Works -->
      <div class="mt-8 rounded-lg border border-subtle bg-surface-body p-6 text-left">
        <h3 class="mb-4 text-center text-sm font-semibold uppercase tracking-wider text-muted">
          How Trade Parties Work
        </h3>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div class="space-y-2">
            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-surface-body">
              1
            </div>
            <h4 class="font-semibold text-primary">Submit Games</h4>
            <p class="text-sm text-muted">
              List games you want to trade during the submission period
            </p>
          </div>
          <div class="space-y-2">
            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-surface-body">
              2
            </div>
            <h4 class="font-semibold text-primary">Build Want List</h4>
            <p class="text-sm text-muted">
              Select which games you'd accept in trade from others
            </p>
          </div>
          <div class="space-y-2">
            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-surface-body">
              3
            </div>
            <h4 class="font-semibold text-primary">Algorithm Runs</h4>
            <p class="text-sm text-muted">
              Computer finds optimal trade chains across all participants
            </p>
          </div>
          <div class="space-y-2">
            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-surface-body">
              4
            </div>
            <h4 class="font-semibold text-primary">Execute Trades</h4>
            <p class="text-sm text-muted">
              Coordinate shipping with your matched trade partners
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Sign in prompt for guests -->
    {#if !$currentUser}
      <div class="rounded-lg border border-subtle bg-surface-card p-6 text-center">
        <p class="mb-4 text-secondary">Sign in to participate in trade parties</p>
        <a
          href="/login?redirect=/trade-parties"
          class="inline-block rounded-lg border border-emerald-500 bg-emerald-500 px-6 py-2 font-semibold text-surface-body transition hover:bg-emerald-600"
        >
          Sign In
        </a>
      </div>
    {/if}
  </div>
</main>
