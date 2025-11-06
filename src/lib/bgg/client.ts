/**
 * BoardGameGeek XML API2 Client
 *
 * Fetches game data from BGG's public XML API.
 * Includes rate limiting and error handling.
 *
 * API Documentation: https://boardgamegeek.com/wiki/page/BGG_XML_API2
 */

const BGG_API_BASE = 'https://boardgamegeek.com/xmlapi2';
const BGG_RATE_LIMIT_MS = 5000; // BGG requires 5 second delay between requests

let lastRequestTime = 0;

/**
 * Rate-limited fetch to respect BGG's API guidelines
 */
async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < BGG_RATE_LIMIT_MS) {
    const waitTime = BGG_RATE_LIMIT_MS - timeSinceLastRequest;
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }

  lastRequestTime = Date.now();
  return fetch(url);
}

/**
 * Fetch game details from BGG by ID
 *
 * @param bggId - BoardGameGeek game ID
 * @param includeStats - Whether to include rating/ranking statistics
 * @returns XML response text
 * @throws Error if fetch fails or BGG returns error
 */
export async function fetchGameById(bggId: number, includeStats = true): Promise<string> {
  if (!bggId || bggId < 1) {
    throw new Error(`Invalid BGG ID: ${bggId}`);
  }

  const params = new URLSearchParams({
    id: bggId.toString(),
    type: 'boardgame',
  });

  if (includeStats) {
    params.append('stats', '1');
  }

  const url = `${BGG_API_BASE}/thing?${params.toString()}`;

  try {
    const response = await rateLimitedFetch(url);

    if (!response.ok) {
      throw new Error(`BGG API returned ${response.status}: ${response.statusText}`);
    }

    const xml = await response.text();

    // Check for BGG error responses
    if (xml.includes('<error>') || xml.includes('Invalid')) {
      throw new Error(`BGG returned error for game ID ${bggId}`);
    }

    // Check if game exists
    if (xml.includes('<items termsofuse') && xml.includes('total="0"')) {
      throw new Error(`Game with BGG ID ${bggId} not found`);
    }

    return xml;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch BGG data for game ${bggId}: ${error.message}`);
    }
    throw new Error(`Failed to fetch BGG data for game ${bggId}: Unknown error`);
  }
}

/**
 * Search for games on BGG by name
 *
 * @param query - Search query (game name)
 * @param exact - Whether to search for exact matches only
 * @returns XML response text with search results
 * @throws Error if fetch fails
 */
export async function searchGames(query: string, exact = false): Promise<string> {
  if (!query || query.trim().length === 0) {
    throw new Error('Search query cannot be empty');
  }

  const params = new URLSearchParams({
    query: query.trim(),
    type: 'boardgame',
  });

  if (exact) {
    params.append('exact', '1');
  }

  const url = `${BGG_API_BASE}/search?${params.toString()}`;

  try {
    const response = await rateLimitedFetch(url);

    if (!response.ok) {
      throw new Error(`BGG API returned ${response.status}: ${response.statusText}`);
    }

    return await response.text();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to search BGG for "${query}": ${error.message}`);
    }
    throw new Error(`Failed to search BGG for "${query}": Unknown error`);
  }
}

/**
 * Fetch multiple games by IDs (batch request)
 *
 * @param bggIds - Array of BGG game IDs (max 20)
 * @param includeStats - Whether to include statistics
 * @returns XML response text
 * @throws Error if more than 20 IDs provided or fetch fails
 */
export async function fetchGamesByIds(
  bggIds: number[],
  includeStats = true
): Promise<string> {
  if (bggIds.length === 0) {
    throw new Error('At least one BGG ID is required');
  }

  if (bggIds.length > 20) {
    throw new Error('BGG API supports maximum 20 IDs per request');
  }

  const params = new URLSearchParams({
    id: bggIds.join(','),
    type: 'boardgame',
  });

  if (includeStats) {
    params.append('stats', '1');
  }

  const url = `${BGG_API_BASE}/thing?${params.toString()}`;

  try {
    const response = await rateLimitedFetch(url);

    if (!response.ok) {
      throw new Error(`BGG API returned ${response.status}: ${response.statusText}`);
    }

    return await response.text();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch BGG data for games: ${error.message}`);
    }
    throw new Error('Failed to fetch BGG data for games: Unknown error');
  }
}

/**
 * Check BGG API health
 *
 * @returns true if BGG API is reachable
 */
export async function checkBggHealth(): Promise<boolean> {
  try {
    // Fetch a well-known game (Gloomhaven, BGG ID 174430) to test connectivity
    const response = await rateLimitedFetch(`${BGG_API_BASE}/thing?id=174430&type=boardgame`);
    return response.ok;
  } catch {
    return false;
  }
}
