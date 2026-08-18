import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/** Repository root, resolved from this file's location. */
export const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/**
 * Recursively list files under `dir` whose name ends with one of `extensions`.
 *
 * `node:fs.globSync` would be simpler but is not present in the @types/node version this
 * project pins, so `npm run check` rejects it.
 */
export function listFiles(dir: string, extensions: string[]): string[] {
  const found: string[] = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      found.push(...listFiles(path, extensions));
      continue;
    }

    if (extensions.some((ext) => entry.name.endsWith(ext))) {
      found.push(path);
    }
  }

  return found;
}

/** Application source files, excluding tests. */
export function sourceFiles(): string[] {
  return listFiles(join(repoRoot, 'src'), ['.ts', '.svelte']).filter(
    (f) => !f.endsWith('.test.ts') && !f.endsWith('.spec.ts')
  );
}
