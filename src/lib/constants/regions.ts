/**
 * New Zealand regions for gift cascade filtering
 */
export const NZ_REGIONS = [
  { value: '', label: 'No restriction' },
  { value: 'nz', label: 'All of NZ' },
  { value: 'north_island', label: 'North Island' },
  { value: 'south_island', label: 'South Island' },
  { value: 'auckland', label: 'Auckland' },
  { value: 'wellington', label: 'Wellington' },
  { value: 'canterbury', label: 'Canterbury' },
  { value: 'waikato', label: 'Waikato' },
  { value: 'bay_of_plenty', label: 'Bay of Plenty' },
  { value: 'otago', label: 'Otago' },
] as const;

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
