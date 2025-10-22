import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/svelte';
import ActivityTimeline from './ActivityTimeline.svelte';
import type { ActivityItem } from '$lib/types/activity';

describe('ActivityTimeline', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the header', () => {
    const { getByText } = render(ActivityTimeline, { props: { activities: [] } });
    expect(getByText('Recent Activity')).toBeTruthy();
  });

  it('shows empty state when no activities', () => {
    const { getByText } = render(ActivityTimeline, { props: { activities: [] } });
    expect(getByText('No recent activity to show. Check back soon!')).toBeTruthy();
  });

  it('groups activities by time period', () => {
    const now = new Date('2025-01-15T12:00:00Z');
    vi.setSystemTime(now);

    const activities: ActivityItem[] = [
      {
        id: '1',
        type: 'trade',
        gameTitle: 'Game 1',
        bggId: null,
        condition: 'excellent',
        price: null,
        tradeValue: 80,
        timestamp: '2025-01-15T10:00:00Z', // Today
        userName: 'User 1',
        userLocation: 'Wellington',
        listingHref: '/listings/1',
        thumbnail: null,
      },
      {
        id: '2',
        type: 'sell',
        gameTitle: 'Game 2',
        bggId: null,
        condition: 'good',
        price: 50,
        tradeValue: null,
        timestamp: '2025-01-14T10:00:00Z', // Yesterday
        userName: 'User 2',
        userLocation: 'Auckland',
        listingHref: '/listings/2',
        thumbnail: null,
      },
      {
        id: '3',
        type: 'want',
        gameTitle: 'Game 3',
        bggId: null,
        condition: 'mint',
        price: null,
        tradeValue: null,
        timestamp: '2025-01-13T10:00:00Z', // This week
        userName: 'User 3',
        userLocation: 'Christchurch',
        listingHref: '/listings/3',
        thumbnail: null,
      },
      {
        id: '4',
        type: 'trade',
        gameTitle: 'Game 4',
        bggId: null,
        condition: 'fair',
        price: null,
        tradeValue: 60,
        timestamp: '2025-01-08T10:00:00Z', // Older
        userName: 'User 4',
        userLocation: 'Dunedin',
        listingHref: '/listings/4',
        thumbnail: null,
      },
    ];

    const { getByRole, getByText } = render(ActivityTimeline, { props: { activities } });

    // Check that all group headers are rendered (using role to target h2 elements specifically)
    expect(getByRole('heading', { name: /today/i })).toBeTruthy();
    expect(getByRole('heading', { name: /yesterday/i })).toBeTruthy();
    expect(getByRole('heading', { name: /this week/i })).toBeTruthy();
    expect(getByRole('heading', { name: /older/i })).toBeTruthy();

    // Check that all games are rendered
    expect(getByText('Game 1')).toBeTruthy();
    expect(getByText('Game 2')).toBeTruthy();
    expect(getByText('Game 3')).toBeTruthy();
    expect(getByText('Game 4')).toBeTruthy();
  });

  it('only shows groups that have activities', () => {
    const now = new Date('2025-01-15T12:00:00Z');
    vi.setSystemTime(now);

    const activities: ActivityItem[] = [
      {
        id: '1',
        type: 'trade',
        gameTitle: 'Game 1',
        bggId: null,
        condition: 'excellent',
        price: null,
        tradeValue: 80,
        timestamp: '2025-01-15T10:00:00Z', // Today only
        userName: 'User 1',
        userLocation: 'Wellington',
        listingHref: '/listings/1',
        thumbnail: null,
      },
    ];

    const { getByRole, queryByRole } = render(ActivityTimeline, { props: { activities } });

    // Only "Today" should be shown (using role to target h2 elements specifically)
    expect(getByRole('heading', { name: /today/i })).toBeTruthy();
    expect(queryByRole('heading', { name: /yesterday/i })).toBeNull();
    expect(queryByRole('heading', { name: /this week/i })).toBeNull();
    expect(queryByRole('heading', { name: /older/i })).toBeNull();
  });

  it('renders correct group icons', () => {
    const now = new Date('2025-01-15T12:00:00Z');
    vi.setSystemTime(now);

    const activities: ActivityItem[] = [
      {
        id: '1',
        type: 'trade',
        gameTitle: 'Game 1',
        bggId: null,
        condition: 'excellent',
        price: null,
        tradeValue: 80,
        timestamp: '2025-01-15T10:00:00Z',
        userName: 'User 1',
        userLocation: 'Wellington',
        listingHref: '/listings/1',
        thumbnail: null,
      },
    ];

    const { getByText } = render(ActivityTimeline, { props: { activities } });

    // Check that the "today" icon is rendered
    expect(getByText('⚡')).toBeTruthy();
  });
});
