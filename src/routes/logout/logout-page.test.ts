import { describe, expect, it, vi } from 'vitest';

vi.mock('$lib/pocketbase', () => ({
  currentUser: {
    logout: vi.fn(),
  },
}));

const redirectMock = vi.fn((status: number, location: string) => {
  const error = new Error('REDIRECT');
  (error as any).status = status;
  (error as any).location = location;
  throw error;
});

vi.mock('@sveltejs/kit', () => ({
  redirect: redirectMock,
}));

describe('logout page load', () => {
  it('logs out the current user and redirects home', async () => {
    const module = await import('./+page.ts');

    await expect(module.load({} as any)).rejects.toMatchObject({
      message: 'REDIRECT',
      status: 302,
      location: '/',
    });

    const { currentUser } = await import('$lib/pocketbase');
    expect(currentUser.logout).toHaveBeenCalled();
    expect(redirectMock).toHaveBeenCalledWith(302, '/');
  });
});
