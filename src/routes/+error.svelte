<script lang="ts">
  import { page } from '$app/stores';

  let status = $derived($page.status);
  let message = $derived($page.error?.message ?? 'An unexpected error occurred');

  const errorTitles: Record<number, string> = {
    404: 'Page Not Found',
    403: 'Forbidden',
    500: 'Internal Server Error',
    503: 'Service Unavailable',
  };

  const errorDescriptions: Record<number, string> = {
    404: "The page you're looking for doesn't exist. It may have been moved or deleted.",
    403: "You don't have permission to access this page.",
    500: 'Something went wrong on our end. Please try again later.',
    503: 'The service is temporarily unavailable. Please try again in a few moments.',
  };

  let title = $derived(errorTitles[status] || 'Error');
  let description = $derived(errorDescriptions[status] || message);
</script>

<svelte:head>
  <title>{status} - {title} · Meeple Cart</title>
</svelte:head>

<main class="flex items-center justify-center bg-surface-body px-6 py-12 transition-colors">
  <div class="mx-auto max-w-2xl text-center">
    <!-- Decorative Logo -->
    <div class="mb-8 flex justify-center">
      <img src="/logo.png" alt="Meeple Cart" class="h-32 w-32 opacity-20" />
    </div>

    <!-- Error Status -->
    <h1 class="mb-4 text-8xl font-bold text-primary opacity-50">{status}</h1>

    <!-- Error Title -->
    <h2 class="mb-6 text-3xl font-semibold text-primary">{title}</h2>

    <!-- Error Description -->
    <p class="mb-10 text-lg text-secondary">
      {description}
    </p>

    <!-- Action Buttons -->
    <div class="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
      <!-- eslint-disable svelte/no-navigation-without-resolve -->
      <a
        href="/"
        class="inline-flex items-center gap-2 rounded-lg border border-emerald-500 bg-emerald-500 px-6 py-3 font-semibold text-[var(--accent-contrast)] shadow-[0_10px_25px_rgba(16,185,129,0.25)] transition hover:bg-emerald-400"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
        Go Home
      </a>

      <button
        type="button"
        onclick={() => window.history.back()}
        class="inline-flex items-center gap-2 rounded-lg border border-subtle bg-surface-card px-6 py-3 font-semibold text-secondary transition hover:border-emerald-500 hover:bg-surface-panel hover:text-emerald-200"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        Go Back
      </button>
      <!-- eslint-enable svelte/no-navigation-without-resolve -->
    </div>

    <!-- Helpful Links -->
    {#if status === 404}
      <div class="mt-12 border-t border-subtle pt-8">
        <p class="mb-4 text-sm text-muted">Looking for something specific?</p>
        <div class="flex flex-wrap justify-center gap-3 text-sm">
          <a href="/games" class="text-[var(--accent)] hover:underline"> Browse Games </a>
          <span class="text-muted">·</span>
          <a href="/cascades" class="text-[var(--accent)] hover:underline"> Gift Cascades </a>
          <span class="text-muted">·</span>
          <a href="/messages" class="text-[var(--accent)] hover:underline"> Messages </a>
        </div>
      </div>
    {/if}
  </div>
</main>
