<script lang="ts">
  import { currentUser } from '$lib/pocketbase';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Trade Party · Meeple Cart</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <!-- Breadcrumb -->
  <div class="mb-6 text-sm text-secondary">
    <a href="/trade-parties" class="hover:text-primary">Trade Parties</a>
    <span class="mx-2">/</span>
    <span class="text-primary">Trade Party Details</span>
  </div>

  <!-- Placeholder Content -->
  <div class="rounded-lg border border-subtle bg-surface-card p-8">
    <div class="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
      <div class="flex items-start gap-3">
        <span class="text-2xl">🚧</span>
        <div>
          <p class="font-semibold text-amber-200">Feature In Development</p>
          <p class="mt-1 text-sm text-amber-300/80">
            Trade party details page is coming soon!
          </p>
        </div>
      </div>
    </div>

    <!-- Preview Layout -->
    <div class="space-y-6 opacity-50">
      <!-- Header -->
      <div class="border-b border-subtle pb-6">
        <div class="mb-2 flex items-center gap-2">
          <span
            class="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-200"
          >
            Accepting Submissions
          </span>
          <span class="text-sm text-muted">Closes in 5 days</span>
        </div>
        <h1 class="mb-2 text-3xl font-bold text-primary">
          Summer 2026 Trade Party - Auckland Region
        </h1>
        <div class="flex items-center gap-4 text-sm text-secondary">
          <span>Organized by @coordinator</span>
          <span>·</span>
          <span>24 participants</span>
          <span>·</span>
          <span>87 games submitted</span>
        </div>
      </div>

      <!-- Main Content -->
      <div class="grid gap-6 lg:grid-cols-3">
        <div class="lg:col-span-2 space-y-6">
          <!-- About -->
          <div>
            <h2 class="mb-3 text-lg font-semibold text-primary">About This Trade Party</h2>
            <div class="rounded-lg border border-subtle bg-surface-body p-4">
              <p class="text-sm text-secondary">
                Welcome to the Summer 2026 Auckland region trade party! This event is open to all
                community members in the Auckland area. Submit your unwanted games and build your
                want lists to find the perfect matches through our algorithmic trading system.
              </p>
            </div>
          </div>

          <!-- Timeline -->
          <div>
            <h2 class="mb-3 text-lg font-semibold text-primary">Timeline</h2>
            <div class="space-y-3">
              <div class="flex gap-4 rounded-lg border border-subtle bg-surface-body p-4">
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-200">
                  ✓
                </div>
                <div class="flex-1">
                  <div class="flex items-center justify-between">
                    <h3 class="font-semibold text-primary">Submission Period</h3>
                    <span class="text-xs text-muted">Dec 1 - Dec 14</span>
                  </div>
                  <p class="mt-1 text-sm text-muted">Add games you want to trade</p>
                </div>
              </div>
              <div class="flex gap-4 rounded-lg border border-accent bg-accent/5 p-4">
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent">
                  →
                </div>
                <div class="flex-1">
                  <div class="flex items-center justify-between">
                    <h3 class="font-semibold text-primary">Want List Period</h3>
                    <span class="text-xs text-muted">Dec 15 - Dec 21</span>
                  </div>
                  <p class="mt-1 text-sm text-muted">Select games you'd accept in trade</p>
                </div>
              </div>
              <div class="flex gap-4 rounded-lg border border-subtle bg-surface-body p-4 opacity-50">
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-hover text-muted">
                  ○
                </div>
                <div class="flex-1">
                  <div class="flex items-center justify-between">
                    <h3 class="font-semibold text-primary">Results</h3>
                    <span class="text-xs text-muted">Dec 22</span>
                  </div>
                  <p class="mt-1 text-sm text-muted">Algorithm runs and results published</p>
                </div>
              </div>
              <div class="flex gap-4 rounded-lg border border-subtle bg-surface-body p-4 opacity-50">
                <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-hover text-muted">
                  ○
                </div>
                <div class="flex-1">
                  <div class="flex items-center justify-between">
                    <h3 class="font-semibold text-primary">Execution</h3>
                    <span class="text-xs text-muted">Dec 23 - Jan 5</span>
                  </div>
                  <p class="mt-1 text-sm text-muted">Coordinate and complete trades</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Submissions Preview -->
          <div>
            <h2 class="mb-3 text-lg font-semibold text-primary">Submitted Games</h2>
            <div class="space-y-2">
              <div class="flex items-center justify-between rounded-lg border border-subtle bg-surface-body p-3">
                <div>
                  <h3 class="font-medium text-primary">Wingspan</h3>
                  <p class="text-xs text-muted">Submitted by @alice · Like New</p>
                </div>
                <button
                  disabled
                  class="rounded px-3 py-1 text-xs font-medium text-muted opacity-50"
                >
                  Add to Want List
                </button>
              </div>
              <div class="flex items-center justify-between rounded-lg border border-subtle bg-surface-body p-3">
                <div>
                  <h3 class="font-medium text-primary">Gloomhaven</h3>
                  <p class="text-xs text-muted">Submitted by @bob · Good</p>
                </div>
                <button
                  disabled
                  class="rounded px-3 py-1 text-xs font-medium text-muted opacity-50"
                >
                  Add to Want List
                </button>
              </div>
              <p class="pt-2 text-center text-sm text-muted">+ 85 more games...</p>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-4">
          <div class="rounded-lg border border-subtle bg-surface-card p-4">
            <h3 class="mb-3 font-semibold text-primary">Participation Stats</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-secondary">Participants:</span>
                <span class="font-medium text-primary">24</span>
              </div>
              <div class="flex justify-between">
                <span class="text-secondary">Games Submitted:</span>
                <span class="font-medium text-primary">87</span>
              </div>
              <div class="flex justify-between">
                <span class="text-secondary">Avg Games/Person:</span>
                <span class="font-medium text-primary">3.6</span>
              </div>
            </div>
          </div>

          <div class="rounded-lg border border-subtle bg-surface-card p-4">
            <h3 class="mb-3 font-semibold text-primary">Organizer</h3>
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 text-lg">
                👤
              </div>
              <div>
                <p class="font-medium text-primary">@coordinator</p>
                <p class="text-xs text-muted">12 trades · Trusted Member</p>
              </div>
            </div>
          </div>

          <div class="rounded-lg border border-subtle bg-surface-card p-4">
            <h3 class="mb-3 font-semibold text-primary">Rules</h3>
            <ul class="space-y-1 text-sm text-secondary">
              <li>• Auckland region only</li>
              <li>• Max 5 games per person</li>
              <li>• Shipping: $5 flat rate</li>
              <li>• No shipping to SI</li>
            </ul>
          </div>

          {#if $currentUser}
            <button
              disabled
              class="w-full cursor-not-allowed rounded-lg border border-emerald-500 bg-emerald-500 px-6 py-2 font-semibold text-surface-body opacity-50"
            >
              Submit Games
            </button>
          {:else}
            <a
              href="/login?redirect=/trade-parties/{data.id}"
              class="block w-full rounded-lg border border-emerald-500 bg-emerald-500 px-6 py-2 text-center font-semibold text-surface-body transition hover:bg-emerald-600"
            >
              Sign In to Participate
            </a>
          {/if}
        </div>
      </div>
    </div>

    <div class="mt-6 border-t border-subtle pt-6">
      <a href="/trade-parties" class="text-sm text-secondary hover:text-primary">
        ← Back to Trade Partys
      </a>
    </div>
  </div>
</div>
