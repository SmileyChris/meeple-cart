<script lang="ts">
  import { pb, currentUser } from '$lib/pocketbase';
  import type { TradePartySubmissionRecord } from '$lib/types/pocketbase';
  import type { BggSearchItem } from '$lib/types/bgg';
  import BggSearch from '$lib/components/BggSearch.svelte';

  interface Props {
    tradePartyId: string;
    onSuccess?: (submission: TradePartySubmissionRecord) => void;
    onCancel?: () => void;
  }

  let { tradePartyId, onSuccess, onCancel }: Props = $props();

  let title = $state('');
  let bggId = $state('');
  let condition = $state<'mint' | 'like_new' | 'good' | 'fair' | 'poor'>('good');
  let description = $state('');
  let photos = $state<FileList | null>(null);
  let shipFromRegion = $state('');
  let willShipTo = $state('');
  let shippingNotes = $state('');

  let isSubmitting = $state(false);
  let error = $state('');

  function handleBggSelect(game: BggSearchItem) {
    title = game.name.value;
    bggId = game.id.toString();
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();

    if (!$currentUser) {
      error = 'You must be logged in to submit a game';
      return;
    }

    isSubmitting = true;
    error = '';

    try {
      const formData = new FormData();
      formData.append('trade_party', tradePartyId);
      formData.append('user', $currentUser.id);
      formData.append('title', title);
      if (bggId) formData.append('bgg_id', bggId);
      formData.append('condition', condition);
      formData.append('description', description);
      formData.append('status', 'approved'); // Auto-approve for now

      // Add photos
      if (photos) {
        for (let i = 0; i < photos.length; i++) {
          formData.append('photos', photos[i]);
        }
      }

      // Shipping info (store as JSON string for will_ship_to)
      if (shipFromRegion) formData.append('ship_from_region', shipFromRegion);
      if (willShipTo) {
        const regions = willShipTo.split(',').map(r => r.trim());
        formData.append('will_ship_to', JSON.stringify(regions));
      }
      if (shippingNotes) formData.append('shipping_notes', shippingNotes);

      const submission = await pb.collection('trade_party_submissions').create<TradePartySubmissionRecord>(formData);

      // Update party game count
      await pb.collection('trade_parties').update(tradePartyId, {
        game_count: { $inc: 1 },
      });

      if (onSuccess) {
        onSuccess(submission);
      }

      // Reset form
      title = '';
      bggId = '';
      condition = 'good';
      description = '';
      photos = null;
      shipFromRegion = '';
      willShipTo = '';
      shippingNotes = '';
    } catch (err: any) {
      console.error('Failed to submit game:', err);
      error = err.message || 'Failed to submit game. Please try again.';
    } finally {
      isSubmitting = false;
    }
  }

  function handleCancel() {
    if (onCancel) {
      onCancel();
    }
  }
</script>

<form onsubmit={handleSubmit} class="space-y-6">
  {#if error}
    <div class="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
      <p class="text-sm text-red-200">{error}</p>
    </div>
  {/if}

  <!-- Game Search (BGG) -->
  <div>
    <label for="bgg_search" class="mb-2 block text-sm font-medium text-primary">
      Search for Game <span class="text-red-400">*</span>
    </label>
    <BggSearch onSelect={handleBggSelect} placeholder="Search BoardGameGeek..." />
    <p class="mt-1 text-xs text-muted">
      Search for a game on BoardGameGeek to auto-fill details
    </p>
  </div>

  <!-- Game Title (Manual Entry or Auto-filled) -->
  <div>
    <label for="title" class="mb-2 block text-sm font-medium text-primary">
      Game Title <span class="text-red-400">*</span>
    </label>
    <input
      type="text"
      id="title"
      bind:value={title}
      required
      placeholder="e.g., Wingspan"
      class="w-full rounded-lg border border-subtle bg-surface-body px-4 py-2 text-primary placeholder-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
    />
    <p class="mt-1 text-xs text-muted">
      Auto-filled from search or enter manually
    </p>
  </div>

  <!-- BGG ID (auto-filled from search) -->
  {#if bggId}
    <div>
      <label class="mb-2 block text-sm font-medium text-primary">
        BoardGameGeek ID
      </label>
      <div class="flex items-center gap-2">
        <input
          type="text"
          value={bggId}
          readonly
          class="flex-1 rounded-lg border border-subtle bg-surface-card px-4 py-2 text-secondary"
        />
        <a
          href="https://boardgamegeek.com/boardgame/{bggId}"
          target="_blank"
          rel="noopener noreferrer"
          class="text-sm text-accent hover:underline"
        >
          View on BGG
        </a>
      </div>
    </div>
  {/if}

  <!-- Condition -->
  <div>
    <label for="condition" class="mb-2 block text-sm font-medium text-primary">
      Condition <span class="text-red-400">*</span>
    </label>
    <select
      id="condition"
      bind:value={condition}
      required
      class="w-full rounded-lg border border-subtle bg-surface-body px-4 py-2 text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
    >
      <option value="mint">Mint - Unplayed, like new</option>
      <option value="like_new">Like New - Played once or twice</option>
      <option value="good">Good - Minor wear</option>
      <option value="fair">Fair - Noticeable wear</option>
      <option value="poor">Poor - Significant wear</option>
    </select>
  </div>

  <!-- Description -->
  <div>
    <label for="description" class="mb-2 block text-sm font-medium text-primary">
      Description
    </label>
    <textarea
      id="description"
      bind:value={description}
      rows="4"
      placeholder="Describe the game's condition, completeness, any damage, etc."
      class="w-full rounded-lg border border-subtle bg-surface-body px-4 py-2 text-primary placeholder-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
    ></textarea>
  </div>

  <!-- Photos -->
  <div>
    <label for="photos" class="mb-2 block text-sm font-medium text-primary">
      Photos <span class="text-muted">(up to 10)</span>
    </label>
    <input
      type="file"
      id="photos"
      bind:files={photos}
      accept="image/jpeg,image/png,image/webp"
      multiple
      class="w-full rounded-lg border border-subtle bg-surface-body px-4 py-2 text-primary file:mr-4 file:rounded-lg file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-semibold file:text-surface-body hover:file:bg-accent/90"
    />
    <p class="mt-1 text-xs text-muted">
      JPEG, PNG, or WebP. Max 5MB per image.
    </p>
  </div>

  <!-- Shipping Info -->
  <div class="rounded-lg border border-subtle bg-surface-card p-4">
    <h3 class="mb-4 font-semibold text-primary">Shipping Information</h3>

    <div class="space-y-4">
      <div>
        <label for="ship_from" class="mb-2 block text-sm font-medium text-primary">
          Shipping From
        </label>
        <input
          type="text"
          id="ship_from"
          bind:value={shipFromRegion}
          placeholder="e.g., Auckland, Wellington, Christchurch"
          class="w-full rounded-lg border border-subtle bg-surface-body px-4 py-2 text-primary placeholder-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </div>

      <div>
        <label for="will_ship_to" class="mb-2 block text-sm font-medium text-primary">
          Will Ship To
        </label>
        <input
          type="text"
          id="will_ship_to"
          bind:value={willShipTo}
          placeholder="e.g., North Island, South Island, Anywhere in NZ"
          class="w-full rounded-lg border border-subtle bg-surface-body px-4 py-2 text-primary placeholder-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
        <p class="mt-1 text-xs text-muted">
          Separate multiple regions with commas
        </p>
      </div>

      <div>
        <label for="shipping_notes" class="mb-2 block text-sm font-medium text-primary">
          Shipping Notes
        </label>
        <textarea
          id="shipping_notes"
          bind:value={shippingNotes}
          rows="2"
          placeholder="Any special shipping requirements or preferences"
          class="w-full rounded-lg border border-subtle bg-surface-body px-4 py-2 text-primary placeholder-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        ></textarea>
      </div>
    </div>
  </div>

  <!-- Actions -->
  <div class="flex items-center justify-end gap-3">
    {#if onCancel}
      <button
        type="button"
        onclick={handleCancel}
        class="rounded-lg border border-subtle px-6 py-2 font-semibold text-secondary transition hover:bg-surface-card"
      >
        Cancel
      </button>
    {/if}
    <button
      type="submit"
      disabled={isSubmitting || !title}
      class="rounded-lg border border-accent bg-accent px-6 py-2 font-semibold text-surface-body transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isSubmitting ? 'Submitting...' : 'Submit Game'}
    </button>
  </div>
</form>
