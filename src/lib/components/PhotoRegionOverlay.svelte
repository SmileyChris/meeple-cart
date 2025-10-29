<script lang="ts">
  import type { PhotoRegion } from '$lib/types/photo-region';
  import type { GameRecord } from '$lib/types/listing';
  import {
    rectanglePercentToPixels,
    polygonPercentToPixels,
    shouldBlurRegion,
    getRegionsForPhoto,
    isPointInRectangle,
    isPointInPolygon,
  } from '$lib/utils/photo-regions';
  import { isRectangleCoordinates, isPolygonCoordinates } from '$lib/types/photo-region';

  interface Props {
    regions: PhotoRegion[];
    photoId: string;
    games: GameRecord[];
    imageWidth: number;
    imageHeight: number;
    onRegionClick?: (gameId: string) => void;
  }

  let { regions, photoId, games, imageWidth, imageHeight, onRegionClick }: Props = $props();

  // Filter regions for this specific photo
  const photoRegions = $derived(getRegionsForPhoto(regions, photoId));

  // Get game status for a region
  function getGameStatus(gameId: string | null): GameRecord['status'] | undefined {
    if (!gameId) return undefined;
    return games.find((g) => g.id === gameId)?.status;
  }

  // Get game name for a region
  function getGameName(gameId: string | null): string {
    if (!gameId) return 'Obscured';
    const game = games.find((g) => g.id === gameId);
    return game?.title ?? 'Unknown';
  }

  // Handle region click
  function handleRegionClick(region: PhotoRegion) {
    if (region.gameId && onRegionClick) {
      onRegionClick(region.gameId);
    }
  }

  // Handle keyboard interaction
  function handleRegionKeydown(event: KeyboardEvent, region: PhotoRegion) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleRegionClick(region);
    }
  }
</script>

{#if photoRegions.length > 0}
  <div class="pointer-events-none absolute inset-0">
    {#each photoRegions as region (region.id)}
      {@const gameName = getGameName(region.gameId)}
      {@const gameStatus = getGameStatus(region.gameId)}
      {@const shouldBlur = shouldBlurRegion(region, gameStatus)}

      {#if isRectangleCoordinates(region.coordinates)}
        {@const pixels = rectanglePercentToPixels(region.coordinates, imageWidth, imageHeight)}

        <div
          class="pointer-events-auto absolute cursor-pointer border-2 transition-all duration-200"
          class:region-blurred={shouldBlur}
          class:region-normal={!shouldBlur}
          style="
            left: {pixels.x}px;
            top: {pixels.y}px;
            width: {pixels.width}px;
            height: {pixels.height}px;
          "
          role="button"
          tabindex="0"
          onclick={() => handleRegionClick(region)}
          onkeydown={(e) => handleRegionKeydown(e, region)}
        >
          {#if !shouldBlur}
            <span class="region-label">
              {gameName}
            </span>
          {/if}
        </div>
      {:else if isPolygonCoordinates(region.coordinates)}
        {@const pixels = polygonPercentToPixels(region.coordinates, imageWidth, imageHeight)}
        {@const pathData = `M ${pixels.map((p) => `${p.x},${p.y}`).join(' L ')} Z`}

        <!-- SVG overlay for polygon -->
        <svg
          class="pointer-events-auto absolute left-0 top-0 h-full w-full"
          style="width: {imageWidth}px; height: {imageHeight}px;"
        >
          <!-- Define filter for blur effect -->
          {#if shouldBlur}
            <defs>
              <filter id="blur-filter-{region.id}">
                <feGaussianBlur in="SourceGraphic" stdDeviation="20" />
              </filter>
            </defs>
          {/if}

          <!-- Polygon path -->
          <path
            d={pathData}
            class="cursor-pointer stroke-2 transition-all duration-200"
            class:polygon-blurred={shouldBlur}
            class:polygon-normal={!shouldBlur}
            role="button"
            tabindex="0"
            onclick={() => handleRegionClick(region)}
            onkeydown={(e) => handleRegionKeydown(e, region)}
          />

          <!-- Label for non-blurred polygons -->
          {#if !shouldBlur && pixels.length > 0}
            <text
              x={pixels[0].x + 8}
              y={pixels[0].y + 20}
              class="pointer-events-none text-xs font-medium"
              fill="white"
              style="text-shadow: 0 1px 3px rgba(0,0,0,0.8);"
            >
              {gameName}
            </text>
          {/if}
        </svg>
      {/if}
    {/each}
  </div>
{/if}

<style>
  /* Rectangle regions - normal state */
  .region-normal {
    border-color: transparent;
    background: transparent;
  }

  .region-normal:hover {
    border-color: rgb(52, 211, 153);
    background: rgba(52, 211, 153, 0.1);
  }

  /* Rectangle regions - blurred state */
  .region-blurred {
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    background: rgba(0, 0, 0, 0.5);
    border-color: rgba(255, 255, 255, 0.3);
    cursor: default;
  }

  /* Polygon regions - normal state */
  .polygon-normal {
    fill: transparent;
    stroke: transparent;
  }

  .polygon-normal:hover {
    fill: rgba(52, 211, 153, 0.1);
    stroke: rgb(52, 211, 153);
  }

  /* Polygon regions - blurred state */
  .polygon-blurred {
    fill: rgba(0, 0, 0, 0.5);
    stroke: rgba(255, 255, 255, 0.3);
    filter: url(#blur-filter);
    cursor: default;
  }

  /* Label styling */
  .region-label {
    position: absolute;
    bottom: 4px;
    left: 4px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
    pointer-events: none;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  }

  /* Focus styles for accessibility */
  [role='button']:focus-visible {
    outline: 2px solid rgb(52, 211, 153);
    outline-offset: 2px;
  }
</style>
