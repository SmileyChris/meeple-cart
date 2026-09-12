import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import TrustBadge from './TrustBadge.svelte';

describe('TrustBadge compact', () => {
  it('renders just the tier label in a pill, without the tier icon', () => {
    const { getByText, queryByText } = render(TrustBadge, {
      props: {
        joinedDate: new Date().toISOString(),
        vouchedTrades: 1,
        compact: true,
      },
    });

    expect(getByText('Seedling')).toBeTruthy();
    // The icon-only span used in the full badge should not be present in compact mode
    expect(queryByText('🌱')).toBeNull();
  });

  it('colours the label using the --trust token with a fallback', () => {
    const { getByText } = render(TrustBadge, {
      props: {
        joinedDate: new Date().toISOString(),
        vouchedTrades: 1,
        compact: true,
      },
    });

    const badge = getByText('Seedling');
    expect(badge.getAttribute('style')).toContain('var(--trust');
  });

  it('still renders the full badge with icon when compact is not set', () => {
    const { getByText } = render(TrustBadge, {
      props: {
        joinedDate: new Date().toISOString(),
        vouchedTrades: 1,
      },
    });

    expect(getByText('🌱')).toBeTruthy();
  });
});
