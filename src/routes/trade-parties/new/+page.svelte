<script lang="ts">
  import { goto } from '$app/navigation';
  import { currentUser } from '$lib/pocketbase';

  // Redirect to login if not authenticated
  $effect(() => {
    if (!$currentUser) {
      goto('/login?redirect=/trade-parties/new');
    }
  });
</script>

<svelte:head>
  <title>Start Trade Party · Meeple Cart</title>
</svelte:head>

<div class="container mx-auto max-w-3xl px-4 py-8">
  <!-- Breadcrumb -->
  <div class="mb-6 text-sm text-secondary">
    <a href="/trade-parties" class="hover:text-primary">Trade Partys</a>
    <span class="mx-2">/</span>
    <span class="text-primary">New Trade Party</span>
  </div>

  <!-- Header -->
  <div class="mb-8">
    <h1 class="mb-2 text-3xl font-bold text-primary">Start a Trade Party</h1>
    <p class="text-secondary">
      Organize an algorithmic multi-way trade event for the community
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
            The trade party creation form is currently being built. Check back soon!
          </p>
        </div>
      </div>
    </div>

    <div class="space-y-6 opacity-50">
      <div>
        <h3 class="mb-4 text-lg font-semibold text-primary">What You'll Be Able To Configure:</h3>
        <div class="space-y-3 text-sm text-secondary">
          <div class="flex items-start gap-2">
            <span class="mt-0.5 text-accent">✓</span>
            <span>Math trade name, description, and organizer details</span>
          </div>
          <div class="flex items-start gap-2">
            <span class="mt-0.5 text-accent">✓</span>
            <span>Submission period (when participants can add games)</span>
          </div>
          <div class="flex items-start gap-2">
            <span class="mt-0.5 text-accent">✓</span>
            <span>Want list building period (when participants choose desired games)</span>
          </div>
          <div class="flex items-start gap-2">
            <span class="mt-0.5 text-accent">✓</span>
            <span>Algorithm execution date</span>
          </div>
          <div class="flex items-start gap-2">
            <span class="mt-0.5 text-accent">✓</span>
            <span>Shipping requirements and regional restrictions</span>
          </div>
          <div class="flex items-start gap-2">
            <span class="mt-0.5 text-accent">✓</span>
            <span>Optional "no trade" items (dummy items for when nothing matches)</span>
          </div>
        </div>
      </div>

      <div class="border-t border-subtle pt-6">
        <h3 class="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
          Trade Party Phases
        </h3>
        <div class="space-y-3">
          <div class="flex items-start gap-3 rounded-lg border border-subtle bg-surface-body p-3">
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-200">
              1
            </div>
            <div>
              <h4 class="font-semibold text-primary">Submission Phase</h4>
              <p class="text-sm text-muted">
                Participants add games they want to trade with conditions and preferences
              </p>
            </div>
          </div>
          <div class="flex items-start gap-3 rounded-lg border border-subtle bg-surface-body p-3">
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-sm font-bold text-blue-200">
              2
            </div>
            <div>
              <h4 class="font-semibold text-primary">Want List Phase</h4>
              <p class="text-sm text-muted">
                Participants browse submissions and build their want lists
              </p>
            </div>
          </div>
          <div class="flex items-start gap-3 rounded-lg border border-subtle bg-surface-body p-3">
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
          <div class="flex items-start gap-3 rounded-lg border border-subtle bg-surface-body p-3">
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-sm font-bold text-amber-200">
              4
            </div>
            <div>
              <h4 class="font-semibold text-primary">Execution Phase</h4>
              <p class="text-sm text-muted">
                Participants coordinate shipping and complete their trades
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-6 flex items-center justify-between border-t border-subtle pt-6">
      <a href="/trade-parties" class="text-sm text-secondary hover:text-primary">
        ← Back to Trade Partys
      </a>
      <button
        disabled
        class="cursor-not-allowed rounded-lg border border-subtle bg-surface-body px-6 py-2 font-semibold text-muted opacity-50"
      >
        Create Trade Party (Coming Soon)
      </button>
    </div>
  </div>

  <!-- Info Box -->
  <div class="mt-6 rounded-lg border border-subtle bg-surface-body p-4">
    <h3 class="mb-2 text-sm font-semibold text-primary">💡 Trade Party Tips</h3>
    <ul class="space-y-2 text-sm text-secondary">
      <li>• Math trades work best with 15+ participants for maximum matching opportunities</li>
      <li>• Set realistic timelines - typically 2 weeks submission + 1 week want lists</li>
      <li>• Consider regional groupings to reduce shipping costs</li>
      <li>• Enable "no trade" items so participants aren't forced into unwanted trades</li>
      <li>• Communicate shipping expectations clearly upfront</li>
    </ul>
    <a
      href="/help/trade-parties"
      class="mt-3 inline-block text-sm text-accent hover:underline"
    >
      Learn more about organizing trade partys →
    </a>
  </div>
</div>
