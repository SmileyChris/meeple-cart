/**
 * Trust Buddy Verification System - Core Utilities
 *
 * Utilities for community-powered phone verification including:
 * - Phone number hashing (SHA-256)
 * - Verification code generation
 * - Phone number formatting and masking
 * - Queue position calculation
 * - Verification eligibility checks
 */

/**
 * Hash a phone number using SHA-256
 * Returns a 64-character hexadecimal string
 */
export async function hashPhoneNumber(phoneNumber: string): Promise<string> {
  // Normalize phone number (remove spaces, dashes, etc.)
  const normalized = normalizePhoneNumber(phoneNumber);

  // Use Web Crypto API for SHA-256 hashing
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);

  // Convert buffer to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

/**
 * Normalize phone number to consistent format
 * Removes all non-digit characters except leading +
 */
export function normalizePhoneNumber(phoneNumber: string): string {
  // Keep leading + for international format, remove all other non-digits
  const trimmed = phoneNumber.trim();
  const hasPlus = trimmed.startsWith('+');
  const digitsOnly = trimmed.replace(/\D/g, '');

  return hasPlus ? `+${digitsOnly}` : digitsOnly;
}

/**
 * Format phone number for display (NZ format)
 * Example: 0212345678 → 021-234-5678
 */
export function formatPhoneNumber(phoneNumber: string): string {
  const normalized = normalizePhoneNumber(phoneNumber);

  // NZ mobile format (021, 022, 027, 020)
  if (normalized.startsWith('02') && normalized.length === 10) {
    return `${normalized.slice(0, 3)}-${normalized.slice(3, 6)}-${normalized.slice(6)}`;
  }

  // NZ landline format (starting with area code)
  if (normalized.length === 9 && !normalized.startsWith('0')) {
    return `0${normalized.slice(0, 1)}-${normalized.slice(1, 4)}-${normalized.slice(4)}`;
  }

  // International format
  if (normalized.startsWith('+')) {
    return normalized;
  }

  // Default: return as-is
  return normalized;
}

/**
 * Mask phone number for privacy
 * Example: 0212345678 → XXX-XXX-5678
 */
export function maskPhoneNumber(phoneNumber: string): string {
  const normalized = normalizePhoneNumber(phoneNumber);

  if (normalized.length < 4) {
    return 'XXX';
  }

  const lastFour = normalized.slice(-4);
  return `XXX-XXX-${lastFour}`;
}

/**
 * Get last 4 digits of phone number
 */
export function getPhoneLastFour(phoneNumber: string): string {
  const normalized = normalizePhoneNumber(phoneNumber);
  return normalized.slice(-4);
}

/**
 * Generate a random 8-character verification code
 * Format: XXXXXXXX (uppercase letters and numbers, no ambiguous characters)
 */
export function generateVerificationCode(): string {
  // Use crypto for secure random generation
  // Exclude ambiguous characters: 0, O, 1, I, L
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const array = new Uint8Array(8);
  crypto.getRandomValues(array);

  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[array[i] % chars.length];
  }

  return code;
}

/**
 * Validate phone number format (NZ phone numbers)
 */
export function isValidNZPhoneNumber(phoneNumber: string): boolean {
  const normalized = normalizePhoneNumber(phoneNumber);

  // NZ mobile: 021, 022, 027, 020 (10 digits total)
  if (/^02[01278]\d{7}$/.test(normalized)) {
    return true;
  }

  // NZ landline: 03-09 area codes (9-10 digits)
  if (/^0[3-9]\d{7,8}$/.test(normalized)) {
    return true;
  }

  // International format (10-15 digits with + prefix)
  if (/^\+\d{10,15}$/.test(normalized)) {
    return true;
  }

  return false;
}

/**
 * Calculate estimated wait time based on queue position
 * Assumes average 5 minutes per verification
 */
export function estimateWaitTime(queuePosition: number): string {
  if (queuePosition === 0 || queuePosition === 1) {
    return 'Next in queue';
  }

  const minutes = queuePosition * 5;

  if (minutes < 60) {
    return `~${minutes} minutes`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `~${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }

  return `~${hours}h ${remainingMinutes}m`;
}

/**
 * Check if user can become a verifier
 * Requirements:
 * - Phone verified
 * - At least 1 completed trade OR 1 vouch received
 * - Account at least 7 days old
 */
export function canBecomeVerifier(
  phoneVerified: boolean,
  tradeCount: number,
  vouchCount: number,
  accountAgeDays: number,
): boolean {
  if (!phoneVerified) return false;
  if (accountAgeDays < 7) return false;
  if (tradeCount === 0 && vouchCount === 0) return false;

  return true;
}

/**
 * Check if user can request verification
 * Requirements:
 * - Not already verified
 * - No pending verification request
 * - Phone number provided
 */
export function canRequestVerification(
  phoneVerified: boolean,
  hasPendingRequest: boolean,
  phoneNumber?: string,
): boolean {
  if (phoneVerified) return false; // Already verified
  if (hasPendingRequest) return false; // Already has pending request
  if (!phoneNumber || phoneNumber.trim().length === 0) return false; // No phone number

  return true;
}

/**
 * Generate SMS message template for verifiers
 */
export function generateSMSTemplate(verifierName: string, code: string): string {
  return `Hi! I'm ${verifierName} from Meeple Cart. Click this link to verify your account: https://meeple.cart.nz/trust-${code}`;
}

/**
 * Calculate verifier success rate
 */
export function calculateSuccessRate(successCount: number, totalVerifications: number): number {
  if (totalVerifications === 0) return 0;
  return Math.round((successCount / totalVerifications) * 100);
}

/**
 * Format karma display
 */
export function formatKarma(karma: number): string {
  if (karma === 0) return '0';
  if (karma < 1000) return karma.toString();
  if (karma < 10000) return `${(karma / 1000).toFixed(1)}k`;
  return `${Math.floor(karma / 1000)}k`;
}

/**
 * Get verifier badge based on verifications completed
 */
export function getVerifierBadge(
  totalVerifications: number,
): { name: string; icon: string; color: string } | null {
  if (totalVerifications >= 100) {
    return { name: 'Trust Legend', icon: '👑', color: 'text-violet-300' };
  }
  if (totalVerifications >= 50) {
    return { name: 'Trust Champion', icon: '⭐', color: 'text-amber-300' };
  }
  if (totalVerifications >= 25) {
    return { name: 'Trust Hero', icon: '🛡️', color: 'text-emerald-300' };
  }
  if (totalVerifications >= 10) {
    return { name: 'Trust Helper', icon: '🤝', color: 'text-sky-300' };
  }
  if (totalVerifications >= 1) {
    return { name: 'New Verifier', icon: '🌟', color: 'text-lime-300' };
  }

  return null;
}

/**
 * Calculate verification expiry time (24 hours from now)
 */
export function getVerificationExpiry(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24);
  return expiry;
}

/**
 * Check if verification has expired
 */
export function isVerificationExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

/**
 * Format time remaining until expiry
 */
export function formatTimeRemaining(expiresAt: string): string {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffMs = expiry.getTime() - now.getTime();

  if (diffMs <= 0) {
    return 'Expired';
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days} ${days === 1 ? 'day' : 'days'}`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}
