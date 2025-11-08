# Photo Gallery Manager & Region Mapping System

**Document Version:** 1.0
**Date:** 2025-10-29
**Status:** Specification
**Priority:** P1 - Feature Enhancement

---

## Executive Summary

This document specifies a comprehensive photo management system for Meeple Cart listings that enables:

1. **Post-creation photo management** - Upload, delete, and reorder photos after listing creation
2. **Game-to-photo region mapping** - Define areas within photos that correspond to specific games
3. **Automatic obscuring** - Blur regions when games are sold/pending
4. **Manual obscuring** - Hide portions of photos (e.g., non-listing items)

**Current State:** Photos can only be uploaded during listing creation and are immutable afterward. The `photo_regions` field exists in the database but is unused.

**Impact:** Sellers cannot manage photos effectively. Multi-game listings lack visual clarity about which game is which. Sold items remain visible in photos, creating confusion.

**Estimated Effort:** 11-16 hours across 5 implementation phases.

---

## What's Implemented ✅

### 1. Photo Upload on Creation

- **Status:** ✅ Complete
- **Location:** `src/routes/listings/new/+page.svelte`
- Upload up to 6 photos during listing creation
- Client-side preview with file size display
- Formats: PNG, JPEG, WEBP (5MB max each)
- Auto-thumbnail generation via PocketBase (100x100, 800x600)

### 2. Photo Display

- **Status:** ✅ Complete
- **Location:** `src/routes/listings/[id]/+page.svelte`
- Photo gallery with thumbnail grid
- Active photo selection
- Full-size image display (max-height: 520px)
- Lazy loading

### 3. Database Schema

- **Status:** ✅ Complete
- **Location:** `pocketbase/schema/pb_schema.json`
- `listings.photos` - File field (up to 6 images)
- `games.photo_regions` - JSON field (currently unused)
- PocketBase file storage and CDN URLs

---

## Feature Gaps (Current Limitations) ❌

### Gap 1: Post-Creation Photo Management

**Impact:** MEDIUM - Sellers cannot fix photo mistakes or update listings
**Effort:** 3-4 hours

#### What's Missing

No interface to add, remove, or reorder photos after listing is published.

#### Expected Flow

```
1. Listing owner navigates to listing detail page
2. Clicks "Manage Photos" button (owner-only)
3. Opens gallery manager at /listings/[id]/photos
4. Can perform actions:
   - Upload new photos (up to 6 total limit)
   - Delete existing photos
   - Drag-and-drop to reorder
   - Click "Edit Regions" to map games
5. Changes save immediately to PocketBase
6. Returns to listing detail page
```

#### Required Implementation

**New Page:**

- `src/routes/listings/[id]/photos/+page.svelte` - Gallery manager UI
- `src/routes/listings/[id]/photos/+page.ts` - Load listing data

**Features:**

- Photo grid with drag-and-drop reordering (using HTML5 drag API)
- Upload button (opens file picker)
- Delete button per photo (with confirmation)
- Photo count indicator (e.g., "4 / 6 photos")
- "Edit Regions" button per photo
- Save indicator (auto-save on changes)

**PocketBase Operations:**

```typescript
// Upload new photo
const formData = new FormData();
formData.append('photos', file);
await pb.collection('listings').update(listingId, formData);

// Delete photo (remove from array)
const listing = await pb.collection('listings').getOne(listingId);
const updatedPhotos = listing.photos.filter((p) => p !== photoToDelete);
await pb.collection('listings').update(listingId, { photos: updatedPhotos });

// Reorder photos (update array order)
await pb.collection('listings').update(listingId, { photos: reorderedArray });
```

**Acceptance Criteria:**

- [ ] Owner can upload additional photos (respecting 6 photo limit)
- [ ] Owner can delete photos (with "Are you sure?" confirmation)
- [ ] Owner can reorder photos via drag-and-drop
- [ ] Photo count displays correctly (e.g., "4 / 6")
- [ ] Upload button disabled when at 6 photo limit
- [ ] Changes persist to PocketBase immediately
- [ ] Non-owners cannot access page (redirect to listing detail)

---

### Gap 2: Photo Region Selection Tool

**Impact:** HIGH - Core feature for multi-game listings
**Effort:** 4-6 hours

#### What's Missing

No UI for defining regions within photos that correspond to games.

#### Expected Flow

```
1. From gallery manager, click "Edit Regions" on a photo
2. Opens PhotoRegionSelector component (modal or dedicated page)
3. Displays photo with canvas overlay
4. User selects tool mode:
   - Rectangle mode: Click-drag to draw box
   - Polygon mode: Click points to draw shape, close on first point
5. User assigns game to region (dropdown selector)
6. OR: User checks "Manual obscure" (for non-listing items)
7. Region saves to listing's photo_region_map
8. User can edit/delete existing regions
9. Click "Done" to return to gallery manager
```

#### Data Structure

**New field on listings table:**

```typescript
// Add to listings collection schema
{
  "name": "photo_region_map",
  "type": "json",
  "required": false,
  "options": {}
}
```

**Data format:**

```typescript
type PhotoRegionMap = PhotoRegion[];

interface PhotoRegion {
  id: string; // UUID
  photoId: string; // Filename of photo
  gameId: string | null; // Linked game (null for manual obscures)
  type: 'rectangle' | 'polygon';
  coordinates: RectangleCoordinates | PolygonCoordinates;
  manuallyObscured: boolean; // True if no game link
  created: string; // ISO date
  updated: string; // ISO date
}

interface RectangleCoordinates {
  x: number; // Left position (%)
  y: number; // Top position (%)
  width: number; // Width (%)
  height: number; // Height (%)
}

interface PolygonCoordinates {
  points: Array<{ x: number; y: number }>; // [x%, y%] points
}
```

**Why percentages?** Responsive - works at any image size/resolution.

#### Required Implementation

**New Component:**

- `src/lib/components/PhotoRegionSelector.svelte`

**Features:**

- Canvas-based region drawing
- Tool selector (Rectangle / Polygon radio buttons)
- **Rectangle mode:**
  - Click and drag to draw bounding box
  - Show dimensions while dragging
  - Constrain to image bounds
- **Polygon mode:**
  - Click to place points
  - Close polygon by clicking first point (or double-click anywhere)
  - Show connecting lines while drawing
  - Minimum 3 points required
- Region list (sidebar or below canvas)
  - Shows all regions for current photo
  - Each region displays: shape type, linked game name, edit/delete buttons
- Game assignment dropdown
  - Lists all games in listing
  - Option: "Manual obscure (no game)"
- Coordinate conversion utilities (pixels ↔ percentages)
- Save button (updates listing.photo_region_map)

**Canvas Implementation:**

```typescript
// Drawing rectangle
let isDrawing = false;
let startX, startY;

function onMouseDown(e: MouseEvent) {
  isDrawing = true;
  const rect = canvas.getBoundingClientRect();
  startX = e.clientX - rect.left;
  startY = e.clientY - rect.top;
}

function onMouseMove(e: MouseEvent) {
  if (!isDrawing) return;
  const rect = canvas.getBoundingClientRect();
  const currentX = e.clientX - rect.left;
  const currentY = e.clientY - rect.top;

  // Draw rectangle preview
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#34d399';
  ctx.lineWidth = 2;
  ctx.strokeRect(startX, startY, currentX - startX, currentY - startY);
}

function onMouseUp(e: MouseEvent) {
  if (!isDrawing) return;
  isDrawing = false;

  // Convert to percentages and save
  const coords = rectanglePixelsToPercent(
    startX,
    startY,
    currentX - startX,
    currentY - startY,
    canvas.width,
    canvas.height
  );

  // Create region object and add to list
}
```

**Polygon Implementation:**

```typescript
let polygonPoints: Array<{ x: number; y: number }> = [];
let isDrawingPolygon = false;

function onPolygonClick(e: MouseEvent) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // Check if clicking near first point (close polygon)
  if (polygonPoints.length >= 3) {
    const firstPoint = polygonPoints[0];
    const distance = Math.sqrt(Math.pow(x - firstPoint.x, 2) + Math.pow(y - firstPoint.y, 2));

    if (distance < 10) {
      // Close polygon
      const coords = polygonPixelsToPercent(polygonPoints, canvas.width, canvas.height);
      // Save polygon
      polygonPoints = [];
      return;
    }
  }

  // Add point
  polygonPoints.push({ x, y });
  drawPolygonPreview();
}

function drawPolygonPreview() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (polygonPoints.length === 0) return;

  ctx.beginPath();
  ctx.moveTo(polygonPoints[0].x, polygonPoints[0].y);

  for (let i = 1; i < polygonPoints.length; i++) {
    ctx.lineTo(polygonPoints[i].x, polygonPoints[i].y);
  }

  ctx.strokeStyle = '#34d399';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw points
  polygonPoints.forEach((point) => {
    ctx.fillStyle = '#34d399';
    ctx.beginPath();
    ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
    ctx.fill();
  });
}
```

**Utility Functions:**

- `src/lib/utils/photo-regions.ts` ✅ (already created)
  - `pixelsToPercent()`, `percentToPixels()`
  - `rectanglePixelsToPercent()`, `rectanglePercentToPixels()`
  - `polygonPixelsToPercent()`, `polygonPercentToPixels()`
  - `isPointInRectangle()`, `isPointInPolygon()`
  - `shouldBlurRegion()`

**Acceptance Criteria:**

- [ ] Can draw rectangular regions via click-drag
- [ ] Can draw polygon regions via point-by-point clicks
- [ ] Polygon closes when clicking first point or double-clicking
- [ ] Regions constrained to image bounds
- [ ] Can assign game to region via dropdown
- [ ] Can mark region as "manual obscure"
- [ ] Can edit existing regions (modify coordinates or game assignment)
- [ ] Can delete regions
- [ ] All coordinates stored as percentages (0-100)
- [ ] Regions save to `listing.photo_region_map` in PocketBase
- [ ] Region list shows all regions for current photo

---

### Gap 3: Region Display & Auto-Blur

**Impact:** HIGH - Visual feedback for users
**Effort:** 2-3 hours

#### What's Missing

No visual rendering of photo regions on listing detail page. No automatic blurring based on game status.

#### Expected Behavior

**On Listing Detail Page:**

1. Load `listing.photo_region_map` from PocketBase
2. For each region on the active photo:
   - Render semi-transparent overlay at region coordinates
   - Apply blur if:
     - Game status is 'sold' or 'pending', OR
     - Region.manuallyObscured is true
   - Show game name on hover
   - Highlight region on hover
3. Clicking a region scrolls to that game in the game list

**Blur Effect:**

```css
.photo-region {
  position: absolute;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.photo-region.blurred {
  backdrop-filter: blur(20px);
  background: rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 255, 255, 0.3);
}

.photo-region:not(.blurred):hover {
  border-color: #34d399;
  background: rgba(52, 211, 153, 0.1);
}

.photo-region.blurred .region-label {
  display: none;
}

.photo-region:not(.blurred) .region-label {
  position: absolute;
  bottom: 4px;
  left: 4px;
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}
```

#### Required Implementation

**New Component:**

- `src/lib/components/PhotoRegionOverlay.svelte`

**Props:**

```typescript
interface Props {
  regions: PhotoRegion[]; // All regions for this photo
  photoId: string; // Current photo filename
  games: GameRecord[]; // All games in listing
  imageWidth: number; // Actual displayed image width
  imageHeight: number; // Actual displayed image height
  onRegionClick?: (gameId: string) => void; // Callback for clicking region
}
```

**Component Logic:**

```svelte
<script lang="ts">
  import { percentToPixels, shouldBlurRegion } from '$lib/utils/photo-regions';

  let { regions, photoId, games, imageWidth, imageHeight, onRegionClick } = $props();

  // Filter regions for this photo
  const photoRegions = $derived(regions.filter((r) => r.photoId === photoId));

  // Get game status for each region
  function getGameStatus(gameId: string | null) {
    if (!gameId) return undefined;
    return games.find((g) => g.id === gameId)?.status;
  }

  function getGameName(gameId: string | null) {
    if (!gameId) return 'Manual obscure';
    return games.find((g) => g.id === gameId)?.title ?? 'Unknown game';
  }

  function handleRegionClick(region: PhotoRegion) {
    if (region.gameId && onRegionClick) {
      onRegionClick(region.gameId);
    }
  }
</script>

<div class="region-overlay-container">
  {#each photoRegions as region}
    {@const shouldBlur = shouldBlurRegion(region, getGameStatus(region.gameId))}
    {@const gameName = getGameName(region.gameId)}

    {#if region.type === 'rectangle'}
      {@const coords = region.coordinates}
      {@const pixels = rectanglePercentToPixels(coords, imageWidth, imageHeight)}

      <div
        class="photo-region"
        class:blurred={shouldBlur}
        style="
          left: {pixels.x}px;
          top: {pixels.y}px;
          width: {pixels.width}px;
          height: {pixels.height}px;
        "
        role="button"
        tabindex="0"
        onclick={() => handleRegionClick(region)}
        onkeydown={(e) => e.key === 'Enter' && handleRegionClick(region)}
      >
        {#if !shouldBlur}
          <span class="region-label">{gameName}</span>
        {/if}
      </div>
    {:else}
      {@const coords = region.coordinates}
      {@const pixels = polygonPercentToPixels(coords, imageWidth, imageHeight)}
      {@const pathData = `M ${pixels.map((p) => `${p.x},${p.y}`).join(' L ')} Z`}

      <svg
        class="polygon-region"
        class:blurred={shouldBlur}
        style="
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        "
      >
        <path
          d={pathData}
          fill={shouldBlur ? 'rgba(0,0,0,0.3)' : 'rgba(52,211,153,0.1)'}
          stroke={shouldBlur ? 'rgba(255,255,255,0.3)' : '#34d399'}
          stroke-width="2"
          style="
            pointer-events: all;
            cursor: pointer;
            filter: {shouldBlur ? 'blur(20px)' : 'none'};
          "
          onclick={() => handleRegionClick(region)}
        />
      </svg>

      {#if !shouldBlur}
        <span
          class="region-label"
          style="
            position: absolute;
            left: {pixels[0].x}px;
            top: {pixels[0].y}px;
          "
        >
          {gameName}
        </span>
      {/if}
    {/if}
  {/each}
</div>

<style>
  .region-overlay-container {
    position: relative;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .photo-region {
    position: absolute;
    border: 2px solid transparent;
    transition: all 0.2s ease;
    pointer-events: all;
    cursor: pointer;
  }

  .photo-region.blurred {
    backdrop-filter: blur(20px);
    background: rgba(0, 0, 0, 0.3);
    border-color: rgba(255, 255, 255, 0.3);
  }

  .photo-region:not(.blurred):hover {
    border-color: #34d399;
    background: rgba(52, 211, 153, 0.1);
  }

  .region-label {
    position: absolute;
    bottom: 4px;
    left: 4px;
    background: rgba(0, 0, 0, 0.8);
    color: #fff;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    pointer-events: none;
  }
</style>
```

**Integration into Listing Detail:**

Modify `src/routes/listings/[id]/+page.svelte`:

```svelte
<script lang="ts">
  import PhotoRegionOverlay from '$lib/components/PhotoRegionOverlay.svelte';

  let { data } = $props();
  let listing = $derived(data.listing);
  let games = $derived(data.games);
  let photoRegions = $derived(listing.photo_region_map ?? []);

  let photoContainerRef: HTMLElement;
  let imageWidth = $state(0);
  let imageHeight = $state(0);

  // Update dimensions when image loads
  function handleImageLoad(e: Event) {
    const img = e.target as HTMLImageElement;
    imageWidth = img.clientWidth;
    imageHeight = img.clientHeight;
  }

  // Scroll to game when region clicked
  function scrollToGame(gameId: string) {
    const gameElement = document.getElementById(`game-${gameId}`);
    gameElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
</script>

<!-- Photo gallery section -->
<div class="photo-gallery">
  <div class="photo-container" bind:this={photoContainerRef}>
    <img
      src={photos[activePhotoIndex].full}
      alt={`${listing.title} photo ${activePhotoIndex + 1}`}
      loading="lazy"
      onload={handleImageLoad}
    />

    <!-- Add region overlay -->
    {#if imageWidth > 0 && imageHeight > 0}
      <PhotoRegionOverlay
        regions={photoRegions}
        photoId={photos[activePhotoIndex].id}
        {games}
        {imageWidth}
        {imageHeight}
        onRegionClick={scrollToGame}
      />
    {/if}
  </div>
</div>

<!-- Game list -->
{#each games as game}
  <div id="game-{game.id}" class="game-card">
    <!-- existing game display -->
  </div>
{/each}
```

**Acceptance Criteria:**

- [ ] Regions display as overlays on photos
- [ ] Rectangular regions render with correct position/size
- [ ] Polygon regions render with correct shape
- [ ] Regions automatically blur when game status is 'sold' or 'pending'
- [ ] Manually obscured regions always blur
- [ ] Non-blurred regions show game name on hover
- [ ] Clicking region scrolls to corresponding game in list
- [ ] Regions update when switching between photos
- [ ] Responsive - regions scale with image size

---

### Gap 4: Integration & Navigation

**Impact:** MEDIUM - Discoverability
**Effort:** 1 hour

#### What's Missing

No links or navigation to the photo gallery manager from existing pages.

#### Expected Flow

**From Listing Detail Page (Owner View):**

```
1. Owner views their own listing
2. Sees "Manage Photos" button next to "Edit prices" and "Manage games"
3. Clicks button → navigates to /listings/[id]/photos
```

**From Listing Creation:**

```
Option A: Inline during creation
1. User uploads photos in create form
2. Below photos, link: "Map games to photos (optional)"
3. Opens PhotoRegionSelector in modal
4. User can map regions before publishing

Option B: After creation
1. User publishes listing
2. Success message shows: "Listing created! [Manage Photos]"
3. Link goes to /listings/[id]/photos
```

#### Required Implementation

**Modify:** `src/routes/listings/[id]/+page.svelte`

Add button in owner actions section:

```svelte
{#if $currentUser && $currentUser.id === listing.owner}
  <div class="owner-actions">
    <a href="/listings/{listing.id}/edit" class="btn-secondary"> Edit prices </a>
    <a href="/listings/{listing.id}/manage" class="btn-secondary"> Manage games </a>
    <a href="/listings/{listing.id}/photos" class="btn-secondary"> Manage photos </a>
  </div>
{/if}
```

**Modify:** `src/routes/listings/new/+page.svelte` (Optional)

Add link after successful creation:

```svelte
{#if createdListingId}
  <div class="success-message">
    <p>Listing created successfully!</p>
    <div class="actions">
      <a href="/listings/{createdListingId}">View listing</a>
      <a href="/listings/{createdListingId}/photos">Manage photos</a>
    </div>
  </div>
{/if}
```

**Acceptance Criteria:**

- [ ] "Manage Photos" button visible to listing owner on detail page
- [ ] Button not visible to non-owners
- [ ] Button navigates to `/listings/[id]/photos`
- [ ] (Optional) Link to photo manager after listing creation

---

## Database Schema Changes

### New Field: listings.photo_region_map

**Migration Required:** Yes

**SQL Migration:**

```sql
-- Add photo_region_map field to listings collection
-- This is a JSON field that stores an array of PhotoRegion objects

ALTER TABLE listings ADD COLUMN photo_region_map JSON;
```

**PocketBase Schema Update:**

```json
{
  "id": "photo_region_map_field",
  "name": "photo_region_map",
  "type": "json",
  "required": false,
  "unique": false,
  "options": {}
}
```

**Default Value:** `[]` (empty array)

**Data Format:**

```json
[
  {
    "id": "uuid-1",
    "photoId": "photo_filename.jpg",
    "gameId": "game_record_id",
    "type": "rectangle",
    "coordinates": {
      "x": 10.5,
      "y": 15.2,
      "width": 25.8,
      "height": 30.4
    },
    "manuallyObscured": false,
    "created": "2025-10-29T12:00:00.000Z",
    "updated": "2025-10-29T12:00:00.000Z"
  },
  {
    "id": "uuid-2",
    "photoId": "photo_filename.jpg",
    "gameId": null,
    "type": "polygon",
    "coordinates": {
      "points": [
        { "x": 50.0, "y": 20.0 },
        { "x": 60.0, "y": 20.0 },
        { "x": 60.0, "y": 40.0 },
        { "x": 50.0, "y": 40.0 }
      ]
    },
    "manuallyObscured": true,
    "created": "2025-10-29T12:05:00.000Z",
    "updated": "2025-10-29T12:05:00.000Z"
  }
]
```

---

## TypeScript Type Definitions

### New Types

**Files to create:**

- ✅ `src/lib/types/photo-region.ts` (already created)

**Types defined:**

```typescript
export type RegionType = 'rectangle' | 'polygon';

export interface RectangleCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PolygonCoordinates {
  points: Array<{ x: number; y: number }>;
}

export type RegionCoordinates = RectangleCoordinates | PolygonCoordinates;

export interface PhotoRegion {
  id: string;
  photoId: string;
  gameId: string | null;
  type: RegionType;
  coordinates: RegionCoordinates;
  manuallyObscured: boolean;
  created: string;
  updated: string;
}
```

### Update Existing Types

**Modify:** `src/lib/types/pocketbase.ts`

Add to `ListingRecord`:

```typescript
export interface ListingRecord {
  // ... existing fields
  photo_region_map?: PhotoRegion[]; // Add this
}
```

---

## Testing Plan

### Unit Tests

**File:** `src/lib/utils/photo-regions.test.ts`

Test cases:

- [ ] `pixelsToPercent()` converts correctly
- [ ] `percentToPixels()` converts correctly
- [ ] `rectanglePixelsToPercent()` handles edge cases
- [ ] `rectanglePercentToPixels()` handles edge cases
- [ ] `polygonPixelsToPercent()` handles multiple points
- [ ] `polygonPercentToPixels()` handles multiple points
- [ ] `isPointInRectangle()` detects containment correctly
- [ ] `isPointInPolygon()` detects containment correctly (ray casting)
- [ ] `shouldBlurRegion()` returns true for sold/pending games
- [ ] `shouldBlurRegion()` returns true for manually obscured regions
- [ ] `validateRegionCoordinates()` rejects out-of-bounds coordinates

### Integration Tests

**File:** `tests/e2e/photo-gallery.spec.ts`

Test scenarios:

- [ ] Owner can access photo gallery manager
- [ ] Non-owner cannot access photo gallery manager
- [ ] Owner can upload new photo
- [ ] Owner can delete photo
- [ ] Owner can reorder photos via drag-drop
- [ ] Owner can open region selector for photo
- [ ] Owner can draw rectangular region
- [ ] Owner can draw polygon region
- [ ] Owner can assign game to region
- [ ] Owner can mark region as manually obscured
- [ ] Owner can edit existing region
- [ ] Owner can delete region
- [ ] Regions display correctly on listing detail page
- [ ] Regions blur when game status changes to sold
- [ ] Clicking region scrolls to game

### Manual Testing Checklist

**Photo Management:**

- [ ] Upload photo at 6 photo limit (should show error/disable button)
- [ ] Delete all photos (should show "No photos" message)
- [ ] Drag-drop photo order (should persist after page reload)
- [ ] Upload very large image (>5MB - should show error)
- [ ] Upload unsupported format (.gif - should show error)

**Region Selection:**

- [ ] Draw rectangle that exceeds image bounds (should constrain)
- [ ] Draw polygon with <3 points (should not allow save)
- [ ] Draw overlapping regions (should allow)
- [ ] Assign same game to multiple regions (should allow)
- [ ] Leave region without game assignment (should require or default to manual obscure)
- [ ] Edit region coordinates (should update correctly)
- [ ] Delete region with associated game (should not affect game record)

**Region Display:**

- [ ] View listing with no regions (should show photos normally)
- [ ] View listing with rectangular regions (should display overlays)
- [ ] View listing with polygon regions (should display correct shapes)
- [ ] Change game status to 'sold' (region should blur automatically)
- [ ] Change game status back to 'available' (region should unblur)
- [ ] Hover over region (should highlight and show game name)
- [ ] Click region (should scroll to game)
- [ ] Resize browser window (regions should scale proportionally)

**Permissions:**

- [ ] Try to access /listings/[id]/photos as non-owner (should redirect)
- [ ] Try to access /listings/[id]/photos when not logged in (should redirect to login)

---

## Performance Considerations

### Image Loading

- Use PocketBase thumbnail URLs for gallery grid (faster loading)
- Use full URLs only for active photo display
- Lazy load images in gallery manager
- Consider image optimization (compress before upload)

### Region Rendering

- Limit to 20 regions per photo (prevent performance issues)
- Use CSS transforms for positioning (GPU-accelerated)
- Debounce region updates during dragging
- Cache converted coordinates (pixels ↔ percentages)

### Data Storage

- Store coordinates as percentages (smaller JSON payload)
- Index `photo_region_map` field if querying frequently
- Consider separate collection if region count grows large (unlikely)

---

## Accessibility

### Keyboard Navigation

- Photo gallery manager:
  - Tab through photos
  - Space/Enter to select photo
  - Arrow keys for reordering
- Region selector:
  - Tab to tool selector
  - Enter to switch modes
  - Tab to region list
  - Delete key to remove selected region

### Screen Readers

- Add ARIA labels to region overlays
- Announce region type and linked game
- Provide text alternative for blurred regions

### Focus Management

- Focus "Edit Regions" button after drawing region
- Focus "Save" button after editing region
- Return focus to triggering element after modal close

---

## Mobile Responsiveness

### Touch Support

- Replace click-drag with touch-drag for rectangles
- Replace click points with tap points for polygons
- Increase touch target size (min 44x44px)
- Add pinch-zoom for precise region selection

### Layout Adjustments

- Stack photo grid vertically on mobile
- Full-width photos on small screens
- Floating action buttons for upload/delete
- Bottom sheet for region selector (not modal)

---

## Future Enhancements

**Not in scope for initial implementation:**

1. **Region Templates**
   - Pre-defined region layouts (e.g., "4 games in grid")
   - Save custom templates for reuse

2. **Bulk Region Assignment**
   - Select multiple photos
   - Assign same region layout to all

3. **AI-Assisted Region Detection**
   - Upload photo
   - AI detects game boxes and suggests regions
   - User confirms or adjusts

4. **Photo Editing**
   - Crop, rotate, adjust brightness
   - Apply filters
   - Annotate with text/arrows

5. **Region Analytics**
   - Track region clicks
   - Heatmap of most-viewed regions
   - Optimize photo order based on engagement

6. **Advanced Blur Options**
   - Pixelation instead of blur
   - Custom blur intensity
   - Animated blur on hover

---

## Implementation Order

### Phase 1: Foundation (2 hours)

1. ✅ Create type definitions (`photo-region.ts`)
2. ✅ Create utility functions (`photo-regions.ts`)
3. Add database field (`photo_region_map` to listings)
4. Update PocketBase schema
5. Write unit tests for utilities

### Phase 2: Photo Gallery Manager (3-4 hours)

1. Create page route (`/listings/[id]/photos`)
2. Build photo grid UI
3. Implement photo upload
4. Implement photo delete
5. Implement drag-drop reordering
6. Add "Edit Regions" button per photo

### Phase 3: Region Selection Tool (4-6 hours)

1. Create `PhotoRegionSelector` component
2. Implement canvas overlay
3. Implement rectangle drawing mode
4. Implement polygon drawing mode
5. Implement game assignment dropdown
6. Implement region list (edit/delete)
7. Implement save to PocketBase

### Phase 4: Region Display & Blur (2-3 hours)

1. Create `PhotoRegionOverlay` component
2. Render rectangular regions
3. Render polygon regions
4. Implement blur logic (auto-blur on game status)
5. Implement hover effects
6. Implement click-to-scroll
7. Update listing detail page

### Phase 5: Integration (1 hour)

1. Add "Manage Photos" button to listing detail
2. Add permission checks (owner-only)
3. (Optional) Add link after listing creation
4. Write integration tests
5. Manual testing

---

## File Summary

### New Files (9)

1. ✅ `src/lib/types/photo-region.ts` - Type definitions
2. ✅ `src/lib/utils/photo-regions.ts` - Utility functions
3. `src/routes/listings/[id]/photos/+page.svelte` - Gallery manager UI
4. `src/routes/listings/[id]/photos/+page.ts` - Gallery manager data loader
5. `src/lib/components/PhotoRegionSelector.svelte` - Region drawing tool
6. `src/lib/components/PhotoRegionOverlay.svelte` - Region display overlay
7. `src/lib/utils/photo-regions.test.ts` - Unit tests
8. `tests/e2e/photo-gallery.spec.ts` - E2E tests
9. `pocketbase/pb_migrations/0006_add_photo_region_map.js` - Database migration

### Modified Files (3)

1. `src/routes/listings/[id]/+page.svelte` - Add region overlay + manage button
2. `src/routes/listings/[id]/+page.ts` - Load photo regions
3. `src/lib/types/pocketbase.ts` - Add `photo_region_map` to ListingRecord

---

## Open Questions

1. **Region limit:** Should we limit regions per photo? (Suggested: 10-20)
2. **Preview mode:** Should gallery manager show blurred preview?
3. **Undo/Redo:** Should region selector have undo/redo for drawings?
4. **Region validation:** Should we prevent overlapping regions?
5. **Mobile priority:** Should we build mobile-first or desktop-first?

---

## Success Metrics

**Adoption:**

- % of listings with photos
- % of multi-game listings using regions
- Average regions per photo

**Engagement:**

- Click-through rate on regions
- Time spent on listings with regions vs without
- User feedback on clarity

**Quality:**

- % of regions linked to games (vs manual obscures)
- % of sold games with blurred regions
- Error rate during region creation

---

**Document Status:** Complete and ready for implementation approval.
