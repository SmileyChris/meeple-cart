<script lang="ts">
  import type { CascadeRecord } from '$lib/types/cascade';
  import { REGION_LABELS } from '$lib/constants/regions';
  import BaseCard from './BaseCard.svelte';

  let { cascade }: { cascade: CascadeRecord } = $props();

  let createdLabel = $derived(
    new Intl.DateTimeFormat('en-NZ', {
      dateStyle: 'medium',
    }).format(new Date(cascade.created))
  );

  // Get status display info
  const statusInfo: Record<string, { label: string; color: string }> = {
    accepting_entries: { label: 'Accepting entries', color: 'text-badge-emerald' },
    selecting_winner: { label: 'Selecting winner', color: 'text-badge-amber' },
    in_transit: { label: 'In transit', color: 'text-badge-blue' },
    awaiting_pass: { label: 'Awaiting pass', color: 'text-badge-purple' },
    completed: { label: 'Completed', color: 'text-muted' },
    broken: { label: 'Broken', color: 'text-red-500' },
  };

  let status = $derived(statusInfo[cascade.status] || statusInfo.accepting_entries);

  // Format deadline
  let deadlineLabel = $derived.by(() => {
    if (!cascade.entry_deadline) return null;
    const deadline = new Date(cascade.entry_deadline);
    const now = new Date();
    const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return 'Closed';
    if (daysLeft === 0) return 'Ends today';
    if (daysLeft === 1) return '1 day left';
    return `${daysLeft} days left`;
  });
</script>

<BaseCard
  href={`/cascades/${cascade.id}`}
  imageUrl={null}
  imageAlt={cascade.name || 'Gift Cascade'}
  borderClass="border border-subtle group-hover:border-pink-500"
>
  {#snippet header()}
    <div class="flex items-center justify-between text-xs uppercase tracking-wide text-muted">
      <span
        class="rounded-full border border-pink-500 bg-pink-500/10 px-3 py-1 font-semibold text-badge-pink"
      >
        🎁 Gift Cascade
      </span>
      <span>{createdLabel}</span>
    </div>
  {/snippet}

  {#snippet content()}
    <div class="space-y-2">
      <h3 class="text-lg font-semibold text-primary transition-colors">
        {cascade.name || 'Gift Cascade'}
      </h3>

      <!-- Game info -->
      {#if cascade.expand?.current_game}
        <p class="text-sm text-secondary">
          {cascade.expand.current_game.title}
        </p>
      {/if}

      <!-- Current holder -->
      {#if cascade.expand?.current_holder}
        <div class="flex items-center gap-1.5 text-sm">
          <span class="text-muted">Held by</span>
          <a
            href={`/users/${cascade.expand.current_holder.id}`}
            class="font-medium text-primary transition hover:text-[var(--accent)]"
            onclick={(e) => e.stopPropagation()}
          >
            {cascade.expand.current_holder.display_name}
          </a>
        </div>
      {/if}

      <!-- Description preview -->
      {#if cascade.description}
        <p class="line-clamp-2 text-sm text-secondary">
          {cascade.description}
        </p>
      {/if}

      <!-- Status badge -->
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium {status.color}">
          {status.label}
        </span>
        {#if deadlineLabel && cascade.status === 'accepting_entries'}
          <span class="text-xs text-muted">({deadlineLabel})</span>
        {/if}
      </div>
    </div>
  {/snippet}

  {#snippet footer()}
    <!-- Region and stats -->
    <div class="border-t border-subtle pt-2 opacity-50"></div>
    <div class="flex items-center justify-between text-xs text-muted">
      <div class="flex items-center gap-2">
        {#if cascade.region}
          <span class="flex items-center gap-1">
            <span>📍</span>
            {REGION_LABELS[cascade.region] || cascade.region}
          </span>
        {/if}
        <span>Gen {cascade.generation}</span>
      </div>
      <div class="flex items-center gap-2">
        <span>👁️ {cascade.view_count}</span>
        <span>👥 {cascade.entry_count}</span>
      </div>
    </div>
  {/snippet}
</BaseCard>
