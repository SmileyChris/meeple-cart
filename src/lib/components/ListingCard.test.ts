import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import ListingCard from './ListingCard.svelte';
import type { ListingPreview } from '$lib/types/listing';

const baseListing = (overrides: Partial<ListingPreview> = {}): ListingPreview => ({
  id: 'listing-1',
  title: 'Gloomhaven bundle',
  listingType: 'trade',
  summary: 'Great condition set',
  location: 'Wellington',
  regions: null,
  created: '2024-05-01T12:00:00Z',
  ownerName: 'Chris',
  ownerId: 'owner-1',
  ownerJoinedDate: '2023-01-15T10:00:00Z',
  ownerVouchedTrades: 3,
  coverImage: 'https://cdn.example/cover.jpg',
  href: '/listings/listing-1',
  games: [
    {
      id: 'game-1',
      title: 'Gloomhaven',
      condition: 'excellent',
      status: 'available',
      bggId: 174430,
      bggUrl: 'https://boardgamegeek.com/boardgame/174430',
      price: 150,
      tradeValue: null,
      canPost: false,
    },
    {
      id: 'game-2',
      title: 'Frosthaven',
      condition: 'good',
      status: 'pending',
      bggId: null,
      bggUrl: null,
      price: null,
      tradeValue: 200,
      canPost: true,
    },
    {
      id: 'game-3',
      title: 'Spirit Island',
      condition: 'fair',
      status: 'sold',
      bggId: null,
      bggUrl: null,
      price: null,
      tradeValue: null,
      canPost: false,
    },
  ],
  ...overrides,
});

describe('ListingCard', () => {
  it('renders listing details with cover image and owner link', () => {
    render(ListingCard, {
      props: {
        listing: baseListing(),
      },
    });

    expect(screen.getByRole('img', { name: 'Gloomhaven bundle' })).toHaveAttribute(
      'src',
      'https://cdn.example/cover.jpg'
    );
    const expectedDate = new Intl.DateTimeFormat('en-NZ', {
      dateStyle: 'medium',
    }).format(new Date('2024-05-01T12:00:00Z'));

    expect(screen.getByText('Trade')).toBeInTheDocument();
    expect(screen.getByText('Gloomhaven bundle')).toBeInTheDocument();
    expect(screen.getByText('Great condition set')).toBeInTheDocument();
    expect(screen.getByText(expectedDate)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Chris' })).toHaveAttribute('href', '/users/owner-1');
    expect(screen.getByText('Wellington')).toBeInTheDocument();

    // Check games are displayed as badges
    expect(screen.getByText('3 games included')).toBeInTheDocument();
    expect(screen.getByText('Gloomhaven')).toBeInTheDocument();
    expect(screen.getByText('Frosthaven')).toBeInTheDocument();
    expect(screen.getByText('Spirit Island')).toBeInTheDocument();
  });

  it('renders fallback state for listings without cover or owner profile', () => {
    render(ListingCard, {
      props: {
        listing: baseListing({
          listingType: 'want',
          ownerId: null,
          ownerName: null,
          ownerJoinedDate: null,
          ownerVouchedTrades: 0,
          coverImage: null,
          location: null,
        }),
      },
    });

    // Check for logo placeholder image (it has role="presentation" due to empty alt)
    const logoImage = screen.getByRole('presentation');
    expect(logoImage).toHaveAttribute('src', '/logo.png');
    expect(screen.getByText('Meeple Cart trader')).toBeInTheDocument();
    expect(screen.getByText('Want to Buy')).toBeInTheDocument();
    expect(screen.getByText('Can post')).toBeInTheDocument();
  });

  it('hides owner info when hideOwner is true', () => {
    render(ListingCard, {
      props: {
        listing: baseListing(),
        hideOwner: true,
      },
    });

    expect(screen.queryByText('Chris')).not.toBeInTheDocument();
    expect(screen.getByText('Gloomhaven bundle')).toBeInTheDocument();
  });
});
