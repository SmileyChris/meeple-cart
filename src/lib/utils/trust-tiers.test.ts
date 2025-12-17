import { describe, it, expect } from 'vitest';
import {
  getAccountAgeDays,
  getTrustTier,
  getTrustTierInfo,
  getBadgeText,
  canVouch,
  isHighRisk,
  formatAccountAge,
  getNextTierProgress,
} from './trust-tiers';

describe('Trust Tier System', () => {
  describe('getTrustTier', () => {
    it('returns "new" for 0 vouched trades', () => {
      expect(getTrustTier(0, 0)).toBe('new');
      expect(getTrustTier(100, 0)).toBe('new');
      expect(getTrustTier(400, 0)).toBe('new');
    });

    it('returns "seedling" for 1 vouched trade', () => {
      expect(getTrustTier(0, 1)).toBe('seedling');
      expect(getTrustTier(15, 1)).toBe('seedling');
      expect(getTrustTier(29, 1)).toBe('seedling');
    });

    it('returns "growing" for 30+ days AND 2+ vouched trades', () => {
      expect(getTrustTier(30, 2)).toBe('growing');
      expect(getTrustTier(50, 3)).toBe('growing');
      expect(getTrustTier(100, 4)).toBe('growing');

      // Not growing if missing either requirement
      expect(getTrustTier(29, 2)).toBe('seedling'); // Not 30 days yet
      expect(getTrustTier(30, 1)).toBe('seedling'); // Only 1 vouch
    });

    it('returns "established" for 90+ days AND 5+ vouched trades', () => {
      expect(getTrustTier(90, 5)).toBe('established');
      expect(getTrustTier(100, 5)).toBe('established');
      expect(getTrustTier(200, 7)).toBe('established');

      // Not established if missing either requirement
      expect(getTrustTier(89, 5)).toBe('growing'); // Not 90 days yet
      expect(getTrustTier(90, 4)).toBe('growing'); // Only 4 vouches
    });

    it('returns "trusted" for 365+ days AND 8+ vouched trades', () => {
      expect(getTrustTier(365, 8)).toBe('trusted');
      expect(getTrustTier(400, 10)).toBe('trusted');
      expect(getTrustTier(730, 15)).toBe('trusted');

      // Not trusted if missing either requirement
      expect(getTrustTier(364, 8)).toBe('established'); // Not 365 days yet
      expect(getTrustTier(365, 7)).toBe('established'); // Only 7 vouches
    });

    it('prioritizes higher tiers correctly', () => {
      // 365 days + 8 vouches = trusted (not established)
      expect(getTrustTier(365, 8)).toBe('trusted');

      // 5 vouches but only 20 days = seedling (not enough days for growing or established)
      expect(getTrustTier(20, 5)).toBe('seedling');

      // 90+ days + 5 vouches = established (not growing)
      expect(getTrustTier(90, 5)).toBe('established');
    });
  });

  describe('getTrustTierInfo', () => {
    it('returns correct info for all tiers', () => {
      const newInfo = getTrustTierInfo('new');
      expect(newInfo.label).toBe('New member');
      expect(newInfo.icon).toBe('🆕');
      expect(newInfo.styles.border).toContain('amber');

      const seedlingInfo = getTrustTierInfo('seedling');
      expect(seedlingInfo.label).toBe('Seedling');
      expect(seedlingInfo.icon).toBe('🌱');
      expect(seedlingInfo.styles.border).toContain('lime');

      const growingInfo = getTrustTierInfo('growing');
      expect(growingInfo.label).toBe('Growing member');
      expect(growingInfo.icon).toBe('🪴');
      expect(growingInfo.styles.border).toContain('sky');

      const establishedInfo = getTrustTierInfo('established');
      expect(establishedInfo.label).toBe('Established member');
      expect(establishedInfo.icon).toBe('🌳');
      expect(establishedInfo.styles.border).toContain('emerald');

      const trustedInfo = getTrustTierInfo('trusted');
      expect(trustedInfo.label).toBe('Trusted member');
      expect(trustedInfo.icon).toBe('⭐');
      expect(trustedInfo.styles.border).toContain('violet');
    });
  });

  describe('getBadgeText', () => {
    it('shows age context for new members > 7 days', () => {
      const text = getBadgeText('new', 45, 0);
      expect(text).toContain('45 days');
      expect(text).toContain('0 vouched trades');
    });

    it('shows "joined today" for 0 days old', () => {
      const text = getBadgeText('new', 0, 0);
      expect(text).toContain('joined today');
    });

    it('shows progress for seedling waiting on age', () => {
      const text = getBadgeText('seedling', 15, 2);
      expect(text).toContain('15/30 days');
    });

    it('shows just label for other tiers', () => {
      expect(getBadgeText('growing', 30, 2)).toBe('Growing member');
      expect(getBadgeText('established', 100, 5)).toBe('Established member');
      expect(getBadgeText('trusted', 400, 10)).toBe('Trusted member');
    });
  });

  describe('canVouch', () => {
    it('allows vouching with 1+ vouched trades', () => {
      expect(canVouch(1, false)).toBe(true);
      expect(canVouch(5, false)).toBe(true);
    });

    it('allows vouching with phone verification', () => {
      expect(canVouch(0, true)).toBe(true);
      expect(canVouch(1, true)).toBe(true);
    });

    it('denies vouching with no vouches and no phone verification', () => {
      expect(canVouch(0, false)).toBe(false);
    });
  });

  describe('isHighRisk', () => {
    it('returns true for new tier without phone verification', () => {
      expect(isHighRisk('new', false)).toBe(true);
    });

    it('returns false for new tier with phone verification', () => {
      expect(isHighRisk('new', true)).toBe(false);
    });

    it('returns false for all other tiers', () => {
      expect(isHighRisk('seedling', false)).toBe(false);
      expect(isHighRisk('growing', false)).toBe(false);
      expect(isHighRisk('established', false)).toBe(false);
      expect(isHighRisk('trusted', false)).toBe(false);
    });
  });

  describe('formatAccountAge', () => {
    it('formats days correctly', () => {
      const today = new Date();
      expect(formatAccountAge(today)).toBe('joined today');

      const yesterday = new Date(Date.now() - 86400000);
      expect(formatAccountAge(yesterday)).toBe('joined yesterday');

      const fiveDaysAgo = new Date(Date.now() - 5 * 86400000);
      expect(formatAccountAge(fiveDaysAgo)).toBe('joined 5 days ago');
    });

    it('formats weeks correctly', () => {
      const twoWeeksAgo = new Date(Date.now() - 14 * 86400000);
      expect(formatAccountAge(twoWeeksAgo)).toBe('2 weeks');

      const oneWeekAgo = new Date(Date.now() - 7 * 86400000);
      expect(formatAccountAge(oneWeekAgo)).toBe('1 week');
    });

    it('formats months correctly', () => {
      const twoMonthsAgo = new Date(Date.now() - 60 * 86400000);
      expect(formatAccountAge(twoMonthsAgo)).toBe('2 months');

      const oneMonthAgo = new Date(Date.now() - 30 * 86400000);
      expect(formatAccountAge(oneMonthAgo)).toBe('1 month');
    });

    it('formats years correctly', () => {
      const twoYearsAgo = new Date(Date.now() - 730 * 86400000);
      expect(formatAccountAge(twoYearsAgo)).toBe('2 years');

      const oneYearAgo = new Date(Date.now() - 365 * 86400000);
      expect(formatAccountAge(oneYearAgo)).toBe('1 year');
    });
  });

  describe('getNextTierProgress', () => {
    it('returns null for trusted tier', () => {
      const progress = getNextTierProgress('trusted', 400, 10);
      expect(progress).toBeNull();
    });

    it('shows progress from new to seedling', () => {
      const progress = getNextTierProgress('new', 5, 0);
      expect(progress).toBeTruthy();
      expect(progress?.nextTier).toBe('seedling');
      expect(progress?.requirements).toHaveLength(1);
      expect(progress?.requirements[0].needed).toBe(1);
    });

    it('shows progress from seedling to growing', () => {
      const progress = getNextTierProgress('seedling', 15, 1);
      expect(progress).toBeTruthy();
      expect(progress?.nextTier).toBe('growing');
      expect(progress?.requirements).toHaveLength(2);
      expect(progress?.requirements[0].label).toBe('Vouched trades');
      expect(progress?.requirements[1].label).toBe('Account age');
    });

    it('shows progress from growing to established', () => {
      const progress = getNextTierProgress('growing', 50, 3);
      expect(progress).toBeTruthy();
      expect(progress?.nextTier).toBe('established');
      expect(progress?.requirements).toHaveLength(2);
      expect(progress?.requirements[0].label).toBe('Vouched trades');
      expect(progress?.requirements[0].needed).toBe(5);
      expect(progress?.requirements[1].label).toBe('Account age');
      expect(progress?.requirements[1].needed).toBe(90);
    });

    it('shows progress from established to trusted', () => {
      const progress = getNextTierProgress('established', 200, 6);
      expect(progress).toBeTruthy();
      expect(progress?.nextTier).toBe('trusted');
      expect(progress?.requirements).toHaveLength(2);
      expect(progress?.requirements[0].label).toBe('Vouched trades');
      expect(progress?.requirements[1].label).toBe('Account age');
    });

    it('marks requirements as met correctly', () => {
      const progress = getNextTierProgress('seedling', 35, 2);
      expect(progress?.requirements[0].met).toBe(true); // 2 vouched trades
      expect(progress?.requirements[1].met).toBe(true); // 35 days
    });
  });

  describe('getAccountAgeDays', () => {
    it('calculates age from string date', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
      const age = getAccountAgeDays(threeDaysAgo);
      expect(age).toBe(3);
    });

    it('calculates age from Date object', () => {
      const fiveDaysAgo = new Date(Date.now() - 5 * 86400000);
      const age = getAccountAgeDays(fiveDaysAgo);
      expect(age).toBe(5);
    });

    it('returns 0 for today', () => {
      const today = new Date();
      const age = getAccountAgeDays(today);
      expect(age).toBe(0);
    });
  });
});
