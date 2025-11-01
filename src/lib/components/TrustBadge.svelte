<script lang="ts">
  import type { TrustTier } from '$lib/utils/trust-tiers';
  import {
    getAccountAgeDays,
    getTrustTier,
    getTrustTierInfo,
    getBadgeText,
    getTooltipText,
  } from '$lib/utils/trust-tiers';

  interface Props {
    /** Account joined date */
    joinedDate: string;
    /** Number of vouched trades (trades where user received a vouch) */
    vouchedTrades: number;
    /** Size variant */
    size?: 'small' | 'medium' | 'large';
    /** Show label text */
    showLabel?: boolean;
    /** Show tooltip on hover */
    showTooltip?: boolean;
    /** Custom class names */
    class?: string;
  }

  let {
    joinedDate,
    vouchedTrades,
    size = 'medium',
    showLabel = true,
    showTooltip = true,
    class: className = '',
  }: Props = $props();

  // Calculate tier
  let accountAgeDays = $derived(getAccountAgeDays(joinedDate));
  let tier = $derived<TrustTier>(getTrustTier(accountAgeDays, vouchedTrades));
  let tierInfo = $derived(getTrustTierInfo(tier));
  let badgeText = $derived(getBadgeText(tier, accountAgeDays, vouchedTrades));
  let tooltipText = $derived(getTooltipText(tier));

  // Size-specific classes
  let sizeClasses = $derived(
    size === 'small'
      ? 'px-2 py-0.5 text-xs gap-1'
      : size === 'large'
        ? 'px-4 py-2 text-base gap-2'
        : 'px-3 py-1 text-sm gap-1.5',
  );

  let iconSize = $derived(size === 'small' ? 'text-sm' : size === 'large' ? 'text-lg' : 'text-base');
</script>

<span
  class="inline-flex items-center rounded-full border {tierInfo.styles.border} {tierInfo.styles.background} {tierInfo.styles.text} {sizeClasses} {className}"
  title={showTooltip ? tooltipText : undefined}
  role="status"
  aria-label="Trust tier: {tierInfo.label}"
>
  <span class={iconSize} aria-hidden="true">{tierInfo.icon}</span>
  {#if showLabel}
    <span class="font-medium">{badgeText}</span>
  {/if}
</span>
