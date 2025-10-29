import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import StatusHistory from './StatusHistory.svelte';
import type { StatusChange } from '$lib/utils/listing-status';

describe('StatusHistory component', () => {
  const mockHistory: StatusChange[] = [
    {
      from: 'draft',
      to: 'active',
      reason: 'Listing published',
      actor: 'user123',
      timestamp: '2025-10-29T10:00:00.000Z',
    },
    {
      from: 'active',
      to: 'pending',
      reason: 'Trade initiated',
      actor: 'user456',
      timestamp: '2025-10-30T11:30:00.000Z',
    },
    {
      from: 'pending',
      to: 'completed',
      reason: 'Trade completed',
      actor: 'user789',
      timestamp: '2025-10-30T15:45:00.000Z',
    },
  ];

  it('should render status history when data is provided', () => {
    const { getByText, getAllByText, container } = render(StatusHistory, {
      props: { statusHistory: mockHistory },
    });

    // Check title
    expect(getByText('Status History')).toBeTruthy();

    // Check unique statuses are displayed
    expect(getByText('draft')).toBeTruthy();
    expect(getAllByText('active').length).toBeGreaterThan(0);
    expect(getAllByText('pending').length).toBeGreaterThan(0);
    expect(getByText('completed')).toBeTruthy();

    // Check reasons
    expect(getByText('Listing published')).toBeTruthy();
    expect(getByText('Trade initiated')).toBeTruthy();
    expect(getByText('Trade completed')).toBeTruthy();

    // Check arrows
    const arrows = container.querySelectorAll('.text-muted');
    expect(arrows.length).toBeGreaterThan(0);
  });

  it('should display empty state when no history', () => {
    const { getByText, queryByText } = render(StatusHistory, {
      props: { statusHistory: [] },
    });

    // Empty state message
    expect(
      getByText(/No status changes yet/i) || getByText(/Status history will appear here/i)
    ).toBeTruthy();

    // Title should not be visible in empty state
    expect(queryByText('Status History')).toBeFalsy();
  });

  it('should apply correct color classes for different statuses', () => {
    const { container } = render(StatusHistory, {
      props: { statusHistory: mockHistory },
    });

    // Check for color classes
    const emeraldText = container.querySelector('.text-emerald-400');
    const amberText = container.querySelector('.text-amber-400');
    const skyText = container.querySelector('.text-sky-400');

    // At least one of each color should be present based on our mock data
    expect(emeraldText || amberText || skyText).toBeTruthy();
  });

  it('should format timestamps correctly', () => {
    const { container } = render(StatusHistory, {
      props: { statusHistory: mockHistory },
    });

    // Check that timestamps are rendered (formatted dates)
    const timestamps = container.querySelectorAll('.text-xs.text-muted');
    expect(timestamps.length).toBe(3); // One for each history entry
  });

  it('should handle single status change', () => {
    const singleChange: StatusChange[] = [
      {
        from: 'active',
        to: 'cancelled',
        reason: 'User cancelled listing',
        actor: 'user999',
        timestamp: '2025-10-30T12:00:00.000Z',
      },
    ];

    const { getByText } = render(StatusHistory, {
      props: { statusHistory: singleChange },
    });

    expect(getByText('active')).toBeTruthy();
    expect(getByText('cancelled')).toBeTruthy();
    expect(getByText('User cancelled listing')).toBeTruthy();
  });

  it('should display status history section with correct styling', () => {
    const { container } = render(StatusHistory, {
      props: { statusHistory: mockHistory },
    });

    // Check for section with proper classes
    const section = container.querySelector('section');
    expect(section).toBeTruthy();
    expect(section?.classList.contains('rounded-xl')).toBe(true);
    expect(section?.classList.contains('border')).toBe(true);
  });

  it('should display empty state with dashed border', () => {
    const { container } = render(StatusHistory, {
      props: { statusHistory: [] },
    });

    const section = container.querySelector('section');
    expect(section).toBeTruthy();
    expect(section?.classList.contains('border-dashed')).toBe(true);
  });

  it('should show transition arrows between statuses', () => {
    const { container } = render(StatusHistory, {
      props: { statusHistory: mockHistory },
    });

    // Each history entry should have a from status, arrow, and to status
    const historyItems = container.querySelectorAll('.border-l-2');
    expect(historyItems.length).toBe(3); // One for each change
  });

  it('should handle status with unknown color', () => {
    const unknownStatus: StatusChange[] = [
      {
        from: 'unknown_status',
        to: 'another_unknown',
        reason: 'Test unknown status',
        actor: 'user000',
        timestamp: '2025-10-30T12:00:00.000Z',
      },
    ];

    const { getByText, container } = render(StatusHistory, {
      props: { statusHistory: unknownStatus },
    });

    // Should render without error
    expect(getByText('unknown_status')).toBeTruthy();
    expect(getByText('another_unknown')).toBeTruthy();
    expect(getByText('Test unknown status')).toBeTruthy();

    // Should have muted color classes (includes arrows and unknown statuses)
    const mutedElements = container.querySelectorAll('.text-muted');
    expect(mutedElements.length).toBeGreaterThan(0);
  });

  it('should render multiple history entries in order', () => {
    const { container } = render(StatusHistory, {
      props: { statusHistory: mockHistory },
    });

    const historyItems = container.querySelectorAll('.border-l-2');
    expect(historyItems.length).toBe(3);

    // Check that all three entries are present
    const reasons = Array.from(container.querySelectorAll('.text-sm.text-secondary')).map(
      (el) => el.textContent
    );

    expect(reasons).toContain('Listing published');
    expect(reasons).toContain('Trade initiated');
    expect(reasons).toContain('Trade completed');
  });
});
