/**
 * BGG Cache Manager
 *
 * Manages user-specific BoardGameGeek data cache in the bgg_info collection.
 * Each user stores their own fetched BGG data to prevent cross-contamination.
 */

import type PocketBase from 'pocketbase';
import type { BggInfoRecord, BggThing } from '$lib/types/bgg';
import { fetchGameById } from './client';
import { parseThingResponse, getCategories, getMechanics, getDesigners, getPublishers, getPrimaryName, getOverallRank } from './parser';

const CACHE_EXPIRY_DAYS = 30; // Refresh BGG data after 30 days

/**
 * Check if user has cached BGG data for a game
 *
 * @param pb - PocketBase instance
 * @param userId - Current user's ID
 * @param bggId - BoardGameGeek game ID
 * @returns Cached BGG info record or null if not found
 */
export async function getCachedBggInfo(
  pb: PocketBase,
  userId: string,
  bggId: number
): Promise<BggInfoRecord | null> {
  try {
    const record = await pb
      .collection('bgg_info')
      .getFirstListItem<BggInfoRecord>(`user = "${userId}" && bgg_id = ${bggId}`);

    return record;
  } catch (error) {
    // Record not found
    return null;
  }
}

/**
 * Check if cached BGG data is stale and needs refresh
 *
 * @param record - BGG info record
 * @returns true if data should be refreshed
 */
export function isCacheStale(record: BggInfoRecord): boolean {
  const lastFetched = new Date(record.last_fetched);
  const now = new Date();
  const daysSinceLastFetch = (now.getTime() - lastFetched.getTime()) / (1000 * 60 * 60 * 24);

  return daysSinceLastFetch > CACHE_EXPIRY_DAYS;
}

/**
 * Fetch and cache BGG data for a game
 *
 * This function:
 * 1. Checks if user already has cached data
 * 2. If cache is fresh, returns existing data
 * 3. If cache is stale or missing, fetches from BGG API
 * 4. Saves/updates cache with new data
 *
 * @param pb - PocketBase instance
 * @param userId - Current user's ID
 * @param bggId - BoardGameGeek game ID
 * @param forceRefresh - Force refresh even if cache is fresh
 * @returns BGG info record
 * @throws Error if fetch or save fails
 */
export async function fetchAndCacheBggInfo(
  pb: PocketBase,
  userId: string,
  bggId: number,
  forceRefresh = false
): Promise<BggInfoRecord> {
  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = await getCachedBggInfo(pb, userId, bggId);
    if (cached && !isCacheStale(cached)) {
      return cached;
    }
  }

  // Fetch from BGG API
  const xml = await fetchGameById(bggId, true);
  const response = parseThingResponse(xml);

  if (response.items.length === 0) {
    throw new Error(`No game found with BGG ID ${bggId}`);
  }

  const game = response.items[0];

  // Convert to BggInfoRecord format
  const bggData = bggThingToBggInfo(game, userId);

  // Check if record exists
  const existing = await getCachedBggInfo(pb, userId, bggId);

  let record: BggInfoRecord;

  if (existing) {
    // Update existing record
    record = await pb.collection('bgg_info').update<BggInfoRecord>(existing.id, bggData);
  } else {
    // Create new record
    record = await pb.collection('bgg_info').create<BggInfoRecord>(bggData);
  }

  return record;
}

/**
 * Convert BGG Thing to BggInfoRecord format
 */
function bggThingToBggInfo(
  thing: BggThing,
  userId: string
): Omit<BggInfoRecord, 'id' | 'collectionId' | 'collectionName' | 'created' | 'updated'> {
  const primaryName = getPrimaryName(thing);
  const categories = getCategories(thing);
  const mechanics = getMechanics(thing);
  const designers = getDesigners(thing);
  const publishers = getPublishers(thing);
  const overallRank = getOverallRank(thing);

  return {
    user: userId,
    bgg_id: thing.id,
    title: primaryName,
    year_published: thing.yearpublished,
    description: thing.description,
    thumbnail_url: thing.thumbnail,
    image_url: thing.image,
    min_players: thing.minplayers,
    max_players: thing.maxplayers,
    min_playtime: thing.minplaytime,
    max_playtime: thing.maxplaytime,
    min_age: thing.minage,
    average_rating: thing.statistics?.ratings.average,
    rating_stddev: thing.statistics?.ratings.stddev,
    num_ratings: thing.statistics?.ratings.usersrated,
    complexity_weight: thing.statistics?.ratings.averageweight,
    bgg_rank: overallRank || undefined,
    categories: categories.length > 0 ? categories : undefined,
    mechanics: mechanics.length > 0 ? mechanics : undefined,
    designers: designers.length > 0 ? designers : undefined,
    publishers: publishers.length > 0 ? publishers : undefined,
    last_fetched: new Date().toISOString(),
    fetch_error: undefined,
  };
}

/**
 * Batch fetch and cache multiple games
 *
 * Note: BGG API supports max 20 games per request, but this function
 * processes them one-by-one to respect rate limiting and handle errors gracefully.
 *
 * @param pb - PocketBase instance
 * @param userId - Current user's ID
 * @param bggIds - Array of BGG game IDs
 * @returns Array of BGG info records (may be partial if some fail)
 */
export async function batchFetchAndCache(
  pb: PocketBase,
  userId: string,
  bggIds: number[]
): Promise<Array<BggInfoRecord | null>> {
  const results: Array<BggInfoRecord | null> = [];

  for (const bggId of bggIds) {
    try {
      const record = await fetchAndCacheBggInfo(pb, userId, bggId);
      results.push(record);
    } catch (error) {
      console.error(`Failed to fetch BGG data for game ${bggId}:`, error);
      results.push(null);
    }
  }

  return results;
}

/**
 * Delete user's cached BGG data for a game
 *
 * @param pb - PocketBase instance
 * @param userId - Current user's ID
 * @param bggId - BGG game ID
 * @returns true if deleted, false if not found
 */
export async function deleteCachedBggInfo(
  pb: PocketBase,
  userId: string,
  bggId: number
): Promise<boolean> {
  const cached = await getCachedBggInfo(pb, userId, bggId);

  if (!cached) {
    return false;
  }

  await pb.collection('bgg_info').delete(cached.id);
  return true;
}

/**
 * Get all user's cached BGG data
 *
 * @param pb - PocketBase instance
 * @param userId - Current user's ID
 * @returns Array of user's BGG info records
 */
export async function getUserBggCache(
  pb: PocketBase,
  userId: string
): Promise<BggInfoRecord[]> {
  return pb.collection('bgg_info').getFullList<BggInfoRecord>({
    filter: `user = "${userId}"`,
    sort: '-last_fetched',
  });
}

/**
 * Clear all user's cached BGG data
 *
 * @param pb - PocketBase instance
 * @param userId - Current user's ID
 * @returns Number of records deleted
 */
export async function clearUserBggCache(pb: PocketBase, userId: string): Promise<number> {
  const records = await getUserBggCache(pb, userId);

  for (const record of records) {
    await pb.collection('bgg_info').delete(record.id);
  }

  return records.length;
}

/**
 * Save BGG fetch error for a game
 *
 * When BGG API fails, we can save an error record to avoid
 * repeatedly trying to fetch the same problematic game.
 *
 * @param pb - PocketBase instance
 * @param userId - Current user's ID
 * @param bggId - BGG game ID
 * @param errorMessage - Error message to store
 */
export async function saveBggFetchError(
  pb: PocketBase,
  userId: string,
  bggId: number,
  errorMessage: string
): Promise<BggInfoRecord> {
  const existing = await getCachedBggInfo(pb, userId, bggId);

  const errorData = {
    user: userId,
    bgg_id: bggId,
    title: `Error: BGG ID ${bggId}`,
    last_fetched: new Date().toISOString(),
    fetch_error: errorMessage,
  };

  if (existing) {
    return pb.collection('bgg_info').update<BggInfoRecord>(existing.id, errorData);
  } else {
    return pb.collection('bgg_info').create<BggInfoRecord>(errorData);
  }
}
