<script lang="ts">
  import type { PageData, ActionData } from './$types';
  import { enhance } from '$app/forms';
  import Alert from '$lib/components/Alert.svelte';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let prefs = $derived(data.preferences);
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

    {#if form?.success}
      <Alert type="success">✓ Preferences saved successfully</Alert>
    {/if}

    {#if form?.error}
      <Alert type="error">{form.error}</Alert>
    {/if}

    <!-- Preferences Form -->
    <form method="POST" action="?/update" use:enhance class="space-y-8">
      <!-- Watched Regions -->
      <section class="space-y-4">
        <div>
          <h2 class="text-xl font-semibold text-primary">Watched Regions</h2>
          <p class="mt-1 text-sm text-muted">
            Get notified when new listings appear in these regions
          </p>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          {#each data.regions as region (region)}
            <label
              class="flex items-center gap-3 rounded-lg border border-subtle bg-surface-card transition-colors p-3 transition hover:border-emerald-500"
            >
              <input
                type="checkbox"
                name="region_{region}"
                checked={prefs.watched_regions?.includes(region)}
                class="h-4 w-4 rounded border-subtle bg-surface-card transition-colors focus:ring-[color:rgba(52,211,153,0.35)] focus:ring-offset-0"
                style="color: var(--accent)"
              />
              <span class="text-secondary">{region}</span>
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
            name="max_distance_km"
            min="0"
            step="10"
            value={prefs.max_distance_km || ''}
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
                checked={prefs.email_frequency === option.value}
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
                checked={prefs.in_app_digest === option.value ||
                  (!prefs.in_app_digest && option.value === 'instant')}
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
              name="notify_new_listings"
              checked={prefs.notify_new_listings}
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
              name="notify_price_drops"
              checked={prefs.notify_price_drops}
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
              name="notify_new_messages"
              checked={prefs.notify_new_messages}
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
          class="rounded-lg bg-emerald-500 px-6 py-2 font-medium text-[var(--accent-contrast)] transition hover:bg-emerald-400"
        >
          Save Preferences
        </button>
      </div>
      <!-- eslint-enable svelte/no-navigation-without-resolve -->
    </form>
  </div>
</main>
