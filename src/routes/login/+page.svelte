<script lang="ts">
  import type { ActionData } from './$types';
  export let form: ActionData;
</script>

<section
  class="mx-auto mt-16 max-w-md rounded-xl border border-subtle bg-surface-panel p-8 shadow-elevated transition-colors"
>
  <h1 class="text-2xl font-semibold text-primary">Log in</h1>
  <p class="mt-2 text-sm text-muted">Use the email and password you registered with.</p>

  <form class="mt-6 space-y-4" method="POST">
    <div class="space-y-2">
      <label class="block text-sm font-medium text-secondary" for="email">Email</label>
      <input
        class="w-full rounded-lg border border-subtle bg-surface-card px-3 py-2 text-primary transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
        id="email"
        name="email"
        type="email"
        value={form?.email ?? ''}
        required
        autocomplete="email"
      />
    </div>

    <div class="space-y-2">
      <label class="block text-sm font-medium text-secondary" for="password">Password</label>
      <input
        class="w-full rounded-lg border border-subtle bg-surface-card px-3 py-2 text-primary transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
        id="password"
        name="password"
        type="password"
        required
        autocomplete="current-password"
      />
    </div>

    {#if form?.invalid}
      <p class="text-sm text-rose-400">
        We couldn't find that account. Double-check your credentials.
      </p>
    {:else if form?.missing}
      <p class="text-sm text-rose-400">Please fill in both email and password.</p>
    {/if}

    <button class="btn-primary w-full" type="submit">
      Continue
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
