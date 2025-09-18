<script lang="ts">
  import type { ActionData } from './$types';
  export let form: ActionData;
</script>

<section
  class="mx-auto mt-16 max-w-md rounded-xl border border-slate-800 bg-slate-900/70 p-8 shadow-lg"
>
  <h1 class="text-2xl font-semibold text-slate-100">Log in</h1>
  <p class="mt-2 text-sm text-slate-400">Use the email and password you registered with.</p>

  <form class="mt-6 space-y-4" method="POST">
    <div class="space-y-2">
      <label class="block text-sm font-medium text-slate-200" for="email">Email</label>
      <input
        class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
        id="email"
        name="email"
        type="email"
        value={form?.email ?? ''}
        required
        autocomplete="email"
      />
    </div>

    <div class="space-y-2">
      <label class="block text-sm font-medium text-slate-200" for="password">Password</label>
      <input
        class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
        id="password"
        name="password"
        type="password"
        required
        autocomplete="current-password"
      />
    </div>

    {#if form?.invalid}
      <p class="text-sm text-rose-300">
        We couldn't find that account. Double-check your credentials.
      </p>
    {:else if form?.missing}
      <p class="text-sm text-rose-300">Please fill in both email and password.</p>
    {/if}

    <button
      class="w-full rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-900 transition hover:bg-emerald-400"
      type="submit"
    >
      Continue
    </button>
  </form>

  <p class="mt-6 text-sm text-slate-400">
    Need an account?
    <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
    <a class="text-emerald-300 hover:underline" href="/register">Create one</a>.
  </p>
</section>
