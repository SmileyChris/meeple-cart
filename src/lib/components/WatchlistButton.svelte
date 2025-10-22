<script lang="ts">
  import { enhance } from '$app/forms';

  let {
    listingId,
    isWatching,
    compact = false,
  }: { listingId: string; isWatching: boolean; compact?: boolean } = $props();

  let isSubmitting = $state(false);
</script>

<form
  method="POST"
  action="/watchlist?/toggle"
  use:enhance={() => {
    isSubmitting = true;
    return async ({ update }) => {
      await update();
      isSubmitting = false;
    };
  }}
>
  <input type="hidden" name="listing_id" value={listingId} />
  <button
    type="submit"
    disabled={isSubmitting}
    class={`group inline-flex items-center gap-2 rounded-full border transition ${compact ? 'btn-ghost px-2 py-1.5' : 'btn-ghost px-4 py-2 bg-surface-card'} ${
      isWatching
        ? 'border-amber-500 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
        : 'text-muted hover:border-amber-500 hover:text-amber-300'
    } disabled:opacity-50`}
  >
    <svg class="h-5 w-5" fill={isWatching ? 'currentColor' : 'none'} viewBox="0 0 24 24">
      <path
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
      />
    </svg>
    {#if !compact}
      <span class="text-sm font-medium">
        {isWatching ? 'Watching' : 'Watch'}
      </span>
    {/if}
  </button>
</form>
