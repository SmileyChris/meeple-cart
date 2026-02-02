<script lang="ts">
  import { currentUser } from '$lib/pocketbase';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let threads = $derived(data.threads.items);
  let categories = $derived(data.categories);
  let currentTab = $derived(data.currentTab);
  let currentCategory = $derived(data.currentCategory);
  let currentTags = $derived(data.currentTags);
  let currentSearch = $derived(data.currentSearch);

  let searchInput = $state(currentSearch ?? '');

  function setTab(tab: string) {
    const url = new URL($page.url);
    url.searchParams.set('tab', tab);
    url.searchParams.delete('page'); // Reset to page 1
    goto(url.toString());
  }

  function setCategory(slug: string | null) {
    const url = new URL($page.url);
    if (slug) {
      url.searchParams.set('category', slug);
    } else {
      url.searchParams.delete('category');
    }
    url.searchParams.delete('page'); // Reset to page 1
    goto(url.toString());
  }

  function handleSearch() {
    const url = new URL($page.url);
    if (searchInput.trim()) {
      url.searchParams.set('search', searchInput.trim());
    } else {
      url.searchParams.delete('search');
    }
    url.searchParams.delete('page'); // Reset to page 1
    goto(url.toString());
  }

  function nextPage() {
    const url = new URL($page.url);
    url.searchParams.set('page', (data.threads.page + 1).toString());
    goto(url.toString());
  }

  function prevPage() {
    const url = new URL($page.url);
    const prevPageNum = Math.max(1, data.threads.page - 1);
    url.searchParams.set('page', prevPageNum.toString());
    goto(url.toString());
  }

  // Format date for display
  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return minutes <= 1 ? 'Just now' : `${minutes}m ago`;
      }
      return hours === 1 ? '1h ago' : `${hours}h ago`;
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString('en-NZ', { month: 'short', day: 'numeric' });
    }
  }

  // Get preview text from markdown content
  function getPreview(content: string, maxLength: number = 200): string {
    // Strip markdown syntax
    const plain = content
      .replace(/[#*`_\[\]]/g, '')
      .replace(/\n+/g, ' ')
      .trim();
    return plain.length > maxLength ? plain.substring(0, maxLength) + '...' : plain;
  }
</script>

<svelte:head>
  <title>Chat · Meeple Cart</title>
  <meta
    name="description"
    content="Connect with the board gaming community in New Zealand. Chat about games, trading tips, and more."
  />
</svelte:head>

<main class="bg-surface-body px-6 py-8 text-primary transition-colors sm:px-8">
  <div class="mx-auto max-w-5xl space-y-6">
    <!-- Header with action -->
    {#if $currentUser}
      <div class="flex justify-end">
        <a
          href="/chat/new"
          class="rounded-lg border border-emerald-500 bg-emerald-500 px-4 py-2 font-semibold text-surface-body transition hover:bg-emerald-600"
        >
          New Chat
        </a>
      </div>
    {/if}

    <!-- Tabs & Filters -->
    <div class="space-y-4">
      <!-- Tabs -->
      <div class="flex flex-wrap items-center gap-2 border-b border-subtle">
        <button
          onclick={() => setTab('latest')}
          class="border-b-2 px-4 py-2 text-sm font-medium transition {currentTab === 'latest'
            ? 'border-accent text-accent'
            : 'border-transparent text-secondary hover:text-primary'}"
        >
          Latest
        </button>
        <button
          onclick={() => setTab('top')}
          class="border-b-2 px-4 py-2 text-sm font-medium transition {currentTab === 'top'
            ? 'border-accent text-accent'
            : 'border-transparent text-secondary hover:text-primary'}"
        >
          Top
        </button>
        <button
          onclick={() => setTab('wanted')}
          class="border-b-2 px-4 py-2 text-sm font-medium transition {currentTab === 'wanted'
            ? 'border-accent text-accent'
            : 'border-transparent text-secondary hover:text-primary'}"
        >
          🔍 Wanted
        </button>
        <button
          onclick={() => setTab('unanswered')}
          class="border-b-2 px-4 py-2 text-sm font-medium transition {currentTab === 'unanswered'
            ? 'border-accent text-accent'
            : 'border-transparent text-secondary hover:text-primary'}"
        >
          Unanswered
        </button>

        <!-- Category Dropdown (right side) -->
        <div class="relative ml-auto flex items-center gap-2">
          <select
            id="category-filter"
            onchange={(e) => setCategory(e.currentTarget.value || null)}
            value={currentCategory ?? ''}
            class="border-b-2 bg-transparent px-4 py-2 text-sm font-medium transition focus:outline-none {currentCategory
              ? 'border-accent text-accent'
              : 'border-transparent text-secondary hover:text-primary'}"
          >
            <option value="">All Categories</option>
            {#each categories as category}
              <option value={category.slug}>
                {category.icon}
                {category.name}
              </option>
            {/each}
          </select>
        </div>
      </div>

      <!-- Search -->
      <div class="flex gap-2">
        <input
          type="search"
          bind:value={searchInput}
          placeholder="Search chats..."
          onkeydown={(e) => e.key === 'Enter' && handleSearch()}
          class="flex-1 rounded-lg border border-subtle bg-surface-body px-4 py-2 text-sm text-primary placeholder-muted focus:border-accent focus:outline-none"
        />
        <button
          onclick={handleSearch}
          class="rounded-lg border border-accent bg-accent px-4 py-2 text-sm font-medium text-surface-body hover:opacity-90"
        >
          Search
        </button>
      </div>

      <!-- Active Filters Display -->
      {#if currentCategory || currentTags.length > 0 || currentSearch}
        <div class="flex flex-wrap items-center gap-2 text-sm">
          <span class="text-muted">Filters:</span>
          {#if currentCategory}
            {@const cat = categories.find((c) => c.slug === currentCategory)}
            {#if cat}
              <button
                onclick={() => setCategory(null)}
                class="inline-flex items-center gap-1 rounded-full border border-subtle bg-surface-card px-3 py-1 text-sm font-medium text-secondary hover:border-accent"
              >
                {cat.icon}
                {cat.name}
                <span class="text-muted">×</span>
              </button>
            {/if}
          {/if}
          {#each currentTags as tag}
            <button
              onclick={() => {
                const url = new URL($page.url);
                const params = url.searchParams;
                const allTags = params.getAll('tag');
                // Remove all tag params
                while (params.has('tag')) {
                  params.delete('tag');
                }
                // Re-add all except the one being removed
                allTags.filter((t) => t !== tag).forEach((t) => params.append('tag', t));
                params.delete('page');
                goto(url.toString());
              }}
              class="inline-flex items-center gap-1 rounded-full border border-subtle bg-surface-card px-3 py-1 text-sm font-medium text-secondary hover:border-accent"
            >
              #{tag}
              <span class="text-muted">×</span>
            </button>
          {/each}
          {#if currentSearch}
            <button
              onclick={() => {
                searchInput = '';
                handleSearch();
              }}
              class="inline-flex items-center gap-1 rounded-full border border-subtle bg-surface-card px-3 py-1 text-sm font-medium text-secondary hover:border-accent"
            >
              Search: "{currentSearch}"
              <span class="text-muted">×</span>
            </button>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Thread List -->
    {#if threads.length === 0}
      <div class="rounded-xl border border-subtle bg-surface-card p-12 text-center">
        <p class="text-lg text-secondary">No chats yet</p>
        <p class="mt-2 text-sm text-muted">Be the first to start a chat!</p>
        {#if $currentUser}
          <a
            href="/chat/new"
            class="mt-4 inline-block rounded-lg border border-emerald-500 bg-emerald-500 px-6 py-2 font-semibold text-surface-body transition hover:bg-emerald-600"
          >
            Start a Chat
          </a>
        {:else}
          <a
            href="/login?redirect=/chat"
            class="mt-4 inline-block rounded-lg border border-emerald-500 bg-emerald-500 px-6 py-2 font-semibold text-surface-body transition hover:bg-emerald-600"
          >
            Sign In to Start
          </a>
        {/if}
      </div>
    {:else}
      <div class="space-y-3">
        {#each threads as thread (thread.id)}
          <a
            href="/chat/{thread.id}"
            class="block rounded-lg border border-subtle bg-surface-card p-6 transition hover:border-accent"
          >
            <div class="mb-3 flex items-start justify-between gap-4">
              <div class="flex-1">
                <!-- Category Badge -->
                {#if thread.expand?.category}
                  {@const category = thread.expand.category}
                  <div class="mb-2">
                    <span
                      class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                      style="background-color: {category.color}15; color: {category.color}"
                    >
                      {category.icon}
                      {category.name}
                    </span>
                  </div>
                {/if}

                <div class="mb-1 flex items-center gap-2">
                  {#if thread.is_pinned}
                    <span class="text-sm">📌</span>
                  {/if}
                  {#if thread.expand?.category?.slug === 'wanted'}
                    <span class="text-sm">🔍</span>
                  {/if}
                  <h2 class="text-lg font-semibold text-primary hover:text-accent">
                    {thread.title}
                  </h2>
                  {#if thread.is_locked}
                    <span
                      class="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-badge-amber"
                    >
                      🔒 Locked
                    </span>
                  {/if}
                </div>

                <p class="text-sm text-secondary">
                  {getPreview(thread.content)}
                </p>

                <!-- Wanted Items Preview -->
                {#if thread.expand?.category?.slug === 'wanted' && thread.wanted_items && thread.wanted_items.length > 0}
                  <div class="mt-2 text-xs text-muted">
                    <span class="font-medium">Looking for:</span>
                    {thread.wanted_items
                      .slice(0, 3)
                      .map((i) => i.title)
                      .join(', ')}
                    {#if thread.wanted_items.length > 3}
                      <span>+{thread.wanted_items.length - 3} more</span>
                    {/if}
                  </div>
                {/if}

                <!-- Tags -->
                {#if thread.tags && thread.tags.length > 0}
                  <div class="mt-2 flex flex-wrap gap-1">
                    {#each thread.tags.slice(0, 5) as tag}
                      <a
                        href="/chat?tag={encodeURIComponent(tag)}"
                        class="inline-block rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent hover:bg-accent/20"
                        onclick={(e) => e.stopPropagation()}
                      >
                        #{tag}
                      </a>
                    {/each}
                    {#if thread.tags.length > 5}
                      <span class="text-xs text-muted">+{thread.tags.length - 5}</span>
                    {/if}
                  </div>
                {/if}
              </div>
            </div>

            <div class="flex items-center gap-4 text-xs text-muted">
              <span class="font-medium text-secondary">
                {thread.expand?.author?.display_name ?? 'Unknown'}
              </span>
              <span>·</span>
              <span>{formatDate(thread.created)}</span>
              <span>·</span>
              <span>👁️ {thread.view_count}</span>
              <span>·</span>
              <span>💬 {thread.reply_count}</span>
              {#if thread.last_reply_at}
                <span>·</span>
                <span>Last reply {formatDate(thread.last_reply_at)}</span>
              {/if}
            </div>
          </a>
        {/each}
      </div>
    {/if}

    <!-- Pagination -->
    {#if data.threads.totalPages > 1}
      <div class="flex items-center justify-center gap-4">
        <button
          onclick={prevPage}
          disabled={data.threads.page === 1}
          class="rounded-lg border border-subtle bg-surface-card px-4 py-2 text-sm font-medium text-secondary transition hover:border-accent hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          ← Previous
        </button>
        <span class="text-sm text-muted">
          Page {data.threads.page} of {data.threads.totalPages}
        </span>
        <button
          onclick={nextPage}
          disabled={data.threads.page === data.threads.totalPages}
          class="rounded-lg border border-subtle bg-surface-card px-4 py-2 text-sm font-medium text-secondary transition hover:border-accent hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next →
        </button>
      </div>
    {/if}

    <!-- Sign in prompt for guests -->
    {#if !$currentUser}
      <div class="rounded-lg border border-subtle bg-surface-card p-6 text-center">
        <p class="mb-4 text-secondary">Sign in to start chats and reply to threads</p>
        <a
          href="/login?redirect=/chat"
          class="inline-block rounded-lg border border-emerald-500 bg-emerald-500 px-6 py-2 font-semibold text-surface-body transition hover:bg-emerald-600"
        >
          Sign In
        </a>
      </div>
    {/if}
  </div>
</main>
