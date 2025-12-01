<script lang="ts">
  import { goto } from '$app/navigation';
  import { pb, currentUser } from '$lib/pocketbase';
  import MarkdownEditor from '$lib/components/MarkdownEditor.svelte';
  import { subscribeToThread } from '$lib/utils/discussions';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let listing = $derived(data.listing);
  let categories = $derived(data.categories);

  let category = $state('');
  let title = $state('');
  let content = $state('');
  let tags = $state<string[]>([]);
  let tagInput = $state('');
  let wantedItems = $state<Array<{ title: string; bgg_id: string; max_price: string }>>([
    { title: '', bgg_id: '', max_price: '' },
  ]);
  let wantedOfferType = $state<'buying' | 'trading' | 'either'>('either');
  let isSubmitting = $state(false);
  let error = $state('');

  // Check if the selected category is "wanted"
  let isWantedPost = $derived(
    categories.find((c) => c.id === category)?.slug === 'wanted'
  );

  function addWantedItem() {
    wantedItems = [...wantedItems, { title: '', bgg_id: '', max_price: '' }];
  }

  function removeWantedItem(index: number) {
    wantedItems = wantedItems.filter((_, i) => i !== index);
  }

  function addTag() {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 10) {
      tags = [...tags, tag];
      tagInput = '';
    }
  }

  function removeTag(tag: string) {
    tags = tags.filter((t) => t !== tag);
  }

  function handleTagKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    } else if (e.key === ',' && tagInput.trim()) {
      e.preventDefault();
      addTag();
    }
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();

    if (!$currentUser) {
      goto('/login');
      return;
    }

    if (!title.trim()) {
      error = 'Title is required';
      return;
    }

    if (title.trim().length < 3) {
      error = 'Title must be at least 3 characters';
      return;
    }

    if (title.trim().length > 200) {
      error = 'Title must be less than 200 characters';
      return;
    }

    if (!content.trim()) {
      error = 'Content is required';
      return;
    }

    if (!category) {
      error = 'Please select a category';
      return;
    }

    // Validate wanted items if this is a wanted post
    if (isWantedPost) {
      const validWantedItems = wantedItems.filter((item) => item.title.trim());
      if (validWantedItems.length === 0) {
        error = 'Please specify at least one item you want';
        return;
      }
    }

    isSubmitting = true;
    error = '';

    try {
      // Prepare wanted items data
      const validWantedItems =
        isWantedPost
          ? wantedItems
              .filter((item) => item.title.trim())
              .map((item) => ({
                title: item.title.trim(),
                ...(item.bgg_id.trim() ? { bgg_id: parseInt(item.bgg_id, 10) } : {}),
                ...(item.max_price.trim()
                  ? { max_price: Math.round(parseFloat(item.max_price) * 100) }
                  : {}),
              }))
          : undefined;

      // Create thread
      const thread = await pb.collection('discussion_threads').create({
        title: title.trim(),
        content: content,
        author: $currentUser.id,
        category: category,
        tags: tags.length > 0 ? tags : undefined,
        ...(isWantedPost ? { wanted_items: validWantedItems } : {}),
        ...(isWantedPost ? { wanted_offer_type: wantedOfferType } : {}),
        listing: listing?.id || null,
      });

      // Auto-subscribe author
      await subscribeToThread($currentUser.id, thread.id);

      // If linked to listing, notify listing owner
      if (listing && listing.owner !== $currentUser.id) {
        await pb.collection('notifications').create({
          user: listing.owner,
          type: 'discussion_reply',
          title: 'New discussion on your listing',
          message: `${$currentUser.display_name} started a discussion: "${title.trim()}"`,
          link: `/discussions/${thread.id}`,
          read: false,
        });

        // Auto-subscribe listing owner
        await subscribeToThread(listing.owner, thread.id);
      }

      // Redirect to thread
      goto(`/discussions/${thread.id}`);
    } catch (err) {
      console.error('Failed to create thread:', err);
      error = 'Failed to create discussion. Please try again.';
      isSubmitting = false;
    }
  }
</script>

<svelte:head>
  <title>New Discussion - Meeple Cart</title>
</svelte:head>

<div class="container mx-auto max-w-3xl px-4 py-8">
  <!-- Breadcrumb -->
  <div class="mb-6 text-sm text-secondary">
    <a href="/discussions" class="hover:text-primary">Discussions</a>
    <span class="mx-2">/</span>
    <span class="text-primary">New Discussion</span>
  </div>

  <!-- Header -->
  <div class="mb-8">
    <h1 class="mb-2 text-3xl font-bold text-primary">
      {isWantedPost ? 'Post a Wanted Ad' : 'Start a Discussion'}
    </h1>
    <p class="text-secondary">
      {#if listing}
        About: <a href="/listings/{listing.id}" class="font-medium text-accent hover:underline">
          {listing.title}
        </a>
      {:else if isWantedPost}
        Let the community know what games or items you're looking for.
      {:else}
        Share your thoughts, ask questions, or start a conversation with the community.
      {/if}
    </p>
  </div>

  <!-- Related listing info -->
  {#if listing}
    <div class="mb-6 rounded-lg border border-subtle bg-surface-card p-4">
      <div class="mb-1 text-xs font-medium uppercase tracking-wider text-muted">
        Related Listing
      </div>
      <div class="flex items-start gap-4">
        {#if listing.photos && listing.photos.length > 0}
          <img
            src={pb.files.getUrl(listing, listing.photos[0], { thumb: '100x100' })}
            alt={listing.title}
            class="h-16 w-16 rounded object-cover"
          />
        {/if}
        <div class="flex-1">
          <a
            href="/listings/{listing.id}"
            class="font-semibold text-primary hover:text-accent hover:underline"
          >
            {listing.title}
          </a>
          <p class="text-sm text-secondary">
            by {listing.expand?.owner?.display_name ?? 'Unknown'}
          </p>
        </div>
      </div>
    </div>
  {/if}

  <!-- Form -->
  <div class="rounded-lg border border-subtle bg-surface-card p-6">
    {#if error}
      <div class="alert alert-error mb-4">
        {error}
      </div>
    {/if}

    <form onsubmit={handleSubmit} class="space-y-6">
      <!-- Category Selection -->
      <div>
        <label for="category" class="mb-2 block text-sm font-medium text-secondary">
          Category <span class="text-red-400">*</span>
        </label>
        <select
          id="category"
          bind:value={category}
          class="w-full rounded-lg border border-subtle bg-surface-body px-4 py-2 text-primary focus:border-accent focus:outline-none"
          required
        >
          <option value="">Select a category...</option>
          {#each categories as cat}
            <option value={cat.id}>
              {cat.icon}
              {cat.name}
            </option>
          {/each}
        </select>
        <p class="mt-1 text-xs text-muted">
          {#if isWantedPost}
            Wanted posts let you specify items you're looking for
          {:else}
            Choose the category that best fits your discussion
          {/if}
        </p>
      </div>

      <!-- Title -->
      <div>
        <label for="title" class="mb-2 block text-sm font-medium text-secondary">
          Title <span class="text-red-400">*</span>
        </label>
        <input
          type="text"
          id="title"
          bind:value={title}
          placeholder="What's this discussion about?"
          maxlength="200"
          class="w-full rounded-lg border border-subtle bg-surface-body px-4 py-2 text-primary placeholder-muted focus:border-accent focus:outline-none"
          required
        />
        <div class="mt-1 text-right text-xs text-muted">
          {title.length}/200
        </div>
      </div>

      <!-- Content -->
      <div>
        <label for="content" class="mb-2 block text-sm font-medium text-secondary">
          Content <span class="text-red-400">*</span>
        </label>
        <MarkdownEditor
          bind:value={content}
          placeholder="Write your message in markdown..."
          rows={10}
        />
        <p class="mt-2 text-xs text-muted">
          You can use markdown for formatting. @mention users to notify them.
        </p>
      </div>

      <!-- Tags -->
      <div>
        <label for="tags" class="mb-2 block text-sm font-medium text-secondary">
          Tags (optional)
        </label>
        <div class="space-y-2">
          <div class="flex gap-2">
            <input
              type="text"
              id="tags"
              bind:value={tagInput}
              onkeydown={handleTagKeydown}
              placeholder="Type tags and press Enter or comma (e.g., euro, co-op, region:auckland)"
              maxlength="50"
              class="flex-1 rounded-lg border border-subtle bg-surface-body px-4 py-2 text-sm text-primary placeholder-muted focus:border-accent focus:outline-none"
              disabled={tags.length >= 10}
            />
            <button
              type="button"
              onclick={addTag}
              disabled={!tagInput.trim() || tags.length >= 10}
              class="rounded-lg border border-accent bg-accent px-4 py-2 text-sm font-medium text-surface-body hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add
            </button>
          </div>
          {#if tags.length > 0}
            <div class="flex flex-wrap gap-2">
              {#each tags as tag}
                <span
                  class="inline-flex items-center gap-1 rounded-full border border-subtle bg-surface-card px-3 py-1 text-sm text-secondary"
                >
                  #{tag}
                  <button
                    type="button"
                    onclick={() => removeTag(tag)}
                    class="text-muted hover:text-primary"
                    title="Remove tag"
                  >
                    ×
                  </button>
                </span>
              {/each}
            </div>
          {/if}
          <p class="text-xs text-muted">
            Add up to 10 tags. Use prefixes like tag:, region:, or player-count: for clarity.
            {#if tags.length > 0}
              <span class="text-secondary">({tags.length}/10)</span>
            {/if}
          </p>
        </div>
      </div>

      <!-- Wanted Items (only for wanted posts) -->
      {#if isWantedPost}
        <div class="space-y-4 rounded-lg border border-accent/30 bg-accent/5 p-4">
          <div>
            <h3 class="text-sm font-semibold text-primary">
              Items You Want <span class="text-red-400">*</span>
            </h3>
            <p class="mt-1 text-xs text-muted">
              List the games or items you're looking for. Include BGG IDs to help others identify
              exact games.
            </p>
          </div>

          <div class="space-y-3">
            {#each wantedItems as item, index (index)}
              <div class="flex gap-3">
                <div class="flex-1 space-y-2">
                  <input
                    type="text"
                    bind:value={item.title}
                    placeholder="Game title (e.g., Wingspan)"
                    class="w-full rounded-lg border border-subtle bg-surface-body px-3 py-2 text-sm text-primary placeholder-muted focus:border-accent focus:outline-none"
                  />
                  <div class="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      bind:value={item.bgg_id}
                      placeholder="BGG ID (optional)"
                      class="w-full rounded-lg border border-subtle bg-surface-body px-3 py-2 text-sm text-primary placeholder-muted focus:border-accent focus:outline-none"
                    />
                    <input
                      type="number"
                      bind:value={item.max_price}
                      placeholder="Max price (NZD, optional)"
                      step="0.01"
                      class="w-full rounded-lg border border-subtle bg-surface-body px-3 py-2 text-sm text-primary placeholder-muted focus:border-accent focus:outline-none"
                    />
                  </div>
                </div>
                {#if wantedItems.length > 1}
                  <button
                    type="button"
                    onclick={() => removeWantedItem(index)}
                    class="rounded-lg p-2 text-rose-400 transition hover:bg-rose-500/10"
                    title="Remove item"
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

          <button type="button" onclick={addWantedItem} class="text-sm text-accent hover:underline">
            + Add another item
          </button>

          <!-- Offer Type -->
          <div>
            <label class="mb-2 block text-sm font-medium text-secondary"> I'm looking to: </label>
            <div class="space-y-2">
              <label class="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="wanted_offer_type"
                  value="buying"
                  bind:group={wantedOfferType}
                  class="h-4 w-4 accent-[var(--accent)]"
                />
                <span class="text-secondary">💰 Buy (cash only)</span>
              </label>
              <label class="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="wanted_offer_type"
                  value="trading"
                  bind:group={wantedOfferType}
                  class="h-4 w-4 accent-[var(--accent)]"
                />
                <span class="text-secondary">🔄 Trade (no cash)</span>
              </label>
              <label class="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="wanted_offer_type"
                  value="either"
                  bind:group={wantedOfferType}
                  class="h-4 w-4 accent-[var(--accent)]"
                />
                <span class="text-secondary">💰🔄 Either buy or trade</span>
              </label>
            </div>
          </div>
        </div>
      {/if}

      <!-- Actions -->
      <div class="flex items-center justify-between gap-4">
        <a
          href={listing ? `/listings/${listing.id}` : '/discussions'}
          class="text-sm text-secondary hover:text-primary"
        >
          Cancel
        </a>
        <button
          type="submit"
          disabled={isSubmitting || !title.trim() || !content.trim()}
          class="rounded-lg border border-emerald-500 bg-emerald-500 px-6 py-2 font-semibold text-surface-body transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Creating...' : 'Create Discussion'}
        </button>
      </div>
    </form>
  </div>

  <!-- Guidelines -->
  <div class="mt-6 rounded-lg border border-subtle bg-surface-body p-4">
    <h3 class="mb-2 text-sm font-semibold text-primary">Community Guidelines</h3>
    <ul class="space-y-1 text-xs text-secondary">
      <li>• Be respectful and constructive</li>
      <li>• Stay on topic and relevant to board game trading</li>
      <li>• No spam, self-promotion, or duplicate posts</li>
      <li>• Report any inappropriate content to moderators</li>
    </ul>
    <a href="/guidelines" class="mt-3 inline-block text-xs text-accent hover:underline">
      Read full community guidelines →
    </a>
  </div>
</div>
