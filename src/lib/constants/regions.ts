/**
 * North Island regions
 */
export const NORTH_ISLAND_REGIONS = [
  { value: 'northland', label: 'Northland' },
  { value: 'auckland', label: 'Auckland' },
  { value: 'waikato', label: 'Waikato' },
  { value: 'bay_of_plenty', label: 'Bay of Plenty' },
  { value: 'gisborne', label: 'Gisborne' },
  { value: 'hawkes_bay', label: "Hawke's Bay" },
  { value: 'taranaki', label: 'Taranaki' },
  { value: 'manawatu_whanganui', label: 'Manawatū-Whanganui' },
  { value: 'wellington', label: 'Wellington' },
] as const;

/**
 * South Island regions
 */
export const SOUTH_ISLAND_REGIONS = [
  { value: 'tasman', label: 'Tasman' },
  { value: 'nelson', label: 'Nelson' },
  { value: 'marlborough', label: 'Marlborough' },
  { value: 'west_coast', label: 'West Coast' },
  { value: 'canterbury', label: 'Canterbury' },
  { value: 'otago', label: 'Otago' },
  { value: 'southland', label: 'Southland' },
] as const;

/**
 * All New Zealand regions
 */
export const NZ_REGIONS = [
  { value: '', label: 'No restriction' },
  { value: 'nz', label: 'All of NZ' },
  { value: 'north_island', label: 'North Island' },
  ...NORTH_ISLAND_REGIONS,
  { value: 'south_island', label: 'South Island' },
  ...SOUTH_ISLAND_REGIONS,
] as const;

/**
 * Get all region values for an island
 */
export function getIslandRegions(island: 'north_island' | 'south_island'): string[] {
  if (island === 'north_island') {
    return NORTH_ISLAND_REGIONS.map((r) => r.value);
  }
  return SOUTH_ISLAND_REGIONS.map((r) => r.value);
}

/**
 * Map region values to display labels
 */
export const REGION_LABELS: Record<string, string> = Object.fromEntries(
  NZ_REGIONS.filter((r) => r.value !== '').map((r) => [r.value, r.label])
);

/**
 * Valid cascade region type
 */
export type CascadeRegionValue = (typeof NZ_REGIONS)[number]['value'];
