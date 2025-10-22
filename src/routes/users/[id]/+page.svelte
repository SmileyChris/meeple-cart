<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;

  const profile = data.profile;
  const listings = data.listings;
  const vouches = data.vouches;
  const reviews = data.reviews;

  const typeLabels: Record<string, string> = {
    trade: 'Trade',
    sell: 'Sell',
    want: 'Want to Buy',
  };

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat('en-NZ', { dateStyle: 'medium' }).format(new Date(iso));

  const formatRelativeTime = (iso: string) => {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };
</script>

<svelte:head>
  <title>{profile.display_name} · Meeple Cart</title>
  <meta
    name="description"
    content="View {profile.display_name}'s profile, active listings, and trading history on Meeple Cart"
  />
</svelte:head>

<main class="min-h-screen bg-surface-body transition-colors px-6 py-12">
  <div class="mx-auto max-w-5xl space-y-8">
    <!-- Profile Header -->
    <div class="rounded-xl border border-subtle bg-surface-card transition-colors p-8">
      <div class="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div class="space-y-3">
          <h1 class="text-3xl font-bold text-primary">{profile.display_name}</h1>
          {#if profile.location}
            <p class="flex items-center gap-2 text-secondary">
              <span class="text-lg">📍</span>
              <span>{profile.location}</span>
            </p>
          {/if}
          <p class="text-sm text-muted">
            Member since {formatDate(profile.joined_date)}
          </p>
        </div>

        <!-- Stats -->
        <div class="flex gap-6">
          <div class="text-center">
            <div class="text-3xl font-bold text-emerald-300">{profile.trade_count}</div>
            <div class="text-sm text-muted">Trades</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-emerald-300">{profile.vouch_count}</div>
            <div class="text-sm text-muted">Vouches</div>
          </div>
        </div>
      </div>

      {#if profile.bio}
        <div class="mt-6 border-t border-subtle pt-6">
          <h2 class="mb-2 text-sm font-semibold text-secondary">About</h2>
          <p class="text-muted">{profile.bio}</p>
        </div>
      {/if}
    </div>

    <!-- Active Listings -->
    <div class="space-y-4">
      <h2 class="text-2xl font-bold text-primary">
        Active listings ({listings.length})
      </h2>

      {#if listings.length === 0}
        <div class="rounded-xl border border-subtle bg-surface-card transition-colors p-8 text-center">
          <p class="text-muted">No active listings</p>
        </div>
      {:else}
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {#each listings as listing (listing.id)}
            <!-- eslint-disable svelte/no-navigation-without-resolve -->
            <a
              href={`/listings/${listing.id}`}
              class="group block overflow-hidden rounded-xl border border-subtle bg-surface-card transition-colors transition hover:border-emerald-500/80 hover:shadow-lg"
            >
              {#if listing.coverImage}
                <img
                  alt={listing.title}
                  class="h-40 w-full object-cover"
                  src={listing.coverImage}
                />
              {:else}
                <div class="flex h-40 items-center justify-center bg-surface-card-alt text-5xl opacity-20">
                  🎲
                </div>
              {/if}

              <div class="p-4">
                <h3 class="font-semibold text-primary transition group-hover:text-emerald-300">
                  {listing.title}
                </h3>
                <div class="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                  <span
                    class="rounded-full border border-emerald-600 px-2 py-0.5 uppercase text-emerald-200"
                  >
                    {typeLabels[listing.listingType] ?? listing.listingType}
                  </span>
                  {#if listing.location}
                    <span>{listing.location}</span>
                  {/if}
                </div>
                <p class="mt-2 text-sm text-muted">
                  {listing.gameCount}
                  {listing.gameCount === 1 ? 'game' : 'games'}
                  · {formatRelativeTime(listing.created)}
                </p>
              </div>
            </a>
            <!-- eslint-enable svelte/no-navigation-without-resolve -->
          {/each}
        </div>
      {/if}
    </div>

    <!-- Vouches -->
    {#if vouches.length > 0}
      <div class="space-y-4">
        <h2 class="text-2xl font-bold text-primary">Vouches ({profile.vouch_count})</h2>

        <div class="space-y-3">
          {#each vouches as vouch (vouch.id)}
            <div class="rounded-xl border border-subtle bg-surface-card transition-colors p-4">
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1">
                  {#if vouch.voucherId}
                    <!-- eslint-disable svelte/no-navigation-without-resolve -->
                    <a
                      href={`/users/${vouch.voucherId}`}
                      class="font-semibold text-emerald-300 hover:text-emerald-200"
                    >
                      {vouch.voucherName}
                    </a>
                    <!-- eslint-enable svelte/no-navigation-without-resolve -->
                  {:else}
                    <span class="font-semibold text-secondary">{vouch.voucherName}</span>
                  {/if}
                  {#if vouch.message}
                    <p class="mt-2 text-sm text-muted">"{vouch.message}"</p>
                  {/if}
                </div>
                <span class="text-xs text-muted">
                  {formatRelativeTime(vouch.created)}
                </span>
              </div>
            </div>
          {/each}
        </div>

        {#if profile.vouch_count > vouches.length}
          <p class="text-sm text-muted">
            Showing {vouches.length} most recent of {profile.vouch_count} total vouches
          </p>
        {/if}
      </div>
    {/if}

    <!-- Reviews -->
    {#if reviews.length > 0}
      <div class="space-y-4">
        <h2 class="text-2xl font-bold text-primary">Reviews ({reviews.length})</h2>

        <div class="space-y-4">
          {#each reviews as review (review.id)}
            <div class="rounded-xl border border-subtle bg-surface-card transition-colors p-6">
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1 space-y-3">
                  <!-- Rating -->
                  <div class="flex items-center gap-2">
                    {#each Array(5) as _, i}
                      <span class="text-2xl">
                        {i < review.rating ? '⭐' : '☆'}
                      </span>
                    {/each}
                  </div>

                  <!-- Reviewer -->
                  <div class="flex items-center gap-2 text-sm">
                    <span class="text-muted">Review from</span>
                    <!-- eslint-disable svelte/no-navigation-without-resolve -->
                    <a
                      href={`/users/${review.reviewerId}`}
                      class="font-semibold text-emerald-300 hover:text-emerald-200"
                    >
                      {review.reviewerName}
                    </a>
                    <!-- eslint-enable svelte/no-navigation-without-resolve -->
                  </div>

                  <!-- Review Text -->
                  {#if review.review}
                    <p class="text-secondary leading-relaxed">"{review.review}"</p>
                  {/if}

                  <!-- Trade Info -->
                  <div class="flex items-center gap-2 text-sm text-muted">
                    <span>Trade: {review.listingTitle}</span>
                    <span>·</span>
                    <span>{formatDate(review.completedDate)}</span>
                  </div>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</main>
