import { afterEach, describe, expect, it, vi } from 'vitest';

const setupModule = async (browser: boolean, redirectMessage = 'Redirect') => {
  vi.resetModules();
  const redirectMock = vi.fn((status: number, location: string) => {
    const error = new Error(redirectMessage);
    (error as any).status = status;
    (error as any).location = location;
    throw error;
  });

  vi.doMock('$app/environment', () => ({ browser }));
  vi.doMock('$lib/pocketbase', () => ({ pb: {} }));
  vi.doMock('@sveltejs/kit', () => ({ redirect: redirectMock }));

  const module = await import('./+page.ts');
  return { load: module.load, redirectMock };
};

describe('register page load', () => {
  afterEach(() => {
    localStorage.clear();
    vi.resetModules();
    vi.doUnmock('$app/environment');
    vi.doUnmock('$lib/pocketbase');
    vi.doUnmock('@sveltejs/kit');
  });

  it('skips redirect when running on the server', async () => {
    const { load } = await setupModule(false);
    await expect(load({} as any)).resolves.toEqual({});
  });

  it('redirects to profile when auth token exists in local storage', async () => {
    const { load, redirectMock } = await setupModule(true);
    localStorage.setItem('pocketbase_auth', JSON.stringify({ token: 'abc123' }));

    await expect(load({} as any)).rejects.toMatchObject({
      message: 'Redirect',
      status: 302,
      location: '/profile',
    });
    expect(redirectMock).toHaveBeenCalledWith(302, '/profile');
  });

  it('swallows unexpected redirect errors to allow registration', async () => {
    const { load } = await setupModule(true, 'Different');
    localStorage.setItem('pocketbase_auth', JSON.stringify({ token: 'token' }));

    await expect(load({} as any)).resolves.toEqual({});
  });

  it('continues to register when auth data is malformed', async () => {
    const { load } = await setupModule(true);
    localStorage.setItem('pocketbase_auth', '{not-json');

    await expect(load({} as any)).resolves.toEqual({});
  });
});
