<script lang="ts">
  import type { PageData } from './$types';
  import { pb, currentUser } from '$lib/pocketbase';
  import { goto } from '$app/navigation';
  import {
    isValidNZPhoneNumber,
    formatPhoneNumber,
    maskPhoneNumber,
    canBecomeVerifier,
  } from '$lib/utils/trust-buddy';
  import { getAccountAgeDays } from '$lib/utils/trust-tiers';

  let { data }: { data: PageData } = $props();

  let user = $derived($currentUser);
  let phone = $state(user?.phone || '');
  let phoneVerified = $derived(user?.phone_verified || false);
  let saving = $state(false);
  let error = $state<string | null>(null);
  let success = $state<string | null>(null);

  // Verifier settings
  let isVerifier = $state(data.verifierSettings?.is_active || false);
  let weeklyLimit = $state(data.verifierSettings?.weekly_limit || 5);

  // Check if user can become a verifier
  let canBeVerifier = $derived(
    canBecomeVerifier(
      phoneVerified,
      user?.trade_count || 0,
      user?.vouch_count || 0,
      user?.joined_date ? getAccountAgeDays(user.joined_date) : 0
    )
  );

  async function savePhoneNumber() {
    if (!user) return;

    saving = true;
    error = null;
    success = null;

    try {
      // Validate phone number
      if (phone && !isValidNZPhoneNumber(phone)) {
        throw new Error('Invalid NZ phone number format');
      }

      // Update user record
      await pb.collection('users').update(user.id, {
        phone: phone || null,
      });

      success = 'Phone number updated successfully';

      // Refresh user data
      const updatedUser = await pb.collection('users').getOne(user.id);
      currentUser.set(updatedUser);
    } catch (err: any) {
      console.error('Failed to update phone:', err);
      error = err.message || 'Failed to update phone number';
    } finally {
      saving = false;
    }
  }

  async function requestVerification() {
    if (!user || !phone) return;

    goto('/verification/request');
  }

  async function toggleVerifier() {
    if (!user || !canBeVerifier) return;

    saving = true;
    error = null;

    try {
      if (data.verifierSettings) {
        // Update existing settings
        await pb.collection('verifier_settings').update(data.verifierSettings.id, {
          is_active: isVerifier,
          weekly_limit: weeklyLimit,
        });
      } else {
        // Create new verifier settings
        await pb.collection('verifier_settings').create({
          user: user.id,
          is_active: isVerifier,
          weekly_limit: weeklyLimit,
          total_verifications: 0,
          success_count: 0,
          karma_earned: 0,
        });
      }

      success = isVerifier ? 'You are now a verifier!' : 'Verifier status disabled';
    } catch (err: any) {
      console.error('Failed to update verifier settings:', err);
      error = err.message || 'Failed to update verifier settings';
      // Revert toggle
      isVerifier = !isVerifier;
    } finally {
      saving = false;
    }
  }

  function goToVerification() {
    goto('/profile/verify');
  }
</script>

<svelte:head>
  <title>Settings · Meeple Cart</title>
  <meta name="description" content="Manage your Meeple Cart account settings and preferences" />
</svelte:head>

<main class="bg-surface-body px-6 py-12">
  <div class="mx-auto max-w-3xl space-y-8">
    <!-- Header -->
    <div>
      <h1 class="text-3xl font-bold text-primary">Settings</h1>
      <p class="mt-2 text-muted">Manage your account settings and verification status</p>
    </div>

    <!-- Email Verification Status -->
    {#if user && !user.verified}
      <div
        class="rounded-lg border border-amber-500/80 bg-amber-500/10 p-4"
        role="alert"
        aria-live="polite"
      >
        <div class="flex items-start gap-3">
          <span class="text-2xl" aria-hidden="true">⚠️</span>
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-amber-200">Email not verified</h3>
            <p class="mt-1 text-sm text-amber-200/80">
              Please verify your email address to unlock all features.
            </p>
            <button
              type="button"
              class="mt-2 rounded-md bg-amber-500/20 px-3 py-1.5 text-sm font-medium text-amber-100 transition-colors hover:bg-amber-500/30"
              onclick={goToVerification}
            >
              Verify Email
            </button>
          </div>
        </div>
      </div>
    {/if}

    <!-- Phone Verification Section -->
    <div class="rounded-xl border border-subtle bg-surface-card p-6">
      <h2 class="text-xl font-bold text-primary">Phone Verification</h2>
      <p class="mt-2 text-sm text-muted">
        Verify your phone number to vouch for other traders and build trust.
      </p>

      <div class="mt-6 space-y-4">
        <!-- Phone Number Input -->
        <div>
          <label for="phone" class="block text-sm font-medium text-secondary"> Phone Number </label>
          <div class="mt-1 flex gap-2">
            <input
              id="phone"
              type="tel"
              bind:value={phone}
              placeholder="021-234-5678"
              disabled={phoneVerified}
              class="flex-1 rounded-md border border-subtle bg-surface-body px-3 py-2 text-primary placeholder-muted disabled:cursor-not-allowed disabled:opacity-50"
            />
            {#if !phoneVerified}
              <button
                type="button"
                onclick={savePhoneNumber}
                disabled={saving || !phone}
                class="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            {/if}
          </div>
          {#if phone && !phoneVerified}
            <p class="mt-1 text-xs text-muted">
              Enter your NZ mobile or landline number (e.g., 021-234-5678)
            </p>
          {/if}
        </div>

        <!-- Verification Status -->
        {#if phoneVerified}
          <div
            class="flex items-center gap-2 rounded-md border border-emerald-500/80 bg-emerald-500/10 px-4 py-3"
          >
            <span class="text-2xl">✅</span>
            <div class="flex-1">
              <p class="font-medium text-emerald-200">Phone Verified</p>
              <p class="text-sm text-emerald-200/80">
                {user?.phone ? maskPhoneNumber(user.phone) : 'Your phone is verified'}
              </p>
            </div>
          </div>
        {:else if phone && user?.phone === phone}
          <button
            type="button"
            onclick={requestVerification}
            class="w-full rounded-md bg-accent px-4 py-3 font-medium text-white transition-colors hover:bg-accent/90"
          >
            Request Verification
          </button>
          <p class="text-xs text-muted">
            A verified community member will send you a verification link via SMS
          </p>
        {/if}
      </div>
    </div>

    <!-- Become a Verifier Section -->
    {#if phoneVerified}
      <div class="rounded-xl border border-subtle bg-surface-card p-6">
        <h2 class="text-xl font-bold text-primary">Become a Verifier</h2>
        <p class="mt-2 text-sm text-muted">
          Help new members verify their phone numbers and earn karma points.
        </p>

        {#if canBeVerifier}
          <div class="mt-6 space-y-4">
            <!-- Verifier Toggle -->
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium text-primary">Active Verifier</p>
                <p class="text-sm text-muted">
                  Receive verification requests to help the community
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isVerifier}
                onclick={() => {
                  isVerifier = !isVerifier;
                  toggleVerifier();
                }}
                disabled={saving}
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {isVerifier
                  ? 'bg-accent'
                  : 'bg-surface-card-alt'} disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {isVerifier
                    ? 'translate-x-6'
                    : 'translate-x-1'}"
                ></span>
              </button>
            </div>

            <!-- Weekly Limit -->
            {#if isVerifier}
              <div>
                <label for="weekly-limit" class="block text-sm font-medium text-secondary">
                  Weekly Verification Limit
                </label>
                <select
                  id="weekly-limit"
                  bind:value={weeklyLimit}
                  onchange={toggleVerifier}
                  class="mt-1 block w-full rounded-md border border-subtle bg-surface-body px-3 py-2 text-primary"
                >
                  <option value={3}>3 per week (Light)</option>
                  <option value={5}>5 per week (Regular)</option>
                  <option value={10}>10 per week (Active)</option>
                  <option value={20}>20 per week (Super Helper)</option>
                </select>
                <p class="mt-1 text-xs text-muted">You can change this limit at any time</p>
              </div>

              <!-- Verifier Stats -->
              {#if data.verifierSettings}
                <div
                  class="grid grid-cols-3 gap-4 rounded-md border border-subtle bg-surface-body p-4"
                >
                  <div class="text-center">
                    <div class="text-2xl font-bold text-emerald-300">
                      {data.verifierSettings.total_verifications}
                    </div>
                    <div class="text-xs text-muted">Verified</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-bold text-emerald-300">
                      {data.verifierSettings.success_count}
                    </div>
                    <div class="text-xs text-muted">Completed</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-bold text-emerald-300">
                      {data.verifierSettings.karma_earned}
                    </div>
                    <div class="text-xs text-muted">Karma</div>
                  </div>
                </div>
              {/if}

              <a
                href="/verification/dashboard"
                class="block rounded-md border border-accent bg-accent/10 px-4 py-3 text-center font-medium text-accent transition-colors hover:bg-accent/20"
              >
                Go to Verifier Dashboard
              </a>
            {/if}
          </div>
        {:else}
          <div class="mt-6 rounded-md border border-subtle bg-surface-body p-4">
            <p class="text-sm text-muted">To become a verifier, you need:</p>
            <ul class="mt-2 space-y-1 text-sm text-muted">
              <li class="flex items-center gap-2">
                <span class={phoneVerified ? 'text-emerald-400' : 'text-muted'}>
                  {phoneVerified ? '✓' : '○'}
                </span>
                Verified phone number
              </li>
              <li class="flex items-center gap-2">
                <span
                  class={getAccountAgeDays(user?.joined_date || '') >= 7
                    ? 'text-emerald-400'
                    : 'text-muted'}
                >
                  {getAccountAgeDays(user?.joined_date || '') >= 7 ? '✓' : '○'}
                </span>
                Account at least 7 days old
              </li>
              <li class="flex items-center gap-2">
                <span
                  class={(user?.trade_count || 0) > 0 || (user?.vouch_count || 0) > 0
                    ? 'text-emerald-400'
                    : 'text-muted'}
                >
                  {(user?.trade_count || 0) > 0 || (user?.vouch_count || 0) > 0 ? '✓' : '○'}
                </span>
                At least 1 completed trade or 1 vouch received
              </li>
            </ul>
          </div>
        {/if}
      </div>
    {/if}

    <!-- Success/Error Messages -->
    {#if success}
      <div
        class="rounded-md border border-emerald-500/80 bg-emerald-500/10 px-4 py-3 text-emerald-200"
      >
        {success}
      </div>
    {/if}

    {#if error}
      <div class="rounded-md border border-rose-500/80 bg-rose-500/10 px-4 py-3 text-rose-200">
        {error}
      </div>
    {/if}
  </div>
</main>
