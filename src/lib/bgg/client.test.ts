import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { pb } from '$lib/pocketbase';

// These calls all go through PocketBase's `/api/bgg/*` proxy (pocketbase/pb_hooks/bgg.pb.js)
// rather than hitting BGG directly, so the thing under test here is URL construction - not
// the network call itself, which is mocked out.
//
// client.ts rate-limits itself with a module-level `lastRequestTime`, so each test resets
// the module registry and re-imports fresh - that way every test is a "first ever call"
// with nothing to wait on, instead of racing a real 5s delay.
describe('BGG client URL building', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();
    fetchMock = vi.fn().mockResolvedValue(new Response('<items></items>', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('routes search requests through the PocketBase proxy origin', async () => {
    const { searchGames } = await import('./client');
    await searchGames('wingspan');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe(`${pb.baseURL}/api/bgg/search?query=wingspan&type=boardgame`);
  });

  it('adds the exact flag when an exact match is requested', async () => {
    const { searchGames } = await import('./client');
    await searchGames('wingspan', true);

    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe(`${pb.baseURL}/api/bgg/search?query=wingspan&type=boardgame&exact=1`);
  });

  it('trims whitespace from the search query', async () => {
    const { searchGames } = await import('./client');
    await searchGames('  wingspan  ');

    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe(`${pb.baseURL}/api/bgg/search?query=wingspan&type=boardgame`);
  });

  it('routes thing-by-id requests through the proxy and includes stats by default', async () => {
    const { fetchGameById } = await import('./client');
    await fetchGameById(174430);

    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe(`${pb.baseURL}/api/bgg/thing?id=174430&type=boardgame&stats=1`);
  });

  it('omits the stats param when not requested', async () => {
    const { fetchGameById } = await import('./client');
    await fetchGameById(174430, false);

    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe(`${pb.baseURL}/api/bgg/thing?id=174430&type=boardgame`);
  });

  it('joins multiple ids with commas for batch requests', async () => {
    const { fetchGamesByIds } = await import('./client');
    await fetchGamesByIds([1, 2, 3]);

    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe(
      `${pb.baseURL}/api/bgg/thing?id=${encodeURIComponent('1,2,3')}&type=boardgame&stats=1`
    );
  });

  it('checks health against the proxy thing endpoint', async () => {
    const { checkBggHealth } = await import('./client');
    const ok = await checkBggHealth();

    expect(ok).toBe(true);
    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe(`${pb.baseURL}/api/bgg/thing?id=174430&type=boardgame`);
  });
});
