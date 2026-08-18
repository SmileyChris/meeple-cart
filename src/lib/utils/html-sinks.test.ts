import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { listFiles, repoRoot } from '../../test/files';

/**
 * `{@html}` is the app's only XSS sink. Every use must render a value produced by
 * `src/lib/utils/sanitize.ts`, so that adding a new sink without sanitising it fails here
 * rather than in production.
 */
const SANITISED =
  /\{@html\s+(sanitizeHtml|renderMarkdown|[A-Za-z0-9_$]*[Ss]anitized[A-Za-z0-9_$]*)\b/;

describe('{@html} sinks', () => {
  const files = listFiles(join(repoRoot, 'src'), ['.svelte']);

  it('finds svelte components to check', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('only renders sanitised values', () => {
    const violations: string[] = [];

    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      source.split('\n').forEach((line, index) => {
        if (!line.includes('{@html')) return;
        if (SANITISED.test(line)) return;
        violations.push(`${relative(repoRoot, file)}:${index + 1}: ${line.trim()}`);
      });
    }

    expect(violations).toEqual([]);
  });
});
