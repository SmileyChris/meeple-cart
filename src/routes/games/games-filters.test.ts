import { describe, expect, it } from 'vitest';
import {
  buildItemsFilter,
  formatResultsCount,
  mapSortToPocketBaseSort,
  resolveGameSort,
  sortActivitiesByPrice,
  type GameActivityItem,
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

  it('accepts price and title', () => {
    expect(resolveGameSort('price')).toBe('price');
    expect(resolveGameSort('title')).toBe('title');
  });
});

describe('mapSortToPocketBaseSort', () => {
  it('maps newest to -created', () => {
    expect(mapSortToPocketBaseSort('newest')).toBe('-created');
  });

  it('maps title to ascending title', () => {
    expect(mapSortToPocketBaseSort('title')).toBe('title');
  });

  it('falls back to -created for price (sorted client-side instead)', () => {
    expect(mapSortToPocketBaseSort('price')).toBe('-created');
  });
});

describe('sortActivitiesByPrice', () => {
  const listing = (id: string, price: number | null): GameActivityItem => ({
    id,
    activityType: 'listing',
    gameTitle: id,
    bggId: null,
    condition: 'good',
    timestamp: '2024-01-01',
    userName: null,
    userId: null,
    userJoinedDate: null,
    userVouchedTrades: 0,
    userLocation: null,
    listingHref: `/listings/${id}`,
    thumbnail: null,
    listingRegions: [],
    year: null,
    price,
  });

  it('sorts ascending by price', () => {
    const sorted = sortActivitiesByPrice([listing('c', 300), listing('a', 100), listing('b', 200)]);

    expect(sorted.map((a) => a.id)).toEqual(['a', 'b', 'c']);
  });

  it('places items with no price last', () => {
    const sorted = sortActivitiesByPrice([listing('a', null), listing('b', 100)]);

    expect(sorted.map((a) => a.id)).toEqual(['b', 'a']);
  });

  it('does not mutate the input array', () => {
    const input = [listing('b', 200), listing('a', 100)];
    const sorted = sortActivitiesByPrice(input);

    expect(input.map((a) => a.id)).toEqual(['b', 'a']);
    expect(sorted).not.toBe(input);
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
