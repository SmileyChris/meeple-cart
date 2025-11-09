<script lang="ts">
  import { currentUser } from '$lib/pocketbase';
  import { groupBuys, activeGroupBuys, completedGroupBuys, groupBuyOperations, participants } from '$lib/stores/group-buys';
  import { goto } from '$app/navigation';

  let activeTab = $state<'active' | 'planning' | 'completed'>('active');
  let searchQuery = $state('');

  // Filter group buys based on active tab
  let filteredGroupBuys = $derived(() => {
    let buys = activeTab === 'completed'
      ? $completedGroupBuys
      : activeTab === 'planning'
      ? $groupBuys.filter(gb => gb.status === 'collecting_interest')
      : $activeGroupBuys;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      buys = buys.filter(gb =>
        gb.title.toLowerCase().includes(query) ||
        gb.description.toLowerCase().includes(query)
      );
    }

    return buys;
  });

  function getParticipantCount(groupBuyId: string): number {
    return $participants.filter(p =>
      p.group_buy_id === groupBuyId &&
      p.interest_status !== 'withdrawn'
    ).length;
  }

  function getStatusColor(status: string): string {
    const colors = {
      collecting_interest: 'bg-blue-500/20 text-blue-200 border-blue-500/30',
      collecting_payments: 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30',
      ordered: 'bg-purple-500/20 text-purple-200 border-purple-500/30',
      fulfillment: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30',
      completed: 'bg-gray-500/20 text-gray-200 border-gray-500/30',
      cancelled: 'bg-red-500/20 text-red-200 border-red-500/30',
    };
    return colors[status as keyof typeof colors] || colors.collecting_interest;
  }

  function getStatusLabel(status: string): string {
    const labels = {
      collecting_interest: 'Open for Interest',
      collecting_payments: 'Payment Collection',
      ordered: 'Order Placed',
      fulfillment: 'Fulfillment',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return labels[status as keyof typeof labels] || status;
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return 'Ended';
    } else if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else if (diffDays <= 7) {
      return `${diffDays} days`;
    } else {
      return date.toLocaleDateString('en-NZ', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  }

  function isManager(groupBuy: any): boolean {
    return $currentUser ? groupBuy.managers.includes($currentUser.id) : false;
  }
</script>

<svelte:head>
  <title>Group Buys · Meeple Cart</title>
  <meta
    name="description"
    content="Join group buys to save on shipping and get better deals on board games from overseas."
  />
</svelte:head>

<main class="bg-surface-body px-6 py-16 text-primary transition-colors sm:px-8">
  <div class="mx-auto max-w-6xl space-y-8">
    <!-- Header -->
    <div class="space-y-4">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-4xl font-semibold tracking-tight sm:text-5xl">🛒 Group Buys</h1>
          <p class="mt-2 text-base text-secondary sm:text-lg">
            Save on shipping costs and coordinate bulk orders with the community
          </p>
        </div>
        {#if $currentUser}
          <a
            href="/group-buys/new"
            class="rounded-lg border border-emerald-500 bg-emerald-500 px-6 py-3 font-semibold text-surface-body transition hover:bg-emerald-600"
          >
            Start Group Buy
          </a>
        {/if}
      </div>
    </div>

    <!-- Search Bar -->
    <div class="relative">
      <input
        type="search"
        bind:value={searchQuery}
        placeholder="Search group buys..."
        class="w-full rounded-lg border border-subtle bg-surface-card px-4 py-3 pl-10 text-primary placeholder-muted transition focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      />
      <svg
        class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </div>

    <!-- Tabs -->
    <div class="flex gap-2 border-b border-subtle">
      <button
        onclick={() => (activeTab = 'active')}
        class="border-b-2 px-4 py-2 text-sm font-medium transition {activeTab === 'active'
          ? 'border-accent text-accent'
          : 'border-transparent text-secondary hover:text-primary'}"
      >
        Active ({$activeGroupBuys.length})
      </button>
      <button
        onclick={() => (activeTab = 'planning')}
        class="border-b-2 px-4 py-2 text-sm font-medium transition {activeTab === 'planning'
          ? 'border-accent text-accent'
          : 'border-transparent text-secondary hover:text-primary'}"
      >
        Planning ({$groupBuys.filter(gb => gb.status === 'collecting_interest').length})
      </button>
      <button
        onclick={() => (activeTab = 'completed')}
        class="border-b-2 px-4 py-2 text-sm font-medium transition {activeTab === 'completed'
          ? 'border-accent text-accent'
          : 'border-transparent text-secondary hover:text-primary'}"
      >
        Completed ({$completedGroupBuys.length})
      </button>
    </div>

    <!-- Group Buy Cards -->
    {#if filteredGroupBuys().length === 0}
      <div
        class="rounded-xl border border-dashed border-subtle bg-surface-card p-12 text-center transition-colors"
      >
        <div class="mb-4">
          <span class="text-6xl">🔍</span>
        </div>
        <p class="text-lg font-medium text-primary">
          {searchQuery ? 'No group buys found' : 'No group buys yet'}
        </p>
        <p class="mt-2 text-sm text-secondary">
          {searchQuery
            ? 'Try adjusting your search query'
            : 'Be the first to start a group buy for your favorite campaign!'}
        </p>
        {#if $currentUser && !searchQuery}
          <a
            href="/group-buys/new"
            class="mt-6 inline-block rounded-lg border border-accent bg-accent px-6 py-2 font-semibold text-surface-body transition hover:bg-accent/90"
          >
            Start Your First Group Buy
          </a>
        {/if}
      </div>
    {:else}
      <div class="grid gap-6 md:grid-cols-2">
        {#each filteredGroupBuys() as groupBuy (groupBuy.id)}
          <article
            class="group cursor-pointer rounded-xl border border-subtle bg-surface-card p-6 transition-all hover:border-accent hover:shadow-lg"
            onclick={() => goto(`/group-buys/${groupBuy.id}`)}
          >
            <!-- Header -->
            <div class="mb-4 flex items-start justify-between gap-4">
              <div class="flex-1">
                <h2 class="text-xl font-semibold text-primary group-hover:text-accent transition">
                  {groupBuy.title}
                </h2>
                <div class="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
                  <span class="flex items-center gap-1">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    {getParticipantCount(groupBuy.id)} participants
                  </span>
                  {#if isManager(groupBuy)}
                    <span class="rounded-full bg-accent/20 px-2 py-0.5 text-xs font-medium text-accent">
                      Manager
                    </span>
                  {/if}
                </div>
              </div>
              <span class="shrink-0 rounded-full border px-3 py-1 text-xs font-semibold {getStatusColor(groupBuy.status)}">
                {getStatusLabel(groupBuy.status)}
              </span>
            </div>

            <!-- Description -->
            <p class="mb-4 line-clamp-2 text-sm text-secondary">
              {groupBuy.description}
            </p>

            <!-- Metadata -->
            <div class="flex items-center justify-between border-t border-subtle pt-4 text-sm">
              <div class="flex items-center gap-4 text-muted">
                <span class="flex items-center gap-1">
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  {formatDate(groupBuy.pledge_deadline)}
                </span>
                <span class="capitalize">
                  {groupBuy.usage_mode}
                </span>
              </div>
              <span class="font-medium text-accent">
                View Details →
              </span>
            </div>
          </article>
        {/each}
      </div>
    {/if}

    <!-- Info Cards -->
    {#if filteredGroupBuys().length === 0 && !searchQuery}
      <div class="mt-8 grid gap-6 sm:grid-cols-3">
        <div class="rounded-lg border border-subtle bg-surface-card p-6">
          <div class="mb-3 text-3xl">💰</div>
          <h3 class="mb-2 font-semibold text-primary">Save on Shipping</h3>
          <p class="text-sm text-muted">
            Split international shipping costs across multiple participants
          </p>
        </div>
        <div class="rounded-lg border border-subtle bg-surface-card p-6">
          <div class="mb-3 text-3xl">📍</div>
          <h3 class="mb-2 font-semibold text-primary">Regional Hubs</h3>
          <p class="text-sm text-muted">
            Coordinate local pickup points across New Zealand
          </p>
        </div>
        <div class="rounded-lg border border-subtle bg-surface-card p-6">
          <div class="mb-3 text-3xl">📊</div>
          <h3 class="mb-2 font-semibold text-primary">Track Payments</h3>
          <p class="text-sm text-muted">
            Manage commitments and payments with unique participant codes
          </p>
        </div>
      </div>
    {/if}
  </div>
</main>
