import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { relative } from 'node:path';
import { repoRoot, sourceFiles } from '../../test/files';

/**
 * Reputation counters are maintained by pb_hooks and denied at the rule level. Any client
 * code that still writes them is dead code that will 403 mid-flow — which is exactly how
 * trade completion and vouching broke. This test keeps it from coming back.
 */
const PROTECTED_USER_FIELDS = [
  'trade_count',
  'vouch_count',
  'cascade_reputation',
  'cascades_seeded',
  'cascades_received',
  'cascades_passed',
  'cascades_broken',
  'phone_verified',
];

const USERS_WRITE = /collection\(\s*['"]users['"]\s*\)\s*\.\s*(create|update)\s*\(/;

describe('client writes to the users collection', () => {
  const files = sourceFiles();

  it('finds source files to check', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('never writes reputation counters', () => {
    const violations: string[] = [];

    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      // Deliberately coarse: any file that writes the users collection and also mentions a
      // protected field as an object key is treated as a write. Payloads are often built in
      // a separate variable, and a false positive here is cheap to resolve.
      if (!USERS_WRITE.test(source)) continue;

      for (const field of PROTECTED_USER_FIELDS) {
        if (new RegExp(`\\b${field}\\s*:`).test(source)) {
          violations.push(`${relative(repoRoot, file)} writes ${field}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
