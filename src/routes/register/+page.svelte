<script lang="ts">
  import type { ActionData } from './$types';
  export let form: ActionData;
</script>

<section
  class="mx-auto mt-16 max-w-md rounded-xl border border-subtle bg-surface-panel p-8 shadow-elevated transition-colors"
>
  <h1 class="text-2xl font-semibold text-primary">Create your account</h1>
  <p class="mt-2 text-sm text-muted">Sign up with an email address to start trading.</p>

  <form class="mt-6 space-y-4" method="POST">
    <div class="space-y-2">
      <label class="block text-sm font-medium text-secondary" for="display_name">Full name</label>
      <input
        class="w-full rounded-lg border border-subtle bg-surface-card px-3 py-2 text-primary transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
        id="display_name"
        name="display_name"
        type="text"
        minlength="2"
        maxlength="64"
        value={form?.display_name ?? ''}
        required
        autocomplete="name"
      />
    </div>

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
        minlength="10"
        required
        autocomplete="new-password"
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
        required
        autocomplete="new-password"
      />
    </div>

    {#if form?.missing}
      <p class="text-sm text-rose-400">Please fill all fields.</p>
    {:else if form?.mismatch}
      <p class="text-sm text-rose-400">Passwords must match.</p>
    {:else if form?.error}
      <p class="text-sm text-rose-400">{form.error}</p>
    {/if}

    <button class="btn-primary w-full" type="submit">
      Sign up
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
