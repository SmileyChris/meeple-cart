<script lang="ts">
  import type { ActionData, PageData } from './$types';

  export let data: PageData;
  export let form: ActionData | undefined;

  const actionState = form?.update;
  const profile = actionState?.profile ?? data.profile;
  const updated = actionState?.success ?? false;
  const listings = data.listings;

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

  <form class="mt-6 grid gap-4 sm:grid-cols-2" method="POST" action="?/update">
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
        value={profile.display_name}
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
        value={profile.location ?? ''}
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
        value={profile.preferred_contact}
      >
        <option value="platform" selected={profile.preferred_contact === 'platform'}>
          Meeple Cart messages
        </option>
        <option value="email" selected={profile.preferred_contact === 'email'}>Email</option>
        <option value="phone" selected={profile.preferred_contact === 'phone'}>Phone</option>
      </select>
    </div>

    <div class="sm:col-span-2">
      <label class="block text-sm font-medium text-secondary" for="bio">Bio</label>
      <textarea
        class="mt-2 h-32 w-full rounded-lg border border-subtle bg-surface-card px-3 py-2 text-primary transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
        id="bio"
        name="bio"
        maxlength="2000">{profile.bio ?? ''}</textarea
      >
      <p class="mt-1 text-xs text-muted">Share a short intro or trading preferences.</p>
    </div>

    {#if actionState?.message}
      <p class="sm:col-span-2 text-sm text-rose-400">{actionState.message}</p>
    {/if}
    {#if updated}
      <p class="sm:col-span-2 text-sm" style="color: var(--accent)">Profile updated.</p>
    {/if}

    <div class="sm:col-span-2 flex justify-end">
      <button
        class="btn-primary"
        name="intent"
        value="update"
        type="submit"
      >
        Save changes
      </button>
    </div>
  </form>
</section>
