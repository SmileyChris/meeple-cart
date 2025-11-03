<script lang="ts">
  import { currentUser } from '$lib/pocketbase';
  import { goto } from '$app/navigation';

  let loggingOut = $state(false);

  async function handleLogout() {
    loggingOut = true;
    try {
      currentUser.logout();
      await goto('/');
    } catch (error) {
      console.error('Logout error:', error);
      loggingOut = false;
    }
  }
</script>

<svelte:head>
  <title>Log Out · Meeple Cart</title>
  <meta name="description" content="Log out of your Meeple Cart account" />
</svelte:head>

<main class="bg-surface-body px-6 py-16 text-primary transition-colors sm:px-8">
  <div class="mx-auto max-w-md space-y-8">
    <div
      class="rounded-xl border border-subtle bg-surface-card p-8 text-center transition-colors space-y-6"
    >
      <div class="space-y-2">
        <h1 class="text-2xl font-semibold">Log Out</h1>
        <p class="text-sm text-secondary">Are you sure you want to log out of your account?</p>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          onclick={handleLogout}
          disabled={loggingOut}
          class="btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loggingOut ? 'Logging out...' : 'Yes, log out'}
        </button>

        <a href="/profile" class="btn-ghost px-6 py-2"> Cancel </a>
      </div>
    </div>

    {#if $currentUser}
      <p class="text-center text-sm text-muted">
        Logged in as <span class="text-secondary font-medium">{$currentUser.display_name}</span>
      </p>
    {/if}
  </div>
</main>
