<script lang="ts">
  import type { MessageItem } from '$lib/types/message';
  import MessageBubble from './MessageBubble.svelte';

  let {
    messages,
    loading = false,
    emptyMessage = 'No messages yet. Start the conversation!',
  }: { messages: MessageItem[]; loading?: boolean; emptyMessage?: string } = $props();

  let scrollContainer = $state<HTMLDivElement | undefined>(undefined);
  let shouldScrollToBottom = $state(true);

  function scrollToBottom() {
    if (scrollContainer && shouldScrollToBottom) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }

  function handleScroll() {
    if (scrollContainer) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      shouldScrollToBottom = isAtBottom;
    }
  }

  $effect(() => {
    // When messages change, allow scroll to bottom
    if (messages) {
      shouldScrollToBottom = true;
    }
  });

  $effect(() => {
    // Scroll to bottom when messages or scrollContainer changes
    scrollToBottom();
  });
</script>

<div
  bind:this={scrollContainer}
  onscroll={handleScroll}
  class="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-6"
>
  {#if loading}
    <div class="flex items-center justify-center py-12">
      <div
        class="h-8 w-8 animate-spin rounded-full border-4 border-subtle border-t-emerald-500"
      ></div>
    </div>
  {:else if messages.length === 0}
    <div class="flex flex-1 items-center justify-center">
      <div class="text-center">
        <div class="mb-3 text-5xl opacity-20">💬</div>
        <p class="text-muted">{emptyMessage}</p>
      </div>
    </div>
  {:else}
    {#each messages as message (message.id)}
      <MessageBubble {message} />
    {/each}
  {/if}
</div>
