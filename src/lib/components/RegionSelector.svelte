<script lang="ts">
  import { NORTH_ISLAND_REGIONS, SOUTH_ISLAND_REGIONS } from '$lib/constants/regions';

  let {
    guestRegions = $bindable(),
    showRegionSelector = $bindable(),
    onToggleRegion,
    onClear,
  }: {
    guestRegions: string[];
    showRegionSelector: boolean;
    onToggleRegion: (region: string) => void;
    onClear: () => void;
  } = $props();
</script>

{#if showRegionSelector}
  <div
    class="absolute left-0 top-full z-10 mt-2 w-64 rounded-lg border border-subtle bg-surface-card p-4 shadow-lg"
  >
    <div class="mb-3 flex items-center justify-between">
      <h3 class="text-sm font-semibold text-primary">Select Regions</h3>
      {#if guestRegions.length > 0}
        <button
          onclick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          class="text-xs text-muted hover:text-accent"
        >
          Clear all
        </button>
      {/if}
    </div>

    <div class="space-y-3">
      <div>
        <div class="mb-1 flex items-center justify-between">
          <h4 class="text-xs font-medium text-secondary">North Island</h4>
          <button
            onclick={() => {
              NORTH_ISLAND_REGIONS.forEach((r) => {
                if (!guestRegions.includes(r.value)) {
                  onToggleRegion(r.value);
                }
              });
            }}
            class="text-xs text-muted hover:text-accent"
          >
            All
          </button>
        </div>
        <div class="space-y-1">
          {#each NORTH_ISLAND_REGIONS as region (region.value)}
            <label class="flex cursor-pointer items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={guestRegions.includes(region.value)}
                onchange={() => onToggleRegion(region.value)}
                class="h-3 w-3 rounded border-subtle accent-[var(--accent)]"
              />
              <span>{region.label}</span>
            </label>
          {/each}
        </div>
      </div>

      <div>
        <div class="mb-1 flex items-center justify-between">
          <h4 class="text-xs font-medium text-secondary">South Island</h4>
          <button
            onclick={() => {
              SOUTH_ISLAND_REGIONS.forEach((r) => {
                if (!guestRegions.includes(r.value)) {
                  onToggleRegion(r.value);
                }
              });
            }}
            class="text-xs text-muted hover:text-accent"
          >
            All
          </button>
        </div>
        <div class="space-y-1">
          {#each SOUTH_ISLAND_REGIONS as region (region.value)}
            <label class="flex cursor-pointer items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={guestRegions.includes(region.value)}
                onchange={() => onToggleRegion(region.value)}
                class="h-3 w-3 rounded border-subtle accent-[var(--accent)]"
              />
              <span>{region.label}</span>
            </label>
          {/each}
        </div>
      </div>
    </div>

    <p class="mt-3 text-xs text-muted">Sign up to save your region preferences</p>
  </div>
{/if}
