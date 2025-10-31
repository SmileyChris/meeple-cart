import { afterEach, describe, expect, it, vi } from 'vitest';

const setupModule = async (browser: boolean) => {
  vi.resetModules();
  vi.doMock('$app/environment', () => ({ browser }));
  vi.doMock('$lib/pocketbase', () => ({ pb: {} }));

  const module = await import('./+page.ts');

  return { load: module.load };
};

describe('login page load', () => {
  afterEach(() => {
    localStorage.clear();
    vi.resetModules();
    vi.doUnmock('$app/environment');
    vi.doUnmock('$lib/pocketbase');
  });

  it('returns empty data when not running in the browser', async () => {
    const { load } = await setupModule(false);
    await expect(load({} as any)).resolves.toEqual({});
  });

  it('ignores malformed auth data and continues to login', async () => {
    const { load } = await setupModule(true);
    localStorage.setItem('pocketbase_auth', '{invalid json');

    await expect(load({} as any)).resolves.toEqual({});
  });
});
