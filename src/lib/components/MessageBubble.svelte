<script lang="ts">
  import type { MessageItem } from '$lib/types/message';
  import { formatRelativeTime } from '$lib/utils/time';

  export let message: MessageItem;

  const alignmentClass = message.isOwnMessage ? 'ml-auto' : 'mr-auto';
  const bgClass = message.isOwnMessage
    ? 'bg-emerald-500/20 border-emerald-600'
    : 'bg-slate-800 border-slate-700';
  const textClass = message.isOwnMessage ? 'text-emerald-100' : 'text-slate-200';
</script>

<div class="flex flex-col {alignmentClass} max-w-[80%] gap-1">
  {#if !message.isOwnMessage}
    <span class="px-3 text-xs font-medium text-slate-400">{message.senderName}</span>
  {/if}
  <div class="rounded-2xl border {bgClass} px-4 py-2.5">
    <p class="whitespace-pre-wrap break-words {textClass}">{message.content}</p>
  </div>
  <div class="flex items-center gap-2 px-3">
    <span class="text-xs text-slate-500">{formatRelativeTime(message.timestamp)}</span>
    {#if message.isOwnMessage && message.isRead}
      <span class="text-xs text-emerald-400">✓ Read</span>
    {/if}
  </div>
</div>
