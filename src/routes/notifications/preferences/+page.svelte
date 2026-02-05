<script lang="ts">
  import { pb, currentUser } from '$lib/pocketbase';
  import Alert from '$lib/components/Alert.svelte';
  import {
    NORTH_ISLAND_REGIONS,
    SOUTH_ISLAND_REGIONS,
    REGION_LABELS
  } from '$lib/constants/regions';

  // Combine regions for display
  const ALL_REGIONS = [...NORTH_ISLAND_REGIONS, ...SOUTH_ISLAND_REGIONS].map((r) => r.value);

  function getPrefsFromUser(user: any) {
    const userPrefs = user?.notification_prefs || {};
    return {
      watched_regions: ((userPrefs.watched_regions as string[]) ?? []).filter((r) =>
        (ALL_REGIONS as string[]).includes(r)
      ),
      max_distance_km: (userPrefs.max_distance_km as number | null) ?? null,
      email_frequency: (userPrefs.email_frequency as string) ?? 'instant',
      in_app_digest: (userPrefs.in_app_digest as string) ?? 'instant',
      notify_new_listings: (userPrefs.notify_new_listings as boolean) ?? true,
      notify_price_drops: (userPrefs.notify_price_drops as boolean) ?? false,
      notify_new_messages: (userPrefs.notify_new_messages as boolean) ?? true
    };
  }

  // Initialize preferences from current user or defaults
  let prefs = $state(getPrefsFromUser($currentUser));
  let initialized = $state(!!$currentUser);

  $effect(() => {
    if ($currentUser && !initialized) {
      prefs = getPrefsFromUser($currentUser);
      initialized = true;
    }
  });

  let isLoading = $state(false);
  let success = $state(false);
  let error = $state<string | null>(null);

  async function savePreferences(e: Event) {
    e.preventDefault();
    if (!$currentUser) return;

    isLoading = true;
    error = null;
    success = false;

    try {
      await pb.collection('users').update($currentUser.id, {
        notification_prefs: prefs
      });
      // Update local user store to reflect changes immediately
      // (PB update returns the record, but authStore might need manual sync if not auto-updated)
      // Actually the realtime subscription in pocketbase.ts might handle it, but update() returns the record so we can update the store if needed.
      // However, pocketbase.ts implementation suggests it listens to changes or we might need to manually set it if we want instant feedback if the subscription is slow.
      // But typically, we just rely on the fact the request succeeded.
      success = true;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Failed to save preferences:', err);
      error = err.message || 'Failed to save preferences';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      isLoading = false;
    }
  }

  function handleRegionToggle(region: string) {
    if (prefs.watched_regions.includes(region)) {
      prefs.watched_regions = prefs.watched_regions.filter((r) => r !== region);
    } else {
      prefs.watched_regions = [...prefs.watched_regions, region];
    }
  }
</script>

<svelte:head>
  <title>Notification Preferences · Meeple Cart</title>
</svelte:head>

<main class="bg-surface-body transition-colors px-6 py-12">
  <div class="mx-auto max-w-2xl space-y-6">
    <!-- Header -->
    <div class="space-y-2">
      <!-- eslint-disable svelte/no-navigation-without-resolve -->
      <div class="flex items-center gap-3">
        <a
          href="/notifications"
          class="rounded-lg p-2 text-muted transition hover:bg-surface-card-alt hover:text-secondary"
          aria-label="Back to notifications"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </a>
        <h1 class="text-3xl font-bold text-primary">Notification Preferences</h1>
      </div>
      <p class="text-muted">
        Choose which regions to watch and how you want to receive notifications
      </p>
    </div>

    {#if success}
      <Alert type="success">✓ Preferences saved successfully</Alert>
    {/if}

    {#if error}
      <Alert type="error">{error}</Alert>
    {/if}

    <!-- Preferences Form -->
    <form onsubmit={savePreferences} class="space-y-8">
      <!-- Watched Regions -->
      <section class="space-y-4">
        <div>
          <h2 class="text-xl font-semibold text-primary">Watched Regions</h2>
          <p class="mt-1 text-sm text-muted">
            Get notified when new listings appear in these regions
          </p>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          {#each ALL_REGIONS as region (region)}
            <label
              class="flex items-center gap-3 rounded-lg border border-subtle bg-surface-card transition-colors p-3 transition hover:border-emerald-500"
            >
              <input
                type="checkbox"
                checked={prefs.watched_regions.includes(region)}
                onchange={() => handleRegionToggle(region)}
                class="h-4 w-4 rounded border-subtle bg-surface-card transition-colors focus:ring-[color:rgba(52,211,153,0.35)] focus:ring-offset-0"
                style="color: var(--accent)"
              />
              <span class="text-secondary">{REGION_LABELS[region]}</span>
            </label>
          {/each}
        </div>
      </section>

      <!-- Distance Filter -->
      <section class="space-y-4">
        <div>
          <h2 class="text-xl font-semibold text-primary">Distance Filter</h2>
          <p class="mt-1 text-sm text-muted">
            Only notify about listings within this distance (optional)
          </p>
        </div>

        <div class="flex items-center gap-3">
          <input
            type="number"
            min="0"
            step="10"
            bind:value={prefs.max_distance_km}
            placeholder="No limit"
            class="w-32 rounded-lg border border-subtle bg-surface-card transition-colors px-3 py-2 text-primary focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
          />
          <span class="text-muted">km from your location</span>
        </div>
      </section>

      <!-- Email Frequency -->
      <section class="space-y-4">
        <div>
          <h2 class="text-xl font-semibold text-primary">Email Notifications</h2>
          <p class="mt-1 text-sm text-muted">How often to send email summaries</p>
        </div>

        <div class="space-y-2">
          {#each [{ value: 'instant', label: 'Instant - as they happen' }, { value: 'daily', label: 'Daily digest' }, { value: 'weekly', label: 'Weekly digest' }, { value: 'never', label: 'Never - in-app only' }] as option (option.value)}
            <label
              class="flex items-center gap-3 rounded-lg border border-subtle bg-surface-card transition-colors p-3 transition hover:border-emerald-500"
            >
              <input
                type="radio"
                name="email_frequency"
                value={option.value}
                bind:group={prefs.email_frequency}
                class="h-4 w-4 border-subtle bg-surface-card transition-colors focus:ring-[color:rgba(52,211,153,0.35)] focus:ring-offset-0"
                style="color: var(--accent)"
              />
              <span class="text-secondary">{option.label}</span>
            </label>
          {/each}
        </div>
      </section>

      <!-- In-App Digest Frequency -->
      <section class="space-y-4">
        <div>
          <h2 class="text-xl font-semibold text-primary">In-App Notification Digest</h2>
          <p class="mt-1 text-sm text-muted">
            Batch multiple notifications together instead of showing each individually
          </p>
        </div>

        <div class="space-y-2">
          {#each [{ value: 'instant', label: 'Instant - show immediately' }, { value: 'daily', label: 'Daily summary' }, { value: 'weekly', label: 'Weekly summary' }] as option (option.value)}
            <label
              class="flex items-center gap-3 rounded-lg border border-subtle bg-surface-card transition-colors p-3 transition hover:border-emerald-500"
            >
              <input
                type="radio"
                name="in_app_digest"
                value={option.value}
                bind:group={prefs.in_app_digest}
                class="h-4 w-4 border-subtle bg-surface-card transition-colors focus:ring-[color:rgba(52,211,153,0.35)] focus:ring-offset-0"
                style="color: var(--accent)"
              />
              <span class="text-secondary">{option.label}</span>
            </label>
          {/each}
        </div>
      </section>

      <!-- Notification Types -->
      <section class="space-y-4">
        <div>
          <h2 class="text-xl font-semibold text-primary">Notification Types</h2>
          <p class="mt-1 text-sm text-muted">What to notify you about</p>
        </div>

        <div class="space-y-2">
          <label
            class="flex items-center gap-3 rounded-lg border border-subtle bg-surface-card transition-colors p-3"
          >
            <input
              type="checkbox"
              bind:checked={prefs.notify_new_listings}
              class="h-4 w-4 rounded border-subtle bg-surface-card transition-colors focus:ring-[color:rgba(52,211,153,0.35)] focus:ring-offset-0"
              style="color: var(--accent)"
            />
            <div>
              <div class="font-medium text-secondary">New listings in watched regions</div>
              <div class="text-sm text-muted">Get notified when games are listed nearby</div>
            </div>
          </label>

          <label
            class="flex items-center gap-3 rounded-lg border border-subtle bg-surface-card transition-colors p-3"
          >
            <input
              type="checkbox"
              bind:checked={prefs.notify_price_drops}
              class="h-4 w-4 rounded border-subtle bg-surface-card transition-colors focus:ring-[color:rgba(52,211,153,0.35)] focus:ring-offset-0"
              style="color: var(--accent)"
            />
            <div>
              <div class="font-medium text-secondary">Price drops (coming soon)</div>
              <div class="text-sm text-muted">When watched items drop in price</div>
            </div>
          </label>

          <label
            class="flex items-center gap-3 rounded-lg border border-subtle bg-surface-card transition-colors p-3"
          >
            <input
              type="checkbox"
              bind:checked={prefs.notify_new_messages}
              class="h-4 w-4 rounded border-subtle bg-surface-card transition-colors focus:ring-[color:rgba(52,211,153,0.35)] focus:ring-offset-0"
              style="color: var(--accent)"
            />
            <div>
              <div class="font-medium text-secondary">New messages</div>
              <div class="text-sm text-muted">When someone messages you about a listing</div>
            </div>
          </label>
        </div>
      </section>

      <!-- Submit -->
      <div class="flex justify-end gap-3">
        <a
          href="/notifications"
          class="rounded-lg border border-subtle px-6 py-2 text-secondary transition hover:border-emerald-500 hover:text-emerald-300"
        >
          Cancel
        </a>
        <button
          type="submit"
          disabled={isLoading}
          class="rounded-lg bg-emerald-500 px-6 py-2 font-medium text-[var(--accent-contrast)] transition hover:bg-emerald-400 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
      <!-- eslint-enable svelte/no-navigation-without-resolve -->
    </form>
  </div>
</main>
