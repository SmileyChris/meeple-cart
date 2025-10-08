import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/svelte';
import ActivityItem from './ActivityItem.svelte';
import type { ActivityItem as ActivityItemType } from '$lib/types/activity';

describe('ActivityItem', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const mockActivity: ActivityItemType = {
    id: 'test-id',
    type: 'trade',
    gameTitle: 'Wingspan',
    bggId: 266192,
    condition: 'excellent',
    price: null,
    tradeValue: 80,
    timestamp: '2025-01-15T10:00:00Z',
    userName: 'Test User',
    userLocation: 'Wellington',
    listingHref: '/listings/test-listing',
    thumbnail: null,
  };

  it('renders game title', () => {
    const { getByText } = render(ActivityItem, { props: { activity: mockActivity } });
    expect(getByText('Wingspan')).toBeTruthy();
  });

  it('renders user information', () => {
    const { getByText } = render(ActivityItem, { props: { activity: mockActivity } });
    expect(getByText('Test User')).toBeTruthy();
    expect(getByText('📍 Wellington')).toBeTruthy();
  });

  it('renders trade label for trade listings', () => {
    const { getByText } = render(ActivityItem, { props: { activity: mockActivity } });
    expect(getByText('Trade')).toBeTruthy();
  });

  it('renders sell label for sell listings', () => {
    const sellActivity: ActivityItemType = { ...mockActivity, type: 'sell', price: 100 };
    const { getByText } = render(ActivityItem, { props: { activity: sellActivity } });
    expect(getByText('Sell')).toBeTruthy();
  });

  it('renders want label for want listings', () => {
    const wantActivity: ActivityItemType = { ...mockActivity, type: 'want' };
    const { getByText } = render(ActivityItem, { props: { activity: wantActivity } });
    expect(getByText('Looking for')).toBeTruthy();
  });

  it('renders condition label', () => {
    const { getByText } = render(ActivityItem, { props: { activity: mockActivity } });
    expect(getByText('Excellent')).toBeTruthy();
  });

  it('renders price for sell listings', () => {
    const sellActivity: ActivityItemType = {
      ...mockActivity,
      type: 'sell',
      price: 100,
      tradeValue: null,
    };
    const { getByText } = render(ActivityItem, { props: { activity: sellActivity } });
    expect(getByText('$100')).toBeTruthy();
  });

  it('renders trade value for trade listings', () => {
    const { getByText } = render(ActivityItem, { props: { activity: mockActivity } });
    expect(getByText('$80')).toBeTruthy();
  });

  it('renders BGG link when bggId is provided', () => {
    const { getByText } = render(ActivityItem, { props: { activity: mockActivity } });
    const link = getByText('View on BGG →');
    expect(link).toBeTruthy();
    expect(link.getAttribute('href')).toBe('https://boardgamegeek.com/boardgame/266192');
  });

  it('does not render BGG link when bggId is null', () => {
    const activityWithoutBgg: ActivityItemType = { ...mockActivity, bggId: null };
    const { queryByText } = render(ActivityItem, { props: { activity: activityWithoutBgg } });
    expect(queryByText('View on BGG →')).toBeNull();
  });

  it('shows "New" badge for very recent items', () => {
    const now = new Date('2025-01-15T10:30:00Z');
    vi.setSystemTime(now);

    const recentActivity: ActivityItemType = {
      ...mockActivity,
      timestamp: '2025-01-15T10:00:00Z', // 30 minutes ago
    };

    const { getAllByText } = render(ActivityItem, { props: { activity: recentActivity } });
    const newBadges = getAllByText('New');
    expect(newBadges.length).toBeGreaterThan(0);
  });

  it('does not show "New" badge for older items', () => {
    const now = new Date('2025-01-15T12:00:00Z');
    vi.setSystemTime(now);

    const oldActivity: ActivityItemType = {
      ...mockActivity,
      timestamp: '2025-01-15T10:00:00Z', // 2 hours ago
    };

    const { queryByText } = render(ActivityItem, { props: { activity: oldActivity } });
    expect(queryByText('New')).toBeNull();
  });

  it('renders thumbnail when provided', () => {
    const activityWithThumbnail: ActivityItemType = {
      ...mockActivity,
      thumbnail: 'https://example.com/image.jpg',
    };

    const { container } = render(ActivityItem, { props: { activity: activityWithThumbnail } });
    const img = container.querySelector('img');
    expect(img).toBeTruthy();
    expect(img?.getAttribute('src')).toBe('https://example.com/image.jpg');
  });

  it('shows fallback name when userName is null', () => {
    const activityWithoutUser: ActivityItemType = { ...mockActivity, userName: null };
    const { getByText } = render(ActivityItem, { props: { activity: activityWithoutUser } });
    expect(getByText('Meeple Cart member')).toBeTruthy();
  });
});
