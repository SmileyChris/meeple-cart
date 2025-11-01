<script lang="ts">
  let {
    placeholder = 'Type a message...',
    disabled = false,
    maxLength = 4000,
    onsend,
  }: {
    placeholder?: string;
    disabled?: boolean;
    maxLength?: number;
    onsend?: (event: CustomEvent<{ content: string }>) => void;
  } = $props();

  let content = $state('');

  function handleSubmit(event?: SubmitEvent) {
    event?.preventDefault();
    const trimmed = content.trim();
    if (trimmed && trimmed.length <= maxLength) {
      onsend?.(new CustomEvent('send', { detail: { content: trimmed } }));
      content = '';
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  }

  let remainingChars = $derived(maxLength - content.length);
  let isNearLimit = $derived(remainingChars < 100);
</script>

<form onsubmit={handleSubmit} class="flex flex-col gap-2">
  <div class="relative">
    <textarea
      bind:value={content}
      onkeydown={handleKeydown}
      {placeholder}
      {disabled}
      maxlength={maxLength}
      rows="3"
      class="w-full resize-none rounded-xl border border-subtle bg-surface-card px-4 py-3 text-primary placeholder:text-muted transition focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)] disabled:cursor-not-allowed disabled:opacity-50"
    />
  </div>

  <div class="flex items-center justify-between">
    {#if isNearLimit}
      <span class="text-sm {remainingChars < 0 ? 'text-rose-400' : 'text-amber-400'}">
        {remainingChars} characters remaining
      </span>
    {:else}
      <div></div>
    {/if}

    <div class="flex gap-2">
      <button
        type="submit"
        disabled={disabled || !content.trim() || content.length > maxLength}
        class="btn-primary px-6 py-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Send
      </button>
    </div>
  </div>
</form>
