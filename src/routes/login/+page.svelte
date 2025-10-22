<script lang="ts">
  import { currentUser } from '$lib/pocketbase';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let email = '';
  let password = '';
  let error: string | null = null;
  let loading = false;

  // Redirect if already logged in
  onMount(() => {
    if ($currentUser) {
      goto('/profile');
    }
  });

  async function handleSubmit(e: Event) {
    e.preventDefault();
    error = null;

    if (!email || !password) {
      error = 'Please fill in both email and password.';
      return;
    }

    loading = true;
    try {
      await currentUser.login(email, password);
      goto('/profile');
    } catch (err) {
      console.error('Login failed', err);
      error = "We couldn't find that account. Double-check your credentials.";
    } finally {
      loading = false;
    }
  }
</script>

<section
  class="mx-auto mt-16 max-w-md rounded-xl border border-subtle bg-surface-panel p-8 shadow-elevated transition-colors"
>
  <h1 class="text-2xl font-semibold text-primary">Log in</h1>
  <p class="mt-2 text-sm text-muted">Use the email and password you registered with.</p>

  <form class="mt-6 space-y-4" on:submit={handleSubmit}>
    <div class="space-y-2">
      <label class="block text-sm font-medium text-secondary" for="email">Email</label>
      <input
        class="w-full rounded-lg border border-subtle bg-surface-card px-3 py-2 text-primary transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
        id="email"
        name="email"
        type="email"
        bind:value={email}
        required
        autocomplete="email"
        disabled={loading}
      />
    </div>

    <div class="space-y-2">
      <label class="block text-sm font-medium text-secondary" for="password">Password</label>
      <input
        class="w-full rounded-lg border border-subtle bg-surface-card px-3 py-2 text-primary transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
        id="password"
        name="password"
        type="password"
        bind:value={password}
        required
        autocomplete="current-password"
        disabled={loading}
      />
    </div>

    {#if error}
      <p class="text-sm text-rose-400">{error}</p>
    {/if}

    <button class="btn-primary w-full" type="submit" disabled={loading}>
      {loading ? 'Logging in...' : 'Continue'}
    </button>
  </form>

  <p class="mt-6 text-sm text-muted">
    Need an account?
    <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
    <a class="transition-colors hover:underline" style="color: var(--accent)" href="/register"
      >Create one</a
    >.
  </p>
</section>
