<script lang="ts">
  import type { DiscussionThreadRecord } from '$lib/types/pocketbase';
  import BaseCard from './BaseCard.svelte';

  let { thread }: { thread: DiscussionThreadRecord } = $props();

  let createdLabel = $derived(
    new Intl.DateTimeFormat('en-NZ', {
      dateStyle: 'medium',
    }).format(new Date(thread.created))
  );

  // Get preview text from markdown content
  function getPreview(content: string, maxLength: number = 150): string {
    // Strip markdown syntax
    const plain = content
      .replace(/[#*`_\[\]]/g, '')
      .replace(/\n+/g, ' ')
      .trim();
    return plain.length > maxLength ? plain.substring(0, maxLength) + '...' : plain;
  }
</script>

<BaseCard
  href={`/chat/${thread.id}`}
  imageUrl={null}
  imageAlt={thread.title}
  borderClass="border border-subtle group-hover:border-accent"
>
  {#snippet header()}
    <div class="flex items-center justify-between text-xs uppercase tracking-wide text-muted">
      <span
        class="rounded-full border border-purple-500 bg-purple-500/10 px-3 py-1 font-semibold text-badge-purple"
      >
        💬 Chat
      </span>
      <span>{createdLabel}</span>
    </div>
  {/snippet}

  {#snippet content()}
    <div class="space-y-2">
      <h3 class="text-lg font-semibold text-primary transition-colors">{thread.title}</h3>

      <!-- Author info -->
      <div class="flex items-center gap-1.5 text-sm">
        {#if thread.expand?.author}
          <a
            href={`/users/${thread.expand.author.id}`}
            class="font-medium text-primary transition hover:text-[var(--accent)]"
            onclick={(e) => e.stopPropagation()}
          >
            {thread.expand.author.display_name}
          </a>
        {:else}
          <span class="font-medium text-primary">Meeple Cart member</span>
        {/if}
      </div>

      <!-- Content preview -->
      <p class="text-sm text-secondary transition-colors">{getPreview(thread.content)}</p>

      <!-- Category badge -->
      {#if thread.expand?.category}
        {@const category = thread.expand.category}
        <div class="mt-2">
          <span
            class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
            style="background-color: {category.color}15; color: {category.color}"
          >
            {category.icon}
            {category.name}
          </span>
        </div>
      {/if}

      <!-- Tags -->
      {#if thread.tags && thread.tags.length > 0}
        <div class="mt-2 flex flex-wrap gap-1">
          {#each thread.tags.slice(0, 3) as tag}
            <span class="inline-block rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
              #{tag}
            </span>
          {/each}
          {#if thread.tags.length > 3}
            <span class="text-xs text-muted">+{thread.tags.length - 3}</span>
          {/if}
        </div>
      {/if}
    </div>
  {/snippet}

  {#snippet footer()}
    <!-- Stats -->
    <div class="border-t border-subtle pt-2 opacity-50"></div>
    <div class="flex items-center gap-3 text-xs text-muted">
      <span>👁️ {thread.view_count}</span>
      <span>💬 {thread.reply_count}</span>
    </div>
  {/snippet}
</BaseCard>
