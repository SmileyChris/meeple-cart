<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    href,
    imageUrl,
    imageAlt,
    borderClass = 'border border-subtle group-hover:border-[var(--accent)]',
    header,
    content,
    footer,
  }: {
    href: string;
    imageUrl: string | null;
    imageAlt: string;
    borderClass?: string;
    header?: Snippet;
    content: Snippet;
    footer?: Snippet;
  } = $props();
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -->
<div
  class="group block cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-body)]"
  role="link"
  tabindex="0"
  onclick={() => (window.location.href = href)}
  onkeydown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      window.location.href = href;
    }
  }}
>
  <article
    class="flex flex-col overflow-hidden rounded-xl bg-surface-card shadow-elevated transition-all group-hover:scale-[1.02] group-hover:shadow-lg {borderClass}"
  >
    <!-- Image Section -->
    {#if imageUrl}
      <img
        alt={imageAlt}
        class="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
        src={imageUrl}
        loading="lazy"
      />
    {:else}
      <div
        class="flex h-48 w-full items-center justify-center bg-surface-card-alt transition-colors"
      >
        <img src="/logo.png" alt="" class="h-32 w-32 opacity-20" />
      </div>
    {/if}

    <!-- Content Section -->
    <div class="flex flex-1 flex-col gap-4 p-5">
      <!-- Header slot (badges, metadata) -->
      {#if header}
        {@render header()}
      {/if}

      <!-- Main content slot -->
      {@render content()}

      <!-- Footer slot (location, additional info) -->
      {#if footer}
        <div class="mt-auto">
          {@render footer()}
        </div>
      {/if}
    </div>
  </article>
</div>
<!-- eslint-enable svelte/no-navigation-without-resolve -->
