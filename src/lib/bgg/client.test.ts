import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// These calls all go through PocketBase's `/api/bgg/*` proxy (pocketbase/pb_hooks/bgg.pb.js)
// rather than hitting BGG directly, so most of what's under test here is URL construction
// and the Authorization header - not the network call itself, which is mocked out.
//
// client.ts rate-limits itself with a module-level `lastRequestTime`, and reads the current
// user's token off the `pb` singleton at call time. Both are module state, so every test
// resets the module registry and re-imports `$lib/pocketbase` + `./client` together - that
// way each test gets its own fresh `pb` (so authStore mutations in one test can't leak into
// another) and is a "first ever call" with nothing to wait on, instead of racing a real 5s
// rate-limit delay.
async function freshClient() {
  vi.resetModules();
  const { pb } = await import('$lib/pocketbase');
  const client = await import('./client');
  return { pb, ...client };
}

describe('BGG client', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // PocketBase's default auth store persists to localStorage, which jsdom keeps across
    // `vi.resetModules()` (that only clears the JS module registry, not browser storage) -
    // so without this, a token saved in one test would leak into the next.
    localStorage.clear();
    fetchMock = vi.fn().mockResolvedValue(new Response('<items></items>', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('URL building', () => {
    it('routes search requests through the PocketBase proxy origin', async () => {
      const { pb, searchGames } = await freshClient();
      await searchGames('wingspan');

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe(`${pb.baseURL}/api/bgg/search?query=wingspan&type=boardgame`);
    });

    it('adds the exact flag when an exact match is requested', async () => {
      const { pb, searchGames } = await freshClient();
      await searchGames('wingspan', true);

      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe(`${pb.baseURL}/api/bgg/search?query=wingspan&type=boardgame&exact=1`);
    });

    it('trims whitespace from the search query', async () => {
      const { pb, searchGames } = await freshClient();
      await searchGames('  wingspan  ');

      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe(`${pb.baseURL}/api/bgg/search?query=wingspan&type=boardgame`);
    });

    it('routes thing-by-id requests through the proxy and includes stats by default', async () => {
      const { pb, fetchGameById } = await freshClient();
      await fetchGameById(174430);

      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe(`${pb.baseURL}/api/bgg/thing?id=174430&type=boardgame&stats=1`);
    });

    it('omits the stats param when not requested', async () => {
      const { pb, fetchGameById } = await freshClient();
      await fetchGameById(174430, false);

      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe(`${pb.baseURL}/api/bgg/thing?id=174430&type=boardgame`);
    });

    it('joins multiple ids with commas for batch requests', async () => {
      const { pb, fetchGamesByIds } = await freshClient();
      await fetchGamesByIds([1, 2, 3]);

      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe(
        `${pb.baseURL}/api/bgg/thing?id=${encodeURIComponent('1,2,3')}&type=boardgame&stats=1`
      );
    });

    it('checks health against the proxy thing endpoint', async () => {
      const { pb, checkBggHealth } = await freshClient();
      const ok = await checkBggHealth();

      expect(ok).toBe(true);
      const [url] = fetchMock.mock.calls[0];
      expect(url).toBe(`${pb.baseURL}/api/bgg/thing?id=174430&type=boardgame`);
    });
  });

  describe('authentication', () => {
    // The proxy requires a logged-in user ($apis.requireAuth() in bgg.pb.js), so the client
    // must send the current user's token - the same raw `Authorization: <token>` header
    // pb.send() would attach automatically (no "Bearer" prefix; see rateLimitedFetch's
    // comment for why this uses raw fetch instead of pb.send()).

    it('sends the current auth token as the Authorization header', async () => {
      const { pb, searchGames } = await freshClient();
      pb.authStore.save('test-user-token');

      await searchGames('wingspan');

      const [, options] = fetchMock.mock.calls[0];
      expect((options.headers as Record<string, string>).Authorization).toBe('test-user-token');
    });

    it('sends no Authorization header when logged out', async () => {
      const { searchGames } = await freshClient();

      await searchGames('wingspan');

      const [, options] = fetchMock.mock.calls[0];
      expect((options.headers as Record<string, string>).Authorization).toBeUndefined();
    });

    it('surfaces a clear error when the proxy responds 401', async () => {
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ message: 'not authorized' }), { status: 401 })
      );

      const { searchGames } = await freshClient();

      await expect(searchGames('wingspan')).rejects.toThrow(
        'You must be logged in to use BoardGameGeek search.'
      );
    });
  });
});
