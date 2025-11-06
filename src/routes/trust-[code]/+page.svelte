<script lang="ts">
  import type { PageData } from './$types';
  import { pb } from '$lib/pocketbase';
  import { goto } from '$app/navigation';
  import {
    hashPhoneNumber,
    isValidNZPhoneNumber,
    formatPhoneNumber,
    isVerificationExpired,
  } from '$lib/utils/trust-buddy';

  let { data }: { data: PageData } = $props();

  let phoneNumber = $state('');
  let step = $state<'input' | 'verifying' | 'success' | 'error'>('input');
  let error = $state<string | null>(null);
  let errorDetails = $state<string | null>(null);

  // Check if link is already used or expired
  let linkStatus = $derived.by(() => {
    if (!data.link) return 'invalid';
    if (data.link.used) return 'used';
    if (isVerificationExpired(data.link.expires_at)) return 'expired';
    return 'valid';
  });

  async function handleVerify() {
    if (!data.link) return;

    step = 'verifying';
    error = null;
    errorDetails = null;

    try {
      // Validate phone number
      if (!isValidNZPhoneNumber(phoneNumber)) {
        throw new Error('Please enter a valid NZ phone number');
      }

      // Hash the phone number
      const phoneHash = await hashPhoneNumber(phoneNumber);

      // Verify phone hash matches the link's target
      if (phoneHash !== data.link.target_phone_hash) {
        throw new Error('This verification link was sent to a different phone number');
      }

      // Mark link as used
      await pb.collection('verification_links').update(data.link.id, {
        used: true,
        used_at: new Date().toISOString(),
        attempt_count: (data.link.attempt_count || 0) + 1,
      });

      // Get the verification request
      const request = await pb
        .collection('verification_requests')
        .getOne(data.link.request, { expand: 'user' });

      // Update user as verified
      await pb.collection('users').update(request.user, {
        phone_verified: true,
        phone_hash: phoneHash,
      });

      // Update request as completed
      await pb.collection('verification_requests').update(request.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
      });

      // Update verifier success count
      await pb.collection('verifier_settings').update(data.link.verifier, {
        success_count: data.verifierSettings
          ? data.verifierSettings.success_count + 1
          : 1,
        karma_earned: data.verifierSettings
          ? data.verifierSettings.karma_earned + 50
          : 50, // Bonus 50 karma for completed verification
      });

      // Create verification pair to prevent re-verification
      await pb.collection('verification_pairs').create({
        verifier: data.link.verifier,
        verified: request.user,
        verified_at: new Date().toISOString(),
      });

      step = 'success';

      // Redirect to home after 3 seconds
      setTimeout(() => {
        goto('/');
      }, 3000);
    } catch (err: any) {
      console.error('Verification failed:', err);
      step = 'error';
      error = err.message || 'Verification failed';

      // Increment attempt count
      if (data.link) {
        try {
          await pb.collection('verification_links').update(data.link.id, {
            attempt_count: (data.link.attempt_count || 0) + 1,
          });
        } catch (e) {
          console.error('Failed to update attempt count:', e);
        }
      }
    }
  }

  function retry() {
    step = 'input';
    error = null;
    errorDetails = null;
  }
</script>

<svelte:head>
  <title>Verify Your Phone · Meeple Cart</title>
  <meta name="description" content="Complete your phone verification on Meeple Cart" />
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="bg-surface-body px-6 py-12">
  <div class="mx-auto max-w-lg">
    <!-- Meeple Cart Logo/Header -->
    <div class="text-center">
      <h1 class="text-4xl font-bold text-primary">Meeple Cart</h1>
      <p class="mt-2 text-muted">Phone Verification</p>
    </div>

    <div class="mt-8">
      {#if linkStatus === 'invalid'}
        <!-- Invalid Link -->
        <div class="rounded-xl border border-rose-500/80 bg-rose-500/10 p-8 text-center">
          <span class="text-6xl">❌</span>
          <h2 class="mt-4 text-2xl font-bold text-rose-200">Invalid Link</h2>
          <p class="mt-2 text-rose-200/80">
            This verification link is not valid or has been removed.
          </p>
          <a
            href="/"
            class="mt-6 inline-block rounded-md bg-accent px-6 py-3 font-medium text-white transition-colors hover:bg-accent/90"
          >
            Go to Home
          </a>
        </div>
      {:else if linkStatus === 'used'}
        <!-- Already Used -->
        <div class="rounded-xl border border-sky-500/80 bg-sky-500/10 p-8 text-center">
          <span class="text-6xl">✅</span>
          <h2 class="mt-4 text-2xl font-bold text-sky-200">Already Verified</h2>
          <p class="mt-2 text-sky-200/80">
            This verification link has already been used successfully.
          </p>
          <a
            href="/"
            class="mt-6 inline-block rounded-md bg-accent px-6 py-3 font-medium text-white transition-colors hover:bg-accent/90"
          >
            Go to Home
          </a>
        </div>
      {:else if linkStatus === 'expired'}
        <!-- Expired -->
        <div class="rounded-xl border border-amber-500/80 bg-amber-500/10 p-8 text-center">
          <span class="text-6xl">⏰</span>
          <h2 class="mt-4 text-2xl font-bold text-amber-200">Link Expired</h2>
          <p class="mt-2 text-amber-200/80">
            This verification link has expired. Please request a new one.
          </p>
          <a
            href="/verification/request"
            class="mt-6 inline-block rounded-md bg-accent px-6 py-3 font-medium text-white transition-colors hover:bg-accent/90"
          >
            Request New Verification
          </a>
        </div>
      {:else if step === 'input'}
        <!-- Phone Input -->
        <div class="rounded-xl border border-subtle bg-surface-card p-8">
          <div class="text-center">
            <span class="text-6xl">📱</span>
            <h2 class="mt-4 text-2xl font-bold text-primary">Verify Your Phone</h2>
            <p class="mt-2 text-muted">
              Enter the phone number where you received this link
            </p>
          </div>

          <form onsubmit={(e) => { e.preventDefault(); handleVerify(); }} class="mt-8 space-y-6">
            <div>
              <label for="phone" class="block text-sm font-medium text-secondary">
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                bind:value={phoneNumber}
                placeholder="021-234-5678"
                required
                autofocus
                class="mt-1 block w-full rounded-md border border-subtle bg-surface-body px-4 py-3 text-primary placeholder-muted"
              />
              <p class="mt-1 text-xs text-muted">
                Must match the number this link was sent to
              </p>
            </div>

            <button
              type="submit"
              disabled={!phoneNumber}
              class="w-full rounded-md bg-accent px-4 py-3 font-medium text-white transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Verify Phone Number
            </button>
          </form>
        </div>
      {:else if step === 'verifying'}
        <!-- Verifying -->
        <div class="rounded-xl border border-subtle bg-surface-card p-8 text-center">
          <div class="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-accent/20 border-t-accent"></div>
          <h2 class="mt-4 text-2xl font-bold text-primary">Verifying...</h2>
          <p class="mt-2 text-muted">Please wait while we verify your phone number</p>
        </div>
      {:else if step === 'success'}
        <!-- Success -->
        <div class="rounded-xl border border-emerald-500/80 bg-emerald-500/10 p-8 text-center">
          <span class="text-6xl">🎉</span>
          <h2 class="mt-4 text-2xl font-bold text-emerald-200">Verification Complete!</h2>
          <p class="mt-2 text-emerald-200/80">
            Your phone number has been verified successfully.
          </p>
          <div class="mt-6 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
            <p class="text-sm text-emerald-200">
              <strong>You can now:</strong>
            </p>
            <ul class="mt-2 space-y-1 text-sm text-emerald-200/80">
              <li>✓ Vouch for other traders</li>
              <li>✓ Build trust in the community</li>
              <li>✓ Unlock all platform features</li>
            </ul>
          </div>
          <p class="mt-4 text-sm text-muted">Redirecting you to home...</p>
        </div>
      {:else if step === 'error'}
        <!-- Error -->
        <div class="rounded-xl border border-rose-500/80 bg-rose-500/10 p-8 text-center">
          <span class="text-6xl">❌</span>
          <h2 class="mt-4 text-2xl font-bold text-rose-200">Verification Failed</h2>
          <p class="mt-2 text-rose-200/80">
            {error || 'Something went wrong during verification'}
          </p>
          {#if errorDetails}
            <p class="mt-2 text-sm text-rose-200/60">{errorDetails}</p>
          {/if}
          <div class="mt-6 flex gap-3">
            <button
              type="button"
              onclick={retry}
              class="flex-1 rounded-md border border-subtle bg-surface-body px-4 py-3 font-medium text-secondary transition-colors hover:bg-surface-card"
            >
              Try Again
            </button>
            <a
              href="/verification/request"
              class="flex-1 rounded-md bg-accent px-4 py-3 text-center font-medium text-white transition-colors hover:bg-accent/90"
            >
              Request New Link
            </a>
          </div>
        </div>
      {/if}
    </div>

    <!-- Footer -->
    <div class="mt-8 text-center text-sm text-muted">
      <p>Need help? <a href="/help" class="text-accent hover:underline">Contact Support</a></p>
    </div>
  </div>
</main>
