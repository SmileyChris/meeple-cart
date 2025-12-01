/**
 * Trust Tier System
 *
 * Calculates and displays user trust tiers based on account age and vouched trades.
 * See docs/reputation/trust-tiers.md for full specification.
 */

export type TrustTier = 'new' | 'seedling' | 'growing' | 'established' | 'trusted';

export interface TrustTierInfo {
  tier: TrustTier;
  label: string;
  icon: string;
  description: string;
  styles: {
    border: string;
    background: string;
    text: string;
  };
}

/**
 * Calculate account age in days
 */
export function getAccountAgeDays(joinedDate: string | Date): number {
  const joined = typeof joinedDate === 'string' ? new Date(joinedDate) : joinedDate;
  return Math.floor((Date.now() - joined.getTime()) / 86400000);
}

/**
 * Calculate trust tier based on account age and vouched trades
 *
 * Tier logic:
 * - Trusted: 1+ year (365 days) AND 8+ vouched trades
 * - Established: 90+ days AND 5+ vouched trades
 * - Growing: 30+ days AND 2+ vouched trades
 * - Seedling: 1+ vouched trades
 * - New: 0 vouched trades (warning state)
 */
export function getTrustTier(accountAgeDays: number, vouchedTrades: number): TrustTier {
  // Trusted: 1+ year AND 8 vouched trades
  if (accountAgeDays >= 365 && vouchedTrades >= 8) {
    return 'trusted';
  }

  // Established: 90+ days AND 5 vouched trades
  if (accountAgeDays >= 90 && vouchedTrades >= 5) {
    return 'established';
  }

  // Growing: 30+ days AND 2 vouched trades
  if (accountAgeDays >= 30 && vouchedTrades >= 2) {
    return 'growing';
  }

  // Seedling: 1 vouched trade
  if (vouchedTrades >= 1) {
    return 'seedling';
  }

  // New: 0 vouched trades (warning state)
  return 'new';
}

/**
 * Get trust tier information including label, icon, description, and styles
 */
export function getTrustTierInfo(tier: TrustTier): TrustTierInfo {
  const tierMap: Record<TrustTier, TrustTierInfo> = {
    new: {
      tier: 'new',
      label: 'New member',
      icon: '🆕',
      description: 'Brand new member, highest caution advised',
      styles: {
        border: 'border-amber-500/80',
        background: 'bg-amber-500/10',
        text: 'text-badge-amber',
      },
    },
    seedling: {
      tier: 'seedling',
      label: 'Seedling',
      icon: '🌱',
      description: 'First vouched trade completed',
      styles: {
        border: 'border-lime-500/80',
        background: 'bg-lime-500/10',
        text: 'text-badge-lime',
      },
    },
    growing: {
      tier: 'growing',
      label: 'Growing member',
      icon: '🪴',
      description: 'Building reputation with community feedback',
      styles: {
        border: 'border-sky-500/80',
        background: 'bg-sky-500/10',
        text: 'text-badge-sky',
      },
    },
    established: {
      tier: 'established',
      label: 'Established member',
      icon: '🌳',
      description: 'Experienced trader with proven positive history',
      styles: {
        border: 'border-emerald-500/80',
        background: 'bg-emerald-500/10',
        text: 'text-badge-emerald',
      },
    },
    trusted: {
      tier: 'trusted',
      label: 'Trusted member',
      icon: '⭐',
      description: 'Highly trusted, long-term community member',
      styles: {
        border: 'border-violet-500/80',
        background: 'bg-violet-500/10',
        text: 'text-badge-violet',
      },
    },
  };

  return tierMap[tier];
}

/**
 * Get formatted badge text with contextual information
 */
export function getBadgeText(
  tier: TrustTier,
  accountAgeDays: number,
  vouchedTrades: number
): string {
  const info = getTrustTierInfo(tier);

  // For new members, show age context if account isn't brand new
  if (tier === 'new') {
    if (accountAgeDays > 7) {
      return `${info.label} (${accountAgeDays} days old, 0 vouched trades)`;
    }
    if (accountAgeDays === 0) {
      return `${info.label} (joined today)`;
    }
    return `${info.label} (${accountAgeDays} days old)`;
  }

  // For seedling waiting on age requirement for growing
  if (tier === 'seedling' && vouchedTrades >= 2 && accountAgeDays < 30) {
    return `${info.label} (${accountAgeDays}/${30} days for Growing)`;
  }

  // For all other cases, just show the tier label
  return info.label;
}

/**
 * Get tooltip text explaining the current tier
 */
export function getTooltipText(tier: TrustTier): string {
  const descriptions: Record<TrustTier, string> = {
    new: 'New member - Use caution and prefer tracked shipping. No vouched trades yet.',
    seedling: 'Completed first vouched trade. Building trust in the community.',
    growing: 'Active trader with multiple vouched trades and 30+ day account.',
    established: 'Experienced trader with 5+ vouched trades and proven positive history.',
    trusted:
      'Highly trusted member with 1+ year history and 8+ vouched trades. Long-term community member.',
  };

  return descriptions[tier];
}

/**
 * Check if user is considered high risk (for warning displays)
 */
export function isHighRisk(tier: TrustTier, phoneVerified: boolean): boolean {
  // High risk = New tier AND no phone verification
  return tier === 'new' && !phoneVerified;
}

/**
 * Calculate if user can vouch for others
 * Can vouch if: received 1+ vouch OR phone verified
 */
export function canVouch(vouchedTrades: number, phoneVerified: boolean): boolean {
  return vouchedTrades >= 1 || phoneVerified;
}

/**
 * Format relative time for account age display
 */
export function formatAccountAge(joinedDate: string | Date): string {
  const ageDays = getAccountAgeDays(joinedDate);

  if (ageDays === 0) return 'joined today';
  if (ageDays === 1) return 'joined yesterday';
  if (ageDays < 7) return `joined ${ageDays} days ago`;
  if (ageDays < 30) {
    const weeks = Math.floor(ageDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
  }
  if (ageDays < 365) {
    const months = Math.floor(ageDays / 30);
    return `${months} ${months === 1 ? 'month' : 'months'}`;
  }

  const years = Math.floor(ageDays / 365);
  return `${years} ${years === 1 ? 'year' : 'years'}`;
}

/**
 * Get progress towards next tier
 */
export function getNextTierProgress(
  tier: TrustTier,
  accountAgeDays: number,
  vouchedTrades: number
): {
  nextTier: TrustTier | null;
  requirements: { label: string; current: number; needed: number; met: boolean }[];
  message: string;
} | null {
  if (tier === 'trusted') {
    return null; // Already at highest tier
  }

  const progressMap: Record<
    Exclude<TrustTier, 'trusted'>,
    {
      nextTier: TrustTier;
      requirements: { label: string; current: number; needed: number; met: boolean }[];
      message: string;
    }
  > = {
    new: {
      nextTier: 'seedling',
      requirements: [
        {
          label: 'Vouched trades',
          current: vouchedTrades,
          needed: 1,
          met: vouchedTrades >= 1,
        },
      ],
      message:
        vouchedTrades >= 1
          ? "You've reached Seedling!"
          : 'Complete a trade and get vouched to reach Seedling!',
    },
    seedling: {
      nextTier: 'growing',
      requirements: [
        {
          label: 'Vouched trades',
          current: vouchedTrades,
          needed: 2,
          met: vouchedTrades >= 2,
        },
        {
          label: 'Account age',
          current: accountAgeDays,
          needed: 30,
          met: accountAgeDays >= 30,
        },
      ],
      message:
        vouchedTrades >= 2 && accountAgeDays >= 30
          ? "You've reached Growing!"
          : vouchedTrades >= 2
            ? `Wait ${30 - accountAgeDays} more days to reach Growing!`
            : accountAgeDays >= 30
              ? `Get ${2 - vouchedTrades} more vouched trade${2 - vouchedTrades === 1 ? '' : 's'} to reach Growing!`
              : `Get ${2 - vouchedTrades} more vouched trade${2 - vouchedTrades === 1 ? '' : 's'} AND wait ${30 - accountAgeDays} more days!`,
    },
    growing: {
      nextTier: 'established',
      requirements: [
        {
          label: 'Vouched trades',
          current: vouchedTrades,
          needed: 5,
          met: vouchedTrades >= 5,
        },
        {
          label: 'Account age',
          current: accountAgeDays,
          needed: 90,
          met: accountAgeDays >= 90,
        },
      ],
      message:
        vouchedTrades >= 5 && accountAgeDays >= 90
          ? "You've reached Established!"
          : vouchedTrades >= 5
            ? `Wait ${90 - accountAgeDays} more days to reach Established!`
            : accountAgeDays >= 90
              ? `Get ${5 - vouchedTrades} more vouched trade${5 - vouchedTrades === 1 ? '' : 's'} to reach Established!`
              : `Get ${5 - vouchedTrades} more vouched trade${5 - vouchedTrades === 1 ? '' : 's'} AND wait ${90 - accountAgeDays} more days!`,
    },
    established: {
      nextTier: 'trusted',
      requirements: [
        {
          label: 'Vouched trades',
          current: vouchedTrades,
          needed: 8,
          met: vouchedTrades >= 8,
        },
        {
          label: 'Account age',
          current: accountAgeDays,
          needed: 365,
          met: accountAgeDays >= 365,
        },
      ],
      message:
        vouchedTrades >= 8 && accountAgeDays >= 365
          ? "You've reached Trusted!"
          : vouchedTrades >= 8
            ? `Wait ${365 - accountAgeDays} more days to reach Trusted!`
            : accountAgeDays >= 365
              ? `Get ${8 - vouchedTrades} more vouched trade${8 - vouchedTrades === 1 ? '' : 's'} to reach Trusted!`
              : `Get ${8 - vouchedTrades} more vouched trade${8 - vouchedTrades === 1 ? '' : 's'} AND wait ${365 - accountAgeDays} more days!`,
    },
  };

  return progressMap[tier as Exclude<TrustTier, 'trusted'>];
}
