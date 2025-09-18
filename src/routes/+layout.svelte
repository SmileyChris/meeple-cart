<script lang="ts">
  import type { PageData } from './$types';
  import '../app.css';

  export let data: PageData;
</script>

<div class="min-h-screen bg-slate-950 text-slate-100">
  <header class="bg-slate-950/80 backdrop-blur border-b border-slate-800">
    <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
      <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
      <a class="text-lg font-semibold hover:text-emerald-300" href="/">Meeple Cart</a>
      <!-- eslint-disable svelte/no-navigation-without-resolve -->
      <nav class="flex items-center gap-3 text-sm">
        {#if data.user}
          <a
            class="rounded-full border border-slate-700 px-3 py-1.5 transition hover:border-emerald-500 hover:text-emerald-300"
            href="/profile"
          >
            {data.user.display_name ?? 'Profile'}
          </a>
          <a
            class="rounded-full border border-emerald-500 bg-emerald-500/10 px-3 py-1.5 text-emerald-200 transition hover:bg-emerald-500/20"
            href="/listings/new"
          >
            New listing
          </a>
          <form method="post" action="/logout">
            <button
              class="rounded-full border border-slate-700 px-3 py-1.5 transition hover:border-rose-500 hover:text-rose-200"
              type="submit"
            >
              Log out
            </button>
          </form>
        {:else}
          <a
            class="rounded-full border border-slate-700 px-3 py-1.5 transition hover:border-emerald-500 hover:text-emerald-300"
            href="/login"
          >
            Log in
          </a>
          <a
            class="rounded-full border border-emerald-500 bg-emerald-500/10 px-3 py-1.5 text-emerald-200 transition hover:bg-emerald-500/20"
            href="/register"
          >
            Create account
          </a>
        {/if}
      </nav>
      <!-- eslint-enable svelte/no-navigation-without-resolve -->
    </div>
  </header>

  <slot />
</div>
