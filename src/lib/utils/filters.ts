import type { UserRecord } from '$lib/types/pocketbase';

/**
 * Centralized localStorage keys for filter preferences
 */
export const FILTER_STORAGE_KEYS = {
  listingTypes: 'preferredListingTypes',
  regionFilter: 'preferredRegionFilter',
  canPost: 'preferredCanPost',
  guestRegions: 'guestPreferredRegions',
  condition: 'preferredCondition',
  priceRange: 'preferredPriceRange',
  lastCondition: 'lastCondition',
  lastPriceRange: 'lastPriceRange',
} as const;

/**
 * Apply stored filter preferences to a URL
 * Returns a new URL with filters applied, or null if no changes needed
 */
export function applyStoredFilters(
  currentUrl: URL,
  currentUser?: UserRecord | null
): URL | null {
  const hasAnyParams =
    currentUrl.searchParams.has('sell') ||
    currentUrl.searchParams.has('trade') ||
    currentUrl.searchParams.has('want') ||
    currentUrl.searchParams.has('region') ||
    currentUrl.searchParams.has('canPost') ||
    currentUrl.searchParams.has('page');

  if (hasAnyParams) {
    return null; // Already has params, don't override
  }

  const newUrl = new URL(currentUrl);
  let needsRedirect = false;

  // Apply saved listing types
  const savedTypes = localStorage.getItem(FILTER_STORAGE_KEYS.listingTypes);
  if (savedTypes) {
    try {
      const types = JSON.parse(savedTypes);
      if (Array.isArray(types) && types.length > 0 && types.length < 3) {
        ['sell', 'trade', 'want'].forEach((t) => {
          if (!types.includes(t)) {
            newUrl.searchParams.set(t, 'false');
          }
        });
        needsRedirect = true;
      }
    } catch {
      // Ignore invalid data
    }
  }

  // Apply saved region filter
  const savedRegionFilter = localStorage.getItem(FILTER_STORAGE_KEYS.regionFilter);
  const savedCanPost = localStorage.getItem(FILTER_STORAGE_KEYS.canPost);

  if (savedRegionFilter === 'true') {
    let regionsToApply: string[] = [];

    if (currentUser?.preferred_regions) {
      regionsToApply = currentUser.preferred_regions;
    } else {
      const savedRegions = localStorage.getItem(FILTER_STORAGE_KEYS.guestRegions);
      if (savedRegions) {
        try {
          regionsToApply = JSON.parse(savedRegions);
        } catch {
          // Ignore invalid data
        }
      }
    }

    if (regionsToApply.length > 0) {
      regionsToApply.forEach((region) => {
        newUrl.searchParams.append('region', region);
      });
      needsRedirect = true;

      if (savedCanPost === 'true') {
        newUrl.searchParams.set('canPost', 'true');
      }
    }
  }

  return needsRedirect ? newUrl : null;
}

/**
 * Save listing type preferences to localStorage
 */
export function saveListingTypePreferences(types: string[]): void {
  if (types.length === 0 || types.length === 3) {
    localStorage.removeItem(FILTER_STORAGE_KEYS.listingTypes);
  } else {
    localStorage.setItem(FILTER_STORAGE_KEYS.listingTypes, JSON.stringify(types));
  }
}

/**
 * Save region filter state to localStorage
 */
export function saveRegionFilterState(enabled: boolean): void {
  localStorage.setItem(FILTER_STORAGE_KEYS.regionFilter, String(enabled));
}

/**
 * Save can post filter state to localStorage
 */
export function saveCanPostState(enabled: boolean): void {
  localStorage.setItem(FILTER_STORAGE_KEYS.canPost, String(enabled));
}

/**
 * Save guest preferred regions to localStorage
 */
export function saveGuestRegions(regions: string[]): void {
  if (regions.length > 0) {
    localStorage.setItem(FILTER_STORAGE_KEYS.guestRegions, JSON.stringify(regions));
  } else {
    localStorage.removeItem(FILTER_STORAGE_KEYS.guestRegions);
  }
}

/**
 * Get guest preferred regions from localStorage
 */
export function getGuestRegions(): string[] {
  const stored = localStorage.getItem(FILTER_STORAGE_KEYS.guestRegions);
  if (!stored) return [];

  try {
    const regions = JSON.parse(stored);
    return Array.isArray(regions) ? regions : [];
  } catch {
    return [];
  }
}

/**
 * Save condition filter preference to localStorage
 */
export function saveConditionPreference(condition: string | null): void {
  if (condition) {
    localStorage.setItem(FILTER_STORAGE_KEYS.condition, condition);
  } else {
    localStorage.removeItem(FILTER_STORAGE_KEYS.condition);
  }
}

/**
 * Save last used condition to localStorage (for dropdown defaults)
 */
export function saveLastCondition(condition: string): void {
  localStorage.setItem(FILTER_STORAGE_KEYS.lastCondition, condition);
}

/**
 * Get last used condition from localStorage
 */
export function getLastCondition(): string | null {
  return localStorage.getItem(FILTER_STORAGE_KEYS.lastCondition);
}

/**
 * Save price range preference to localStorage
 */
export function savePriceRangePreference(minPrice: string, maxPrice: string): void {
  if (minPrice || maxPrice) {
    localStorage.setItem(
      FILTER_STORAGE_KEYS.priceRange,
      JSON.stringify({ minPrice, maxPrice })
    );
  } else {
    localStorage.removeItem(FILTER_STORAGE_KEYS.priceRange);
  }
}

/**
 * Save last used price range to localStorage (for dropdown defaults)
 */
export function saveLastPriceRange(minPrice: string, maxPrice: string): void {
  localStorage.setItem(
    FILTER_STORAGE_KEYS.lastPriceRange,
    JSON.stringify({ minPrice, maxPrice })
  );
}

/**
 * Get last used price range from localStorage
 */
export function getLastPriceRange(): { minPrice: string; maxPrice: string } {
  const stored = localStorage.getItem(FILTER_STORAGE_KEYS.lastPriceRange);
  if (!stored) return { minPrice: '', maxPrice: '50' };

  try {
    const range = JSON.parse(stored);
    return {
      minPrice: range.minPrice || '',
      maxPrice: range.maxPrice || '50',
    };
  } catch {
    return { minPrice: '', maxPrice: '50' };
  }
}
