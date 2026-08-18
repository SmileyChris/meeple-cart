import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { repoRoot, sourceFiles } from '../../test/files';

/**
 * `notifications.type` is a select field, so PocketBase rejects any value not in its list.
 * The trade flow sends types the schema never knew about, which meant those writes failed
 * even once the create rule allowed them.
 */

type Collection = {
  fields: { name: string; type: string; required: boolean; values?: string[] }[];
};

const schema: Record<string, Collection> = JSON.parse(
  readFileSync(join(repoRoot, 'pocketbase/schema/effective-rules.json'), 'utf8')
);

function typesUsedInSource(): string[] {
  const used = new Set<string>();
  for (const file of sourceFiles()) {
    const source = readFileSync(file, 'utf8');
    // Match the `type:` key inside a notifications create payload.
    for (const match of source.matchAll(
      /collection\(\s*['"]notifications['"]\s*\)\s*\.\s*create[\s\S]{0,400}?\btype:\s*['"]([a-z0-9_]+)['"]/g
    )) {
      used.add(match[1]);
    }
  }
  return [...used].sort();
}

describe('notification types', () => {
  const field = schema.notifications.fields.find((f) => f.name === 'type');

  it('is a select field with declared values', () => {
    expect(field?.type).toBe('select');
    expect(field?.values?.length).toBeGreaterThan(0);
  });

  it('accepts every type the client sends', () => {
    const used = typesUsedInSource();
    expect(used.length).toBeGreaterThan(0);

    const missing = used.filter((t) => !field?.values?.includes(t));
    expect(missing).toEqual([]);
  });
});
