import { describe, it, expect } from 'vitest';
import {
  hashPhoneNumber,
  normalizePhoneNumber,
  formatPhoneNumber,
  maskPhoneNumber,
  getPhoneLastFour,
  generateVerificationCode,
  isValidNZPhoneNumber,
  estimateWaitTime,
  canBecomeVerifier,
  canRequestVerification,
  generateSMSTemplate,
  calculateSuccessRate,
  formatKarma,
  getVerifierBadge,
  getVerificationExpiry,
  isVerificationExpired,
  formatTimeRemaining,
} from './trust-buddy';

describe('Trust Buddy Utilities', () => {
  describe('normalizePhoneNumber', () => {
    it('removes spaces and dashes', () => {
      expect(normalizePhoneNumber('021-234-5678')).toBe('0212345678');
      expect(normalizePhoneNumber('021 234 5678')).toBe('0212345678');
      expect(normalizePhoneNumber('021 234-5678')).toBe('0212345678');
    });

    it('preserves leading + for international numbers', () => {
      expect(normalizePhoneNumber('+64212345678')).toBe('+64212345678');
      expect(normalizePhoneNumber('+64 21 234 5678')).toBe('+64212345678');
    });

    it('removes all non-digit characters except leading +', () => {
      expect(normalizePhoneNumber('(021) 234-5678')).toBe('0212345678');
      expect(normalizePhoneNumber('+64 (21) 234-5678')).toBe('+64212345678');
    });

    it('trims whitespace', () => {
      expect(normalizePhoneNumber('  0212345678  ')).toBe('0212345678');
    });
  });

  describe('formatPhoneNumber', () => {
    it('formats NZ mobile numbers correctly', () => {
      expect(formatPhoneNumber('0212345678')).toBe('021-234-5678');
      expect(formatPhoneNumber('0222345678')).toBe('022-234-5678');
      expect(formatPhoneNumber('0272345678')).toBe('027-234-5678');
    });

    it('handles international format', () => {
      expect(formatPhoneNumber('+64212345678')).toBe('+64212345678');
    });

    it('returns normalized form for unknown formats', () => {
      expect(formatPhoneNumber('12345')).toBe('12345');
    });
  });

  describe('maskPhoneNumber', () => {
    it('masks phone number showing only last 4 digits', () => {
      expect(maskPhoneNumber('0212345678')).toBe('XXX-XXX-5678');
      expect(maskPhoneNumber('021-234-5678')).toBe('XXX-XXX-5678');
    });

    it('handles short numbers', () => {
      expect(maskPhoneNumber('123')).toBe('XXX');
    });

    it('works with international numbers', () => {
      expect(maskPhoneNumber('+64212345678')).toBe('XXX-XXX-5678');
    });
  });

  describe('getPhoneLastFour', () => {
    it('returns last 4 digits', () => {
      expect(getPhoneLastFour('0212345678')).toBe('5678');
      expect(getPhoneLastFour('021-234-5678')).toBe('5678');
      expect(getPhoneLastFour('+64212345678')).toBe('5678');
    });
  });

  describe('hashPhoneNumber', () => {
    it('generates consistent SHA-256 hash', async () => {
      const phone = '0212345678';
      const hash1 = await hashPhoneNumber(phone);
      const hash2 = await hashPhoneNumber(phone);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 hex is 64 chars
      expect(hash1).toMatch(/^[a-f0-9]{64}$/); // Only hex characters
    });

    it('generates different hashes for different numbers', async () => {
      const hash1 = await hashPhoneNumber('0212345678');
      const hash2 = await hashPhoneNumber('0212345679');

      expect(hash1).not.toBe(hash2);
    });

    it('normalizes before hashing', async () => {
      const hash1 = await hashPhoneNumber('021-234-5678');
      const hash2 = await hashPhoneNumber('0212345678');
      const hash3 = await hashPhoneNumber('021 234 5678');

      expect(hash1).toBe(hash2);
      expect(hash2).toBe(hash3);
    });
  });

  describe('generateVerificationCode', () => {
    it('generates 8-character code', () => {
      const code = generateVerificationCode();
      expect(code).toHaveLength(8);
    });

    it('uses only uppercase letters and numbers', () => {
      const code = generateVerificationCode();
      expect(code).toMatch(/^[A-Z0-9]{8}$/);
    });

    it('excludes ambiguous characters', () => {
      // Generate many codes to test randomness
      for (let i = 0; i < 100; i++) {
        const code = generateVerificationCode();
        expect(code).not.toMatch(/[01IOL]/); // No 0, 1, I, O, L
      }
    });

    it('generates different codes each time', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(generateVerificationCode());
      }
      expect(codes.size).toBeGreaterThan(90); // Very unlikely to get duplicates
    });
  });

  describe('isValidNZPhoneNumber', () => {
    it('validates NZ mobile numbers', () => {
      expect(isValidNZPhoneNumber('0212345678')).toBe(true);
      expect(isValidNZPhoneNumber('0222345678')).toBe(true);
      expect(isValidNZPhoneNumber('0272345678')).toBe(true);
      expect(isValidNZPhoneNumber('0202345678')).toBe(true);
    });

    it('validates NZ landline numbers', () => {
      expect(isValidNZPhoneNumber('0312345678')).toBe(true);
      expect(isValidNZPhoneNumber('0491234567')).toBe(true);
    });

    it('validates international format', () => {
      expect(isValidNZPhoneNumber('+64212345678')).toBe(true);
      expect(isValidNZPhoneNumber('+12125551234')).toBe(true);
    });

    it('rejects invalid numbers', () => {
      expect(isValidNZPhoneNumber('12345')).toBe(false);
      expect(isValidNZPhoneNumber('0112345678')).toBe(false); // Invalid area code
      expect(isValidNZPhoneNumber('021234')).toBe(false); // Too short
      expect(isValidNZPhoneNumber('abc')).toBe(false);
      expect(isValidNZPhoneNumber('')).toBe(false);
    });

    it('works with formatted numbers', () => {
      expect(isValidNZPhoneNumber('021-234-5678')).toBe(true);
      expect(isValidNZPhoneNumber('021 234 5678')).toBe(true);
    });
  });

  describe('estimateWaitTime', () => {
    it('returns "Next in queue" for position 0 or 1', () => {
      expect(estimateWaitTime(0)).toBe('Next in queue');
      expect(estimateWaitTime(1)).toBe('Next in queue');
    });

    it('estimates minutes for short waits', () => {
      expect(estimateWaitTime(2)).toBe('~10 minutes');
      expect(estimateWaitTime(5)).toBe('~25 minutes');
      expect(estimateWaitTime(10)).toBe('~50 minutes');
    });

    it('estimates hours for long waits', () => {
      expect(estimateWaitTime(12)).toBe('~1 hour');
      expect(estimateWaitTime(24)).toBe('~2 hours');
      expect(estimateWaitTime(36)).toBe('~3 hours');
    });

    it('estimates hours and minutes', () => {
      expect(estimateWaitTime(13)).toBe('~1h 5m');
      expect(estimateWaitTime(25)).toBe('~2h 5m');
    });
  });

  describe('canBecomeVerifier', () => {
    it('requires phone verification', () => {
      expect(canBecomeVerifier(false, 5, 3, 30)).toBe(false);
    });

    it('requires at least 7 days account age', () => {
      expect(canBecomeVerifier(true, 5, 3, 6)).toBe(false);
      expect(canBecomeVerifier(true, 5, 3, 7)).toBe(true);
    });

    it('requires at least 1 trade or 1 vouch', () => {
      expect(canBecomeVerifier(true, 0, 0, 30)).toBe(false);
      expect(canBecomeVerifier(true, 1, 0, 30)).toBe(true);
      expect(canBecomeVerifier(true, 0, 1, 30)).toBe(true);
    });

    it('returns true when all requirements met', () => {
      expect(canBecomeVerifier(true, 5, 3, 30)).toBe(true);
    });
  });

  describe('canRequestVerification', () => {
    it('denies if already verified', () => {
      expect(canRequestVerification(true, false, '0212345678')).toBe(false);
    });

    it('denies if pending request exists', () => {
      expect(canRequestVerification(false, true, '0212345678')).toBe(false);
    });

    it('denies if no phone number', () => {
      expect(canRequestVerification(false, false, '')).toBe(false);
      expect(canRequestVerification(false, false, undefined)).toBe(false);
    });

    it('allows when all conditions met', () => {
      expect(canRequestVerification(false, false, '0212345678')).toBe(true);
    });
  });

  describe('generateSMSTemplate', () => {
    it('generates correct SMS message', () => {
      const message = generateSMSTemplate('Alice', 'ABC12345');
      expect(message).toContain('Alice');
      expect(message).toContain('ABC12345');
      expect(message).toContain('Meeple Cart');
      expect(message).toContain('https://meeple.cart.nz/trust-ABC12345');
    });
  });

  describe('calculateSuccessRate', () => {
    it('calculates percentage correctly', () => {
      expect(calculateSuccessRate(50, 100)).toBe(50);
      expect(calculateSuccessRate(75, 100)).toBe(75);
      expect(calculateSuccessRate(1, 3)).toBe(33);
    });

    it('handles zero total', () => {
      expect(calculateSuccessRate(0, 0)).toBe(0);
    });

    it('rounds to nearest integer', () => {
      expect(calculateSuccessRate(2, 3)).toBe(67); // 66.666... rounded to 67
    });
  });

  describe('formatKarma', () => {
    it('formats small numbers as-is', () => {
      expect(formatKarma(0)).toBe('0');
      expect(formatKarma(123)).toBe('123');
      expect(formatKarma(999)).toBe('999');
    });

    it('formats thousands with k suffix', () => {
      expect(formatKarma(1000)).toBe('1.0k');
      expect(formatKarma(1500)).toBe('1.5k');
      expect(formatKarma(9999)).toBe('10.0k');
    });

    it('formats large numbers correctly', () => {
      expect(formatKarma(10000)).toBe('10k');
      expect(formatKarma(50000)).toBe('50k');
      expect(formatKarma(999000)).toBe('999k');
    });
  });

  describe('getVerifierBadge', () => {
    it('returns null for 0 verifications', () => {
      expect(getVerifierBadge(0)).toBeNull();
    });

    it('returns New Verifier for 1-9 verifications', () => {
      const badge = getVerifierBadge(5);
      expect(badge?.name).toBe('New Verifier');
      expect(badge?.icon).toBe('🌟');
    });

    it('returns Trust Helper for 10-24 verifications', () => {
      const badge = getVerifierBadge(15);
      expect(badge?.name).toBe('Trust Helper');
      expect(badge?.icon).toBe('🤝');
    });

    it('returns Trust Hero for 25-49 verifications', () => {
      const badge = getVerifierBadge(30);
      expect(badge?.name).toBe('Trust Hero');
      expect(badge?.icon).toBe('🛡️');
    });

    it('returns Trust Champion for 50-99 verifications', () => {
      const badge = getVerifierBadge(75);
      expect(badge?.name).toBe('Trust Champion');
      expect(badge?.icon).toBe('⭐');
    });

    it('returns Trust Legend for 100+ verifications', () => {
      const badge = getVerifierBadge(150);
      expect(badge?.name).toBe('Trust Legend');
      expect(badge?.icon).toBe('👑');
    });
  });

  describe('getVerificationExpiry', () => {
    it('returns date 24 hours in the future', () => {
      const now = new Date();
      const expiry = getVerificationExpiry();
      const diff = expiry.getTime() - now.getTime();
      const hours = diff / (1000 * 60 * 60);

      expect(hours).toBeGreaterThanOrEqual(23.9); // Allow small timing variance
      expect(hours).toBeLessThanOrEqual(24.1);
    });
  });

  describe('isVerificationExpired', () => {
    it('returns false for future dates', () => {
      const future = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      expect(isVerificationExpired(future.toISOString())).toBe(false);
    });

    it('returns true for past dates', () => {
      const past = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
      expect(isVerificationExpired(past.toISOString())).toBe(true);
    });

    it('handles edge case of exactly now', () => {
      const now = new Date();
      // Might be expired or not depending on exact timing
      const result = isVerificationExpired(now.toISOString());
      expect(typeof result).toBe('boolean');
    });
  });

  describe('formatTimeRemaining', () => {
    it('returns "Expired" for past dates', () => {
      const past = new Date(Date.now() - 1000);
      expect(formatTimeRemaining(past.toISOString())).toBe('Expired');
    });

    it('formats minutes for short durations', () => {
      const future = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      const formatted = formatTimeRemaining(future.toISOString());
      expect(formatted).toMatch(/\d+m/);
    });

    it('formats hours and minutes for medium durations', () => {
      const future = new Date(Date.now() + 90 * 60 * 1000); // 1.5 hours
      const formatted = formatTimeRemaining(future.toISOString());
      expect(formatted).toMatch(/\d+h \d+m/);
    });

    it('formats days for long durations', () => {
      const future = new Date(Date.now() + 25 * 60 * 60 * 1000); // 25 hours
      const formatted = formatTimeRemaining(future.toISOString());
      expect(formatted).toMatch(/\d+ days?/);
    });
  });
});
