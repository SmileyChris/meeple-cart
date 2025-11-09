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
  it('returns empty object without logging out', async () => {
    const module = await import('./+page.ts');

    // The logout page load just returns empty object
    // Actual logout happens when user confirms on the page
    await expect(module.load({} as any)).resolves.toEqual({});

    // currentUser.logout should not be called in the load function
    const { currentUser } = await import('$lib/pocketbase');
    expect(currentUser.logout).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
