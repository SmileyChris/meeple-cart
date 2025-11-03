<script lang="ts">
  interface Props {
    type?: 'error' | 'success' | 'warning' | 'info';
    children?: import('svelte').Snippet;
  }

  let { type = 'info', children }: Props = $props();
</script>

<div class="alert alert-{type}">
  {#if children}
    {@render children()}
  {/if}
</div>
