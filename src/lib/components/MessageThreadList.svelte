<script lang="ts">
  import type { MessageThread } from '$lib/types/message';
  import { formatRelativeTime } from '$lib/utils/time';

  export let threads: MessageThread[];
  export let selectedThreadId: string | null = null;

  function handleThreadClick(threadId: string) {
    window.location.href = `/messages/${threadId}`;
  }
</script>

<div class="flex flex-col">
  {#if threads.length === 0}
    <div class="flex flex-col items-center justify-center py-20">
      <div class="mb-4 text-6xl opacity-20">📭</div>
      <p class="text-lg text-slate-400">No messages yet</p>
      <p class="text-sm text-slate-500">Messages about your listings will appear here</p>
    </div>
  {:else}
    {#each threads as thread (thread.threadId)}
      <button
        on:click={() => handleThreadClick(thread.threadId)}
        class="flex gap-4 border-b border-slate-800 px-4 py-4 text-left transition hover:bg-slate-900/50 {selectedThreadId ===
        thread.threadId
          ? 'bg-slate-900 border-l-4 border-l-emerald-500'
          : ''}"
      >
        <!-- Listing thumbnail or placeholder -->
        <div class="flex-shrink-0">
          {#if thread.listingThumbnail}
            <img
              src={thread.listingThumbnail}
              alt={thread.listingTitle}
              class="h-16 w-16 rounded-lg object-cover"
            />
          {:else}
            <div
              class="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-800 text-2xl opacity-50"
            >
              🎲
            </div>
          {/if}
        </div>

        <!-- Thread info -->
        <div class="flex min-w-0 flex-1 flex-col gap-1">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0 flex-1">
              <h3
                class="truncate font-semibold text-slate-200 {thread.lastMessage.isRead
                  ? ''
                  : 'font-bold'}"
              >
                {thread.otherUser.name}
              </h3>
              <p class="truncate text-sm text-slate-400">{thread.listingTitle}</p>
            </div>
            <div class="flex flex-col items-end gap-1">
              <span class="text-xs text-slate-500">
                {formatRelativeTime(thread.lastMessage.timestamp)}
              </span>
              {#if thread.unreadCount > 0}
                <span
                  class="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-emerald-500 px-1.5 text-xs font-bold text-slate-900"
                >
                  {thread.unreadCount}
                </span>
              {/if}
            </div>
          </div>

          <p
            class="truncate text-sm {thread.lastMessage.isRead
              ? 'text-slate-500'
              : 'font-medium text-slate-300'}"
          >
            {thread.lastMessage.content}
          </p>
        </div>
      </button>
    {/each}
  {/if}
</div>
