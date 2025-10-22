<script lang="ts">
  import type { PageData } from './$types';
  import '../app.css';
  import NotificationBell from '$lib/components/NotificationBell.svelte';
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';

  export let data: PageData;
</script>

<div class="min-h-screen bg-surface-body text-primary transition-colors">
  <header
    class="border-b border-subtle bg-[color:var(--surface-header)] backdrop-blur transition-colors"
  >
    <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
      <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
      <a class="text-lg font-semibold transition-colors hover:text-[var(--accent)]" href="/">
        Meeple Cart
      </a>
      <!-- eslint-disable svelte/no-navigation-without-resolve -->
      <nav class="flex items-center gap-3 text-sm">
        <a class="btn-ghost" href="/activity"> Activity </a>
        <a class="btn-ghost" href="/cascades"> 🎁 Gift Cascades </a>
        <ThemeToggle />
        {#if data.user}
          <NotificationBell unreadCount={data.unreadNotifications} />
          <a class="btn-ghost" href="/watchlist"> ⭐ Watchlist </a>
          <a class="btn-ghost" href="/messages"> 💬 Messages </a>
          <a class="btn-ghost" href="/profile">
            {data.user.display_name ?? 'Profile'}
          </a>
          <a class="btn-primary" href="/listings/new"> New listing </a>
          <form method="post" action="/logout">
            <button class="btn-ghost" type="submit"> Log out </button>
          </form>
        {:else}
          <a class="btn-ghost" href="/login"> Log in </a>
          <a class="btn-primary" href="/register"> Create account </a>
        {/if}
      </nav>
      <!-- eslint-enable svelte/no-navigation-without-resolve -->
    </div>
  </header>

  <slot />
</div>
