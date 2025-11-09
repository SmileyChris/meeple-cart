<script lang="ts">
  import { goto } from '$app/navigation';
  import { currentUser } from '$lib/pocketbase';

  // Redirect to login if not authenticated
  $effect(() => {
    if (!$currentUser) {
      goto('/login?redirect=/group-buys/new');
    }
  });
</script>

<svelte:head>
  <title>Start Group Buy · Meeple Cart</title>
</svelte:head>

<div class="container mx-auto max-w-3xl px-4 py-8">
  <!-- Breadcrumb -->
  <div class="mb-6 text-sm text-secondary">
    <a href="/group-buys" class="hover:text-primary">Group Buys</a>
    <span class="mx-2">/</span>
    <span class="text-primary">New Group Buy</span>
  </div>

  <!-- Header -->
  <div class="mb-8">
    <h1 class="mb-2 text-3xl font-bold text-primary">Start a Group Buy</h1>
    <p class="text-secondary">
      Coordinate bulk orders and save on shipping costs with the community
    </p>
  </div>

  <!-- Placeholder Form -->
  <div class="rounded-lg border border-subtle bg-surface-card p-6">
    <div class="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
      <div class="flex items-start gap-3">
        <span class="text-2xl">🚧</span>
        <div>
          <p class="font-semibold text-amber-200">Feature In Development</p>
          <p class="mt-1 text-sm text-amber-300/80">
            The group buy creation form is currently being built. Check back soon!
          </p>
        </div>
      </div>
    </div>

    <div class="space-y-6 opacity-50">
      <div>
        <h3 class="mb-4 text-lg font-semibold text-primary">What You'll Be Able To Set Up:</h3>
        <div class="space-y-3 text-sm text-secondary">
          <div class="flex items-start gap-2">
            <span class="mt-0.5 text-accent">✓</span>
            <span>Campaign details (Kickstarter URL, pledge tiers, deadlines)</span>
          </div>
          <div class="flex items-start gap-2">
            <span class="mt-0.5 text-accent">✓</span>
            <span>Minimum and maximum participants per tier</span>
          </div>
          <div class="flex items-start gap-2">
            <span class="mt-0.5 text-accent">✓</span>
            <span>Regional hub configuration (Auckland, Wellington, Christchurch, etc.)</span>
          </div>
          <div class="flex items-start gap-2">
            <span class="mt-0.5 text-accent">✓</span>
            <span>Payment tracking with unique participant codes</span>
          </div>
          <div class="flex items-start gap-2">
            <span class="mt-0.5 text-accent">✓</span>
            <span>Discussion thread for questions and updates</span>
          </div>
        </div>
      </div>

      <div class="border-t border-subtle pt-6">
        <h3 class="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
          Group Buy Modes
        </h3>
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="rounded-lg border border-subtle bg-surface-body p-4">
            <h4 class="mb-1 font-semibold text-primary">Regional</h4>
            <p class="text-sm text-muted">
              Simple, local group with single hub or direct delivery
            </p>
          </div>
          <div class="rounded-lg border border-subtle bg-surface-body p-4">
            <h4 class="mb-1 font-semibold text-primary">Federated</h4>
            <p class="text-sm text-muted">
              Large network with multiple regional hubs nationwide
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-6 flex items-center justify-between border-t border-subtle pt-6">
      <a href="/group-buys" class="text-sm text-secondary hover:text-primary">
        ← Back to Group Buys
      </a>
      <button
        disabled
        class="cursor-not-allowed rounded-lg border border-subtle bg-surface-body px-6 py-2 font-semibold text-muted opacity-50"
      >
        Create Group Buy (Coming Soon)
      </button>
    </div>
  </div>

  <!-- Info Box -->
  <div class="mt-6 rounded-lg border border-subtle bg-surface-body p-4">
    <h3 class="mb-2 text-sm font-semibold text-primary">📖 How Group Buys Work</h3>
    <ol class="space-y-2 text-sm text-secondary">
      <li>1. Create group buy with campaign details and participant requirements</li>
      <li>2. Community members register interest and select pledge tiers</li>
      <li>3. Once minimum reached, participants confirm commitment</li>
      <li>4. Each participant receives unique payment code</li>
      <li>5. Coordinator tracks payments and manages fulfillment</li>
      <li>6. Items distributed via regional hubs or direct delivery</li>
    </ol>
    <a
      href="/help/group-buys"
      class="mt-3 inline-block text-sm text-accent hover:underline"
    >
      Learn more about group buys →
    </a>
  </div>
</div>
