import { render, screen, within } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import ListingCard from './ListingCard.svelte';
import type { ListingPreview } from '$lib/types/listing';

const baseListing = (overrides: Partial<ListingPreview> = {}): ListingPreview => ({
  id: 'listing-1',
  title: 'Gloomhaven bundle',
  listingType: 'trade',
  summary: 'Great condition set',
  location: 'Wellington',
  created: '2024-05-01T12:00:00Z',
  ownerName: 'Chris',
  ownerId: 'owner-1',
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
    expect(screen.getByText('Verified member')).toBeInTheDocument();

    const gamesList = screen.getByRole('list');
    const [firstGame, secondGame, thirdGame] = within(gamesList).getAllByRole('listitem');

    const currencyFormatter = new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: 'NZD',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    });

    expect(within(firstGame).getByText('Gloomhaven')).toBeInTheDocument();
    expect(within(firstGame).getByRole('link', { name: 'BGG' })).toHaveAttribute(
      'href',
      'https://boardgamegeek.com/boardgame/174430'
    );
    expect(within(firstGame).getByText(currencyFormatter.format(150))).toBeInTheDocument();

    expect(within(secondGame).getByText('Frosthaven')).toBeInTheDocument();
    expect(
      within(secondGame).getByText(`${currencyFormatter.format(200)} value`)
    ).toBeInTheDocument();

    expect(within(thirdGame).getByText('Spirit Island')).toBeInTheDocument();
    expect(within(thirdGame).getByText('Sold')).toBeInTheDocument();
  });

  it('renders fallback state for listings without cover or owner profile', () => {
    render(ListingCard, {
      props: {
        listing: baseListing({
          listingType: 'want',
          ownerId: null,
          ownerName: null,
          coverImage: null,
          location: null,
        }),
      },
    });

    expect(screen.getByText('No image yet')).toBeInTheDocument();
    expect(screen.getByText('Meeple Cart trader')).toBeInTheDocument();
    expect(screen.getByText('New listing')).toBeInTheDocument();
    expect(screen.getByText('Want to Buy')).toBeInTheDocument();
  });
});
