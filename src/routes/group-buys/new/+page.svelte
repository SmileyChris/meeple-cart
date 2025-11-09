<script lang="ts">
  import { currentUser } from '$lib/pocketbase';
  import { groupBuyOperations, tierOperations, hubOperations } from '$lib/stores/group-buys';
  import { goto } from '$app/navigation';

  // Redirect if not authenticated
  if (!$currentUser) {
    goto('/login?redirect=/group-buys/new');
  }

  // Step state
  let currentStep = $state(1);
  const totalSteps = 4;

  // Step 1: Campaign Info
  let title = $state('');
  let campaign_url = $state('');
  let description = $state('');
  let pledge_deadline = $state('');
  let estimated_delivery = $state('');
  let usage_mode = $state<'regional' | 'federated'>('regional');
  let delivery_policy = $state<'hub_only' | 'hub_or_direct'>('hub_only');

  // Step 2: Pledge Tiers
  let tiers = $state<Array<{
    name: string;
    price_per_unit: number;
    shipping_per_unit: number;
    min_quantity: number;
    max_quantity: number;
    notes: string;
  }>>([{
    name: '',
    price_per_unit: 0,
    shipping_per_unit: 0,
    min_quantity: 1,
    max_quantity: 1,
    notes: '',
  }]);

  // Step 3: Hubs
  let hubs = $state<Array<{
    name: string;
    city: string;
    instructions: string;
    shipping_type: 'flat_per_order' | 'flat_per_unit' | 'no_fee';
    shipping_amount: number;
  }>>([{
    name: '',
    city: '',
    instructions: '',
    shipping_type: 'no_fee',
    shipping_amount: 0,
  }]);

  function addTier() {
    tiers = [...tiers, {
      name: '',
      price_per_unit: 0,
      shipping_per_unit: 0,
      min_quantity: 1,
      max_quantity: 1,
      notes: '',
    }];
  }

  function removeTier(index: number) {
    if (tiers.length > 1) {
      tiers = tiers.filter((_, i) => i !== index);
    }
  }

  function addHub() {
    hubs = [...hubs, {
      name: '',
      city: '',
      instructions: '',
      shipping_type: 'no_fee',
      shipping_amount: 0,
    }];
  }

  function removeHub(index: number) {
    if (hubs.length > 1) {
      hubs = hubs.filter((_, i) => i !== index);
    }
  }

  function nextStep() {
    if (validateCurrentStep()) {
      currentStep++;
    }
  }

  function prevStep() {
    currentStep--;
  }

  function validateCurrentStep(): boolean {
    if (currentStep === 1) {
      if (!title.trim()) {
        alert('Please enter a title');
        return false;
      }
      if (!campaign_url.trim()) {
        alert('Please enter a campaign URL');
        return false;
      }
      if (!description.trim()) {
        alert('Please enter a description');
        return false;
      }
      if (!pledge_deadline) {
        alert('Please select a pledge deadline');
        return false;
      }
      if (!estimated_delivery) {
        alert('Please select an estimated delivery date');
        return false;
      }
    } else if (currentStep === 2) {
      for (let i = 0; i < tiers.length; i++) {
        const tier = tiers[i];
        if (!tier.name.trim()) {
          alert(`Tier ${i + 1}: Please enter a tier name`);
          return false;
        }
        if (tier.price_per_unit <= 0) {
          alert(`Tier ${i + 1}: Please enter a valid price`);
          return false;
        }
      }
    } else if (currentStep === 3) {
      for (let i = 0; i < hubs.length; i++) {
        const hub = hubs[i];
        if (!hub.name.trim()) {
          alert(`Hub ${i + 1}: Please enter a hub name`);
          return false;
        }
        if (!hub.city.trim()) {
          alert(`Hub ${i + 1}: Please enter a city`);
          return false;
        }
      }
    }
    return true;
  }

  async function createGroupBuy() {
    if (!$currentUser) return;

    try {
      // Create group buy
      const groupBuy = groupBuyOperations.create({
        title,
        campaign_url,
        description,
        pledge_deadline,
        estimated_delivery,
        status: 'collecting_interest',
        managers: [$currentUser.id],
        usage_mode,
        delivery_policy,
      });

      // Create tiers
      for (const tier of tiers) {
        tierOperations.create({
          group_buy_id: groupBuy.id,
          name: tier.name,
          price_per_unit: Math.round(tier.price_per_unit * 100), // Convert to cents
          shipping_per_unit: Math.round(tier.shipping_per_unit * 100),
          min_quantity: tier.min_quantity,
          max_quantity: tier.max_quantity,
          notes: tier.notes,
        });
      }

      // Create hubs
      for (const hub of hubs) {
        hubOperations.create({
          group_buy_id: groupBuy.id,
          name: hub.name,
          city: hub.city,
          instructions: hub.instructions,
          managers: [$currentUser.id],
          shipping_type: hub.shipping_type,
          shipping_amount: Math.round(hub.shipping_amount * 100),
        });
      }

      // Redirect to group buy detail
      goto(`/group-buys/${groupBuy.id}`);
    } catch (error) {
      console.error('Failed to create group buy:', error);
      alert('Failed to create group buy. Please try again.');
    }
  }
</script>

<svelte:head>
  <title>Create Group Buy · Meeple Cart</title>
</svelte:head>

<div class="bg-surface-body min-h-screen px-4 py-8 text-primary transition-colors sm:px-6 lg:px-8">
  <div class="mx-auto max-w-4xl">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-4xl font-bold text-primary">Create Group Buy</h1>
      <p class="mt-2 text-secondary">
        Set up a new group buy to coordinate bulk orders with the community
      </p>
    </div>

    <!-- Progress Steps -->
    <div class="mb-8 flex items-center justify-between">
      {#each Array(totalSteps) as _, i}
        <div class="flex flex-1 items-center">
          <div class="flex items-center">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition {i + 1 === currentStep
                ? 'border-accent bg-accent text-surface-body'
                : i + 1 < currentStep
                ? 'border-emerald-500 bg-emerald-500 text-surface-body'
                : 'border-subtle bg-surface-body text-muted'}"
            >
              {i + 1 < currentStep ? '✓' : i + 1}
            </div>
            {#if i < totalSteps - 1}
              <div
                class="ml-2 h-0.5 w-full transition {i + 1 < currentStep
                  ? 'bg-emerald-500'
                  : 'bg-subtle'}"
              ></div>
            {/if}
          </div>
        </div>
      {/each}
    </div>

    <!-- Step Labels -->
    <div class="mb-8 flex justify-between text-xs sm:text-sm">
      <span class={currentStep === 1 ? 'font-semibold text-accent' : 'text-muted'}>Campaign Info</span>
      <span class={currentStep === 2 ? 'font-semibold text-accent' : 'text-muted'}>Pledge Tiers</span>
      <span class={currentStep === 3 ? 'font-semibold text-accent' : 'text-muted'}>Pickup Hubs</span>
      <span class={currentStep === 4 ? 'font-semibold text-accent' : 'text-muted'}>Review</span>
    </div>

    <!-- Form Content -->
    <div class="rounded-xl border border-subtle bg-surface-card p-8">
      {#if currentStep === 1}
        <!-- Step 1: Campaign Info -->
        <div class="space-y-6">
          <div>
            <label class="mb-2 block text-sm font-medium text-primary">Campaign Title *</label>
            <input
              type="text"
              bind:value={title}
              placeholder="e.g., Frosthaven Expansion - Group Pledge"
              class="w-full rounded-lg border border-subtle bg-surface-body px-4 py-3 text-primary transition focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              required
            />
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-primary">Campaign URL *</label>
            <input
              type="url"
              bind:value={campaign_url}
              placeholder="https://www.kickstarter.com/projects/..."
              class="w-full rounded-lg border border-subtle bg-surface-body px-4 py-3 text-primary transition focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              required
            />
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-primary">Description *</label>
            <textarea
              bind:value={description}
              placeholder="Describe the campaign, what you're ordering, and any important details..."
              rows="5"
              class="w-full rounded-lg border border-subtle bg-surface-body px-4 py-3 text-primary transition focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              required
            ></textarea>
            <p class="mt-1 text-xs text-muted">{description.length} characters</p>
          </div>

          <div class="grid gap-6 sm:grid-cols-2">
            <div>
              <label class="mb-2 block text-sm font-medium text-primary">Pledge Deadline *</label>
              <input
                type="date"
                bind:value={pledge_deadline}
                min={new Date().toISOString().split('T')[0]}
                class="w-full rounded-lg border border-subtle bg-surface-body px-4 py-3 text-primary transition focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                required
              />
            </div>

            <div>
              <label class="mb-2 block text-sm font-medium text-primary">Estimated Delivery *</label>
              <input
                type="date"
                bind:value={estimated_delivery}
                min={pledge_deadline || new Date().toISOString().split('T')[0]}
                class="w-full rounded-lg border border-subtle bg-surface-body px-4 py-3 text-primary transition focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                required
              />
            </div>
          </div>

          <div class="grid gap-6 sm:grid-cols-2">
            <div>
              <label class="mb-2 block text-sm font-medium text-primary">Usage Mode</label>
              <select
                bind:value={usage_mode}
                class="w-full rounded-lg border border-subtle bg-surface-body px-4 py-3 text-primary transition focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="regional">Regional (local group)</option>
                <option value="federated">Federated (national network)</option>
              </select>
              <p class="mt-1 text-xs text-muted">Regional for local groups, Federated for nationwide coordination</p>
            </div>

            <div>
              <label class="mb-2 block text-sm font-medium text-primary">Delivery Policy</label>
              <select
                bind:value={delivery_policy}
                class="w-full rounded-lg border border-subtle bg-surface-body px-4 py-3 text-primary transition focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="hub_only">Hub pickup only</option>
                <option value="hub_or_direct">Hub or direct delivery</option>
              </select>
              <p class="mt-1 text-xs text-muted">Whether to allow direct shipping to participants</p>
            </div>
          </div>
        </div>

      {:else if currentStep === 2}
        <!-- Step 2: Pledge Tiers -->
        <div class="space-y-6">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-primary">Pledge Tiers</h2>
            <button
              onclick={addTier}
              class="flex items-center gap-2 rounded-lg border border-accent bg-accent px-4 py-2 text-sm font-semibold text-surface-body transition hover:bg-accent/90"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Add Tier
            </button>
          </div>

          {#each tiers as tier, index (index)}
            <div class="rounded-lg border border-subtle bg-surface-body p-6">
              <div class="mb-4 flex items-center justify-between">
                <h3 class="font-semibold text-primary">Tier {index + 1}</h3>
                {#if tiers.length > 1}
                  <button
                    onclick={() => removeTier(index)}
                    class="text-red-400 transition hover:text-red-300"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                {/if}
              </div>

              <div class="space-y-4">
                <div>
                  <label class="mb-2 block text-sm font-medium text-primary">Tier Name *</label>
                  <input
                    type="text"
                    bind:value={tier.name}
                    placeholder="e.g., Base Game + Expansions"
                    class="w-full rounded-lg border border-subtle bg-surface-card px-4 py-2 text-primary transition focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    required
                  />
                </div>

                <div class="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label class="mb-2 block text-sm font-medium text-primary">Price Per Unit (NZD) *</label>
                    <input
                      type="number"
                      bind:value={tier.price_per_unit}
                      min="0"
                      step="0.01"
                      placeholder="120.00"
                      class="w-full rounded-lg border border-subtle bg-surface-card px-4 py-2 text-primary transition focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                      required
                    />
                  </div>

                  <div>
                    <label class="mb-2 block text-sm font-medium text-primary">Shipping Per Unit (NZD)</label>
                    <input
                      type="number"
                      bind:value={tier.shipping_per_unit}
                      min="0"
                      step="0.01"
                      placeholder="15.00"
                      class="w-full rounded-lg border border-subtle bg-surface-card px-4 py-2 text-primary transition focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                </div>

                <div class="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label class="mb-2 block text-sm font-medium text-primary">Min Quantity</label>
                    <input
                      type="number"
                      bind:value={tier.min_quantity}
                      min="1"
                      placeholder="1"
                      class="w-full rounded-lg border border-subtle bg-surface-card px-4 py-2 text-primary transition focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>

                  <div>
                    <label class="mb-2 block text-sm font-medium text-primary">Max Quantity</label>
                    <input
                      type="number"
                      bind:value={tier.max_quantity}
                      min={tier.min_quantity}
                      placeholder="1"
                      class="w-full rounded-lg border border-subtle bg-surface-card px-4 py-2 text-primary transition focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                  </div>
                </div>

                <div>
                  <label class="mb-2 block text-sm font-medium text-primary">Notes (optional)</label>
                  <textarea
                    bind:value={tier.notes}
                    placeholder="Any additional information about this tier..."
                    rows="2"
                    class="w-full rounded-lg border border-subtle bg-surface-card px-4 py-2 text-primary transition focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  ></textarea>
                </div>
              </div>
            </div>
          {/each}
        </div>

      {:else if currentStep === 3}
        <!-- Step 3: Pickup Hubs -->
        <div class="space-y-6">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-primary">Pickup Hubs</h2>
            <button
              onclick={addHub}
              class="flex items-center gap-2 rounded-lg border border-accent bg-accent px-4 py-2 text-sm font-semibold text-surface-body transition hover:bg-accent/90"
            >
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Add Hub
            </button>
          </div>

          {#each hubs as hub, index (index)}
            <div class="rounded-lg border border-subtle bg-surface-body p-6">
              <div class="mb-4 flex items-center justify-between">
                <h3 class="font-semibold text-primary">Hub {index + 1}</h3>
                {#if hubs.length > 1}
                  <button
                    onclick={() => removeHub(index)}
                    class="text-red-400 transition hover:text-red-300"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                {/if}
              </div>

              <div class="space-y-4">
                <div>
                  <label class="mb-2 block text-sm font-medium text-primary">Hub Name *</label>
                  <input
                    type="text"
                    bind:value={hub.name}
                    placeholder="e.g., Auckland Central Pickup"
                    class="w-full rounded-lg border border-subtle bg-surface-card px-4 py-2 text-primary transition focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    required
                  />
                </div>

                <div>
                  <label class="mb-2 block text-sm font-medium text-primary">City *</label>
                  <input
                    type="text"
                    bind:value={hub.city}
                    placeholder="e.g., Auckland"
                    class="w-full rounded-lg border border-subtle bg-surface-card px-4 py-2 text-primary transition focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    required
                  />
                </div>

                <div>
                  <label class="mb-2 block text-sm font-medium text-primary">Pickup Instructions</label>
                  <textarea
                    bind:value={hub.instructions}
                    placeholder="e.g., Pickup from 123 Queen Street, CBD. Saturdays 10am-2pm."
                    rows="3"
                    class="w-full rounded-lg border border-subtle bg-surface-card px-4 py-2 text-primary transition focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  ></textarea>
                </div>

                <div class="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label class="mb-2 block text-sm font-medium text-primary">Shipping Fee Type</label>
                    <select
                      bind:value={hub.shipping_type}
                      class="w-full rounded-lg border border-subtle bg-surface-card px-4 py-2 text-primary transition focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                      <option value="no_fee">No fee</option>
                      <option value="flat_per_order">Flat per order</option>
                      <option value="flat_per_unit">Flat per unit</option>
                    </select>
                  </div>

                  {#if hub.shipping_type !== 'no_fee'}
                    <div>
                      <label class="mb-2 block text-sm font-medium text-primary">Fee Amount (NZD)</label>
                      <input
                        type="number"
                        bind:value={hub.shipping_amount}
                        min="0"
                        step="0.01"
                        placeholder="5.00"
                        class="w-full rounded-lg border border-subtle bg-surface-card px-4 py-2 text-primary transition focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                    </div>
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        </div>

      {:else if currentStep === 4}
        <!-- Step 4: Review -->
        <div class="space-y-8">
          <div>
            <h2 class="mb-4 text-xl font-semibold text-primary">Review Your Group Buy</h2>
            <p class="text-sm text-secondary">Please review all details before creating your group buy.</p>
          </div>

          <!-- Campaign Info -->
          <div class="rounded-lg border border-subtle bg-surface-body p-6">
            <h3 class="mb-4 font-semibold text-primary">Campaign Information</h3>
            <dl class="space-y-3 text-sm">
              <div>
                <dt class="text-muted">Title:</dt>
                <dd class="mt-1 font-medium text-primary">{title}</dd>
              </div>
              <div>
                <dt class="text-muted">Campaign URL:</dt>
                <dd class="mt-1 text-accent hover:underline">
                  <a href={campaign_url} target="_blank" rel="noopener noreferrer">{campaign_url}</a>
                </dd>
              </div>
              <div>
                <dt class="text-muted">Description:</dt>
                <dd class="mt-1 text-primary">{description}</dd>
              </div>
              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt class="text-muted">Pledge Deadline:</dt>
                  <dd class="mt-1 font-medium text-primary">
                    {new Date(pledge_deadline).toLocaleDateString('en-NZ', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </dd>
                </div>
                <div>
                  <dt class="text-muted">Estimated Delivery:</dt>
                  <dd class="mt-1 font-medium text-primary">
                    {new Date(estimated_delivery).toLocaleDateString('en-NZ', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </dd>
                </div>
              </div>
              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt class="text-muted">Mode:</dt>
                  <dd class="mt-1 font-medium capitalize text-primary">{usage_mode}</dd>
                </div>
                <div>
                  <dt class="text-muted">Delivery Policy:</dt>
                  <dd class="mt-1 font-medium capitalize text-primary">{delivery_policy.replace('_', ' ')}</dd>
                </div>
              </div>
            </dl>
          </div>

          <!-- Tiers -->
          <div class="rounded-lg border border-subtle bg-surface-body p-6">
            <h3 class="mb-4 font-semibold text-primary">Pledge Tiers ({tiers.length})</h3>
            <div class="space-y-3">
              {#each tiers as tier, i}
                <div class="rounded-lg border border-subtle bg-surface-card p-4">
                  <div class="flex items-start justify-between">
                    <div>
                      <h4 class="font-medium text-primary">{tier.name}</h4>
                      {#if tier.notes}
                        <p class="mt-1 text-xs text-muted">{tier.notes}</p>
                      {/if}
                    </div>
                    <div class="text-right">
                      <div class="font-bold text-accent">${tier.price_per_unit.toFixed(2)}</div>
                      <div class="text-xs text-muted">+ ${tier.shipping_per_unit.toFixed(2)} shipping</div>
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>

          <!-- Hubs -->
          <div class="rounded-lg border border-subtle bg-surface-body p-6">
            <h3 class="mb-4 font-semibold text-primary">Pickup Hubs ({hubs.length})</h3>
            <div class="space-y-3">
              {#each hubs as hub, i}
                <div class="rounded-lg border border-subtle bg-surface-card p-4">
                  <h4 class="font-medium text-primary">📍 {hub.name}</h4>
                  <p class="mt-1 text-sm text-secondary">{hub.city}</p>
                  {#if hub.instructions}
                    <p class="mt-2 text-xs text-muted">{hub.instructions}</p>
                  {/if}
                  {#if hub.shipping_type !== 'no_fee'}
                    <p class="mt-2 text-xs text-muted">
                      {hub.shipping_type === 'flat_per_order' ? 'Flat fee' : 'Per unit fee'}: ${hub.shipping_amount.toFixed(2)}
                    </p>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        </div>
      {/if}
    </div>

    <!-- Navigation Buttons -->
    <div class="mt-8 flex items-center justify-between">
      <button
        onclick={prevStep}
        disabled={currentStep === 1}
        class="rounded-lg border border-subtle bg-surface-card px-6 py-3 font-semibold text-primary transition hover:bg-surface-body disabled:cursor-not-allowed disabled:opacity-50"
      >
        Back
      </button>

      {#if currentStep < totalSteps}
        <button
          onclick={nextStep}
          class="rounded-lg border border-accent bg-accent px-8 py-3 font-semibold text-surface-body transition hover:bg-accent/90"
        >
          Next Step
        </button>
      {:else}
        <button
          onclick={createGroupBuy}
          class="rounded-lg border border-emerald-500 bg-emerald-500 px-8 py-3 font-semibold text-surface-body transition hover:bg-emerald-600"
        >
          Create Group Buy
        </button>
      {/if}
    </div>
  </div>
</div>
