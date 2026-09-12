import { describe, expect, it, vi } from 'vitest';
import { createRawSnippet } from 'svelte';
import { readable } from 'svelte/store';
import { render, screen } from '@testing-library/svelte';
import { prerender, ssr } from './+layout';

vi.mock('$app/stores', () => ({
  page: readable({ url: new URL('http://localhost/') }),
}));

// Render as a logged-in user so the primary "Pin a listing" action is shown,
// and stub pb so the unread-notifications fetch never hits the network.
vi.mock('$lib/pocketbase', () => ({
  currentUser: readable({ id: 'user1', display_name: 'Test User' }),
  pb: {
    collection: () => ({
      getList: vi.fn().mockResolvedValue({ totalItems: 0 }),
    }),
  },
}));

// jsdom doesn't implement matchMedia; the footer's waddling-meeple motif
// checks prefers-reduced-motion on mount.
vi.stubGlobal(
  'matchMedia',
  vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
);

const { default: Layout } = await import('./+layout.svelte');

describe('root layout config', () => {
  it('disables prerender and ssr for the app shell', () => {
    expect(prerender).toBe(false);
    expect(ssr).toBe(false);
  });
});

describe('primary navigation', () => {
  const emptyChildren = createRawSnippet(() => ({
    render: () => '<div></div>',
  }));

  it('renders the Board theme nav labels', () => {
    render(Layout, { props: { children: emptyChildren } });

    expect(screen.getByRole('link', { name: /Board/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Browse/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Chat/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Hubs/i })).toBeInTheDocument();
  });

  it('does not show the old Activity/Games labels or a Trade Parties link in the primary nav', () => {
    render(Layout, { props: { children: emptyChildren } });

    expect(screen.queryByRole('link', { name: /^Activity$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /^Games$/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Trade Parties/i)).not.toBeInTheDocument();
  });

  it('renames the primary action button to "Pin a listing"', () => {
    render(Layout, { props: { children: emptyChildren } });

    expect(screen.getByRole('link', { name: /Pin a listing/i })).toBeInTheDocument();
  });
});
