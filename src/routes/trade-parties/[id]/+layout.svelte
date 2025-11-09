<script lang="ts">
  import ThemeToggle from '$lib/components/ThemeToggle.svelte';
  import { page } from '$app/stores';

  let { children } = $props();

  let currentPath = $derived($page.url.pathname);
</script>

<!-- Private party layout - minimal navigation -->
<div class="flex min-h-screen flex-col bg-surface-body text-primary transition-colors">
  <!-- Minimal header -->
  <header class="border-b border-subtle bg-[color:var(--surface-header)] backdrop-blur transition-colors">
    <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
      <div class="flex items-center gap-3">
        <img src="/logo.png" alt="Meeple Cart" class="h-8" />
        <span class="text-lg font-semibold" style="font-family: var(--font-heading)">
          Trade Party
        </span>
      </div>

      <div class="flex items-center gap-3">
        <ThemeToggle />
      </div>
    </div>
  </header>

  <div class="flex-1">
    {@render children()}
  </div>

  <!-- Minimal footer -->
  <footer class="border-t border-subtle bg-surface-card py-6 transition-colors">
    <div class="mx-auto max-w-5xl px-4 text-center">
      <p class="text-sm text-muted">
        Powered by <a href="/" class="text-accent hover:underline">Meeple Cart</a>
      </p>
    </div>
  </footer>
</div>
