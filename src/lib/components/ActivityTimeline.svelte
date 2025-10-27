<script lang="ts">
  import type { ActivityItem } from '$lib/types/activity';
  import { getTimeGroup } from '$lib/utils/time';
  import ActivityItemComponent from './ActivityItem.svelte';

  let { activities }: { activities: ActivityItem[] } = $props();

  type TimeGroup = 'today' | 'yesterday' | 'this-week' | 'older';

  const groupLabels: Record<TimeGroup, string> = {
    today: 'Today',
    yesterday: 'Yesterday',
    'this-week': 'This Week',
    older: 'Older',
  };

  const groupIcons: Record<TimeGroup, string> = {
    today: '⚡',
    yesterday: '🕐',
    'this-week': '📅',
    older: '📦',
  };

  // Group activities by time period
  let groupedActivities = $derived.by(() => {
    const groups: Record<TimeGroup, ActivityItem[]> = {
      today: [],
      yesterday: [],
      'this-week': [],
      older: [],
    };

    activities.forEach((activity) => {
      const group = getTimeGroup(activity.timestamp);
      groups[group].push(activity);
    });

    return groups;
  });

  // Determine which groups have items (in order)
  let groupsToShow = $derived(
    (['today', 'yesterday', 'this-week', 'older'] as const).filter(
      (group) => groupedActivities[group].length > 0
    )
  );
</script>

<div class="space-y-12">
  <!-- Header -->
  <div class="space-y-4 text-center">
    <h1 class="text-4xl font-bold tracking-tight text-primary sm:text-5xl">Recent Activity</h1>
    <p class="mx-auto max-w-2xl text-lg text-muted">
      Latest games listed and wanted by the Meeple Cart community across Aotearoa
    </p>
  </div>

  {#if activities.length === 0}
    <div
      class="mx-auto max-w-md rounded-2xl border-2 border-dashed border-subtle bg-surface-card p-12 text-center transition-colors"
    >
      <div class="mb-4 text-6xl opacity-20">📭</div>
      <p class="text-lg text-muted">No recent activity to show. Check back soon!</p>
    </div>
  {:else}
    <div class="space-y-16">
      {#each groupsToShow as group (group)}
        <div class="space-y-8">
          <!-- Group header -->
          <div class="flex items-center gap-4">
            <div class="flex-shrink-0">
              <div
                class="flex h-12 w-12 items-center justify-center rounded-full bg-surface-card-alt text-2xl transition-colors ring-4 ring-[color:var(--surface-body)]"
              >
                {groupIcons[group]}
              </div>
            </div>
            <div class="min-w-0 flex-1">
              <h2 class="text-2xl font-bold uppercase tracking-wide text-secondary sm:text-3xl">
                {groupLabels[group]}
              </h2>
              <div
                class="mt-1 h-px bg-gradient-to-r from-[color:rgba(148,163,184,0.45)] to-transparent"
              ></div>
            </div>
          </div>

          <!-- Activity items -->
          <div class="space-y-0">
            {#each groupedActivities[group] as activity (activity.id)}
              <ActivityItemComponent {activity} />
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
