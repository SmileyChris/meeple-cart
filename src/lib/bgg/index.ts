/**
 * BoardGameGeek Integration
 *
 * This module provides utilities for fetching and caching game data
 * from BoardGameGeek's public XML API.
 *
 * Usage Example:
 * ```typescript
 * import { fetchAndCacheBggInfo } from '$lib/bgg';
 * import { pb, currentUser } from '$lib/pocketbase';
 * import { get } from 'svelte/store';
 *
 * // Fetch BGG data for Gloomhaven (BGG ID: 174430)
 * const user = get(currentUser);
 * if (user) {
 *   const bggData = await fetchAndCacheBggInfo(pb, user.id, 174430);
 *   console.log(bggData.title); // "Gloomhaven"
 *   console.log(bggData.average_rating); // e.g., 8.5
 * }
 * ```
 *
 * Features:
 * - Rate-limited API calls (5 second delay between requests)
 * - Per-user caching (prevents malicious data poisoning)
 * - Automatic cache refresh after 30 days
 * - Full TypeScript types for BGG API responses
 */

// Client exports
export { fetchGameById, searchGames, fetchGamesByIds, checkBggHealth } from './client';

// Parser exports
export {
  parseThingResponse,
  parseSearchResponse,
  getPrimaryName,
  getCategories,
  getMechanics,
  getDesigners,
  getPublishers,
  getOverallRank,
} from './parser';

// Cache exports
export {
  getCachedBggInfo,
  isCacheStale,
  fetchAndCacheBggInfo,
  batchFetchAndCache,
  deleteCachedBggInfo,
  getUserBggCache,
  clearUserBggCache,
  saveBggFetchError,
} from './cache';

// Type exports
export type {
  BggInfoRecord,
  BggThing,
  BggThingResponse,
  BggSearchResponse,
  BggSearchItem,
} from '$lib/types/bgg';
