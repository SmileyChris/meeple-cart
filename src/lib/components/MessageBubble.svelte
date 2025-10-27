<script lang="ts">
  import type { MessageItem } from '$lib/types/message';
  import { formatRelativeTime } from '$lib/utils/time';

  let { message }: { message: MessageItem } = $props();

  let alignmentClass = $derived(message.isOwnMessage ? 'ml-auto' : 'mr-auto');
  let bubbleClass = $derived(
    message.isOwnMessage
      ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
      : 'border-subtle bg-surface-card-alt'
  );
  let textClass = $derived(message.isOwnMessage ? 'text-[var(--accent-strong)]' : 'text-secondary');
</script>

<div class="flex flex-col {alignmentClass} max-w-[80%] gap-1">
  {#if !message.isOwnMessage}
    <span class="px-3 text-xs font-medium text-muted">{message.senderName}</span>
  {/if}
  <div class="rounded-2xl border {bubbleClass} px-4 py-2.5">
    <p class="whitespace-pre-wrap break-words {textClass}">{message.content}</p>
  </div>
  <div class="flex items-center gap-2 px-3">
    <span class="text-xs text-muted">{formatRelativeTime(message.timestamp)}</span>
    {#if message.isOwnMessage && message.isRead}
      <span class="text-xs text-[var(--accent-strong)]">✓ Read</span>
    {/if}
  </div>
</div>
