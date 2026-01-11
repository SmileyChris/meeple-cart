<script lang="ts">
  import { onMount } from 'svelte';

  type Theme = 'light' | 'dark';

  let theme = $state<Theme>('dark');

  const storageKey = 'meeple-theme';

  const applyTheme = (next: Theme) => {
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
    localStorage.setItem(storageKey, next);
  };

  onMount(() => {
    const root = document.documentElement;
    const attr = root.dataset.theme;
    if (attr === 'light' || attr === 'dark') {
      theme = attr;
    } else {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    applyTheme(theme);
  });

  const toggleTheme = () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(theme);
  };
</script>

<button
  class="btn-ghost gap-2"
  type="button"
  onclick={toggleTheme}
  aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
>
  {#if theme === 'dark'}
    <span aria-hidden="true">🌙</span>
    <span class="text-sm font-medium">Dark Mode</span>
  {:else}
    <span aria-hidden="true">☀️</span>
    <span class="text-sm font-medium">Light Mode</span>
  {/if}
</button>
