import { describe, expect, it } from 'vitest';
import { prerender, ssr } from './+layout.ts';

describe('root layout config', () => {
  it('disables prerender and ssr for the app shell', () => {
    expect(prerender).toBe(false);
    expect(ssr).toBe(false);
  });
});
