import { describe, expect, it } from 'vitest';
import { NZ_REGIONS, REGION_LABELS } from './regions';

describe('region constants', () => {
  it('includes expected NZ regions in display order', () => {
    const regionValues = NZ_REGIONS.map((region) => region.value);
    expect(regionValues).toContain('auckland');
    expect(regionValues).toContain('wellington');
    expect(NZ_REGIONS[0]).toEqual({ value: '', label: 'No restriction' });
  });

  it('derives region labels map from region definitions', () => {
    expect(REGION_LABELS.auckland).toBe('Auckland');
    expect(REGION_LABELS.wellington).toBe('Wellington');
    expect(REGION_LABELS.nz).toBe('All of NZ');
  });
});
