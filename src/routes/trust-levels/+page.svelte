<script lang="ts">
  import { getTrustTierInfo, getNextTierProgress, type TrustTier } from '$lib/utils/trust-tiers';

  const tiers: TrustTier[] = ['new', 'seedling', 'growing', 'established', 'trusted'];

  const tierRequirements: Record<TrustTier, { vouches: string; days: string }> = {
    new: { vouches: '0', days: 'Any' },
    seedling: { vouches: '1+', days: 'Any' },
    growing: { vouches: '2+', days: '30+' },
    established: { vouches: '5+', days: '90+' },
    trusted: { vouches: '8+', days: '365+' },
  };
</script>

<svelte:head>
  <title>Trust Levels · Meeple Cart</title>
  <meta
    name="description"
    content="Learn about the Meeple Cart trust tier system and how to build your reputation in the community"
  />
</svelte:head>

<main class="bg-surface-body transition-colors px-6 py-16 sm:px-8">
  <div class="mx-auto max-w-3xl space-y-8">
    <!-- Page Header -->
    <div class="space-y-4 text-center">
      <h1 class="text-4xl font-semibold tracking-tight text-primary sm:text-5xl">Trust Levels</h1>
      <p class="text-lg text-secondary">
        Our trust tier system helps the community identify experienced traders and build confidence
        in transactions.
      </p>
    </div>

    <!-- How it works -->
    <div class="rounded-xl border border-subtle bg-surface-card p-6 space-y-4">
      <h2 class="text-xl font-semibold text-primary">How Trust Levels Work</h2>
      <p class="text-secondary">
        Your trust level is based on two factors: <strong>vouched trades</strong> (successful trades
        where your trading partner vouched for you) and <strong>account age</strong> (how long
        you've been a member).
      </p>
      <p class="text-secondary">
        As you complete more trades and receive vouches from trading partners, you'll progress
        through the tiers. Higher tiers signal to other members that you're an experienced and
        trustworthy trader.
      </p>
    </div>

    <!-- Tier Cards -->
    <div class="space-y-4">
      <h2 class="text-2xl font-semibold text-primary">The Five Tiers</h2>

      <div class="space-y-4">
        {#each tiers as tier (tier)}
          {@const info = getTrustTierInfo(tier)}
          {@const reqs = tierRequirements[tier]}
          <div
            class="rounded-xl border {info.styles.border} {info.styles.background} p-6 space-y-3"
          >
            <div class="flex items-center gap-3">
              <span class="text-3xl">{info.icon}</span>
              <div>
                <h3 class="text-xl font-semibold {info.styles.text}">{info.label}</h3>
                <p class="text-sm text-secondary">{info.description}</p>
              </div>
            </div>

            <div class="flex gap-6 text-sm">
              <div class="space-y-1">
                <span class="text-muted">Vouched Trades</span>
                <p class="font-semibold text-primary">{reqs.vouches}</p>
              </div>
              <div class="space-y-1">
                <span class="text-muted">Account Age</span>
                <p class="font-semibold text-primary">{reqs.days} days</p>
              </div>
            </div>

            {#if tier === 'new'}
              <p class="text-sm text-primary bg-surface-card rounded-lg px-3 py-2 border border-amber-500/50">
                ⚠️ New members should use tracked shipping and take extra precautions until they
                build trust.
              </p>
            {/if}
          </div>
        {/each}
      </div>
    </div>

    <!-- Tips Section -->
    <div class="rounded-xl border border-subtle bg-surface-card p-6 space-y-4">
      <h2 class="text-xl font-semibold text-primary">Tips for Building Trust</h2>
      <ul class="space-y-3 text-secondary">
        <li class="flex gap-3">
          <span class="text-emerald-400">✓</span>
          <span
            >Complete trades successfully and ask your trading partner to vouch for you afterward</span
          >
        </li>
        <li class="flex gap-3">
          <span class="text-emerald-400">✓</span>
          <span>Communicate clearly and respond promptly to messages</span>
        </li>
        <li class="flex gap-3">
          <span class="text-emerald-400">✓</span>
          <span>Use tracked shipping for valuable items</span>
        </li>
        <li class="flex gap-3">
          <span class="text-emerald-400">✓</span>
          <span>Be accurate about item conditions in your listings</span>
        </li>
        <li class="flex gap-3">
          <span class="text-emerald-400">✓</span>
          <span>Vouch for others when you have positive trade experiences</span>
        </li>
      </ul>
    </div>

    <!-- FAQ -->
    <div class="rounded-xl border border-subtle bg-surface-card p-6 space-y-4">
      <h2 class="text-xl font-semibold text-primary">Frequently Asked Questions</h2>

      <div class="space-y-4">
        <div>
          <h3 class="font-semibold text-primary">What's a vouched trade?</h3>
          <p class="text-secondary text-sm mt-1">
            A vouched trade is when someone you traded with gives you a vouch - a public endorsement
            that the trade went well. It's like a positive reference from a trading partner.
          </p>
        </div>

        <div>
          <h3 class="font-semibold text-primary">Can I lose my trust level?</h3>
          <p class="text-secondary text-sm mt-1">
            Trust levels are based on your positive history and don't decrease over time. However,
            serious violations of site rules may result in account restrictions.
          </p>
        </div>

        <div>
          <h3 class="font-semibold text-primary">Why do some tiers require account age?</h3>
          <p class="text-secondary text-sm mt-1">
            Account age requirements help ensure that higher tiers represent genuine long-term
            community members, not just accounts created to quickly game the system.
          </p>
        </div>
      </div>
    </div>

    <!-- Back link -->
    <div class="text-center">
      <a href="/" class="text-emerald-400 hover:text-emerald-300 transition-colors">
        ← Back to home
      </a>
    </div>
  </div>
</main>
