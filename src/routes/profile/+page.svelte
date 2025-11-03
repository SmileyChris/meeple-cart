<script lang="ts">
  import type { PageData } from './$types';
  import { pb, currentUser } from '$lib/pocketbase';
  import { invalidate } from '$app/navigation';
  import {
    NORTH_ISLAND_REGIONS,
    SOUTH_ISLAND_REGIONS,
    getIslandRegions,
  } from '$lib/constants/regions';

  let { data }: { data: PageData } = $props();

  let profile = $state(data.profile);
  let listings = $state(data.listings);
  let updated = $state(false);
  let error = $state<string | null>(null);
  let saving = $state(false);

  // Form fields
  let displayName = $state(profile.display_name);
  let location = $state(profile.location || '');
  let bio = $state(profile.bio || '');
  let preferredContact = $state(profile.preferred_contact);
  let preferredRegions = $state<string[]>(profile.preferred_regions || []);

  // Island selection logic
  let northIslandChecked = $derived(
    NORTH_ISLAND_REGIONS.every((r) => preferredRegions.includes(r.value))
  );
  let southIslandChecked = $derived(
    SOUTH_ISLAND_REGIONS.every((r) => preferredRegions.includes(r.value))
  );

  function toggleIsland(island: 'north_island' | 'south_island') {
    const islandRegionValues = getIslandRegions(island);
    const allSelected = island === 'north_island' ? northIslandChecked : southIslandChecked;

    if (allSelected) {
      // Deselect all regions in this island
      preferredRegions = preferredRegions.filter((r) => !islandRegionValues.includes(r));
    } else {
      // Select all regions in this island
      const newRegions = islandRegionValues.filter((r) => !preferredRegions.includes(r));
      preferredRegions = [...preferredRegions, ...newRegions];
    }
  }

  function toggleRegion(regionValue: string) {
    if (preferredRegions.includes(regionValue)) {
      preferredRegions = preferredRegions.filter((r) => r !== regionValue);
    } else {
      preferredRegions = [...preferredRegions, regionValue];
    }
  }

  async function handleUpdate(e: Event) {
    e.preventDefault();
    error = null;
    updated = false;

    if (!displayName.trim()) {
      error = 'Display name is required.';
      return;
    }

    saving = true;
    try {
      const updatedProfile = await pb.collection('users').update($currentUser!.id, {
        display_name: displayName.trim(),
        location: location.trim() || null,
        bio: bio.trim() || null,
        preferred_contact: preferredContact,
        preferred_regions: preferredRegions.length > 0 ? preferredRegions : null,
      });

      // Update the store
      currentUser.set(updatedProfile as any);
      profile = updatedProfile as any;
      updated = true;

      // Refresh data
      await invalidate('app:profile');
    } catch (err) {
      console.error('Profile update failed', err);
      error = 'Unable to update profile. Please try again.';
    } finally {
      saving = false;
    }
  }

  const typeLabels: Record<string, string> = {
    trade: 'Trade',
    sell: 'Sell',
    want: 'Want to Buy',
  };

  const statusLabels: Record<string, string> = {
    active: 'Active',
    pending: 'Pending',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat('en-NZ', { dateStyle: 'medium' }).format(new Date(iso));
</script>

<section
  class="mx-auto mt-12 max-w-3xl rounded-xl border border-subtle bg-surface-panel p-8 shadow-elevated transition-colors"
>
  <header
    class="flex flex-col gap-3 border-b border-subtle pb-4"
  >
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-primary">{profile.display_name}</h1>
        <p class="text-sm text-muted">
          Joined {new Date(profile.joined_date).toLocaleDateString()}
        </p>
      </div>
      <div class="flex gap-4 text-sm text-secondary">
        <span
          ><span class="font-semibold" style="color: var(--accent)">{profile.trade_count}</span> trades</span
        >
        <span
          ><span class="font-semibold" style="color: var(--accent)">{profile.vouch_count}</span> vouches</span
        >
      </div>
    </div>

    <!-- Verification Status -->
    <div class="flex flex-wrap gap-2">
      {#if profile.verified}
        <span
          class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium"
          style="border-color: var(--accent); color: var(--accent); background-color: rgba(52, 211, 153, 0.1)"
        >
          <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Email Verified
        </span>
      {:else}
        <a
          href="/profile/verify"
          class="inline-flex items-center gap-1.5 rounded-full border border-amber-500 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/20"
        >
          <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          Email Not Verified
        </a>
      {/if}

      {#if profile.phone_verified}
        <span
          class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium"
          style="border-color: var(--accent); color: var(--accent); background-color: rgba(52, 211, 153, 0.1)"
        >
          <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Phone Verified
        </span>
      {:else}
        <a
          href="/settings"
          class="inline-flex items-center gap-1.5 rounded-full border border-subtle bg-surface-card px-2.5 py-0.5 text-xs font-medium text-muted transition-colors hover:border-accent/50 hover:bg-accent/5"
        >
          <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          Phone Not Verified
        </a>
      {/if}
    </div>
  </header>

  <section class="mt-6 space-y-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-xl font-semibold text-primary">My listings</h2>
        <p class="text-sm text-muted">Create, review, and manage the games you have on offer.</p>
      </div>
      <!-- eslint-disable svelte/no-navigation-without-resolve -->
      <a class="btn-secondary px-4 py-2" href="/listings/new"> New listing </a>
      <!-- eslint-enable svelte/no-navigation-without-resolve -->
    </div>

    {#if listings.length > 0}
      <ul
        class="divide-y divide-[var(--border-subtle)] rounded-xl border border-subtle bg-surface-card transition-colors"
      >
        {#each listings as listing (listing.id)}
          <li class="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div class="space-y-1">
              <h3 class="text-lg font-semibold text-primary">{listing.title}</h3>
              <div
                class="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-muted"
              >
                <span
                  class="rounded-full border px-2 py-0.5"
                  style="border-color: var(--accent); color: var(--accent)"
                >
                  {typeLabels[listing.listingType] ?? listing.listingType}
                </span>
                <span class="rounded-full border border-subtle px-2 py-0.5 text-secondary">
                  {statusLabels[listing.status] ?? listing.status}
                </span>
                <span>Created {formatDate(listing.created)}</span>
                <span>{listing.views} views</span>
              </div>
            </div>
            <div class="flex flex-wrap gap-3 text-sm">
              <!-- eslint-disable svelte/no-navigation-without-resolve -->
              <a class="btn-ghost" href={`/listings/${listing.id}`}> View </a>
              <a class="btn-ghost" href={`/listings/${listing.id}/manage`}> Manage games </a>
              <a class="btn-ghost" href={`/listings/${listing.id}/edit`}> Edit prices </a>
              <!-- eslint-enable svelte/no-navigation-without-resolve -->
            </div>
          </li>
        {/each}
      </ul>
    {:else}
      <div
        class="rounded-xl border border-dashed border-subtle bg-surface-card p-6 text-sm text-muted transition-colors"
      >
        You have not created any listings yet. Use the <span style="color: var(--accent)"
          >New listing</span
        > button to publish your first trade.
      </div>
    {/if}
  </section>

  <form class="mt-6 grid gap-4 sm:grid-cols-2" onsubmit={handleUpdate}>
    <div class="sm:col-span-2">
      <label class="block text-sm font-medium text-secondary" for="display_name">Display name</label
      >
      <input
        class="mt-2 w-full rounded-lg border border-subtle bg-surface-card px-3 py-2 text-primary transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
        id="display_name"
        name="display_name"
        type="text"
        minlength="2"
        maxlength="64"
        bind:value={displayName}
        disabled={saving}
        required
      />
    </div>

    <div>
      <label class="block text-sm font-medium text-secondary" for="location">Location</label>
      <input
        class="mt-2 w-full rounded-lg border border-subtle bg-surface-card px-3 py-2 text-primary transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
        id="location"
        name="location"
        type="text"
        maxlength="120"
        bind:value={location}
        disabled={saving}
        placeholder="Eg: Wellington"
      />
    </div>

    <div>
      <label class="block text-sm font-medium text-secondary" for="preferred_contact"
        >Preferred contact</label
      >
      <select
        class="mt-2 w-full rounded-lg border border-subtle bg-surface-card px-3 py-2 text-primary transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
        id="preferred_contact"
        name="preferred_contact"
        bind:value={preferredContact}
        disabled={saving}
      >
        <option value="platform">Meeple Cart messages</option>
        <option value="email">Email</option>
        <option value="phone">Phone</option>
      </select>
    </div>

    <div class="sm:col-span-2">
      <label class="block text-sm font-medium text-secondary" for="bio">Bio</label>
      <textarea
        class="mt-2 h-32 w-full rounded-lg border border-subtle bg-surface-card px-3 py-2 text-primary transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
        id="bio"
        name="bio"
        maxlength="2000"
        bind:value={bio}
        disabled={saving}
      ></textarea>
      <p class="mt-1 text-xs text-muted">Share a short intro or trading preferences.</p>
    </div>

    <div class="sm:col-span-2">
      <label class="block text-sm font-medium text-secondary">Preferred regions</label>
      <p class="mt-1 text-xs text-muted">
        Select your favorite regions to automatically filter listings when you visit the browse page.
      </p>
      <div class="mt-3 space-y-4">
        <!-- North Island -->
        <div class="space-y-2">
          <label class="flex items-center gap-2 text-sm font-medium text-primary">
            <input
              type="checkbox"
              class="h-4 w-4 rounded border border-subtle bg-surface-card transition-colors"
              checked={northIslandChecked}
              disabled={saving}
              onchange={() => toggleIsland('north_island')}
            />
            North Island
          </label>
          <div class="ml-6 grid gap-2 sm:grid-cols-2">
            {#each NORTH_ISLAND_REGIONS as region (region.value)}
              <label class="flex items-center gap-2 text-sm text-secondary">
                <input
                  type="checkbox"
                  class="h-4 w-4 rounded border border-subtle bg-surface-card transition-colors"
                  checked={preferredRegions.includes(region.value)}
                  disabled={saving}
                  onchange={() => toggleRegion(region.value)}
                />
                {region.label}
              </label>
            {/each}
          </div>
        </div>

        <!-- South Island -->
        <div class="space-y-2">
          <label class="flex items-center gap-2 text-sm font-medium text-primary">
            <input
              type="checkbox"
              class="h-4 w-4 rounded border border-subtle bg-surface-card transition-colors"
              checked={southIslandChecked}
              disabled={saving}
              onchange={() => toggleIsland('south_island')}
            />
            South Island
          </label>
          <div class="ml-6 grid gap-2 sm:grid-cols-2">
            {#each SOUTH_ISLAND_REGIONS as region (region.value)}
              <label class="flex items-center gap-2 text-sm text-secondary">
                <input
                  type="checkbox"
                  class="h-4 w-4 rounded border border-subtle bg-surface-card transition-colors"
                  checked={preferredRegions.includes(region.value)}
                  disabled={saving}
                  onchange={() => toggleRegion(region.value)}
                />
                {region.label}
              </label>
            {/each}
          </div>
        </div>
      </div>
    </div>

    {#if error}
      <p class="sm:col-span-2 text-sm text-rose-400">{error}</p>
    {/if}
    {#if updated}
      <p class="sm:col-span-2 text-sm" style="color: var(--accent)">Profile updated.</p>
    {/if}

    <div class="sm:col-span-2 flex justify-end">
      <button class="btn-primary" type="submit" disabled={saving}>
        {saving ? 'Saving...' : 'Save changes'}
      </button>
    </div>
  </form>
</section>
