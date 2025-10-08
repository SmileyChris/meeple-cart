<script lang="ts">
  import { onMount, afterUpdate } from 'svelte';
  import type { MessageItem } from '$lib/types/message';
  import MessageBubble from './MessageBubble.svelte';

  export let messages: MessageItem[];
  export let loading = false;
  export let emptyMessage = 'No messages yet. Start the conversation!';

  let scrollContainer: HTMLDivElement;
  let shouldScrollToBottom = true;

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

  onMount(() => {
    scrollToBottom();
  });

  afterUpdate(() => {
    scrollToBottom();
  });

  $: if (messages) {
    // Allow scroll to bottom when new messages arrive
    shouldScrollToBottom = true;
  }
</script>

<div
  bind:this={scrollContainer}
  on:scroll={handleScroll}
  class="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-6"
>
  {#if loading}
    <div class="flex items-center justify-center py-12">
      <div
        class="h-8 w-8 animate-spin rounded-full border-4 border-slate-700 border-t-emerald-500"
      ></div>
    </div>
  {:else if messages.length === 0}
    <div class="flex flex-1 items-center justify-center">
      <div class="text-center">
        <div class="mb-3 text-5xl opacity-20">💬</div>
        <p class="text-slate-400">{emptyMessage}</p>
      </div>
    </div>
  {:else}
    {#each messages as message (message.id)}
      <MessageBubble {message} />
    {/each}
  {/if}
</div>
