<script lang="ts">
  import type { ActivityItem } from '$lib/types/activity';
  import { getTimeGroup } from '$lib/utils/time';
  import ActivityItemComponent from './ActivityItem.svelte';

  export let activities: ActivityItem[];

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
  const groupedActivities: Record<TimeGroup, ActivityItem[]> = {
    today: [],
    yesterday: [],
    'this-week': [],
    older: [],
  };

  activities.forEach((activity) => {
    const group = getTimeGroup(activity.timestamp);
    groupedActivities[group].push(activity);
  });

  // Determine which groups have items (in order)
  const groupsToShow: TimeGroup[] = (['today', 'yesterday', 'this-week', 'older'] as const).filter(
    (group) => groupedActivities[group].length > 0
  );
</script>

<div class="space-y-12">
  <!-- Header -->
  <div class="space-y-4 text-center">
    <h1 class="text-4xl font-bold tracking-tight text-slate-100 sm:text-5xl">Recent Activity</h1>
    <p class="mx-auto max-w-2xl text-lg text-slate-400">
      Latest games listed and wanted by the Meeple Cart community across Aotearoa
    </p>
  </div>

  {#if activities.length === 0}
    <div
      class="mx-auto max-w-md rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/40 p-12 text-center"
    >
      <div class="mb-4 text-6xl opacity-20">📭</div>
      <p class="text-lg text-slate-400">No recent activity to show. Check back soon!</p>
    </div>
  {:else}
    <div class="space-y-16">
      {#each groupsToShow as group (group)}
        <div class="space-y-8">
          <!-- Group header -->
          <div class="flex items-center gap-4">
            <div class="flex-shrink-0">
              <div
                class="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-2xl ring-4 ring-slate-950"
              >
                {groupIcons[group]}
              </div>
            </div>
            <div class="min-w-0 flex-1">
              <h2 class="text-2xl font-bold uppercase tracking-wide text-slate-300 sm:text-3xl">
                {groupLabels[group]}
              </h2>
              <div class="mt-1 h-px bg-gradient-to-r from-slate-700 to-transparent"></div>
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
