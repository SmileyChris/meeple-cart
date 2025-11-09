<script lang="ts">
  import { currentUser } from '$lib/pocketbase';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Group Buy · Meeple Cart</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <!-- Breadcrumb -->
  <div class="mb-6 text-sm text-secondary">
    <a href="/group-buys" class="hover:text-primary">Group Buys</a>
    <span class="mx-2">/</span>
    <span class="text-primary">Group Buy Details</span>
  </div>

  <!-- Placeholder Content -->
  <div class="rounded-lg border border-subtle bg-surface-card p-8">
    <div class="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
      <div class="flex items-start gap-3">
        <span class="text-2xl">🚧</span>
        <div>
          <p class="font-semibold text-amber-200">Feature In Development</p>
          <p class="mt-1 text-sm text-amber-300/80">
            Group buy details page is coming soon!
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
            class="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200"
          >
            Active
          </span>
          <span class="text-sm text-muted">Regional · Auckland</span>
        </div>
        <h1 class="mb-2 text-3xl font-bold text-primary">
          Example Group Buy - Frosthaven Expansion
        </h1>
        <div class="flex items-center gap-4 text-sm text-secondary">
          <span>Organized by @coordinator</span>
          <span>·</span>
          <span>12 participants</span>
          <span>·</span>
          <span>Closes in 14 days</span>
        </div>
      </div>

      <!-- Campaign Info -->
      <div class="grid gap-6 lg:grid-cols-3">
        <div class="lg:col-span-2 space-y-6">
          <div>
            <h2 class="mb-3 text-lg font-semibold text-primary">Campaign Details</h2>
            <div class="rounded-lg border border-subtle bg-surface-body p-4">
              <p class="text-sm text-secondary">
                Campaign description, Kickstarter link, pledge tiers, estimated delivery, etc.
              </p>
            </div>
          </div>

          <div>
            <h2 class="mb-3 text-lg font-semibold text-primary">Pledge Tiers</h2>
            <div class="space-y-3">
              <div class="rounded-lg border border-subtle bg-surface-body p-4">
                <div class="flex items-start justify-between">
                  <div>
                    <h3 class="font-semibold text-primary">Base Game + Expansions</h3>
                    <p class="mt-1 text-sm text-muted">
                      Core box with all stretch goals
                    </p>
                  </div>
                  <div class="text-right">
                    <p class="font-semibold text-primary">$120 NZD</p>
                    <p class="text-xs text-muted">8 / 10 spots</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 class="mb-3 text-lg font-semibold text-primary">Discussion</h2>
            <div class="rounded-lg border border-subtle bg-surface-body p-4">
              <p class="text-sm text-muted">
                Discussion thread would appear here...
              </p>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-4">
          <div class="rounded-lg border border-subtle bg-surface-card p-4">
            <h3 class="mb-3 font-semibold text-primary">Progress</h3>
            <div class="mb-2 h-2 rounded-full bg-surface-body">
              <div class="h-2 w-4/5 rounded-full bg-emerald-500"></div>
            </div>
            <p class="text-sm text-secondary">12 / 15 minimum participants</p>
          </div>

          <div class="rounded-lg border border-subtle bg-surface-card p-4">
            <h3 class="mb-3 font-semibold text-primary">Timeline</h3>
            <div class="space-y-2 text-sm text-secondary">
              <div class="flex justify-between">
                <span>Pledge Deadline:</span>
                <span class="font-medium text-primary">Jan 15, 2026</span>
              </div>
              <div class="flex justify-between">
                <span>Est. Delivery:</span>
                <span class="font-medium text-primary">Q3 2026</span>
              </div>
            </div>
          </div>

          <div class="rounded-lg border border-subtle bg-surface-card p-4">
            <h3 class="mb-3 font-semibold text-primary">Pickup Locations</h3>
            <div class="space-y-2 text-sm text-secondary">
              <div>📍 Auckland Central</div>
              <div>📍 North Shore</div>
            </div>
          </div>

          {#if $currentUser}
            <button
              disabled
              class="w-full cursor-not-allowed rounded-lg border border-emerald-500 bg-emerald-500 px-6 py-2 font-semibold text-surface-body opacity-50"
            >
              Register Interest
            </button>
          {:else}
            <a
              href="/login?redirect=/group-buys/{data.id}"
              class="block w-full rounded-lg border border-emerald-500 bg-emerald-500 px-6 py-2 text-center font-semibold text-surface-body transition hover:bg-emerald-600"
            >
              Sign In to Join
            </a>
          {/if}
        </div>
      </div>
    </div>

    <div class="mt-6 border-t border-subtle pt-6">
      <a href="/group-buys" class="text-sm text-secondary hover:text-primary">
        ← Back to Group Buys
      </a>
    </div>
  </div>
</div>
