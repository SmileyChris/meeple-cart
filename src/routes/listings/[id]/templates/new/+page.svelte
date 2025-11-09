<script lang="ts">
  import type { PageData } from './$types';
  import type { TemplateType } from '$lib/types/offer-template';
  import { pb, currentUser } from '$lib/pocketbase';
  import { goto } from '$app/navigation';
  import { formatCurrency } from '$lib/utils/currency';

  let { data }: { data: PageData } = $props();

  // Form state
  let selectedItemIds = $state<string[]>([]);
  let templateType = $state<TemplateType>('cash_only');
  let cashAmount = $state('');
  let tradeForItems = $state<Array<{ title: string; bgg_id: string }>>([{ title: '', bgg_id: '' }]);
  let openToLowerOffers = $state(false);
  let openToShippingNegotiation = $state(false);
  let openToTradeOffers = $state(false);
  let displayName = $state('');
  let notes = $state('');
  let submitting = $state(false);
  let error = $state<string | null>(null);

  // Toggle item selection
  function toggleItem(itemId: string) {
    if (selectedItemIds.includes(itemId)) {
      selectedItemIds = selectedItemIds.filter(id => id !== itemId);
    } else {
      selectedItemIds = [...selectedItemIds, itemId];
    }
  }

  // Select all / deselect all
  function toggleAllItems() {
    if (selectedItemIds.length === data.items.length) {
      selectedItemIds = [];
    } else {
      selectedItemIds = data.items.map(item => item.id);
    }
  }

  // Add trade item
  function addTradeItem() {
    tradeForItems = [...tradeForItems, { title: '', bgg_id: '' }];
  }

  // Remove trade item
  function removeTradeItem(index: number) {
    tradeForItems = tradeForItems.filter((_, i) => i !== index);
  }

  // Validate and submit
  async function handleSubmit() {
    error = null;

    // Validation
    if (selectedItemIds.length === 0) {
      error = 'Please select at least one item for this template';
      return;
    }

    if (templateType === 'cash_only' || templateType === 'cash_or_trade') {
      const amount = parseFloat(cashAmount);
      if (!cashAmount || isNaN(amount) || amount <= 0) {
        error = 'Please enter a valid cash amount';
        return;
      }
    }

    if (templateType === 'trade_only' || templateType === 'cash_or_trade') {
      const validTradeItems = tradeForItems.filter(item => item.title.trim());
      if (validTradeItems.length === 0) {
        error = 'Please specify at least one item you want to trade for';
        return;
      }
    }

    submitting = true;

    try {
      const user = $currentUser;
      if (!user) {
        error = 'You must be logged in';
        return;
      }

      // Prepare trade items (filter out empty ones)
      const validTradeItems = tradeForItems
        .filter(item => item.title.trim())
        .map(item => ({
          title: item.title.trim(),
          ...(item.bgg_id.trim() ? { bgg_id: parseInt(item.bgg_id, 10) } : {}),
        }));

      const templateData = {
        listing: data.listing.id,
        owner: user.id,
        items: selectedItemIds,
        template_type: templateType,
        ...(templateType === 'cash_only' || templateType === 'cash_or_trade'
          ? { cash_amount: Math.round(parseFloat(cashAmount) * 100) } // Convert to cents
          : {}),
        ...(templateType === 'trade_only' || templateType === 'cash_or_trade'
          ? { trade_for_items: validTradeItems }
          : {}),
        open_to_lower_offers: openToLowerOffers,
        open_to_shipping_negotiation: openToShippingNegotiation,
        open_to_trade_offers: openToTradeOffers,
        status: 'active',
        ...(displayName.trim() ? { display_name: displayName.trim() } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      };

      await pb.collection('offer_templates').create(templateData);

      // Redirect to manage page
      await goto(`/listings/${data.listing.id}/manage`);
    } catch (err) {
      console.error('Failed to create offer template:', err);
      error = err instanceof Error ? err.message : 'Failed to create template';
      submitting = false;
    }
  }

  // Auto-generate display name
  $effect(() => {
    if (!displayName && selectedItemIds.length > 0) {
      const selectedItems = data.items.filter(item => selectedItemIds.includes(item.id));
      if (selectedItems.length === 1) {
        displayName = selectedItems[0].title;
      } else if (selectedItems.length === data.items.length) {
        displayName = 'Full listing bundle';
      } else {
        displayName = `${selectedItems.length}-item bundle`;
      }
    }
  });
</script>

<svelte:head>
  <title>Create Offer Template · {data.listing.title} · Meeple Cart</title>
</svelte:head>

<main class="bg-surface-body px-6 py-12 text-primary transition-colors sm:px-8">
  <div class="mx-auto max-w-3xl space-y-8">
    <!-- Header -->
    <header class="space-y-4">
      <div class="flex items-center gap-4">
        <a
          href="/listings/{data.listing.id}/manage"
          class="rounded-lg p-2 text-muted transition hover:bg-surface-card-alt hover:text-secondary"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </a>
        <div class="flex-1">
          <h1 class="text-3xl font-semibold tracking-tight">Create Offer Template</h1>
          <p class="mt-1 text-sm text-muted">{data.listing.title}</p>
        </div>
      </div>
      <p class="text-sm text-secondary">
        Offer templates let you define what you're willing to accept for specific items. Buyers can
        see your templates and make offers based on them.
      </p>
    </header>

    {#if error}
      <div
        class="rounded-lg border border-rose-500/50 bg-rose-500/10 px-4 py-3 text-sm text-rose-300"
      >
        {error}
      </div>
    {/if}

    <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-8">
      <!-- Item Selection -->
      <section class="space-y-4 rounded-xl border border-subtle bg-surface-card p-6 transition-colors">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">Select Items</h2>
          <button
            type="button"
            onclick={toggleAllItems}
            class="text-sm text-accent hover:underline"
          >
            {selectedItemIds.length === data.items.length ? 'Deselect all' : 'Select all'}
          </button>
        </div>
        <p class="text-sm text-muted">
          Choose which items from your listing this template applies to.
        </p>
        <div class="space-y-2">
          {#each data.items as item (item.id)}
            <label
              class="flex cursor-pointer items-start gap-3 rounded-lg border border-subtle bg-surface-body p-4 transition hover:border-accent/50"
            >
              <input
                type="checkbox"
                checked={selectedItemIds.includes(item.id)}
                onchange={() => toggleItem(item.id)}
                class="mt-1 h-4 w-4 rounded border-subtle accent-[var(--accent)]"
              />
              <div class="flex-1">
                <div class="font-medium text-primary">{item.title}</div>
                <div class="mt-1 text-sm text-muted">
                  {item.condition.charAt(0).toUpperCase() + item.condition.slice(1)} condition
                  {#if item.bgg_id}· BGG ID: {item.bgg_id}{/if}
                </div>
              </div>
            </label>
          {/each}
        </div>
      </section>

      <!-- Template Type -->
      <section class="space-y-4 rounded-xl border border-subtle bg-surface-card p-6 transition-colors">
        <h2 class="text-lg font-semibold">Template Type</h2>
        <p class="text-sm text-muted">What are you willing to accept for these items?</p>
        <div class="space-y-3">
          <label class="flex cursor-pointer items-start gap-3 rounded-lg border border-subtle bg-surface-body p-4 transition hover:border-accent/50">
            <input
              type="radio"
              name="template_type"
              value="cash_only"
              bind:group={templateType}
              class="mt-1 h-4 w-4 accent-[var(--accent)]"
            />
            <div>
              <div class="font-medium text-primary">💰 Cash Only</div>
              <div class="mt-1 text-sm text-muted">
                Sell for a specific price (buyer pays via bank transfer or cash)
              </div>
            </div>
          </label>

          <label class="flex cursor-pointer items-start gap-3 rounded-lg border border-subtle bg-surface-body p-4 transition hover:border-accent/50">
            <input
              type="radio"
              name="template_type"
              value="trade_only"
              bind:group={templateType}
              class="mt-1 h-4 w-4 accent-[var(--accent)]"
            />
            <div>
              <div class="font-medium text-primary">🔄 Trade Only</div>
              <div class="mt-1 text-sm text-muted">
                Trade for specific games or items (no cash involved)
              </div>
            </div>
          </label>

          <label class="flex cursor-pointer items-start gap-3 rounded-lg border border-subtle bg-surface-body p-4 transition hover:border-accent/50">
            <input
              type="radio"
              name="template_type"
              value="cash_or_trade"
              bind:group={templateType}
              class="mt-1 h-4 w-4 accent-[var(--accent)]"
            />
            <div>
              <div class="font-medium text-primary">💰🔄 Cash or Trade</div>
              <div class="mt-1 text-sm text-muted">
                Accept either cash payment or trade for specific items
              </div>
            </div>
          </label>
        </div>
      </section>

      <!-- Cash Amount (if applicable) -->
      {#if templateType === 'cash_only' || templateType === 'cash_or_trade'}
        <section class="space-y-4 rounded-xl border border-subtle bg-surface-card p-6 transition-colors">
          <h2 class="text-lg font-semibold">Cash Amount</h2>
          <div>
            <label class="block text-sm font-medium text-secondary" for="cash_amount">
              Price (NZD)
            </label>
            <input
              id="cash_amount"
              type="number"
              min="0"
              step="0.01"
              bind:value={cashAmount}
              placeholder="e.g., 50.00"
              class="mt-2 w-full rounded-lg border border-subtle bg-surface-body px-3 py-2 text-primary transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
            />
          </div>
          <label class="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              bind:checked={openToLowerOffers}
              class="h-4 w-4 rounded border-subtle accent-[var(--accent)]"
            />
            <span class="text-secondary">Open to lower offers ("Or Nearest Offer")</span>
          </label>
        </section>
      {/if}

      <!-- Trade Items (if applicable) -->
      {#if templateType === 'trade_only' || templateType === 'cash_or_trade'}
        <section class="space-y-4 rounded-xl border border-subtle bg-surface-card p-6 transition-colors">
          <h2 class="text-lg font-semibold">Items You Want</h2>
          <p class="text-sm text-muted">
            List the games or items you're willing to trade for. Buyers can propose trades including
            these items.
          </p>
          <div class="space-y-3">
            {#each tradeForItems as tradeItem, index (index)}
              <div class="flex gap-3">
                <div class="flex-1">
                  <input
                    type="text"
                    bind:value={tradeItem.title}
                    placeholder="Game title (e.g., Wingspan)"
                    class="w-full rounded-lg border border-subtle bg-surface-body px-3 py-2 text-sm text-primary transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
                  />
                </div>
                <div class="w-32">
                  <input
                    type="number"
                    bind:value={tradeItem.bgg_id}
                    placeholder="BGG ID"
                    class="w-full rounded-lg border border-subtle bg-surface-body px-3 py-2 text-sm text-primary transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
                  />
                </div>
                {#if tradeForItems.length > 1}
                  <button
                    type="button"
                    onclick={() => removeTradeItem(index)}
                    class="rounded-lg p-2 text-rose-400 transition hover:bg-rose-500/10"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                {/if}
              </div>
            {/each}
          </div>
          <button
            type="button"
            onclick={addTradeItem}
            class="text-sm text-accent hover:underline"
          >
            + Add another item
          </button>
        </section>
      {/if}

      <!-- Options -->
      <section class="space-y-4 rounded-xl border border-subtle bg-surface-card p-6 transition-colors">
        <h2 class="text-lg font-semibold">Additional Options</h2>
        <div class="space-y-3">
          <label class="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              bind:checked={openToShippingNegotiation}
              class="mt-0.5 h-4 w-4 rounded border-subtle accent-[var(--accent)]"
            />
            <div>
              <div class="text-secondary">Open to shipping negotiation</div>
              <div class="text-xs text-muted">
                Buyers can propose different shipping methods or split costs
              </div>
            </div>
          </label>

          {#if templateType === 'cash_only'}
            <label class="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                bind:checked={openToTradeOffers}
                class="mt-0.5 h-4 w-4 rounded border-subtle accent-[var(--accent)]"
              />
              <div>
                <div class="text-secondary">Also open to trade offers</div>
                <div class="text-xs text-muted">
                  Let buyers propose trades even though this is a cash-only template
                </div>
              </div>
            </label>
          {/if}
        </div>
      </section>

      <!-- Template Details -->
      <section class="space-y-4 rounded-xl border border-subtle bg-surface-card p-6 transition-colors">
        <h2 class="text-lg font-semibold">Template Details</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-secondary" for="display_name">
              Display name (optional)
            </label>
            <input
              id="display_name"
              type="text"
              bind:value={displayName}
              placeholder="e.g., Wingspan Bundle, Full Collection"
              class="mt-2 w-full rounded-lg border border-subtle bg-surface-body px-3 py-2 text-primary transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
            />
            <p class="mt-1 text-xs text-muted">
              A friendly name for this template. Auto-generated if left blank.
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-secondary" for="notes">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              bind:value={notes}
              rows="3"
              placeholder="Any additional information about this offer..."
              class="mt-2 w-full rounded-lg border border-subtle bg-surface-body px-3 py-2 text-primary transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
            ></textarea>
          </div>
        </div>
      </section>

      <!-- Submit -->
      <div class="flex justify-end gap-3">
        <a
          href="/listings/{data.listing.id}/manage"
          class="rounded-lg border border-subtle px-6 py-3 text-sm font-medium text-secondary transition hover:border-strong"
        >
          Cancel
        </a>
        <button
          type="submit"
          disabled={submitting || selectedItemIds.length === 0}
          class="rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-[var(--accent-contrast)] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Creating...' : 'Create Template'}
        </button>
      </div>
    </form>
  </div>
</main>
