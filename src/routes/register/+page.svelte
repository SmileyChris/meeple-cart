<script lang="ts">
  import { currentUser, pb } from '$lib/pocketbase';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let displayName = '';
  let email = '';
  let password = '';
  let passwordConfirm = '';
  let error: string | null = null;
  let loading = false;

  const DEFAULT_NOTIFICATION_PREFS = {
    messages: true,
    trades: true,
  };

  // Redirect if already logged in
  onMount(() => {
    if ($currentUser) {
      goto('/profile');
    }
  });

  async function handleSubmit(e: Event) {
    e.preventDefault();
    error = null;

    if (!email || !password || !passwordConfirm || !displayName) {
      error = 'Please fill all fields.';
      return;
    }

    if (password !== passwordConfirm) {
      error = 'Passwords must match.';
      return;
    }

    loading = true;
    try {
      await pb.collection('users').create({
        email: email.trim().toLowerCase(),
        password,
        passwordConfirm,
        display_name: displayName.trim(),
        preferred_contact: 'platform',
        trade_count: 0,
        vouch_count: 0,
        joined_date: new Date().toISOString(),
        notification_prefs: DEFAULT_NOTIFICATION_PREFS,
        cascades_seeded: 0,
        cascades_received: 0,
        cascades_passed: 0,
        cascades_broken: 0,
        cascade_reputation: 50,
        can_enter_cascades: true,
      });

      // Auto-login after registration
      await currentUser.login(email.trim().toLowerCase(), password);
      goto('/profile');
    } catch (err: any) {
      console.error('Registration failed', err);

      // Extract PocketBase error message if available
      let errorMessage = 'Unable to create account, please check the details and try again.';
      if (err?.response?.data) {
        const data = err.response.data;
        if (data.message) {
          errorMessage = data.message;
        } else if (data.email) {
          errorMessage = 'This email is already registered.';
        }
      }
      error = errorMessage;
    } finally {
      loading = false;
    }
  }
</script>

<section
  class="mx-auto mt-16 max-w-md rounded-xl border border-subtle bg-surface-panel p-8 shadow-elevated transition-colors"
>
  <h1 class="text-2xl font-semibold text-primary">Create your account</h1>
  <p class="mt-2 text-sm text-muted">Sign up with an email address to start trading.</p>

  <form class="mt-6 space-y-4" on:submit={handleSubmit}>
    <div class="space-y-2">
      <label class="block text-sm font-medium text-secondary" for="display_name">Full name</label>
      <input
        class="w-full rounded-lg border border-subtle bg-surface-card px-3 py-2 text-primary transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
        id="display_name"
        name="display_name"
        type="text"
        minlength="2"
        maxlength="64"
        bind:value={displayName}
        required
        autocomplete="name"
        disabled={loading}
      />
    </div>

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
        minlength="10"
        bind:value={password}
        required
        autocomplete="new-password"
        disabled={loading}
      />
      <p class="text-xs text-muted">Use at least 10 characters.</p>
    </div>

    <div class="space-y-2">
      <label class="block text-sm font-medium text-secondary" for="passwordConfirm"
        >Confirm password</label
      >
      <input
        class="w-full rounded-lg border border-subtle bg-surface-card px-3 py-2 text-primary transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
        id="passwordConfirm"
        name="passwordConfirm"
        type="password"
        minlength="10"
        bind:value={passwordConfirm}
        required
        autocomplete="new-password"
        disabled={loading}
      />
    </div>

    {#if error}
      <p class="text-sm text-rose-400">{error}</p>
    {/if}

    <button class="btn-primary w-full" type="submit" disabled={loading}>
      {loading ? 'Creating account...' : 'Sign up'}
    </button>
  </form>

  <p class="mt-6 text-sm text-muted">
    Already registered?
    <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
    <a class="transition-colors hover:underline" style="color: var(--accent)" href="/login"
      >Log in</a
    >.
  </p>
</section>
