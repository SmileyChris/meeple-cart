<script lang="ts">
  import { currentUser } from '$lib/pocketbase';
</script>

<svelte:head>
  <title>Group Buys · Meeple Cart</title>
  <meta
    name="description"
    content="Join group buys to save on shipping and get better deals on board games from overseas."
  />
</svelte:head>

<main class="bg-surface-body px-6 py-16 text-primary transition-colors sm:px-8">
  <div class="mx-auto max-w-5xl space-y-8">
    <!-- Header -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-4xl font-semibold tracking-tight sm:text-5xl">🛒 Group Buys</h1>
          <p class="mt-2 text-base text-secondary sm:text-lg">
            Save on shipping costs and coordinate bulk orders with the community
          </p>
        </div>
        {#if $currentUser}
          <a
            href="/group-buys/new"
            class="rounded-lg border border-emerald-500 bg-emerald-500 px-4 py-2 font-semibold text-surface-body transition hover:bg-emerald-600"
          >
            Start Group Buy
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
        Planning
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
      <p class="text-lg font-medium text-primary">Group Buys Coming Soon!</p>
      <p class="mt-2 text-sm text-secondary">
        Coordinate Kickstarter pledges, bulk orders, and regional distribution
      </p>
      <div class="mt-6 grid gap-4 text-left sm:grid-cols-3">
        <div class="rounded-lg border border-subtle bg-surface-body p-4">
          <div class="mb-2 text-2xl">💰</div>
          <h3 class="font-semibold text-primary">Save on Shipping</h3>
          <p class="mt-1 text-sm text-muted">
            Split international shipping costs across multiple participants
          </p>
        </div>
        <div class="rounded-lg border border-subtle bg-surface-body p-4">
          <div class="mb-2 text-2xl">📍</div>
          <h3 class="font-semibold text-primary">Regional Hubs</h3>
          <p class="mt-1 text-sm text-muted">
            Coordinate local pickup points across New Zealand
          </p>
        </div>
        <div class="rounded-lg border border-subtle bg-surface-body p-4">
          <div class="mb-2 text-2xl">📊</div>
          <h3 class="font-semibold text-primary">Track Payments</h3>
          <p class="mt-1 text-sm text-muted">
            Manage commitments and payments with unique participant codes
          </p>
        </div>
      </div>
    </div>

    <!-- Sign in prompt for guests -->
    {#if !$currentUser}
      <div class="rounded-lg border border-subtle bg-surface-card p-6 text-center">
        <p class="mb-4 text-secondary">Sign in to start or join group buys</p>
        <a
          href="/login?redirect=/group-buys"
          class="inline-block rounded-lg border border-emerald-500 bg-emerald-500 px-6 py-2 font-semibold text-surface-body transition hover:bg-emerald-600"
        >
          Sign In
        </a>
      </div>
    {/if}
  </div>
</main>
