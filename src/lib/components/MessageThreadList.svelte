<script lang="ts">
  import type { MessageThread } from '$lib/types/message';
  import { formatRelativeTime } from '$lib/utils/time';

  let {
    threads,
    selectedThreadId = null,
  }: { threads: MessageThread[]; selectedThreadId?: string | null } = $props();

  function handleThreadClick(threadId: string) {
    window.location.href = `/messages/${threadId}`;
  }
</script>

<div class="space-y-4">
  {#if threads.length === 0}
    <div
      class="rounded-xl border border-dashed border-subtle bg-surface-card p-12 text-center transition-colors"
    >
      <div class="mb-4 text-6xl opacity-20">📭</div>
      <p class="text-lg text-muted">No messages yet</p>
      <p class="mt-1 text-sm text-muted">Messages about your listings will appear here</p>
    </div>
  {:else}
    {#each threads as thread (thread.threadId)}
      <article
        class="cursor-pointer rounded-xl border border-subtle bg-surface-card p-6 transition-colors hover:border-emerald-500/50 {selectedThreadId ===
        thread.threadId
          ? 'border-emerald-500'
          : ''}"
        role="button"
        tabindex="0"
        onclick={() => handleThreadClick(thread.threadId)}
        onkeydown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleThreadClick(thread.threadId);
          }
        }}
      >
        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div class="flex gap-4">
            <!-- Listing thumbnail -->
            <div class="flex-shrink-0">
              {#if thread.listingThumbnail}
                <img
                  src={thread.listingThumbnail}
                  alt={thread.listingTitle}
                  class="h-20 w-20 rounded-lg object-cover"
                />
              {:else}
                <div
                  class="flex h-20 w-20 items-center justify-center rounded-lg bg-surface-card-alt text-3xl opacity-50 transition-colors"
                >
                  🎲
                </div>
              {/if}
            </div>

            <!-- Thread info -->
            <div class="flex min-w-0 flex-1 flex-col gap-2">
              <div>
                <h3
                  class="text-lg font-semibold text-primary {thread.lastMessage.isRead
                    ? ''
                    : 'font-bold'}"
                >
                  {thread.otherUser.name}
                </h3>
                <p class="text-sm text-muted">{thread.listingTitle}</p>
              </div>

              <p
                class="text-sm {thread.lastMessage.isRead
                  ? 'text-muted'
                  : 'font-medium text-secondary'}"
              >
                {thread.lastMessage.content}
              </p>
            </div>
          </div>

          <!-- Right side: time and unread badge -->
          <div class="flex items-center gap-3 sm:flex-col sm:items-end">
            <span class="text-xs text-muted">
              {formatRelativeTime(thread.lastMessage.timestamp)}
            </span>
            {#if thread.unreadCount > 0}
              <span
                class="flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-emerald-500 px-2 text-xs font-bold text-[var(--accent-contrast)]"
              >
                {thread.unreadCount}
              </span>
            {/if}
          </div>
        </div>
      </article>
    {/each}
  {/if}
</div>
