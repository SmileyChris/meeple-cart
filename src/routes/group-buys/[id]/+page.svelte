<script lang="ts">
  import { page } from '$app/stores';
  import { currentUser } from '$lib/pocketbase';
  import {
    groupBuyOperations,
    tierOperations,
    hubOperations,
    participantOperations,
    type GroupBuy,
    type GroupBuyTier,
    type GroupBuyHub,
  } from '$lib/stores/group-buys';
  import { goto } from '$app/navigation';

  const groupBuyId = $page.params.id;

  let groupBuy = $state<GroupBuy | undefined>(groupBuyOperations.getById(groupBuyId));
  let tiers = $state<GroupBuyTier[]>([]);
  let hubs = $state<GroupBuyHub[]>([]);
  let participants = $state<any[]>([]);
  let userParticipation = $state<any | undefined>(undefined);
  let isManager = $state(false);

  // Modal state
  let showRegistrationModal = $state(false);
  let selectedTier = $state<string>('');
  let quantity = $state(1);
  let selectedHub = $state<string>('');
  let shippingMethod = $state<'hub_pickup' | 'direct_delivery'>('hub_pickup');

  // Load data
  $effect(() => {
    if (groupBuyId) {
      groupBuy = groupBuyOperations.getById(groupBuyId);
      tiers = groupBuyOperations.getTiers(groupBuyId);
      hubs = groupBuyOperations.getHubs(groupBuyId);
      participants = groupBuyOperations.getParticipants(groupBuyId);

      if ($currentUser) {
        userParticipation = groupBuyOperations.getUserParticipation(groupBuyId, $currentUser.id);
        isManager = groupBuyOperations.isManager(groupBuyId, $currentUser.id);
      }
    }
  });

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
    return new Date(dateString).toLocaleDateString('en-NZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  function formatCurrency(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`;
  }

  function getParticipantCount(): number {
    return participants.filter(p => p.interest_status !== 'withdrawn').length;
  }

  function getTierParticipants(tierId: string): number {
    return participants.filter(
      p => p.tier_id === tierId && p.interest_status !== 'withdrawn'
    ).length;
  }

  function getHubParticipants(hubId: string): number {
    return participants.filter(
      p => p.hub_id === hubId && p.interest_status !== 'withdrawn'
    ).length;
  }

  function openRegistrationModal() {
    if (!$currentUser) {
      goto('/login?redirect=' + encodeURIComponent(`/group-buys/${groupBuyId}`));
      return;
    }
    showRegistrationModal = true;
    if (tiers.length > 0) {
      selectedTier = tiers[0].id;
    }
    if (hubs.length > 0) {
      selectedHub = hubs[0].id;
    }
  }

  function closeRegistrationModal() {
    showRegistrationModal = false;
    selectedTier = '';
    quantity = 1;
    selectedHub = '';
    shippingMethod = 'hub_pickup';
  }

  function calculateEstimatedCost(): { tierCost: number; shippingCost: number; total: number } {
    const tier = tiers.find(t => t.id === selectedTier);
    const hub = hubs.find(h => h.id === selectedHub);

    if (!tier) return { tierCost: 0, shippingCost: 0, total: 0 };

    const tierCost = tier.price_per_unit * quantity;
    let shippingCost = tier.shipping_per_unit * quantity;

    if (shippingMethod === 'hub_pickup' && hub) {
      if (hub.shipping_type === 'flat_per_order') {
        shippingCost += hub.shipping_amount;
      } else if (hub.shipping_type === 'flat_per_unit') {
        shippingCost += hub.shipping_amount * quantity;
      }
    }

    return {
      tierCost,
      shippingCost,
      total: tierCost + shippingCost,
    };
  }

  async function submitRegistration() {
    if (!$currentUser || !groupBuy) return;

    try {
      participantOperations.register({
        group_buy_id: groupBuy.id,
        user_id: $currentUser.id,
        user_name: $currentUser.display_name,
        tier_id: selectedTier,
        quantity,
        hub_id: shippingMethod === 'hub_pickup' ? selectedHub : undefined,
        shipping_method: shippingMethod,
      });

      // Refresh participation data
      userParticipation = groupBuyOperations.getUserParticipation(groupBuyId, $currentUser.id);
      participants = groupBuyOperations.getParticipants(groupBuyId);

      closeRegistrationModal();
    } catch (error) {
      console.error('Failed to register:', error);
      alert('Failed to register. Please try again.');
    }
  }

  function withdrawRegistration() {
    if (!userParticipation || !$currentUser) return;

    const confirmed = confirm(
      'Are you sure you want to withdraw your registration? This cannot be undone.'
    );

    if (confirmed) {
      participantOperations.withdraw(userParticipation.id, $currentUser.id);
      userParticipation = undefined;
      participants = groupBuyOperations.getParticipants(groupBuyId);
    }
  }

  if (!groupBuy) {
    goto('/group-buys');
  }
</script>

<svelte:head>
  <title>{groupBuy?.title || 'Group Buy'} · Meeple Cart</title>
</svelte:head>

{#if groupBuy}
  <div class="bg-surface-body min-h-screen px-4 py-8 text-primary transition-colors sm:px-6 lg:px-8">
    <div class="mx-auto max-w-7xl">
      <!-- Breadcrumb -->
      <div class="mb-6 flex items-center gap-2 text-sm text-secondary">
        <a href="/group-buys" class="hover:text-primary transition">Group Buys</a>
        <span>/</span>
        <span class="text-primary">{groupBuy.title}</span>
      </div>

      <!-- Main Layout -->
      <div class="grid gap-8 lg:grid-cols-3">
        <!-- Main Content - Left Column (2/3) -->
        <div class="lg:col-span-2 space-y-8">
          <!-- Header -->
          <div class="rounded-xl border border-subtle bg-surface-card p-6">
            <div class="mb-4 flex items-start justify-between gap-4">
              <div class="flex-1">
                <h1 class="text-3xl font-bold text-primary">{groupBuy.title}</h1>
                <div class="mt-3 flex flex-wrap items-center gap-3">
                  <span class="rounded-full border px-3 py-1 text-sm font-semibold {getStatusColor(groupBuy.status)}">
                    {getStatusLabel(groupBuy.status)}
                  </span>
                  <span class="text-sm text-muted capitalize">
                    {groupBuy.usage_mode} mode
                  </span>
                  <span class="flex items-center gap-1 text-sm text-muted">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    {getParticipantCount()} participants
                  </span>
                </div>
              </div>
              {#if isManager}
                <a
                  href="/group-buys/{groupBuy.id}/manage"
                  class="rounded-lg border border-accent bg-accent px-4 py-2 text-sm font-semibold text-surface-body transition hover:bg-accent/90"
                >
                  Manage
                </a>
              {/if}
            </div>

            <div class="space-y-4 border-t border-subtle pt-4">
              <div>
                <h2 class="mb-2 font-semibold text-primary">Campaign Description</h2>
                <p class="text-sm text-secondary leading-relaxed">{groupBuy.description}</p>
              </div>

              <div class="flex flex-wrap gap-6 text-sm">
                <div>
                  <span class="text-muted">Campaign URL:</span>
                  <a
                    href={groupBuy.campaign_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="ml-2 text-accent hover:underline"
                  >
                    View Campaign →
                  </a>
                </div>
                <div>
                  <span class="text-muted">Pledge Deadline:</span>
                  <span class="ml-2 font-medium text-primary">{formatDate(groupBuy.pledge_deadline)}</span>
                </div>
                <div>
                  <span class="text-muted">Est. Delivery:</span>
                  <span class="ml-2 font-medium text-primary">{formatDate(groupBuy.estimated_delivery)}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Pledge Tiers -->
          <div class="rounded-xl border border-subtle bg-surface-card p-6">
            <h2 class="mb-4 text-xl font-semibold text-primary">Pledge Tiers</h2>
            <div class="space-y-4">
              {#each tiers as tier (tier.id)}
                <div class="rounded-lg border border-subtle bg-surface-body p-4">
                  <div class="flex items-start justify-between gap-4">
                    <div class="flex-1">
                      <h3 class="font-semibold text-primary">{tier.name}</h3>
                      {#if tier.notes}
                        <p class="mt-1 text-sm text-muted">{tier.notes}</p>
                      {/if}
                    </div>
                    <div class="text-right">
                      <div class="text-lg font-bold text-accent">{formatCurrency(tier.price_per_unit)}</div>
                      <div class="text-xs text-muted">+ {formatCurrency(tier.shipping_per_unit)} shipping</div>
                      <div class="mt-2 text-xs text-secondary">
                        {getTierParticipants(tier.id)} / {tier.max_quantity > 0 ? tier.max_quantity : '∞'} spots
                      </div>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>

          <!-- Pickup Locations -->
          <div class="rounded-xl border border-subtle bg-surface-card p-6">
            <h2 class="mb-4 text-xl font-semibold text-primary">Pickup Locations</h2>
            <div class="space-y-4">
              {#each hubs as hub (hub.id)}
                <div class="rounded-lg border border-subtle bg-surface-body p-4">
                  <div class="flex items-start justify-between gap-4">
                    <div class="flex-1">
                      <h3 class="font-semibold text-primary">📍 {hub.name}</h3>
                      <p class="mt-1 text-sm text-secondary">{hub.city}</p>
                      <p class="mt-2 text-sm text-muted">{hub.instructions}</p>
                      {#if hub.shipping_type !== 'no_fee'}
                        <p class="mt-2 text-xs text-muted">
                          {hub.shipping_type === 'flat_per_order' ? 'Flat fee' : 'Per unit fee'}:
                          {formatCurrency(hub.shipping_amount)}
                        </p>
                      {/if}
                    </div>
                    <div class="text-right text-sm text-secondary">
                      {getHubParticipants(hub.id)} participants
                    </div>
                  </div>
                </div>
              {/each}
              {#if groupBuy.delivery_policy === 'hub_or_direct'}
                <div class="rounded-lg border border-dashed border-subtle bg-surface-body p-4">
                  <div class="flex items-start gap-3">
                    <svg class="h-5 w-5 shrink-0 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                      />
                    </svg>
                    <div>
                      <h3 class="font-semibold text-primary">Direct Delivery Available</h3>
                      <p class="mt-1 text-sm text-muted">
                        Can't make it to a pickup location? Direct delivery to your address is available.
                      </p>
                    </div>
                  </div>
                </div>
              {/if}
            </div>
          </div>
        </div>

        <!-- Sidebar - Right Column (1/3) -->
        <div class="space-y-6">
          <!-- Registration Card -->
          {#if userParticipation}
            <div class="rounded-xl border border-accent/30 bg-surface-card p-6">
              <div class="mb-4 flex items-center gap-2">
                <svg class="h-5 w-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fill-rule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clip-rule="evenodd"
                  />
                </svg>
                <h3 class="font-semibold text-emerald-400">You're Registered!</h3>
              </div>

              <div class="space-y-3 text-sm">
                <div>
                  <span class="text-muted">Status:</span>
                  <span class="ml-2 font-medium capitalize text-primary">{userParticipation.interest_status}</span>
                </div>
                <div>
                  <span class="text-muted">Tier:</span>
                  <span class="ml-2 font-medium text-primary">
                    {tiers.find(t => t.id === userParticipation.tier_id)?.name || 'Unknown'}
                  </span>
                </div>
                <div>
                  <span class="text-muted">Quantity:</span>
                  <span class="ml-2 font-medium text-primary">{userParticipation.quantity}</span>
                </div>
                <div>
                  <span class="text-muted">Total Cost:</span>
                  <span class="ml-2 font-medium text-accent">
                    {formatCurrency(
                      (tiers.find(t => t.id === userParticipation.tier_id)?.price_per_unit || 0) *
                        userParticipation.quantity +
                        userParticipation.shipping_cost
                    )}
                  </span>
                </div>
                {#if userParticipation.payment_code}
                  <div class="rounded-lg bg-surface-body p-3">
                    <span class="text-xs text-muted">Payment Code:</span>
                    <div class="mt-1 font-mono text-lg font-bold text-accent">
                      {userParticipation.payment_code}
                    </div>
                  </div>
                {/if}
              </div>

              {#if userParticipation.interest_status === 'interested'}
                <button
                  onclick={withdrawRegistration}
                  class="mt-4 w-full rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/20"
                >
                  Withdraw Registration
                </button>
              {/if}
            </div>
          {:else if groupBuy.status === 'collecting_interest'}
            <div class="rounded-xl border border-subtle bg-surface-card p-6">
              <h3 class="mb-4 text-lg font-semibold text-primary">Join This Group Buy</h3>
              <p class="mb-4 text-sm text-secondary">
                Register your interest to participate in this group buy and save on shipping costs.
              </p>
              <button
                onclick={openRegistrationModal}
                class="w-full rounded-lg border border-emerald-500 bg-emerald-500 px-6 py-3 font-semibold text-surface-body transition hover:bg-emerald-600"
              >
                Register Interest
              </button>
            </div>
          {:else}
            <div class="rounded-xl border border-subtle bg-surface-card p-6">
              <h3 class="mb-2 text-lg font-semibold text-primary">Registration Closed</h3>
              <p class="text-sm text-secondary">
                This group buy is no longer accepting new participants.
              </p>
            </div>
          {/if}

          <!-- Progress Card -->
          <div class="rounded-xl border border-subtle bg-surface-card p-6">
            <h3 class="mb-4 font-semibold text-primary">Progress</h3>
            <div class="mb-2 h-2 rounded-full bg-surface-body">
              <div
                class="h-2 rounded-full bg-accent transition-all"
                style="width: {Math.min(100, (getParticipantCount() / 10) * 100)}%"
              ></div>
            </div>
            <p class="text-sm text-secondary">
              {getParticipantCount()} {getParticipantCount() === 1 ? 'participant' : 'participants'} registered
            </p>
          </div>

          <!-- Timeline Card -->
          <div class="rounded-xl border border-subtle bg-surface-card p-6">
            <h3 class="mb-4 font-semibold text-primary">Timeline</h3>
            <div class="space-y-4 text-sm">
              <div class="flex justify-between">
                <span class="text-muted">Pledge Deadline:</span>
                <span class="font-medium text-primary">{formatDate(groupBuy.pledge_deadline)}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Est. Delivery:</span>
                <span class="font-medium text-primary">{formatDate(groupBuy.estimated_delivery)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Registration Modal -->
  {#if showRegistrationModal}
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onclick={closeRegistrationModal}
    >
      <div
        class="w-full max-w-lg rounded-xl border border-subtle bg-surface-card p-6 shadow-2xl"
        onclick={(e) => e.stopPropagation()}
      >
        <div class="mb-6 flex items-center justify-between">
          <h2 class="text-2xl font-bold text-primary">Register Your Interest</h2>
          <button
            onclick={closeRegistrationModal}
            class="rounded-lg p-2 text-secondary transition hover:bg-surface-body hover:text-primary"
          >
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form
          onsubmit={(e) => {
            e.preventDefault();
            submitRegistration();
          }}
          class="space-y-6"
        >
          <!-- Tier Selection -->
          <div>
            <label class="mb-2 block text-sm font-medium text-primary">Select Tier</label>
            <select
              bind:value={selectedTier}
              required
              class="w-full rounded-lg border border-subtle bg-surface-body px-4 py-3 text-primary transition focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
              {#each tiers as tier (tier.id)}
                <option value={tier.id}>
                  {tier.name} - {formatCurrency(tier.price_per_unit)}
                </option>
              {/each}
            </select>
          </div>

          <!-- Quantity -->
          <div>
            <label class="mb-2 block text-sm font-medium text-primary">Quantity</label>
            <input
              type="number"
              bind:value={quantity}
              min="1"
              max={tiers.find(t => t.id === selectedTier)?.max_quantity || 99}
              required
              class="w-full rounded-lg border border-subtle bg-surface-body px-4 py-3 text-primary transition focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <!-- Shipping Method -->
          {#if groupBuy.delivery_policy === 'hub_or_direct'}
            <div>
              <label class="mb-2 block text-sm font-medium text-primary">Shipping Method</label>
              <div class="space-y-2">
                <label class="flex items-center gap-3 rounded-lg border border-subtle bg-surface-body p-3 cursor-pointer transition hover:border-accent">
                  <input
                    type="radio"
                    bind:group={shippingMethod}
                    value="hub_pickup"
                    class="h-4 w-4 text-accent"
                  />
                  <span class="text-sm text-primary">Hub Pickup</span>
                </label>
                <label class="flex items-center gap-3 rounded-lg border border-subtle bg-surface-body p-3 cursor-pointer transition hover:border-accent">
                  <input
                    type="radio"
                    bind:group={shippingMethod}
                    value="direct_delivery"
                    class="h-4 w-4 text-accent"
                  />
                  <span class="text-sm text-primary">Direct Delivery</span>
                </label>
              </div>
            </div>
          {/if}

          <!-- Hub Selection (if hub_pickup) -->
          {#if shippingMethod === 'hub_pickup'}
            <div>
              <label class="mb-2 block text-sm font-medium text-primary">Select Pickup Hub</label>
              <select
                bind:value={selectedHub}
                required
                class="w-full rounded-lg border border-subtle bg-surface-body px-4 py-3 text-primary transition focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              >
                {#each hubs as hub (hub.id)}
                  <option value={hub.id}>
                    {hub.name} - {hub.city}
                  </option>
                {/each}
              </select>
            </div>
          {/if}

          <!-- Cost Estimate -->
          <div class="rounded-lg border border-accent/30 bg-accent/5 p-4">
            <h3 class="mb-3 font-semibold text-primary">Estimated Cost</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-muted">Pledge Amount:</span>
                <span class="font-medium text-primary">{formatCurrency(calculateEstimatedCost().tierCost)}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted">Shipping:</span>
                <span class="font-medium text-primary">{formatCurrency(calculateEstimatedCost().shippingCost)}</span>
              </div>
              <div class="flex justify-between border-t border-subtle pt-2">
                <span class="font-semibold text-primary">Total:</span>
                <span class="text-lg font-bold text-accent">{formatCurrency(calculateEstimatedCost().total)}</span>
              </div>
            </div>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            class="w-full rounded-lg border border-emerald-500 bg-emerald-500 px-6 py-3 font-semibold text-surface-body transition hover:bg-emerald-600"
          >
            Register Interest
          </button>
        </form>
      </div>
    </div>
  {/if}
{/if}
