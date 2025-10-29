<script lang="ts">
  import type { PageData } from './$types';
  import type { PhotoRegion } from '$lib/types/photo-region';
  import { pb } from '$lib/pocketbase';
  import { goto } from '$app/navigation';
  import PhotoRegionSelector from '$lib/components/PhotoRegionSelector.svelte';

  let { data }: { data: PageData } = $props();

  let listing = $derived(data.listing);
  let games = $derived(data.games);
  let photos = $state(data.photos);

  let uploading = $state(false);
  let uploadError = $state<string | null>(null);
  let deleting = $state<string | null>(null);
  let saving = $state(false);

  // Region editor state
  let editingPhotoFilename = $state<string | null>(null);
  let editingPhotoUrl = $state<string | null>(null);
  let photoRegions = $state<PhotoRegion[]>(listing.photo_region_map ?? []);

  // Drag and drop state
  let draggedIndex = $state<number | null>(null);
  let dragOverIndex = $state<number | null>(null);

  const maxPhotos = 6;
  const remainingSlots = $derived(maxPhotos - photos.length);
  const canUploadMore = $derived(photos.length < maxPhotos);

  // File input ref
  let fileInput: HTMLInputElement;

  function openFileSelector() {
    fileInput?.click();
  }

  async function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (!files || files.length === 0) return;

    // Check if upload would exceed limit
    if (photos.length + files.length > maxPhotos) {
      uploadError = `Can only upload ${remainingSlots} more photo${remainingSlots !== 1 ? 's' : ''}`;
      input.value = '';
      return;
    }

    uploading = true;
    uploadError = null;

    try {
      const formData = new FormData();

      // Add existing photos
      for (const photo of photos) {
        formData.append('photos', photo.filename);
      }

      // Add new photos
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file type
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
          uploadError = `Invalid file type: ${file.name}. Only PNG, JPEG, and WEBP are supported.`;
          input.value = '';
          uploading = false;
          return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
          uploadError = `File too large: ${file.name}. Maximum size is 5MB.`;
          input.value = '';
          uploading = false;
          return;
        }

        formData.append('photos', file);
      }

      // Update listing with new photos
      const updatedListing = await pb.collection('listings').update(listing.id, formData);

      // Regenerate photo URLs
      photos = Array.isArray(updatedListing.photos)
        ? updatedListing.photos.map((photo) => ({
            id: photo,
            filename: photo,
            full: pb.files.getUrl(updatedListing, photo).toString(),
            thumb: pb.files.getUrl(updatedListing, photo, { thumb: '400x300' }).toString(),
          }))
        : [];

      input.value = '';
    } catch (err) {
      console.error('Error uploading photos:', err);
      uploadError = 'Failed to upload photos. Please try again.';
    } finally {
      uploading = false;
    }
  }

  async function handleDeletePhoto(photoFilename: string) {
    const confirmed = confirm('Are you sure you want to delete this photo?');
    if (!confirmed) return;

    deleting = photoFilename;

    try {
      // Remove photo from array
      const updatedPhotos = photos.filter((p) => p.filename !== photoFilename).map((p) => p.filename);

      // Update listing
      const formData = new FormData();
      for (const photo of updatedPhotos) {
        formData.append('photos', photo);
      }

      const updatedListing = await pb.collection('listings').update(listing.id, formData);

      // Update local state
      photos = Array.isArray(updatedListing.photos)
        ? updatedListing.photos.map((photo) => ({
            id: photo,
            filename: photo,
            full: pb.files.getUrl(updatedListing, photo).toString(),
            thumb: pb.files.getUrl(updatedListing, photo, { thumb: '400x300' }).toString(),
          }))
        : [];
    } catch (err) {
      console.error('Error deleting photo:', err);
      alert('Failed to delete photo. Please try again.');
    } finally {
      deleting = null;
    }
  }

  // Drag and drop handlers
  function handleDragStart(index: number) {
    draggedIndex = index;
  }

  function handleDragOver(event: DragEvent, index: number) {
    event.preventDefault();
    dragOverIndex = index;
  }

  function handleDragLeave() {
    dragOverIndex = null;
  }

  async function handleDrop(event: DragEvent, targetIndex: number) {
    event.preventDefault();

    if (draggedIndex === null || draggedIndex === targetIndex) {
      draggedIndex = null;
      dragOverIndex = null;
      return;
    }

    // Reorder photos array
    const reordered = [...photos];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, removed);

    // Update local state immediately for visual feedback
    photos = reordered;
    draggedIndex = null;
    dragOverIndex = null;

    // Save to server
    saving = true;

    try {
      const formData = new FormData();
      for (const photo of reordered) {
        formData.append('photos', photo.filename);
      }

      await pb.collection('listings').update(listing.id, formData);
    } catch (err) {
      console.error('Error saving photo order:', err);
      alert('Failed to save photo order. Please try again.');
      // Reload to get correct order
      window.location.reload();
    } finally {
      saving = false;
    }
  }

  function handleDragEnd() {
    draggedIndex = null;
    dragOverIndex = null;
  }

  function openRegionEditor(photoFilename: string) {
    const photo = photos.find((p) => p.filename === photoFilename);
    if (!photo) return;

    editingPhotoFilename = photoFilename;
    editingPhotoUrl = photo.full;
  }

  function closeRegionEditor() {
    editingPhotoFilename = null;
    editingPhotoUrl = null;
  }

  async function handleRegionsSaved(regions: PhotoRegion[]) {
    photoRegions = regions;
  }

  function returnToListing() {
    goto(`/listings/${listing.id}`);
  }
</script>

<svelte:head>
  <title>Manage Photos · {listing.title} · Meeple Cart</title>
</svelte:head>

<main class="bg-surface-body px-6 py-12 text-primary transition-colors sm:px-8">
  <div class="mx-auto max-w-6xl space-y-8">
    <!-- Header -->
    <header class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="space-y-2">
          <h1 class="text-3xl font-semibold tracking-tight">Manage Photos</h1>
          <p class="text-sm text-muted">
            for <a
              href="/listings/{listing.id}"
              class="text-accent hover:underline">{listing.title}</a
            >
          </p>
        </div>
        <button
          class="rounded-lg border border-subtle px-4 py-2 text-sm text-secondary transition hover:border-accent hover:text-accent"
          onclick={returnToListing}
        >
          Back to listing
        </button>
      </div>

      <!-- Photo count -->
      <div class="flex items-center gap-4">
        <p class="text-sm text-secondary">
          <span class="font-medium text-primary">{photos.length}</span>
          <span class="text-muted">/ {maxPhotos} photos</span>
        </p>
        {#if canUploadMore}
          <p class="text-xs text-muted">({remainingSlots} slot{remainingSlots !== 1 ? 's' : ''} remaining)</p>
        {/if}
      </div>
    </header>

    <!-- Upload Section -->
    <section
      class="space-y-4 rounded-xl border border-subtle bg-surface-card p-6 transition-colors"
    >
      <h2 class="text-xl font-semibold text-primary">Upload Photos</h2>

      <input
        bind:this={fileInput}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        class="hidden"
        onchange={handleFileSelect}
      />

      <button
        class="w-full rounded-lg border border-dashed border-subtle bg-surface-body px-4 py-8 text-sm text-secondary transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
        disabled={!canUploadMore || uploading}
        onclick={openFileSelector}
      >
        {#if uploading}
          Uploading...
        {:else if canUploadMore}
          Click to upload photos (PNG, JPG, WEBP · 5MB max)
        {:else}
          Maximum photos reached
        {/if}
      </button>

      {#if uploadError}
        <p class="text-sm text-rose-300">{uploadError}</p>
      {/if}

      <p class="text-xs text-muted">
        Tip: You can upload multiple photos at once. Drag photos below to reorder them.
      </p>
    </section>

    <!-- Photo Grid -->
    {#if photos.length > 0}
      <section class="space-y-4">
        <h2 class="text-xl font-semibold text-primary">Your Photos</h2>

        <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {#each photos as photo, index (photo.id)}
            <div
              class="group relative overflow-hidden rounded-xl border transition-colors"
              class:border-accent={dragOverIndex === index}
              class:border-subtle={dragOverIndex !== index}
              class:opacity-50={draggedIndex === index}
              draggable="true"
              ondragstart={() => handleDragStart(index)}
              ondragover={(e) => handleDragOver(e, index)}
              ondragleave={handleDragLeave}
              ondrop={(e) => handleDrop(e, index)}
              ondragend={handleDragEnd}
              role="button"
              tabindex="0"
            >
              <!-- Photo Index Badge -->
              <div
                class="absolute left-3 top-3 z-10 rounded-full bg-black/80 px-3 py-1 text-xs font-medium text-white"
              >
                Photo {index + 1}
              </div>

              <!-- Image -->
              <img
                src={photo.thumb}
                alt="Listing photo {index + 1}"
                class="h-64 w-full cursor-move object-cover"
              />

              <!-- Actions Overlay -->
              <div
                class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <div class="flex gap-2">
                  <button
                    class="flex-1 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-[var(--accent-contrast)] transition hover:bg-accent/90"
                    onclick={() => openRegionEditor(photo.filename)}
                  >
                    Edit Regions
                  </button>
                  <button
                    class="rounded-lg border border-rose-500 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-300 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={deleting === photo.filename}
                    onclick={() => handleDeletePhoto(photo.filename)}
                  >
                    {#if deleting === photo.filename}
                      Deleting...
                    {:else}
                      Delete
                    {/if}
                  </button>
                </div>
              </div>

              <!-- Drag indicator -->
              {#if draggedIndex === index}
                <div
                  class="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-medium text-white"
                >
                  Dragging...
                </div>
              {/if}
            </div>
          {/each}
        </div>

        {#if saving}
          <p class="text-center text-sm text-muted">Saving order...</p>
        {/if}
      </section>
    {:else}
      <div
        class="rounded-xl border border-dashed border-subtle bg-surface-card p-12 text-center transition-colors"
      >
        <p class="text-lg text-secondary">No photos yet</p>
        <p class="mt-2 text-sm text-muted">Upload photos to get started</p>
      </div>
    {/if}

    <!-- Instructions -->
    <section class="rounded-xl border border-subtle bg-surface-card p-6 transition-colors">
      <h3 class="mb-3 text-sm font-semibold text-primary">How to manage photos:</h3>
      <ul class="space-y-2 text-sm text-muted">
        <li class="flex gap-2">
          <span class="text-accent">•</span>
          <span>Upload new photos using the upload button above (up to 6 total)</span>
        </li>
        <li class="flex gap-2">
          <span class="text-accent">•</span>
          <span>Drag and drop photos to reorder them - the first photo is your cover image</span>
        </li>
        <li class="flex gap-2">
          <span class="text-accent">•</span>
          <span>Click "Edit Regions" to map games to areas within the photo (coming in Phase 3)</span>
        </li>
        <li class="flex gap-2">
          <span class="text-accent">•</span>
          <span
            >Delete photos by hovering over them and clicking "Delete" (requires
            confirmation)</span
          >
        </li>
      </ul>
    </section>
  </div>
</main>

<!-- Region Editor Modal -->
{#if editingPhotoFilename && editingPhotoUrl}
  <PhotoRegionSelector
    photoUrl={editingPhotoUrl}
    photoFilename={editingPhotoFilename}
    {listing}
    {games}
    existingRegions={photoRegions}
    onClose={closeRegionEditor}
    onSave={handleRegionsSaved}
  />
{/if}
