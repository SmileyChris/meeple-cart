<script lang="ts">
  import type { PhotoRegion } from '$lib/types/photo-region';
  import type { GameRecord, ListingRecord } from '$lib/types/listing';
  import { createRectangleRegion, createPolygonRegion, isRectangleCoordinates, isPolygonCoordinates } from '$lib/types/photo-region';
  import {
    rectanglePixelsToPercent,
    rectanglePercentToPixels,
    polygonPixelsToPercent,
    polygonPercentToPixels,
  } from '$lib/utils/photo-regions';
  import { pb } from '$lib/pocketbase';

  interface Props {
    photoUrl: string;
    photoFilename: string;
    listing: ListingRecord;
    games: GameRecord[];
    existingRegions?: PhotoRegion[];
    onClose: () => void;
    onSave: (regions: PhotoRegion[]) => Promise<void>;
  }

  let {
    photoUrl,
    photoFilename,
    listing,
    games,
    existingRegions = [],
    onClose,
    onSave,
  }: Props = $props();

  // Canvas and image references
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null = null;
  let imageElement: HTMLImageElement;
  let containerRef: HTMLDivElement;

  // Image dimensions
  let imageWidth = $state(0);
  let imageHeight = $state(0);
  let imageLoaded = $state(false);

  // Drawing mode
  type DrawMode = 'rectangle' | 'polygon';
  let drawMode = $state<DrawMode>('rectangle');

  // Rectangle drawing state
  let isDrawingRect = $state(false);
  let rectStartX = $state(0);
  let rectStartY = $state(0);
  let rectCurrentX = $state(0);
  let rectCurrentY = $state(0);

  // Polygon drawing state
  let isDrawingPolygon = $state(false);
  let polygonPoints = $state<Array<{ x: number; y: number }>>([]);

  // Regions
  let regions = $state<PhotoRegion[]>([...existingRegions.filter(r => r.photoId === photoFilename)]);
  let selectedRegionId = $state<string | null>(null);
  let editingRegionId = $state<string | null>(null);

  // Form state for new region
  let selectedGameId = $state<string | null>(null);
  let manualObscure = $state(false);

  // Saving state
  let saving = $state(false);
  let saveError = $state<string | null>(null);

  // Initialize canvas when image loads
  function handleImageLoad() {
    if (!imageElement || !containerRef) return;

    imageWidth = imageElement.clientWidth;
    imageHeight = imageElement.clientHeight;

    // Set canvas size to match displayed image
    if (canvas) {
      canvas.width = imageWidth;
      canvas.height = imageHeight;
      ctx = canvas.getContext('2d');
    }

    imageLoaded = true;
    redrawCanvas();
  }

  // Redraw all regions on canvas
  function redrawCanvas() {
    if (!ctx || !canvas) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw existing regions
    for (const region of regions) {
      const isSelected = region.id === selectedRegionId;
      drawRegion(region, isSelected);
    }

    // Draw current drawing
    if (isDrawingRect) {
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        rectStartX,
        rectStartY,
        rectCurrentX - rectStartX,
        rectCurrentY - rectStartY
      );
    } else if (isDrawingPolygon && polygonPoints.length > 0) {
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(polygonPoints[0].x, polygonPoints[0].y);

      for (let i = 1; i < polygonPoints.length; i++) {
        ctx.lineTo(polygonPoints[i].x, polygonPoints[i].y);
      }

      ctx.stroke();

      // Draw points
      for (const point of polygonPoints) {
        ctx.fillStyle = '#34d399';
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw closing indicator on first point
      if (polygonPoints.length >= 3) {
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(polygonPoints[0].x, polygonPoints[0].y, 8, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  // Draw a region
  function drawRegion(region: PhotoRegion, isSelected: boolean) {
    if (!ctx) return;

    const color = isSelected ? '#34d399' : '#94a3b8';
    const lineWidth = isSelected ? 3 : 2;

    if (isRectangleCoordinates(region.coordinates)) {
      const pixels = rectanglePercentToPixels(region.coordinates, imageWidth, imageHeight);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.strokeRect(pixels.x, pixels.y, pixels.width, pixels.height);

      // Fill with semi-transparent color
      ctx.fillStyle = isSelected ? 'rgba(52, 211, 153, 0.1)' : 'rgba(148, 163, 184, 0.05)';
      ctx.fillRect(pixels.x, pixels.y, pixels.width, pixels.height);
    } else if (isPolygonCoordinates(region.coordinates)) {
      const pixels = polygonPercentToPixels(region.coordinates, imageWidth, imageHeight);

      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(pixels[0].x, pixels[0].y);

      for (let i = 1; i < pixels.length; i++) {
        ctx.lineTo(pixels[i].x, pixels[i].y);
      }

      ctx.closePath();
      ctx.stroke();

      // Fill with semi-transparent color
      ctx.fillStyle = isSelected ? 'rgba(52, 211, 153, 0.1)' : 'rgba(148, 163, 184, 0.05)';
      ctx.fill();
    }
  }

  // Mouse event handlers for rectangle drawing
  function handleMouseDown(e: MouseEvent) {
    if (!canvas || drawMode !== 'rectangle') return;

    const rect = canvas.getBoundingClientRect();
    rectStartX = e.clientX - rect.left;
    rectStartY = e.clientY - rect.top;
    isDrawingRect = true;
  }

  function handleMouseMove(e: MouseEvent) {
    if (!canvas) return;

    if (isDrawingRect && drawMode === 'rectangle') {
      const rect = canvas.getBoundingClientRect();
      rectCurrentX = Math.max(0, Math.min(e.clientX - rect.left, canvas.width));
      rectCurrentY = Math.max(0, Math.min(e.clientY - rect.top, canvas.height));
      redrawCanvas();
    }
  }

  function handleMouseUp(e: MouseEvent) {
    if (!canvas || !isDrawingRect || drawMode !== 'rectangle') return;

    const rect = canvas.getBoundingClientRect();
    const endX = Math.max(0, Math.min(e.clientX - rect.left, canvas.width));
    const endY = Math.max(0, Math.min(e.clientY - rect.top, canvas.height));

    const width = Math.abs(endX - rectStartX);
    const height = Math.abs(endY - rectStartY);

    // Only create region if it's big enough (at least 20x20 pixels)
    if (width > 20 && height > 20) {
      const x = Math.min(rectStartX, endX);
      const y = Math.min(rectStartY, endY);

      const coords = rectanglePixelsToPercent(x, y, width, height, imageWidth, imageHeight);
      const newRegion = createRectangleRegion(photoFilename, coords, selectedGameId);
      newRegion.manuallyObscured = manualObscure;

      regions = [...regions, newRegion];
      selectedRegionId = newRegion.id;
    }

    isDrawingRect = false;
    redrawCanvas();
  }

  // Click handler for polygon drawing
  function handleCanvasClick(e: MouseEvent) {
    if (!canvas || drawMode !== 'polygon') return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking near first point to close polygon
    if (polygonPoints.length >= 3) {
      const firstPoint = polygonPoints[0];
      const distance = Math.sqrt(Math.pow(x - firstPoint.x, 2) + Math.pow(y - firstPoint.y, 2));

      if (distance < 15) {
        // Close polygon
        const coords = polygonPixelsToPercent(polygonPoints, imageWidth, imageHeight);
        const newRegion = createPolygonRegion(photoFilename, coords, selectedGameId);
        newRegion.manuallyObscured = manualObscure;

        regions = [...regions, newRegion];
        selectedRegionId = newRegion.id;
        polygonPoints = [];
        isDrawingPolygon = false;
        redrawCanvas();
        return;
      }
    }

    // Add point
    polygonPoints = [...polygonPoints, { x, y }];
    isDrawingPolygon = true;
    redrawCanvas();
  }

  // Cancel current drawing
  function cancelDrawing() {
    isDrawingRect = false;
    isDrawingPolygon = false;
    polygonPoints = [];
    redrawCanvas();
  }

  // Delete a region
  function deleteRegion(regionId: string) {
    regions = regions.filter((r) => r.id !== regionId);
    if (selectedRegionId === regionId) {
      selectedRegionId = null;
    }
    redrawCanvas();
  }

  // Select a region
  function selectRegion(regionId: string) {
    selectedRegionId = regionId;
    redrawCanvas();
  }

  // Update region's game assignment
  function updateRegionGame(regionId: string, gameId: string | null, isManual: boolean) {
    regions = regions.map((r) => {
      if (r.id === regionId) {
        return {
          ...r,
          gameId,
          manuallyObscured: isManual,
          updated: new Date().toISOString(),
        };
      }
      return r;
    });
    redrawCanvas();
  }

  // Save regions to database
  async function handleSave() {
    saving = true;
    saveError = null;

    try {
      // Get all regions for this listing (including other photos)
      const otherPhotoRegions = existingRegions.filter((r) => r.photoId !== photoFilename);

      // Combine with current photo's regions
      const allRegions = [...otherPhotoRegions, ...regions];

      // Update listing
      await pb.collection('listings').update(listing.id, {
        photo_region_map: allRegions,
      });

      await onSave(allRegions);
      onClose();
    } catch (err) {
      console.error('Error saving regions:', err);
      saveError = 'Failed to save regions. Please try again.';
      saving = false;
    }
  }

  // Get game name
  function getGameName(gameId: string | null): string {
    if (!gameId) return 'Manual obscure';
    const game = games.find((g) => g.id === gameId);
    return game?.title ?? 'Unknown game';
  }

  // React to mode changes
  $effect(() => {
    cancelDrawing();
  });

  // Redraw when regions change
  $effect(() => {
    regions;
    selectedRegionId;
    redrawCanvas();
  });
</script>

<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
  <div class="max-h-[90vh] w-full max-w-7xl overflow-y-auto rounded-xl border border-subtle bg-surface-card">
    <!-- Header -->
    <div class="sticky top-0 z-10 border-b border-subtle bg-surface-card p-6">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-semibold text-primary">Edit Photo Regions</h2>
        <button
          class="rounded-lg border border-subtle px-4 py-2 text-sm text-secondary transition hover:border-accent hover:text-accent"
          onclick={onClose}
        >
          Cancel
        </button>
      </div>

      <!-- Tool selector -->
      <div class="mt-4 flex gap-4">
        <label class="flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name="drawMode"
            value="rectangle"
            checked={drawMode === 'rectangle'}
            onchange={() => (drawMode = 'rectangle')}
            class="h-4 w-4"
          />
          <span class="text-sm text-secondary">Rectangle</span>
        </label>
        <label class="flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name="drawMode"
            value="polygon"
            checked={drawMode === 'polygon'}
            onchange={() => (drawMode = 'polygon')}
            class="h-4 w-4"
          />
          <span class="text-sm text-secondary">Polygon</span>
        </label>

        {#if isDrawingPolygon || isDrawingRect}
          <button
            class="ml-auto rounded-lg border border-rose-500 bg-rose-500/10 px-3 py-1 text-sm text-rose-300 transition hover:bg-rose-500/20"
            onclick={cancelDrawing}
          >
            Cancel Drawing
          </button>
        {/if}
      </div>

      <!-- Game assignment -->
      <div class="mt-4 flex flex-wrap gap-4">
        <div class="flex-1">
          <label class="block text-sm font-medium text-secondary" for="game-select">
            Assign to game:
          </label>
          <select
            id="game-select"
            class="mt-1 w-full rounded-lg border border-subtle bg-surface-body px-3 py-2 text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
            bind:value={selectedGameId}
          >
            <option value={null}>-- Select a game --</option>
            {#each games as game}
              <option value={game.id}>{game.title}</option>
            {/each}
          </select>
        </div>

        <div class="flex items-end">
          <label class="flex cursor-pointer items-center gap-2">
            <input type="checkbox" class="h-4 w-4" bind:checked={manualObscure} />
            <span class="text-sm text-secondary">Manual obscure (no game)</span>
          </label>
        </div>
      </div>

      <!-- Instructions -->
      <div class="mt-4 rounded-lg bg-surface-body p-3 text-xs text-muted">
        {#if drawMode === 'rectangle'}
          <strong>Rectangle mode:</strong> Click and drag to draw a box around a game.
        {:else}
          <strong>Polygon mode:</strong> Click to place points. Click the first point again (or get close)
          to complete the shape. Need at least 3 points.
        {/if}
      </div>
    </div>

    <!-- Main content -->
    <div class="grid gap-6 p-6 lg:grid-cols-[1fr_320px]">
      <!-- Image with canvas overlay -->
      <div class="space-y-4">
        <div bind:this={containerRef} class="relative">
          <img
            bind:this={imageElement}
            src={photoUrl}
            alt="Photo to annotate"
            class="w-full rounded-lg"
            onload={handleImageLoad}
          />

          {#if imageLoaded}
            <canvas
              bind:this={canvas}
              class="absolute left-0 top-0 cursor-crosshair"
              onmousedown={handleMouseDown}
              onmousemove={handleMouseMove}
              onmouseup={handleMouseUp}
              onclick={handleCanvasClick}
              style="width: {imageWidth}px; height: {imageHeight}px;"
            />
          {/if}
        </div>
      </div>

      <!-- Region list -->
      <div class="space-y-4">
        <h3 class="text-lg font-semibold text-primary">
          Regions ({regions.length})
        </h3>

        {#if regions.length === 0}
          <p class="text-sm text-muted">No regions yet. Draw one to get started!</p>
        {:else}
          <div class="space-y-3">
            {#each regions as region}
              {@const gameName = getGameName(region.gameId)}
              <div
                class="cursor-pointer rounded-lg border p-3 transition"
                class:border-accent={selectedRegionId === region.id}
                class:bg-accent/5={selectedRegionId === region.id}
                class:border-subtle={selectedRegionId !== region.id}
                onclick={() => selectRegion(region.id)}
                role="button"
                tabindex="0"
              >
                <div class="mb-2 flex items-start justify-between">
                  <div>
                    <p class="text-sm font-medium text-primary">
                      {region.type === 'rectangle' ? '□' : '⬡'} {gameName}
                    </p>
                    <p class="text-xs text-muted">
                      {region.type} · {region.manuallyObscured ? 'Manual obscure' : 'Linked to game'}
                    </p>
                  </div>

                  <button
                    class="text-rose-300 transition hover:text-rose-200"
                    onclick={(e) => {
                      e.stopPropagation();
                      deleteRegion(region.id);
                    }}
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <!-- Edit game assignment -->
                <div class="mt-2 space-y-2">
                  <select
                    class="w-full rounded border border-subtle bg-surface-body px-2 py-1 text-xs text-primary"
                    value={region.gameId ?? ''}
                    onchange={(e) => {
                      const target = e.target as HTMLSelectElement;
                      const gameId = target.value || null;
                      updateRegionGame(region.id, gameId, gameId === null);
                    }}
                  >
                    <option value="">Manual obscure</option>
                    {#each games as game}
                      <option value={game.id}>{game.title}</option>
                    {/each}
                  </select>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <!-- Footer -->
    <div class="sticky bottom-0 border-t border-subtle bg-surface-card p-6">
      {#if saveError}
        <p class="mb-4 text-sm text-rose-300">{saveError}</p>
      {/if}

      <div class="flex justify-end gap-4">
        <button
          class="rounded-lg border border-subtle px-6 py-2 text-sm text-secondary transition hover:border-accent hover:text-accent"
          onclick={onClose}
          disabled={saving}
        >
          Cancel
        </button>
        <button
          class="rounded-lg bg-accent px-6 py-2 font-semibold text-[var(--accent-contrast)] transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
          onclick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Regions'}
        </button>
      </div>
    </div>
  </div>
</div>
