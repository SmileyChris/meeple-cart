<script lang="ts">
  import { marked } from 'marked';

  let {
    value = $bindable(''),
    placeholder = 'Write your message in markdown...',
    rows = 6,
    maxlength = 10000,
  }: {
    value?: string;
    placeholder?: string;
    rows?: number;
    maxlength?: number;
  } = $props();

  let showPreview = $state(false);

  // Configure marked for safety
  marked.setOptions({
    breaks: true,
    gfm: true,
  });

  let renderedMarkdown = $derived(
    showPreview
      ? marked.parse(value, { async: false }) as string
      : ''
  );
</script>

<div class="space-y-2">
  <!-- Tab buttons -->
  <div class="flex gap-2 border-b border-subtle">
    <button
      type="button"
      onclick={() => (showPreview = false)}
      class="px-4 py-2 text-sm font-medium transition {!showPreview
        ? 'border-b-2 border-emerald-500 text-primary'
        : 'text-secondary hover:text-primary'}"
    >
      ✏️ Write
    </button>
    <button
      type="button"
      onclick={() => (showPreview = true)}
      class="px-4 py-2 text-sm font-medium transition {showPreview
        ? 'border-b-2 border-emerald-500 text-primary'
        : 'text-secondary hover:text-primary'}"
    >
      👁️ Preview
    </button>
  </div>

  <!-- Editor/Preview -->
  {#if !showPreview}
    <textarea
      bind:value
      {placeholder}
      {rows}
      {maxlength}
      class="w-full rounded-lg border border-subtle bg-surface-body px-3 py-2 font-mono text-sm text-primary transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[color:rgba(52,211,153,0.35)]"
    ></textarea>
  {:else}
    <div
      class="prose prose-invert min-h-[150px] w-full rounded-lg border border-subtle bg-surface-body px-3 py-2 text-sm text-primary"
    >
      {#if value.trim()}
        {@html renderedMarkdown}
      {:else}
        <p class="text-muted italic">Nothing to preview</p>
      {/if}
    </div>
  {/if}

  <!-- Help text -->
  <div class="flex items-center justify-between text-xs text-muted">
    <div class="space-x-4">
      <span><strong>**bold**</strong></span>
      <span><em>*italic*</em></span>
      <span><code>`code`</code></span>
      <span>[link](url)</span>
    </div>
    <span>{value.length}/{maxlength}</span>
  </div>
</div>

<style>
  :global(.prose) {
    max-width: none;
  }

  :global(.prose h1),
  :global(.prose h2),
  :global(.prose h3) {
    color: var(--text-primary);
    font-weight: 600;
  }

  :global(.prose a) {
    color: var(--accent);
    text-decoration: none;
  }

  :global(.prose a:hover) {
    text-decoration: underline;
  }

  :global(.prose code) {
    background: var(--surface-card-alt);
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    font-size: 0.875em;
  }

  :global(.prose pre) {
    background: var(--surface-card-alt);
    padding: 1rem;
    border-radius: 0.5rem;
    overflow-x: auto;
  }

  :global(.prose pre code) {
    background: none;
    padding: 0;
  }

  :global(.prose ul),
  :global(.prose ol) {
    padding-left: 1.5rem;
  }

  :global(.prose blockquote) {
    border-left: 4px solid var(--accent);
    padding-left: 1rem;
    font-style: italic;
    color: var(--text-secondary);
  }
</style>
