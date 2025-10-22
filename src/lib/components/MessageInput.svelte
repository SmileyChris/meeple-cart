<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let placeholder = 'Type a message...';
  export let disabled = false;
  export let maxLength = 4000;

  let content = '';
  const dispatch = createEventDispatcher<{ send: { content: string } }>();

  function handleSubmit() {
    const trimmed = content.trim();
    if (trimmed && trimmed.length <= maxLength) {
      dispatch('send', { content: trimmed });
      content = '';
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  }

  $: remainingChars = maxLength - content.length;
  $: isNearLimit = remainingChars < 100;
</script>

<form on:submit|preventDefault={handleSubmit} class="flex flex-col gap-2">
  <div class="relative">
    <textarea
      bind:value={content}
      on:keydown={handleKeydown}
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
