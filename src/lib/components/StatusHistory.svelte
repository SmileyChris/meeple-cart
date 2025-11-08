<script lang="ts">
  import type { StatusChange } from '$lib/utils/listing-status';

  let {
    statusHistory = [],
  }: {
    statusHistory: StatusChange[];
  } = $props();

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat('en-NZ', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));

  const statusColors: Record<string, string> = {
    active: 'text-emerald-400',
    pending: 'text-amber-400',
    completed: 'text-sky-400',
    cancelled: 'text-rose-400',
  };
</script>

{#if statusHistory.length > 0}
  <section class="rounded-xl border border-subtle bg-surface-card transition-colors p-6">
    <h3 class="text-lg font-semibold mb-4">Status History</h3>

    <div class="space-y-3">
      {#each statusHistory as change}
        <div class="flex items-start gap-4 border-l-2 border-subtle pl-4 py-2">
          <div class="flex-1">
            <div class="flex items-center gap-2 text-sm">
              <span class={statusColors[change.from] || 'text-muted'}>
                {change.from}
              </span>
              <span class="text-muted">→</span>
              <span class={statusColors[change.to] || 'text-muted'}>
                {change.to}
              </span>
            </div>
            <p class="mt-1 text-sm text-secondary">
              {change.reason}
            </p>
            <p class="mt-1 text-xs text-muted">
              {formatDate(change.timestamp)}
            </p>
          </div>
        </div>
      {/each}
    </div>
  </section>
{:else}
  <section
    class="rounded-xl border border-dashed border-subtle bg-surface-card/50 transition-colors p-6 text-center"
  >
    <p class="text-sm text-muted">
      No status changes yet. Status history will appear here when the listing status changes.
    </p>
  </section>
{/if}
