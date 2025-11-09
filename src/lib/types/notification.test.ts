import { describe, expect, it } from 'vitest';
import {
  DEFAULT_NOTIFICATION_PREFS,
  NOTIFICATION_COLORS,
  NOTIFICATION_ICONS,
} from './notification';

describe('notification type helpers', () => {
  it('exposes default notification preferences', () => {
    expect(DEFAULT_NOTIFICATION_PREFS.notify_new_listings).toBe(true);
    expect(DEFAULT_NOTIFICATION_PREFS.notify_new_messages).toBe(true);
    expect(DEFAULT_NOTIFICATION_PREFS.watched_regions).toEqual([]);
  });

  it('provides icon and color metadata for each notification type', () => {
    expect(Object.keys(NOTIFICATION_ICONS)).toEqual([
      'new_listing',
      'new_message',
      'price_drop',
      'listing_update',
      'discussion_reply',
      'discussion_mention',
    ]);

    expect(NOTIFICATION_COLORS.new_listing).toEqual({
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-600',
      text: 'text-emerald-200',
    });
  });
});
