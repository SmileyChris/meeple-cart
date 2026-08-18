import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { listFiles, repoRoot, sourceFiles } from '../../test/files';

/**
 * Every collection the client talks to must be created by a migration, otherwise the
 * feature is dead code against a freshly migrated database and the route 404s at runtime.
 */

// Collection names that only ever appear inside test doubles.
const TEST_ONLY = new Set(['any']);

function collectionsUsedInSource(): Map<string, string[]> {
  const used = new Map<string, string[]>();
  for (const file of sourceFiles()) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(/\.collection[<(]?[^('"]*\(\s*['"]([a-z0-9_]+)['"]/g)) {
      const name = match[1];
      if (TEST_ONLY.has(name)) continue;
      used.set(name, [...(used.get(name) ?? []), file]);
    }
  }
  return used;
}

function collectionsDefinedInMigrations(): Set<string> {
  const defined = new Set<string>();
  const files = listFiles(join(repoRoot, 'pocketbase/pb_migrations'), ['.js']);

  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(/name:\s*['"]([a-z0-9_]+)['"]/g)) {
      defined.add(match[1]);
    }
    for (const match of source.matchAll(/findCollectionByNameOrId\(\s*['"]([a-z0-9_]+)['"]/g)) {
      defined.add(match[1]);
    }
  }
  return defined;
}

describe('PocketBase schema coverage', () => {
  const used = collectionsUsedInSource();
  const defined = collectionsDefinedInMigrations();

  it('finds collection usages to check', () => {
    expect(used.size).toBeGreaterThan(10);
  });

  it('has a migration for every collection the client queries', () => {
    const missing = [...used.keys()].filter((name) => !defined.has(name)).sort();
    expect(missing).toEqual([]);
  });
});
