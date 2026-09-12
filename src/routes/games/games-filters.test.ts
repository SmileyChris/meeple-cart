import { describe, expect, it } from 'vitest';
import {
  buildItemsFilter,
  formatResultsCount,
  mapSortToPocketBaseSort,
  resolveGameSort,
} from './+page';

describe('buildItemsFilter', () => {
  const base = { regions: [] as string[], search: '', condition: '', canPost: false };

  it('always scopes to active listings', () => {
    expect(buildItemsFilter(base)).toBe('listing.status = "active"');
  });

  it('adds the can_post back-relation filter whenever canPost is on, with no region filter set', () => {
    const filter = buildItemsFilter({ ...base, canPost: true });

    expect(filter).toBe('listing.status = "active" && offer_templates_via_items.can_post = true');
  });

  it('adds canPost independently of the region filter (both present together)', () => {
    const filter = buildItemsFilter({ ...base, regions: ['auckland'], canPost: true });

    expect(filter).toContain('offer_templates_via_items.can_post = true');
    expect(filter).toContain('listing.regions ~ "auckland"');
  });

  it('OR-combines multiple regions in a parenthesized group', () => {
    const filter = buildItemsFilter({ ...base, regions: ['auckland', 'wellington'] });

    expect(filter).toBe(
      'listing.status = "active" && (listing.regions ~ "auckland" || listing.regions ~ "wellington")'
    );
  });

  it('escapes quotes and strips newlines from search text', () => {
    const filter = buildItemsFilter({ ...base, search: 'say "hi"\nthere' });

    expect(filter).toBe('listing.status = "active" && title ~ "say \\"hi\\" there"');
  });

  it('filters to an exact match for "mint" condition', () => {
    const filter = buildItemsFilter({ ...base, condition: 'mint' });

    expect(filter).toBe('listing.status = "active" && condition = "mint"');
  });

  it('filters to the condition and everything better for a lower minimum', () => {
    const filter = buildItemsFilter({ ...base, condition: 'good' });

    expect(filter).toBe(
      'listing.status = "active" && (condition = "good" || condition = "excellent" || condition = "mint")'
    );
  });

  it('combines every active filter with &&', () => {
    const filter = buildItemsFilter({
      regions: ['auckland'],
      search: 'catan',
      condition: 'excellent',
      canPost: true,
    });

    expect(filter).toBe(
      'listing.status = "active" && (listing.regions ~ "auckland") && title ~ "catan" && (condition = "excellent" || condition = "mint") && offer_templates_via_items.can_post = true'
    );
  });
});

describe('resolveGameSort', () => {
  it('defaults to newest for missing or unknown values', () => {
    expect(resolveGameSort(null)).toBe('newest');
    expect(resolveGameSort('bogus')).toBe('newest');
  });

  it('accepts title', () => {
    expect(resolveGameSort('title')).toBe('title');
  });

  it('rejects the removed price option, falling back to newest', () => {
    expect(resolveGameSort('price')).toBe('newest');
  });
});

describe('mapSortToPocketBaseSort', () => {
  it('maps newest to -created', () => {
    expect(mapSortToPocketBaseSort('newest')).toBe('-created');
  });

  it('maps title to ascending title', () => {
    expect(mapSortToPocketBaseSort('title')).toBe('title');
  });
});

describe('formatResultsCount', () => {
  it('uses singular phrasing for exactly one match', () => {
    expect(formatResultsCount(1)).toBe('1 game matches');
  });

  it('uses plural phrasing otherwise, including zero', () => {
    expect(formatResultsCount(0)).toBe('0 games match');
    expect(formatResultsCount(42)).toBe('42 games match');
  });

  it('reflects the total match count, not a page size', () => {
    // e.g. 120 total results paginated 50-at-a-time should still report 120
    expect(formatResultsCount(120)).toBe('120 games match');
  });
});
