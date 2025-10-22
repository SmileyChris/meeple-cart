<script lang="ts">
  import type { PageData } from './$types';
  import { pb, currentUser } from '$lib/pocketbase';
  import { invalidate } from '$app/navigation';

  export let data: PageData;

  let profile = data.profile;
  let listings = data.listings;
  let updated = false;
  let error: string | null = null;
  let saving = false;

  // Form fields
  let displayName = profile.display_name;
  let location = profile.location || '';
  let bio = profile.bio || '';
  let preferredContact = profile.preferred_contact;

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
    class="flex flex-col gap-2 border-b border-subtle pb-4 sm:flex-row sm:items-center sm:justify-between"
  >
    <div>
      <h1 class="text-2xl font-semibold text-primary">{profile.display_name}</h1>
      <p class="text-sm text-muted">
        Joined {new Date(profile.joined_date).toLocaleDateString()}
      </p>
    </div>
    <div class="flex gap-4 text-sm text-secondary">
      <span><span class="font-semibold" style="color: var(--accent)">{profile.trade_count}</span> trades</span>
      <span><span class="font-semibold" style="color: var(--accent)">{profile.vouch_count}</span> vouches</span>
    </div>
  </header>

  <section class="mt-6 space-y-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-xl font-semibold text-primary">My listings</h2>
        <p class="text-sm text-muted">
          Create, review, and manage the games you have on offer.
        </p>
      </div>
      <!-- eslint-disable svelte/no-navigation-without-resolve -->
      <a
        class="btn-secondary px-4 py-2"
        href="/listings/new"
      >
        New listing
      </a>
      <!-- eslint-enable svelte/no-navigation-without-resolve -->
    </div>

    {#if listings.length > 0}
      <ul class="divide-y divide-[var(--border-subtle)] rounded-xl border border-subtle bg-surface-card transition-colors">
        {#each listings as listing (listing.id)}
          <li class="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div class="space-y-1">
              <h3 class="text-lg font-semibold text-primary">{listing.title}</h3>
              <div
                class="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-muted"
              >
                <span class="rounded-full border px-2 py-0.5" style="border-color: var(--accent); color: var(--accent)">
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
              <a
                class="btn-ghost"
                href={`/listings/${listing.id}`}
              >
                View
              </a>
              <a
                class="btn-ghost"
                href={`/listings/${listing.id}/manage`}
              >
                Manage games
              </a>
              <a
                class="btn-ghost"
                href={`/listings/${listing.id}/edit`}
              >
                Edit prices
              </a>
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

  <form class="mt-6 grid gap-4 sm:grid-cols-2" on:submit={handleUpdate}>
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
