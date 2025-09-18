import { describe, expect, it } from 'vitest';
import { serializeNonPOJOs } from './object';

describe('serializeNonPOJOs', () => {
  it('clones nested objects', () => {
    const original = { nested: { value: 42 } };
    const cloned = serializeNonPOJOs(original);

    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned.nested).not.toBe(original.nested);
  });

  it('passes through null and undefined', () => {
    expect(serializeNonPOJOs(null)).toBeNull();
    expect(serializeNonPOJOs(undefined)).toBeUndefined();
  });
});
