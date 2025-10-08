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
  class="mx-auto mt-12 max-w-3xl rounded-xl border border-slate-800 bg-slate-900/60 p-8 shadow-lg"
>
  <header
    class="flex flex-col gap-2 border-b border-slate-800 pb-4 sm:flex-row sm:items-center sm:justify-between"
  >
    <div>
      <h1 class="text-2xl font-semibold text-slate-100">{profile.display_name}</h1>
      <p class="text-sm text-slate-400">
        Joined {new Date(profile.joined_date).toLocaleDateString()}
      </p>
    </div>
    <div class="flex gap-4 text-sm text-slate-300">
      <span><span class="font-semibold text-emerald-300">{profile.trade_count}</span> trades</span>
      <span><span class="font-semibold text-emerald-300">{profile.vouch_count}</span> vouches</span>
    </div>
  </header>

  <section class="mt-6 space-y-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-xl font-semibold text-slate-100">My listings</h2>
        <p class="text-sm text-slate-400">
          Create, review, and manage the games you have on offer.
        </p>
      </div>
      <!-- eslint-disable svelte/no-navigation-without-resolve -->
      <a
        class="inline-flex items-center justify-center rounded-lg border border-emerald-500 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/20"
        href="/listings/new"
      >
        New listing
      </a>
      <!-- eslint-enable svelte/no-navigation-without-resolve -->
    </div>

    {#if listings.length > 0}
      <ul class="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-950/60">
        {#each listings as listing (listing.id)}
          <li class="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div class="space-y-1">
              <h3 class="text-lg font-semibold text-slate-100">{listing.title}</h3>
              <div
                class="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-slate-400"
              >
                <span class="rounded-full border border-emerald-600 px-2 py-0.5 text-emerald-200">
                  {typeLabels[listing.listingType] ?? listing.listingType}
                </span>
                <span class="rounded-full border border-slate-700 px-2 py-0.5 text-slate-300">
                  {statusLabels[listing.status] ?? listing.status}
                </span>
                <span>Created {formatDate(listing.created)}</span>
                <span>{listing.views} views</span>
              </div>
            </div>
            <div class="flex flex-wrap gap-3 text-sm">
              <!-- eslint-disable svelte/no-navigation-without-resolve -->
              <a
                class="rounded-lg border border-slate-700 px-3 py-1.5 text-slate-200 transition hover:border-emerald-500 hover:text-emerald-300"
                href={`/listings/${listing.id}`}
              >
                View
              </a>
              <a
                class="rounded-lg border border-slate-700 px-3 py-1.5 text-slate-200 transition hover:border-emerald-500 hover:text-emerald-300"
                href={`/listings/${listing.id}/manage`}
              >
                Manage games
              </a>
              <a
                class="rounded-lg border border-slate-700 px-3 py-1.5 text-slate-200 transition hover:border-emerald-500 hover:text-emerald-300"
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
        class="rounded-xl border border-dashed border-slate-800 bg-slate-950/40 p-6 text-sm text-slate-400"
      >
        You have not created any listings yet. Use the <span class="text-emerald-300"
          >New listing</span
        > button to publish your first trade.
      </div>
    {/if}
  </section>

  <form class="mt-6 grid gap-4 sm:grid-cols-2" method="POST" action="?/update">
    <div class="sm:col-span-2">
      <label class="block text-sm font-medium text-slate-200" for="display_name">Display name</label
      >
      <input
        class="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
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
      <label class="block text-sm font-medium text-slate-200" for="location">Location</label>
      <input
        class="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
        id="location"
        name="location"
        type="text"
        maxlength="120"
        value={profile.location ?? ''}
        placeholder="Eg: Wellington"
      />
    </div>

    <div>
      <label class="block text-sm font-medium text-slate-200" for="preferred_contact"
        >Preferred contact</label
      >
      <select
        class="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
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
      <label class="block text-sm font-medium text-slate-200" for="bio">Bio</label>
      <textarea
        class="mt-2 h-32 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
        id="bio"
        name="bio"
        maxlength="2000">{profile.bio ?? ''}</textarea
      >
      <p class="mt-1 text-xs text-slate-500">Share a short intro or trading preferences.</p>
    </div>

    {#if actionState?.message}
      <p class="sm:col-span-2 text-sm text-rose-300">{actionState.message}</p>
    {/if}
    {#if updated}
      <p class="sm:col-span-2 text-sm text-emerald-300">Profile updated.</p>
    {/if}

    <div class="sm:col-span-2 flex justify-end">
      <button
        class="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-900 transition hover:bg-emerald-400"
        name="intent"
        value="update"
        type="submit"
      >
        Save changes
      </button>
    </div>
  </form>
</section>
