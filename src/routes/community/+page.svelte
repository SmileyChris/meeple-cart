<svelte:head>
  <title>Community · Meeple Cart</title>
  <meta
    name="description"
    content="Explore community features on Meeple Cart: Gift Cascades, Trade Parties, and Group Buys."
  />
</svelte:head>

<main class="bg-surface-body px-6 py-12 text-primary transition-colors sm:px-8">
  <div class="mx-auto max-w-3xl space-y-6">
    <!-- Header -->
    <div class="space-y-2">
      <h1 class="text-3xl font-semibold tracking-tight sm:text-4xl">Community Features</h1>
      <p class="text-secondary">Special ways to trade and share games</p>
    </div>

    <!-- Feature Cards -->
    <div class="flex flex-col gap-4">
      <a
        href="/cascades"
        class="group flex gap-4 rounded-xl border border-subtle bg-surface-card p-5 transition hover:border-accent hover:shadow-md"
      >
        <span class="text-3xl">🎁</span>
        <div>
          <h2 class="mb-1 font-semibold group-hover:text-accent">Gift Cascades</h2>
          <p class="text-sm text-secondary">
            Pay-it-forward gifting where games pass through the community. Receive a game, then gift
            one to someone else.
          </p>
        </div>
      </a>

      <a
        href="/trade-parties"
        class="group flex gap-4 rounded-xl border border-subtle bg-surface-card p-5 transition hover:border-accent hover:shadow-md"
      >
        <span class="text-3xl">🎉</span>
        <div>
          <h2 class="mb-1 font-semibold group-hover:text-accent">Trade Parties</h2>
          <p class="text-sm text-secondary">
            Smart multi-way trading events to find the perfect match for your board games.
          </p>
        </div>
      </a>

      <div class="relative flex gap-4 rounded-xl border border-subtle bg-surface-card p-5 opacity-60">
        <span
          class="absolute right-3 top-3 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-secondary"
        >
          Coming Soon
        </span>
        <span class="text-3xl">🛒</span>
        <div>
          <h2 class="mb-1 font-semibold">Group Buys</h2>
          <p class="text-sm text-secondary">
            Pool orders with other members for better deals on new releases and bulk purchases.
          </p>
        </div>
      </div>
    </div>
  </div>
</main>
