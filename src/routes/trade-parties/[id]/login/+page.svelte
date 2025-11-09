<script lang="ts">
  import { goto } from '$app/navigation';
  import { pb, currentUser } from '$lib/pocketbase';
  import { page } from '$app/stores';

  let { data } = $props();

  let email = $state('');
  let password = $state('');
  let isSubmitting = $state(false);
  let error = $state('');

  // Get party ID from URL
  let partyId = $derived($page.params.id);

  // Redirect if already logged in
  $effect(() => {
    if ($currentUser) {
      goto(`/trade-parties/${partyId}`);
    }
  });

  async function handleLogin(e: Event) {
    e.preventDefault();

    isSubmitting = true;
    error = '';

    try {
      await pb.collection('users').authWithPassword(email, password);
      // Redirect to party page on success
      goto(`/trade-parties/${partyId}`);
    } catch (err: any) {
      console.error('Login failed:', err);
      error = 'Invalid email or password. Please try again.';
    } finally {
      isSubmitting = false;
    }
  }
</script>

<svelte:head>
  <title>Sign In · Trade Party</title>
</svelte:head>

<div class="mx-auto max-w-md px-4 py-16">
  <!-- Header -->
  <div class="mb-8 text-center">
    <h1 class="mb-2 text-3xl font-bold text-primary">Sign In</h1>
    <p class="text-secondary">
      Sign in to view and participate in this trade party
    </p>
  </div>

  <!-- Login Form -->
  <form onsubmit={handleLogin} class="rounded-lg border border-subtle bg-surface-card p-6">
    {#if error}
      <div class="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
        <p class="text-sm text-red-200">{error}</p>
      </div>
    {/if}

    <div class="space-y-4">
      <!-- Email -->
      <div>
        <label for="email" class="mb-2 block text-sm font-medium text-primary">
          Email
        </label>
        <input
          type="email"
          id="email"
          bind:value={email}
          required
          autocomplete="email"
          placeholder="your@email.com"
          class="w-full rounded-lg border border-subtle bg-surface-body px-4 py-2 text-primary placeholder-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </div>

      <!-- Password -->
      <div>
        <label for="password" class="mb-2 block text-sm font-medium text-primary">
          Password
        </label>
        <input
          type="password"
          id="password"
          bind:value={password}
          required
          autocomplete="current-password"
          placeholder="••••••••"
          class="w-full rounded-lg border border-subtle bg-surface-body px-4 py-2 text-primary placeholder-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </div>
    </div>

    <!-- Submit Button -->
    <button
      type="submit"
      disabled={isSubmitting}
      class="mt-6 w-full rounded-lg border border-accent bg-accent px-6 py-2 font-semibold text-surface-body transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isSubmitting ? 'Signing in...' : 'Sign In'}
    </button>
  </form>

  <!-- Additional Links -->
  <div class="mt-6 space-y-3 text-center text-sm">
    <p class="text-secondary">
      Don't have an account?{' '}
      <a href="/register?redirect=/trade-parties/{partyId}" class="text-accent hover:underline">
        Create one
      </a>
    </p>
    <p class="text-secondary">
      <a href="/reset-password" class="text-accent hover:underline">
        Forgot your password?
      </a>
    </p>
  </div>

  <!-- Info Box -->
  <div class="mt-8 rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
    <p class="text-sm text-blue-200">
      <strong>Note:</strong> You need a Meeple Cart account to participate in trade parties. Creating an account is free and takes less than a minute.
    </p>
  </div>
</div>
